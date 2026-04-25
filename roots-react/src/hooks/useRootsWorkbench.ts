import { useCallback, useEffect, useMemo, useState } from 'react';

import { METHOD_CONFIGS, createDefaultFormState } from '../config/methods';
import { PRESET_BY_ID, ROOT_PRESETS, populationZeroWarning } from '../config/presets';
import { buildFixedPointComparison } from '../lib/fixedPointComparison';
import { loadLegacyEngines } from '../lib/legacyEngineLoader';
import { errorMessage, runFixedPointCandidates, runRootMethod } from '../lib/rootEngineAdapter';
import type {
  AngleMode,
  DisplayedRunState,
  FixedPointComparisonResult,
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

type EngineStatusKind = 'loading' | 'ready' | 'error';

function createRequestSnapshot(
  method: RootMethod,
  forms: Record<RootMethod, MethodFormState>,
  angleMode: AngleMode,
): RunRequestSnapshot {
  return {
    method,
    angleMode,
    values: { ...forms[method] },
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

function visibleFields(config: typeof METHOD_CONFIGS[number], formState: MethodFormState) {
  return config.fields.filter((field) => (field.when ? field.when(formState) : true));
}

function missingRequiredFields(config: typeof METHOD_CONFIGS[number], formState: MethodFormState) {
  return visibleFields(config, formState).filter((field) => {
    if (field.kind === 'select') return false;
    return !String(formState[field.id] ?? '').trim();
  });
}

function invalidRunMessage(result: ReturnType<typeof runRootMethod>) {
  if (result.summary?.stopReason !== 'invalid-input') return null;
  return result.warnings?.[0]?.message ?? 'Check the required inputs before running the method.';
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
  const [selectedPresetId, setSelectedPresetId] = useState('');
  const [comparisonResult, setComparisonResult] = useState<FixedPointComparisonResult | null>(null);

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
    () => createRequestSnapshot(activeMethod, forms, angleMode),
    [activeMethod, angleMode, forms],
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
  const presets = useMemo(() => ROOT_PRESETS, []);
  const selectedPreset = useMemo(
    () => (selectedPresetId ? PRESET_BY_ID.get(selectedPresetId) ?? null : null),
    [selectedPresetId],
  );
  const presetWarning = useMemo(
    () => populationZeroWarning(selectedPreset, selectedPreset ? forms[selectedPreset.method] : null),
    [forms, selectedPreset],
  );
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
      setComparisonResult(null);
    },
    [],
  );

  const runActiveMethod = useCallback(() => {
    if (engineStatus !== 'ready') {
      return;
    }

    const missingFields = missingRequiredFields(activeConfig, forms[activeMethod]);
    if (missingFields.length) {
      setLastRun(null);
      setWorkbenchStatus({
        kind: 'error',
        message: `Enter ${missingFields.map((field) => field.label).join(', ')} before running ${activeConfig.shortLabel}.`,
      });
      setEvidenceExpanded(false);
      setComparisonResult(null);
      return;
    }

    try {
      const request = createRequestSnapshot(activeMethod, forms, angleMode);
      const result = runRootMethod(activeMethod, forms[activeMethod], angleMode);
      const invalidMessage = invalidRunMessage(result);
      if (invalidMessage) {
        setLastRun(null);
        setWorkbenchStatus({ kind: 'error', message: invalidMessage });
        setEvidenceExpanded(false);
        setComparisonResult(null);
        return;
      }
      setLastRun({ result, request });
      setWorkbenchStatus({ kind: 'ready', message: 'Answer ready.' });
      setEvidenceExpanded(true);
      setComparisonResult(null);
    } catch (error) {
      setWorkbenchStatus({ kind: 'error', message: errorMessage(error) });
      setEvidenceExpanded(false);
    }
  }, [activeConfig, activeMethod, angleMode, engineStatus, forms]);

  const toggleAngleMode = useCallback(() => {
    setAngleMode((current) => (current === 'deg' ? 'rad' : 'deg'));
    setEvidenceExpanded(false);
    setComparisonResult(null);
    setWorkbenchStatus(ANGLE_MODE_CHANGED_STATUS);
  }, []);

  const setMethod = useCallback((method: RootMethod) => {
    setActiveMethod(method);
    setSelectedPresetId('');
    setComparisonResult(null);
    setWorkbenchStatus(READY_STATUS);
    setEvidenceExpanded(false);
  }, []);

  const resetActiveMethod = useCallback(() => {
    setForms((current) => ({
      ...current,
      [activeMethod]: createDefaultFormState()[activeMethod],
    }));
    setLastRun(null);
    setSelectedPresetId('');
    setComparisonResult(null);
    setWorkbenchStatus(READY_STATUS);
    setEvidenceExpanded(false);
  }, [activeMethod]);

  const applyPreset = useCallback((presetId: string) => {
    const presetItem = PRESET_BY_ID.get(presetId);
    if (!presetItem) {
      setSelectedPresetId('');
      setComparisonResult(null);
      setWorkbenchStatus(READY_STATUS);
      return;
    }

    setForms((current) => ({
      ...current,
      [presetItem.method]: {
        ...current[presetItem.method],
        ...presetItem.fields,
      },
    }));
    setActiveMethod(presetItem.method);
    setSelectedPresetId(presetItem.id);
    setLastRun(null);
    setComparisonResult(null);
    setEvidenceExpanded(false);
    setWorkbenchStatus({
      kind: 'ready',
      message: `${presetItem.label} loaded. Review values, then run the method.`,
    });
  }, []);

  const runFixedPointRanking = useCallback(() => {
    if (engineStatus !== 'ready' || activeMethod !== 'fixedPoint' || !selectedPreset?.ranking) {
      return;
    }

    const missingFields = missingRequiredFields(activeConfig, forms.fixedPoint);
    if (missingFields.length) {
      setWorkbenchStatus({
        kind: 'error',
        message: `Enter ${missingFields.map((field) => field.label).join(', ')} before running the ranking.`,
      });
      setComparisonResult(null);
      return;
    }

    try {
      const request = createRequestSnapshot(activeMethod, forms, angleMode);
      const result = runRootMethod(activeMethod, forms.fixedPoint, angleMode);
      const invalidMessage = invalidRunMessage(result);
      if (invalidMessage) {
        setWorkbenchStatus({ kind: 'error', message: invalidMessage });
        setComparisonResult(null);
        return;
      }
      const candidateRuns = runFixedPointCandidates(
        selectedPreset.ranking.candidates,
        forms.fixedPoint,
        angleMode,
      );
      setLastRun({ result, request });
      setComparisonResult(buildFixedPointComparison(selectedPreset.ranking, candidateRuns));
      setWorkbenchStatus({ kind: 'ready', message: 'Fixed-point ranking ready.' });
      setEvidenceExpanded(true);
    } catch (error) {
      setWorkbenchStatus({ kind: 'error', message: errorMessage(error) });
      setComparisonResult(null);
    }
  }, [activeConfig, activeMethod, angleMode, engineStatus, forms, selectedPreset]);

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
    applyPreset,
    comparisonResult,
    displayConfig,
    displayRun,
    evidenceExpanded,
    forms,
    methodConfigs,
    presetWarning,
    presets,
    runs,
    setEvidenceExpanded,
    setMethod,
    resetActiveMethod,
    status,
    selectedPreset,
    selectedPresetId,
    toggleAngleMode,
    updateField,
    runActiveMethod,
    runFixedPointRanking,
  };
}
