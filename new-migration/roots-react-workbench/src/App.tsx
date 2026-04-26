import { useId, useState } from 'react';
import { ChevronDown, CircleHelp, Copy, Keyboard, RotateCcw, Search } from 'lucide-react';

import { AngleToggle } from './components/AngleToggle';
import { AnswerPanel } from './components/AnswerPanel';
import { ConfidenceSummary } from './components/ConfidenceSummary';
import { ClassroomToolsPanel } from './components/ClassroomToolsPanel';
import { EmptyState } from './components/EmptyState';
import { EngineToggle } from './components/EngineToggle';
import { EvidencePanel } from './components/EvidencePanel';
import { HelpPopover } from './components/HelpPopover';
import { MethodForm } from './components/MethodForm';
import { MethodPicker } from './components/MethodPicker';
import { QuickCommandMenu } from './components/QuickCommandMenu';
import { RunControls } from './components/RunControls';
import { METHOD_PRESETS } from './config/methods';
import { useRootsWorkbench } from './hooks/useRootsWorkbench';
import { answerText } from './lib/resultFormatters';
import type { PrecisionDisplayConfig } from './types/roots';

function formatLastRun(timestamp: string | null) {
  if (!timestamp) return 'Not run yet';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return 'Unknown time';

  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export default function App() {
  const fullWorkRegionId = useId();
  const [openUtility, setOpenUtility] = useState<'help' | 'presets' | null>(null);
  const [precisionDisplay, setPrecisionDisplay] = useState<PrecisionDisplayConfig>({
    mode: 'standard',
    digits: 5,
  });
  const {
    activeConfig,
    activeForm,
    activeMethod,
    angleMode,
    applyPreset,
    displayConfig,
    displayRun,
    engineMode,
    evidenceExpanded,
    methodConfigs,
    resetActiveMethod,
    runActiveMethod,
    setEngineMode,
    setMethod,
    status,
    toggleAngleMode,
    updateField,
  } = useRootsWorkbench();

  const displayedRun = displayRun.run;
  const hasRun = displayedRun !== null;
  const expressionValue = activeForm[activeConfig.expressionFieldId]?.trim() ?? '';
  const expressionReady = expressionValue.length > 0;
  const copyPayload = answerText(displayedRun);

  const copyActiveAnswer = async () => {
    if (!copyPayload || !navigator.clipboard?.writeText) return;
    try {
      await navigator.clipboard.writeText(copyPayload);
    } catch {
      // The answer panel keeps its own copy feedback; this toolbar action is best-effort.
    }
  };

  return (
    <main className="app-shell">
      <section className="mac-window" aria-label="Roots Workbench">
        <header className="window-toolbar">
          <h1 className="sr-only">Answer workstation</h1>

          <nav className="toolbar-actions" aria-label="Application controls">
            <EngineToggle engineMode={engineMode} onChange={setEngineMode} />
            <AngleToggle angleMode={angleMode} onToggle={toggleAngleMode} />
            <div className="utility-control toolbar-search">
              <button
                type="button"
                className="quick-command"
                aria-expanded={openUtility === 'presets'}
                onClick={() => setOpenUtility((current) => (current === 'presets' ? null : 'presets'))}
              >
                <Search aria-hidden="true" />
                <span className="keycap">⌘K</span>
                <span>Quick command</span>
              </button>
              {openUtility === 'presets' ? (
                <QuickCommandMenu
                  presets={METHOD_PRESETS}
                  onApply={applyPreset}
                  onClose={() => setOpenUtility(null)}
                />
              ) : null}
            </div>
            <div className="toolbar-icon-group">
              <div className="utility-control">
                <button
                  type="button"
                  className="toolbar-icon-button"
                  aria-expanded={openUtility === 'help'}
                  onClick={() => setOpenUtility((current) => (current === 'help' ? null : 'help'))}
                >
                  <CircleHelp aria-hidden="true" />
                  <span className="sr-only">Help</span>
                </button>
                {openUtility === 'help' ? (
                  <HelpPopover config={activeConfig} onClose={() => setOpenUtility(null)} />
                ) : null}
              </div>
              <button type="button" className="toolbar-icon-button" aria-label="Shortcuts">
                <Keyboard aria-hidden="true" />
              </button>
              <button
                type="button"
                className="toolbar-icon-button"
                aria-label="Copy answer"
                disabled={!copyPayload}
                onClick={copyActiveAnswer}
              >
                <Copy aria-hidden="true" />
              </button>
              <button
                type="button"
                className="toolbar-icon-button"
                aria-label="Reset active method"
                onClick={resetActiveMethod}
              >
                <RotateCcw aria-hidden="true" />
              </button>
              <button type="button" className="toolbar-icon-button" aria-label="More actions">
                <ChevronDown aria-hidden="true" />
              </button>
            </div>
          </nav>
        </header>

      <div className="workbench-frame">
        <aside className="method-rail" aria-label="Root method picker">
          <div className="rail-head">
            <span className="brand-mark" aria-hidden="true">√</span>
          </div>
          <MethodPicker
            activeMethod={activeMethod}
            methods={methodConfigs}
            onSelect={setMethod}
          />
          <div className="rail-secondary" aria-label="Secondary navigation">
            <span className="rail-secondary-item">History</span>
            <span className="rail-secondary-item">Saved</span>
            <span className="rail-secondary-item">Settings</span>
          </div>
          <p className="system-ready sr-only"><span /> Engine ready</p>
        </aside>

        <div className="workbench-main">
          <section className="console-grid">
            <section id="equation-studio" className="equation-studio" aria-label="Equation studio">
              <div className="workflow-heading">
                <span className="workflow-step" aria-hidden="true">1</span>
                <div>
                  <h2>Equation Studio</h2>
                  <p>{activeConfig.shortLabel} method</p>
                </div>
              </div>
              <MethodForm
                angleMode={angleMode}
                config={activeConfig}
                formState={activeForm}
                onChange={updateField}
              />
              <ClassroomToolsPanel
                angleMode={angleMode}
                formState={activeForm}
                method={activeMethod}
                precisionDisplay={precisionDisplay}
                onPrecisionDisplayChange={setPrecisionDisplay}
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
              <div className="workflow-heading">
                <span className="workflow-step" aria-hidden="true">2</span>
                <div>
                  <h2>Result</h2>
                  <p>{hasRun ? 'Current calculation output' : 'Waiting for a run'}</p>
                </div>
              </div>
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
                precisionDisplay={precisionDisplay}
                run={displayedRun}
              />
            ) : null}
          </div>
        </div>
      </div>
        <footer className="workbench-statusbar">
          <span><span className="status-dot" /> Ready</span>
          <span>Last run: {formatLastRun(displayRun.ranAt)}</span>
          <span>Engine: {engineMode === 'modern' ? 'Modern beta' : 'Legacy'} · Angle: {angleMode.toUpperCase()} · Precision: current settings</span>
        </footer>
      </section>
    </main>
  );
}
