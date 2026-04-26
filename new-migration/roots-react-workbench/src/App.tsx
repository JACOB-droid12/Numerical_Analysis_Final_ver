import { useId, useState } from 'react';
import { CircleHelp, Command } from 'lucide-react';

import { AngleToggle } from './components/AngleToggle';
import { AnswerPanel } from './components/AnswerPanel';
import { ConfidenceSummary } from './components/ConfidenceSummary';
import { EmptyState } from './components/EmptyState';
import { EvidencePanel } from './components/EvidencePanel';
import { HelpPopover } from './components/HelpPopover';
import { MethodForm } from './components/MethodForm';
import { MethodPicker } from './components/MethodPicker';
import { QuickCommandMenu } from './components/QuickCommandMenu';
import { RunControls } from './components/RunControls';
import { METHOD_PRESETS } from './config/methods';
import { useRootsWorkbench } from './hooks/useRootsWorkbench';

export default function App() {
  const fullWorkRegionId = useId();
  const [openUtility, setOpenUtility] = useState<'help' | 'presets' | null>(null);
  const {
    activeConfig,
    activeForm,
    activeMethod,
    angleMode,
    applyPreset,
    displayConfig,
    displayRun,
    evidenceExpanded,
    methodConfigs,
    resetActiveMethod,
    runActiveMethod,
    setMethod,
    status,
    toggleAngleMode,
    updateField,
  } = useRootsWorkbench();

  const displayedRun = displayRun.run;
  const hasRun = displayedRun !== null;
  const expressionValue = activeForm[activeConfig.expressionFieldId]?.trim() ?? '';
  const expressionReady = expressionValue.length > 0;

  return (
    <main className="app-shell">
      <div className="workbench-frame">
        <aside className="method-rail" aria-label="Root method picker">
          <div className="rail-head">
            <span className="brand-mark" aria-hidden="true">√</span>
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
              <div className="utility-control">
                <button
                  type="button"
                  aria-expanded={openUtility === 'help'}
                  onClick={() => setOpenUtility((current) => (current === 'help' ? null : 'help'))}
                >
                  <CircleHelp aria-hidden="true" /> Help
                </button>
                {openUtility === 'help' ? (
                  <HelpPopover config={activeConfig} onClose={() => setOpenUtility(null)} />
                ) : null}
              </div>
              <div className="utility-control">
                <button
                  type="button"
                  className="quick-command"
                  aria-expanded={openUtility === 'presets'}
                  onClick={() => setOpenUtility((current) => (current === 'presets' ? null : 'presets'))}
                >
                  <Command aria-hidden="true" /> Quick Command
                </button>
                {openUtility === 'presets' ? (
                  <QuickCommandMenu
                    presets={METHOD_PRESETS}
                    onApply={applyPreset}
                    onClose={() => setOpenUtility(null)}
                  />
                ) : null}
              </div>
            </nav>
          </header>

          <section className="console-grid">
            <section id="equation-studio" className="equation-studio" aria-label="Equation studio">
              <MethodForm
                angleMode={angleMode}
                config={activeConfig}
                formState={activeForm}
                onChange={updateField}
              />
              <RunControls
                disabled={status.kind === 'loading' || !expressionReady}
                disabledReason={
                  expressionReady ? undefined : `Enter ${activeConfig.expressionLabel} before running the method.`
                }
                runLabel={activeConfig.runLabel}
                status={status}
                onRun={runActiveMethod}
                onReset={resetActiveMethod}
              />
            </section>

            <aside className="result-console" aria-label="Result console">
              {hasRun ? (
                <>
                  <AnswerPanel
                    run={displayedRun}
                    freshness={displayRun.freshness}
                    runTimestamp={displayRun.ranAt}
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
