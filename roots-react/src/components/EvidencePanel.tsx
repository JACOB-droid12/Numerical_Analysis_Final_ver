import { useId, useMemo } from 'react';

import { ConvergenceGraph } from './ConvergenceGraph';
import { DiagnosticsPanel } from './DiagnosticsPanel';
import { IterationTable } from './IterationTable';
import { SolutionSteps } from './SolutionSteps';
import type { MethodConfig, RootRunResult } from '../types/roots';

interface EvidencePanelProps {
  config: MethodConfig;
  expanded: boolean;
  run: RootRunResult | null;
  onToggle: () => void;
}

export function EvidencePanel({ config, expanded, run, onToggle }: EvidencePanelProps) {
  const title = useMemo(() => (expanded ? 'Hide evidence' : 'Show evidence'), [expanded]);
  const contentId = useId();

  if (!run) {
    return null;
  }

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-950/80 p-4 shadow-sm shadow-slate-950/20">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Evidence
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Diagnostics, graph, steps, and iteration table for {config.shortLabel}.
          </p>
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-controls={contentId}
          className="inline-flex items-center justify-center rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
        >
          {title}
        </button>
      </div>

      {expanded ? (
        <div id={contentId} role="region" aria-label="Evidence details" className="mt-4 space-y-4">
          <DiagnosticsPanel run={run} />
          <ConvergenceGraph run={run} />
          <SolutionSteps run={run} />
          <IterationTable config={config} run={run} />
        </div>
      ) : null}
    </section>
  );
}
