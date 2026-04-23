import { useId } from 'react';

import { AngleToggle } from './components/AngleToggle';
import { AnswerPanel } from './components/AnswerPanel';
import { EmptyState } from './components/EmptyState';
import { EvidencePanel } from './components/EvidencePanel';
import { EvidencePreview } from './components/EvidencePreview';
import { MethodForm } from './components/MethodForm';
import { MethodPicker } from './components/MethodPicker';
import { RunControls } from './components/RunControls';
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

  const displayedRun = displayRun.run;
  const hasRun = displayedRun !== null;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-slate-800 pb-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-300">
              Roots React pilot
            </p>
            <h1 className="text-3xl font-semibold text-slate-50 sm:text-4xl">
              NET+ Roots Workbench
            </h1>
            <p className="max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
              Choose a method, set the inputs, and inspect the answer together with the
              supporting numerical evidence.
            </p>
          </div>
          <AngleToggle angleMode={angleMode} onToggle={toggleAngleMode} />
        </header>

        <section className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
          <div className="space-y-6">
            <section className="rounded-lg border border-slate-800 bg-slate-950/80 p-5 shadow-sm shadow-slate-950/20">
              <div className="space-y-3">
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                    Method
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    Select the numerical method you want to run.
                  </p>
                </div>
                <MethodPicker
                  activeMethod={activeMethod}
                  methods={methodConfigs}
                  onSelect={setMethod}
                />
              </div>
            </section>

            <section className="rounded-lg border border-slate-800 bg-slate-950/80 p-5 shadow-sm shadow-slate-950/20">
              <div className="space-y-5">
                <div>
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                    Method inputs
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">{activeConfig.summary}</p>
                </div>
                <MethodForm
                  config={activeConfig}
                  formState={activeForm}
                  onChange={updateField}
                />
                <RunControls
                  disabled={status.kind === 'loading'}
                  runLabel={activeConfig.runLabel}
                  status={status}
                  onRun={runActiveMethod}
                />
              </div>
            </section>
          </div>

          <div className="space-y-6">
            {hasRun ? (
              <AnswerPanel
                run={displayedRun}
                freshness={displayRun.freshness}
                staleReason={displayRun.staleReason}
              />
            ) : (
              <EmptyState />
            )}
            {hasRun ? (
              <>
                <EvidencePreview
                  fullWorkRegionId={fullWorkRegionId}
                  expanded={evidenceExpanded}
                  freshness={displayRun.freshness}
                  run={displayedRun}
                  onToggle={() => setEvidenceExpanded((current) => !current)}
                />
                {!evidenceExpanded ? <div id={fullWorkRegionId} hidden /> : null}
                <EvidencePanel
                  config={displayConfig}
                  contentId={fullWorkRegionId}
                  expanded={evidenceExpanded}
                  run={displayedRun}
                />
              </>
            ) : null}
          </div>
        </section>
      </div>
    </main>
  );
}
