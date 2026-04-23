import { ConvergenceGraph } from './ConvergenceGraph';
import { DiagnosticsPanel } from './DiagnosticsPanel';
import { IterationTable } from './IterationTable';
import { SolutionSteps } from './SolutionSteps';
import type { MethodConfig, RootRunResult } from '../types/roots';

interface EvidencePanelProps {
  config: MethodConfig;
  contentId: string;
  expanded: boolean;
  run: RootRunResult | null;
}

export function EvidencePanel({ config, contentId, expanded, run }: EvidencePanelProps) {
  if (!run || !expanded) {
    return null;
  }

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-950/80 p-4 shadow-sm shadow-slate-950/20">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">Full work</h2>
          <p className="mt-1 text-sm text-slate-500">
            Diagnostics, graph, steps, and iteration table for {config.shortLabel}.
          </p>
        </div>
      </div>

      <div id={contentId} role="region" aria-label="Full work details" className="mt-4 space-y-4">
        <DiagnosticsPanel run={run} />
        <ConvergenceGraph run={run} />
        <SolutionSteps run={run} />
        <IterationTable config={config} run={run} />
      </div>
    </section>
  );
}
