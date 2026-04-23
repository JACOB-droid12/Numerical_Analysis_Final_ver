import { ConvergenceGraph } from './ConvergenceGraph';
import { DiagnosticsPanel } from './DiagnosticsPanel';
import type { RootRunResult, RunFreshness } from '../types/roots';

interface EvidencePreviewProps {
  fullWorkRegionId: string;
  run: RootRunResult | null;
  freshness: RunFreshness;
  expanded: boolean;
  onToggle: () => void;
}

export function EvidencePreview({
  fullWorkRegionId,
  run,
  freshness,
  expanded,
  onToggle,
}: EvidencePreviewProps) {
  if (!run) {
    return null;
  }

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-950/80 p-4 shadow-sm shadow-slate-950/20">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Evidence preview
          </h2>
          <p className="mt-1 text-sm text-slate-300">Quick proof the result is grounded.</p>
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-controls={fullWorkRegionId}
          className="inline-flex items-center justify-center rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-800"
        >
          {expanded ? 'Hide full work' : 'Show full work'}
        </button>
      </div>

      {freshness === 'stale' ? (
        <p className="mt-4 rounded-md border border-amber-900/60 bg-amber-950/40 px-4 py-3 text-sm text-amber-100">
          The preview below reflects the last successful run and may not match the current draft inputs.
        </p>
      ) : null}

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <ConvergenceGraph run={run} compact />
        <DiagnosticsPanel run={run} compact />
      </div>
    </section>
  );
}
