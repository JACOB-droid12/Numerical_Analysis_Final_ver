import { useId } from 'react';
import { CircleHelp, Command } from 'lucide-react';

import { AngleToggle } from './components/AngleToggle';
import { AnswerPanel } from './components/AnswerPanel';
import { ConfidenceSummary } from './components/ConfidenceSummary';
import { EmptyState } from './components/EmptyState';
import { EvidencePanel } from './components/EvidencePanel';
import { MethodForm } from './components/MethodForm';
import { MethodPicker } from './components/MethodPicker';
import { PresetSelector } from './components/PresetSelector';
import { RunControls } from './components/RunControls';
import { useRootsWorkbench } from './hooks/useRootsWorkbench';

export default function App() {
  const fullWorkRegionId = useId();
  const {
    activeConfig,
    activeForm,
    activeMethod,
    angleMode,
    applyPreset,
    comparisonResult,
    displayConfig,
    displayRun,
    evidenceExpanded,
    methodConfigs,
    presetWarning,
    presets,
    resetActiveMethod,
    runActiveMethod,
    runFixedPointRanking,
    selectedPreset,
    selectedPresetId,
    setMethod,
    status,
    toggleAngleMode,
    updateField,
  } = useRootsWorkbench();

  const displayedRun = displayRun.run;
  const hasRun = displayedRun !== null;

  return (
    <main className="app-shell">
      <div className="workbench-frame">
        <aside className="method-rail" aria-label="Root method picker">
          <div className="rail-head">
            <span className="brand-mark" aria-hidden="true">R</span>
            <div>
              <p className="rail-title">Roots</p>
              <p className="rail-subtitle">One method active</p>
            </div>
          </div>
          <MethodPicker
            activeMethod={activeMethod}
            methods={methodConfigs}
            onSelect={setMethod}
          />
          <p className="system-ready"><span /> Engine ready</p>
        </aside>

        <div className="workbench-main">
          <header className="top-command">
            <div>
              <p className="section-kicker">Roots React Workbench</p>
              <h1>Answer workstation</h1>
            </div>
            <nav aria-label="Utility controls">
              <AngleToggle angleMode={angleMode} onToggle={toggleAngleMode} />
              <button type="button"><CircleHelp aria-hidden="true" /> Help</button>
              <button type="button" className="quick-command"><Command aria-hidden="true" /> Quick Command</button>
            </nav>
          </header>

          <section className="console-grid">
            <section id="equation-studio" className="equation-studio" aria-label="Equation studio">
              <PresetSelector
                presets={presets}
                selectedPresetId={selectedPresetId}
                warning={presetWarning}
                onSelect={applyPreset}
              />
              <MethodForm
                config={activeConfig}
                formState={activeForm}
                onChange={updateField}
              />
              <RunControls
                disabled={status.kind === 'loading'}
                rankingAvailable={Boolean(
                  selectedPreset?.ranking && activeMethod === 'fixedPoint',
                )}
                runLabel={activeConfig.runLabel}
                status={status}
                onRun={runActiveMethod}
                onReset={resetActiveMethod}
                onRunRanking={runFixedPointRanking}
              />
            </section>

            <aside className="result-console" aria-label="Result console">
              {hasRun ? (
                <>
                  <AnswerPanel
                    run={displayedRun}
                    freshness={displayRun.freshness}
                    staleReason={displayRun.staleReason}
                  />
                  <ConfidenceSummary
                    run={displayedRun}
                    freshness={displayRun.freshness}
                    staleReason={displayRun.staleReason}
                  />
                </>
              ) : (
                <EmptyState />
              )}
            </aside>
          </section>

          <div id="evidence" className="evidence-shell">
            {hasRun ? (
              <EvidencePanel
                config={displayConfig}
                contentId={fullWorkRegionId}
                comparisonResult={comparisonResult}
                expanded={evidenceExpanded}
                run={displayedRun}
              />
            ) : null}
          </div>
        </div>
      </div>
    </main>
  );
}
