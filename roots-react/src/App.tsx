import { useId } from 'react';

import { AnswerRail } from './components/AnswerRail';
import { InputComposer } from './components/InputComposer';
import { MethodRail } from './components/MethodRail';
import { WorkbenchHeader } from './components/WorkbenchHeader';
import { WorkbenchShell } from './components/WorkbenchShell';
import { useRootsWorkbench } from './hooks/useRootsWorkbench';

export default function App() {
  const fullWorkRegionId = useId();
  const {
    activeConfig,
    activeForm,
    activeMethod,
    angleMode,
    displayConfig,
    displayRun,
    evidenceExpanded,
    methodConfigs,
    runActiveMethod,
    setEvidenceExpanded,
    setMethod,
    status,
    toggleAngleMode,
    updateField,
  } = useRootsWorkbench();

  return (
    <WorkbenchShell
      header={<WorkbenchHeader angleMode={angleMode} onToggleAngleMode={toggleAngleMode} />}
      methodRail={
        <MethodRail
          activeConfig={activeConfig}
          activeMethod={activeMethod}
          methods={methodConfigs}
          onSelect={setMethod}
        />
      }
      inputComposer={
        <InputComposer
          activeConfig={activeConfig}
          activeForm={activeForm}
          status={status}
          onChange={updateField}
          onRun={runActiveMethod}
        />
      }
      answerRail={
        <AnswerRail
          config={displayConfig}
          evidenceExpanded={evidenceExpanded}
          fullWorkRegionId={fullWorkRegionId}
          displayRun={displayRun}
          onToggleEvidence={() => setEvidenceExpanded((current) => !current)}
        />
      }
    />
  );
}
