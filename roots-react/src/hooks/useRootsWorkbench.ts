import { useCallback, useEffect, useMemo, useState } from 'react';

import { METHOD_CONFIGS, createDefaultFormState } from '../config/methods';
import { loadLegacyEngines } from '../lib/legacyEngineLoader';
import { errorMessage, runRootMethod } from '../lib/rootEngineAdapter';
import type {
  AngleMode,
  MethodFormState,
  RootMethod,
  RootRunResult,
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

export function useRootsWorkbench() {
  const [activeMethod, setActiveMethod] = useState<RootMethod>('bisection');
  const [angleMode, setAngleMode] = useState<AngleMode>('deg');
  const [forms, setForms] = useState<Record<RootMethod, MethodFormState>>(() =>
    createDefaultFormState(),
  );
  const [runs, setRuns] = useState<Partial<Record<RootMethod, RootRunResult>>>({});
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
  const activeRun = useMemo(() => runs[activeMethod] ?? null, [activeMethod, runs]);
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
      setRuns((current) => {
        if (!(method in current)) {
          return current;
        }
        const next = { ...current };
        delete next[method];
        return next;
      });
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
      const result = runRootMethod(activeMethod, forms[activeMethod], angleMode);
      setRuns((current) => ({
        ...current,
        [activeMethod]: result,
      }));
      setWorkbenchStatus({ kind: 'ready', message: 'Answer ready.' });
      setEvidenceExpanded(false);
    } catch (error) {
      setRuns((current) => {
        if (!(activeMethod in current)) {
          return current;
        }
        const next = { ...current };
        delete next[activeMethod];
        return next;
      });
      setWorkbenchStatus({ kind: 'error', message: errorMessage(error) });
      setEvidenceExpanded(false);
    }
  }, [activeMethod, angleMode, engineStatus, forms]);

  const toggleAngleMode = useCallback(() => {
    setAngleMode((current) => (current === 'deg' ? 'rad' : 'deg'));
    setRuns({});
    setEvidenceExpanded(false);
    setWorkbenchStatus(ANGLE_MODE_CHANGED_STATUS);
  }, []);

  const setMethod = useCallback((method: RootMethod) => {
    setActiveMethod(method);
    setWorkbenchStatus(READY_STATUS);
    setEvidenceExpanded(false);
  }, []);

  return {
    activeConfig,
    activeForm,
    activeMethod,
    activeRun,
    angleMode,
    evidenceExpanded,
    forms,
    methodConfigs,
    runs,
    setEvidenceExpanded,
    setMethod,
    status,
    toggleAngleMode,
    updateField,
    runActiveMethod,
  };
}
