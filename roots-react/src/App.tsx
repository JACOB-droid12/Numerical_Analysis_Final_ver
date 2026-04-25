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
    activePreset,
    angleMode,
    displayConfig,
    displayRun,
    evidenceExpanded,
    methodConfigs,
    presetWarningFieldIds,
    rankingResult,
    runActiveMethod,
    runRanking,
    selectPreset,
    selectedPresetId,
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
          activePreset={activePreset}
          presetWarningFieldIds={presetWarningFieldIds}
          rankingResult={rankingResult}
          selectedPresetId={selectedPresetId}
          status={status}
          onChange={updateField}
          onRunRanking={runRanking}
          onRun={runActiveMethod}
          onSelectPreset={selectPreset}
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
