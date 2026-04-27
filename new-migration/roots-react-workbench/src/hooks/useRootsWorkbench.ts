import { useCallback, useEffect, useMemo, useState } from 'react';

import { METHOD_CONFIGS, createDefaultFormState, type MethodPreset } from '../config/methods';
import { loadLegacyEngines } from '../lib/legacyEngineLoader';
import {
  errorMessage,
  isInvalidRun,
  resultFailureMessage,
} from '../lib/rootEngineAdapter';
import {
  runSelectedRootMethod,
  selectedRootEngineName,
  type RootEngineMode,
} from '../lib/rootEngineSelector';
import type {
  AngleMode,
  DisplayedRunState,
  MethodFormState,
  RootMethod,
  RunRequestSnapshot,
  StoredRunState,
  WorkbenchStatus,
} from '../types/roots';

const READY_STATUS: WorkbenchStatus = { kind: 'idle', message: 'Ready.' };
const LOADING_STATUS: WorkbenchStatus = {
  kind: 'loading',
  message: 'Loading root engine...',
};
const INPUTS_CHANGED_STATUS: WorkbenchStatus = {
  kind: 'idle',
  message: 'Inputs changed. Run again to update the answer.',
};
const ANGLE_MODE_CHANGED_STATUS: WorkbenchStatus = {
  kind: 'idle',
  message: 'Angle mode changed. Re-run to update trig values.',
};
const ENGINE_CHANGED_STATUS = (engineMode: RootEngineMode): WorkbenchStatus => ({
  kind: 'idle',
  message: `Engine switched to ${engineMode === 'modern' ? 'Modern beta/testing' : 'Stable'}. Run again to update the answer.`,
});
const PRESET_APPLIED_STATUS = (preset: MethodPreset): WorkbenchStatus => ({
  kind: 'idle',
  message: `${preset.label} loaded. Run the method to calculate the answer.`,
});
const QUICK_SETUP_STATUS = (methodLabel: string): WorkbenchStatus => ({
  kind: 'ready',
  message: `${methodLabel} Quick Setup table ready.`,
});

type EngineStatusKind = 'loading' | 'ready' | 'error';

function createRequestSnapshot(
  method: RootMethod,
  forms: Record<RootMethod, MethodFormState>,
  angleMode: AngleMode,
): RunRequestSnapshot {
  return createMethodRequestSnapshot(method, forms[method], angleMode);
}

function createMethodRequestSnapshot(
  method: RootMethod,
  form: MethodFormState,
  angleMode: AngleMode,
): RunRequestSnapshot {
  return {
    method,
    angleMode,
    values: { ...form },
  };
}

function sameSnapshot(left: RunRequestSnapshot | null, right: RunRequestSnapshot): boolean {
  if (!left) return false;
  if (left.method !== right.method || left.angleMode !== right.angleMode) return false;

  const leftEntries = Object.entries(left.values);
  const rightEntries = Object.entries(right.values);
  if (leftEntries.length !== rightEntries.length) return false;

  return rightEntries.every(([key, value]) => left.values[key] === value);
}

function staleReason(
  previous: RunRequestSnapshot | null,
  current: RunRequestSnapshot,
): string | null {
  if (!previous) return null;
  if (previous.method !== current.method) return 'Method changed. Run again to update the answer.';
  if (previous.angleMode !== current.angleMode) {
    return 'Angle mode changed. Re-run to update trig values.';
  }
  return 'Inputs changed. Run again to update the answer.';
}

export function useRootsWorkbench() {
  const [activeMethod, setActiveMethod] = useState<RootMethod>('newton');
  const [angleMode, setAngleMode] = useState<AngleMode>('rad');
  const [forms, setForms] = useState<Record<RootMethod, MethodFormState>>(() =>
    createDefaultFormState(),
  );
  const [lastRun, setLastRun] = useState<StoredRunState | null>(null);
  const [engineStatus, setEngineStatus] = useState<EngineStatusKind>('loading');
  const [engineErrorMessage, setEngineErrorMessage] = useState('');
  const [workbenchStatus, setWorkbenchStatus] = useState<WorkbenchStatus>(READY_STATUS);
  const [evidenceExpanded, setEvidenceExpanded] = useState(true);
  const [engineMode, setEngineModeState] = useState<RootEngineMode>(() => selectedRootEngineName());

  useEffect(() => {
    let cancelled = false;

    if (engineMode === 'modern') {
      setEngineStatus('ready');
      setEngineErrorMessage('');
      setWorkbenchStatus(READY_STATUS);
      return;
    }

    loadLegacyEngines()
      .then(() => {
        if (!cancelled) {
          setEngineStatus('ready');
          setEngineErrorMessage('');
          setWorkbenchStatus(READY_STATUS);
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setEngineStatus('error');
          setEngineErrorMessage(errorMessage(error));
        }
      });

    return () => {
      cancelled = true;
    };
  }, [engineMode]);

  const activeConfig = useMemo(
    () => METHOD_CONFIGS.find((config) => config.method === activeMethod) ?? METHOD_CONFIGS[0],
    [activeMethod],
  );

  const activeForm = useMemo(() => forms[activeMethod], [activeMethod, forms]);
  const activeRequest = useMemo(
    () => createRequestSnapshot(activeMethod, forms, angleMode),
    [activeMethod, angleMode, forms],
  );
  const displayRun = useMemo<DisplayedRunState>(() => {
    if (!lastRun) {
      return {
        run: null,
        request: null,
        ranAt: null,
        freshness: 'empty',
        staleReason: null,
        hasCompareEntry: false,
      };
    }

    const freshness = sameSnapshot(lastRun.request, activeRequest) ? 'current' : 'stale';
    return {
      run: lastRun.result,
      request: lastRun.request,
      ranAt: lastRun.ranAt,
      freshness,
      staleReason: freshness === 'stale' ? staleReason(lastRun.request, activeRequest) : null,
      hasCompareEntry: true,
    };
  }, [activeRequest, lastRun]);
  const displayConfig = useMemo(() => {
    const displayMethod = displayRun.run?.method ?? activeMethod;
    return METHOD_CONFIGS.find((config) => config.method === displayMethod) ?? METHOD_CONFIGS[0];
  }, [activeMethod, displayRun.run]);
  const methodConfigs = useMemo(() => METHOD_CONFIGS, []);
  const status = useMemo<WorkbenchStatus>(() => {
    if (engineStatus === 'loading') {
      return LOADING_STATUS;
    }
    if (engineStatus === 'error') {
      return { kind: 'error', message: engineErrorMessage };
    }
    return workbenchStatus;
  }, [engineErrorMessage, engineStatus, workbenchStatus]);

  const updateField = useCallback(
    (method: RootMethod, fieldId: string, value: string) => {
      setForms((current) => ({
        ...current,
        [method]: {
          ...current[method],
          [fieldId]: value,
        },
      }));
      setWorkbenchStatus(INPUTS_CHANGED_STATUS);
      setEvidenceExpanded(false);
    },
    [],
  );

  const runActiveMethod = useCallback(() => {
    if (engineStatus !== 'ready') {
      return;
    }

    try {
      const request = createRequestSnapshot(activeMethod, forms, angleMode);
      const result = runSelectedRootMethod(activeMethod, forms[activeMethod], angleMode, engineMode);

      if (isInvalidRun(result)) {
        setLastRun(null);
        setWorkbenchStatus({ kind: 'error', message: resultFailureMessage(result) });
        setEvidenceExpanded(false);
        return;
      }

      setLastRun({ result, request, ranAt: new Date().toISOString() });
      setWorkbenchStatus({ kind: 'ready', message: 'Answer ready.' });
      setEvidenceExpanded(true);
    } catch (error) {
      setLastRun(null);
      setWorkbenchStatus({ kind: 'error', message: errorMessage(error) });
      setEvidenceExpanded(false);
    }
  }, [activeMethod, angleMode, engineMode, engineStatus, forms]);

  const runQuickSetup = useCallback(
    (method: RootMethod, values: MethodFormState) => {
      const config = METHOD_CONFIGS.find((entry) => entry.method === method) ?? METHOD_CONFIGS[0];
      const defaults = createDefaultFormState()[method];
      const nextMethodForm: MethodFormState = {
        ...defaults,
        ...values,
      };

      setActiveMethod(method);
      setForms((current) => ({
        ...current,
        [method]: nextMethodForm,
      }));

      if (engineStatus !== 'ready') {
        setWorkbenchStatus(LOADING_STATUS);
        setEvidenceExpanded(false);
        return;
      }

      try {
        const request = createMethodRequestSnapshot(method, nextMethodForm, angleMode);
        const result = runSelectedRootMethod(method, nextMethodForm, angleMode, engineMode);

        if (isInvalidRun(result)) {
          setLastRun(null);
          setWorkbenchStatus({ kind: 'error', message: resultFailureMessage(result) });
          setEvidenceExpanded(false);
          return;
        }

        setLastRun({ result, request, ranAt: new Date().toISOString() });
        setWorkbenchStatus(QUICK_SETUP_STATUS(config.label));
        setEvidenceExpanded(true);
      } catch (error) {
        setLastRun(null);
        setWorkbenchStatus({ kind: 'error', message: errorMessage(error) });
        setEvidenceExpanded(false);
      }
    },
    [angleMode, engineMode, engineStatus],
  );

  const setEngineMode = useCallback((mode: RootEngineMode) => {
    setEngineModeState(mode);
    setLastRun(null);
    setEvidenceExpanded(false);
    setEngineErrorMessage('');
    setEngineStatus(mode === 'legacy' && !window.RootEngine ? 'loading' : 'ready');
    setWorkbenchStatus(ENGINE_CHANGED_STATUS(mode));
  }, []);

  const toggleAngleMode = useCallback(() => {
    setAngleMode((current) => (current === 'deg' ? 'rad' : 'deg'));
    setEvidenceExpanded(false);
    setWorkbenchStatus(ANGLE_MODE_CHANGED_STATUS);
  }, []);

  const setMethod = useCallback((method: RootMethod) => {
    setActiveMethod(method);
    setWorkbenchStatus(READY_STATUS);
    setEvidenceExpanded(false);
  }, []);

  const applyPreset = useCallback((preset: MethodPreset) => {
    const defaults = createDefaultFormState()[preset.method];
    setActiveMethod(preset.method);
    setForms((current) => ({
      ...current,
      [preset.method]: {
        ...defaults,
        ...preset.values,
      },
    }));
    setLastRun(null);
    setWorkbenchStatus(PRESET_APPLIED_STATUS(preset));
    setEvidenceExpanded(false);
  }, []);

  const resetActiveMethod = useCallback(() => {
    setForms((current) => ({
      ...current,
      [activeMethod]: createDefaultFormState()[activeMethod],
    }));
    setLastRun(null);
    setWorkbenchStatus(READY_STATUS);
    setEvidenceExpanded(false);
  }, [activeMethod]);

  return {
    activeConfig,
    activeForm,
    activeMethod,
    angleMode,
    displayConfig,
    displayRun,
    engineMode,
    evidenceExpanded,
    methodConfigs,
    applyPreset,
    runQuickSetup,
    setEngineMode,
    setMethod,
    resetActiveMethod,
    status,
    toggleAngleMode,
    updateField,
    runActiveMethod,
  };
}
