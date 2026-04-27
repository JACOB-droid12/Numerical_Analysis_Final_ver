import { useEffect, useId, useMemo, useState } from 'react';
import { ChevronDown, CircleHelp, Copy, RotateCcw, X } from 'lucide-react';

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
import { QuickSetupPanel } from './components/QuickSetupPanel';
import { RunControls } from './components/RunControls';
import { METHOD_PRESETS } from './config/methods';
import { useCopyFeedback } from './hooks/useCopyFeedback';
import { useRootsWorkbench } from './hooks/useRootsWorkbench';
import { answerText } from './lib/resultFormatters';
import type { MethodFormState, PrecisionDisplayConfig, RootMethod } from './types/roots';

function formatLastRun(timestamp: string | null) {
  if (!timestamp) return 'Not run yet';
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return 'Unknown time';

  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

const METHOD_FIELD_PREFIX: Record<RootMethod, string> = {
  bisection: 'root-bis',
  falsePosition: 'root-fp',
  fixedPoint: 'root-fpi',
  newton: 'root-newton',
  secant: 'root-secant',
};

function precisionDisplayFromComputationSettings(
  method: RootMethod,
  formState: MethodFormState,
): PrecisionDisplayConfig {
  const prefix = METHOD_FIELD_PREFIX[method];
  const digits = Number(formState[`${prefix}-k`] ?? 8);
  const mode = formState[`${prefix}-mode`] === 'chop' ? 'chop' : 'round';

  return {
    mode,
    digits: Number.isInteger(digits) && digits > 0 ? digits : 8,
  };
}

export default function App() {
  const fullWorkRegionId = useId();
  const [openUtility, setOpenUtility] = useState<'help' | 'presets' | 'shortcuts' | 'more' | null>(null);
  const { copyStatus, copyText } = useCopyFeedback();
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
    runQuickSetup,
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
  const expressionError = status.kind === 'error' && expressionReady ? status.message : undefined;
  const copyPayload = answerText(displayedRun);
  const precisionDisplay = useMemo(
    () => precisionDisplayFromComputationSettings(activeMethod, activeForm),
    [activeForm, activeMethod],
  );

  const copyActiveAnswer = async () => {
    if (!copyPayload) return;
    await copyText(copyPayload);
  };

  useEffect(() => {
    if (!openUtility) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpenUtility(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openUtility]);

  return (
    <main className="app-shell">
      <section className="mac-window" aria-label="Roots Workbench">
        <header className="window-toolbar">
          <h1 className="sr-only">Answer workstation</h1>

          <nav className="toolbar-actions" aria-label="Application controls">
            <AngleToggle angleMode={angleMode} onToggle={toggleAngleMode} />
            <div className="utility-control toolbar-search">
              <button
                type="button"
                className="quick-command"
                aria-expanded={openUtility === 'presets'}
                onClick={() => setOpenUtility((current) => (current === 'presets' ? null : 'presets'))}
              >
                <span className="keycap">⌘K</span>
                <span>Load preset</span>
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
              <button
                type="button"
                className="toolbar-icon-button"
                aria-label={
                  copyStatus === 'success'
                    ? 'Answer copied'
                    : copyStatus === 'error'
                      ? 'Copy answer failed'
                      : 'Copy answer'
                }
                aria-live="polite"
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
              <div className="utility-control">
                <button
                  type="button"
                  className="toolbar-icon-button"
                  aria-expanded={openUtility === 'more'}
                  aria-label="More actions"
                  onClick={() => setOpenUtility((current) => (current === 'more' ? null : 'more'))}
                >
                  <ChevronDown aria-hidden="true" />
                </button>
                {openUtility === 'more' ? (
                  <section className="utility-popover more-actions-popover" aria-label="More actions">
                    <header className="utility-popover-head">
                      <div>
                        <p className="section-kicker">Actions</p>
                        <h2>Workbench tools</h2>
                      </div>
                      <button
                        type="button"
                        className="popover-close-button"
                        onClick={() => setOpenUtility(null)}
                        aria-label="Close actions"
                      >
                        <X aria-hidden="true" />
                      </button>
                    </header>
                    <div className="action-list">
                      <button type="button" onClick={() => setOpenUtility('help')}>
                        Open method help
                      </button>
                      <button type="button" onClick={() => setOpenUtility('presets')}>
                        Load preset
                      </button>
                      <button type="button" onClick={() => setOpenUtility('shortcuts')}>
                        Keyboard basics
                      </button>
                      <button
                        type="button"
                        disabled={!copyPayload}
                        onClick={async () => {
                          await copyActiveAnswer();
                          setOpenUtility(null);
                        }}
                      >
                        Copy current answer
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          resetActiveMethod();
                          setOpenUtility(null);
                        }}
                      >
                        Reset active method
                      </button>
                    </div>
                  </section>
                ) : null}
                {openUtility === 'shortcuts' ? (
                  <section className="utility-popover shortcuts-popover" aria-label="Keyboard shortcuts">
                    <header className="utility-popover-head">
                      <div>
                        <p className="section-kicker">Shortcuts</p>
                        <h2>Keyboard basics</h2>
                      </div>
                      <button
                        type="button"
                        className="popover-close-button"
                        onClick={() => setOpenUtility(null)}
                        aria-label="Close shortcuts"
                      >
                        <X aria-hidden="true" />
                      </button>
                    </header>
                    <dl className="shortcut-list">
                      <div>
                        <dt><span className="keycap">Tab</span></dt>
                        <dd>Move to the next control</dd>
                      </div>
                      <div>
                        <dt><span className="keycap">Enter</span></dt>
                        <dd>Use the focused control</dd>
                      </div>
                      <div>
                        <dt><span className="keycap">Esc</span></dt>
                        <dd>Close an open panel</dd>
                      </div>
                    </dl>
                  </section>
                ) : null}
              </div>
            </div>
          </nav>
        </header>

      <div className="workbench-frame">
        <aside className="method-rail" aria-label="Root method picker">
          <div className="rail-head">
            <span className="brand-mark" aria-hidden="true">√</span>
            <div className="brand-lockup">
              <strong>Roots</strong>
              <span>Workbench</span>
            </div>
          </div>
          <MethodPicker
            activeMethod={activeMethod}
            methods={methodConfigs}
            onSelect={setMethod}
          />
          <details className="rail-quick-setup">
            <summary>
              <span>Quick Setup</span>
              <small>Manual table</small>
            </summary>
            <QuickSetupPanel disabled={status.kind === 'loading'} onRun={runQuickSetup} />
          </details>
          <details className="rail-advanced-testing" aria-label="Advanced testing tools">
            <summary>
              <span>Advanced/testing</span>
              <small>{engineMode === 'modern' ? 'Modern beta/testing' : 'Stable'}</small>
            </summary>
            <EngineToggle engineMode={engineMode} onChange={setEngineMode} />
          </details>
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
                engineMode={engineMode}
                expressionError={expressionError}
                formState={activeForm}
                onChange={updateField}
              />
              <ClassroomToolsPanel
                angleMode={angleMode}
                engineMode={engineMode}
                formState={activeForm}
                method={activeMethod}
                precisionDisplay={precisionDisplay}
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
                    precisionDisplay={precisionDisplay}
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
          <span>Mode: {engineMode === 'modern' ? 'Modern beta/testing' : 'Stable'} · Angle: {angleMode.toUpperCase()} · Precision: current settings</span>
        </footer>
      </section>
    </main>
  );
}
