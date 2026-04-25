import { useCallback, useEffect, useMemo, useState } from 'react';

import { METHOD_CONFIGS, createDefaultFormState } from '../config/methods';
import { findPreset, zeroUnsafeFieldIds } from '../config/presets';
import { runFixedPointRanking } from '../lib/fixedPointRanking';
import { loadLegacyEngines } from '../lib/legacyEngineLoader';
import { errorMessage, runRootMethod } from '../lib/rootEngineAdapter';
import type {
  AngleMode,
  FixedPointRankingResult,
  DisplayedRunState,
  MethodFormState,
  RootPreset,
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
const PRESET_LOADED_STATUS: WorkbenchStatus = {
  kind: 'ready',
  message: 'Preset loaded. Run when ready.',
};

type EngineStatusKind = 'loading' | 'ready' | 'error';

function createRequestSnapshot(
  method: RootMethod,
  forms: Record<RootMethod, MethodFormState>,
  angleMode: AngleMode,
  presetId: string | null,
): RunRequestSnapshot {
  return {
    method,
    angleMode,
    values: { ...forms[method] },
    presetId,
  };
}

function sameSnapshot(left: RunRequestSnapshot | null, right: RunRequestSnapshot): boolean {
  if (!left) return false;
  if (left.method !== right.method || left.angleMode !== right.angleMode) return false;
  if ((left.presetId ?? null) !== (right.presetId ?? null)) return false;

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
  const [activeMethod, setActiveMethod] = useState<RootMethod>('bisection');
  const [angleMode, setAngleMode] = useState<AngleMode>('rad');
  const [forms, setForms] = useState<Record<RootMethod, MethodFormState>>(() =>
    createDefaultFormState(),
  );
  const [lastRun, setLastRun] = useState<StoredRunState | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState('');
  const [rankingResult, setRankingResult] = useState<FixedPointRankingResult | null>(null);
  const [engineStatus, setEngineStatus] = useState<EngineStatusKind>('loading');
  const [engineErrorMessage, setEngineErrorMessage] = useState('');
  const [workbenchStatus, setWorkbenchStatus] = useState<WorkbenchStatus>(READY_STATUS);
  const [evidenceExpanded, setEvidenceExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;

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
  }, []);

  const activeConfig = useMemo(
    () => METHOD_CONFIGS.find((config) => config.method === activeMethod) ?? METHOD_CONFIGS[0],
    [activeMethod],
  );

  const activeForm = useMemo(() => forms[activeMethod], [activeMethod, forms]);
  const activeRequest = useMemo(
    () => createRequestSnapshot(activeMethod, forms, angleMode, selectedPresetId || null),
    [activeMethod, angleMode, forms, selectedPresetId],
  );
  const activePreset = useMemo<RootPreset | null>(
    () => (selectedPresetId ? findPreset(selectedPresetId) : null),
    [selectedPresetId],
  );
  const presetWarningFieldIds = useMemo(
    () => zeroUnsafeFieldIds(activePreset, forms[activeMethod] ?? {}),
    [activeMethod, activePreset, forms],
  );
  const displayRun = useMemo<DisplayedRunState>(() => {
    if (!lastRun) {
      return {
        run: null,
        request: null,
        freshness: 'empty',
        staleReason: null,
        hasCompareEntry: false,
      };
    }

    const freshness = sameSnapshot(lastRun.request, activeRequest) ? 'current' : 'stale';
    return {
      run: lastRun.result,
      request: lastRun.request,
      freshness,
      staleReason: freshness === 'stale' ? staleReason(lastRun.request, activeRequest) : null,
      hasCompareEntry: true,
    };
  }, [activeRequest, lastRun]);
  const activeRun = useMemo(
    () => (displayRun.freshness === 'current' ? displayRun.run : null),
    [displayRun.freshness, displayRun.run],
  );
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
      setRankingResult(null);
    },
    [],
  );

  const runActiveMethod = useCallback(() => {
    if (engineStatus !== 'ready') {
      return;
    }

    try {
      const request = createRequestSnapshot(activeMethod, forms, angleMode, selectedPresetId || null);
      const result = runRootMethod(activeMethod, forms[activeMethod], angleMode);
      setLastRun({ result, request });
      setWorkbenchStatus({ kind: 'ready', message: 'Answer ready.' });
      setEvidenceExpanded(false);
    } catch (error) {
      setWorkbenchStatus({ kind: 'error', message: errorMessage(error) });
      setEvidenceExpanded(false);
    }
  }, [activeMethod, angleMode, engineStatus, forms, selectedPresetId]);

  const toggleAngleMode = useCallback(() => {
    setAngleMode((current) => (current === 'deg' ? 'rad' : 'deg'));
    setEvidenceExpanded(false);
    setWorkbenchStatus(ANGLE_MODE_CHANGED_STATUS);
    setRankingResult(null);
  }, []);

  const setMethod = useCallback((method: RootMethod) => {
    setActiveMethod(method);
    setSelectedPresetId('');
    setRankingResult(null);
    setWorkbenchStatus(READY_STATUS);
    setEvidenceExpanded(false);
  }, []);

  const selectPreset = useCallback((presetId: string) => {
    const preset = presetId ? findPreset(presetId) : null;

    setSelectedPresetId(presetId);
    setRankingResult(null);
    if (!preset) {
      setWorkbenchStatus(READY_STATUS);
      setEvidenceExpanded(false);
      return;
    }

    setActiveMethod(preset.method);
    setForms((current) => ({
      ...current,
      [preset.method]: {
        ...current[preset.method],
        ...preset.fields,
      },
    }));
    setWorkbenchStatus(PRESET_LOADED_STATUS);
    setEvidenceExpanded(false);
  }, []);

  const runRanking = useCallback(() => {
    if (engineStatus !== 'ready' || !activePreset?.ranking) {
      return;
    }

    try {
      const form = forms.fixedPoint;
      const result = runFixedPointRanking(
        activePreset.id,
        activePreset.ranking,
        form['root-fpi-x0'] ?? activePreset.ranking.p0,
        {
          k: Number(form['root-fpi-k']),
          mode: form['root-fpi-mode'] === 'chop' ? 'chop' : 'round',
        },
        {
          kind: form['root-fpi-stop-kind'] === 'epsilon' ? 'epsilon' : 'iterations',
          value: form['root-fpi-stop-value'] ?? '4',
        },
        angleMode,
      );
      setRankingResult(result);
      setWorkbenchStatus({ kind: 'ready', message: 'Fixed-point ranking ready.' });
    } catch (error) {
      setWorkbenchStatus({ kind: 'error', message: errorMessage(error) });
    }
  }, [activePreset, angleMode, engineStatus, forms.fixedPoint]);

  const runs = useMemo<Partial<Record<RootMethod, ReturnType<typeof runRootMethod>>>>(() => {
    if (!lastRun || displayRun.freshness !== 'current') {
      return {};
    }

    return {
      [lastRun.result.method]: lastRun.result,
    } as Partial<Record<RootMethod, ReturnType<typeof runRootMethod>>>;
  }, [displayRun.freshness, lastRun]);

  return {
    activeConfig,
    activeForm,
    activeMethod,
    activeRun,
    angleMode,
    displayConfig,
    displayRun,
    evidenceExpanded,
    forms,
    methodConfigs,
    activePreset,
    presetWarningFieldIds,
    rankingResult,
    runs,
    setEvidenceExpanded,
    setMethod,
    selectPreset,
    selectedPresetId,
    status,
    toggleAngleMode,
    updateField,
    runActiveMethod,
    runRanking,
  };
}
