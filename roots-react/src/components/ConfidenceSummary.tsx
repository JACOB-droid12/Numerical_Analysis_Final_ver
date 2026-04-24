import { compactConfidenceItems, staleStatusText } from '../lib/resultFormatters';
import type { RootRunResult, RunFreshness } from '../types/roots';

interface ConfidenceSummaryProps {
  run: RootRunResult | null;
  freshness: RunFreshness;
  staleReason: string | null;
}

function statusClasses(freshness: RunFreshness): string {
  return freshness === 'stale'
    ? 'border-amber-900/60 bg-amber-950/40 text-amber-200'
    : 'border-emerald-900/60 bg-emerald-950/40 text-emerald-200';
}

function statusLabel(freshness: RunFreshness): string {
  return freshness === 'stale' ? 'Stale' : 'Current';
}

export function ConfidenceSummary({ run, freshness, staleReason }: ConfidenceSummaryProps) {
  if (!run) {
    return null;
  }

  const items = compactConfidenceItems(run);
  const note = staleStatusText(staleReason);

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-950/80 p-4 shadow-sm shadow-slate-950/20">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Confidence
          </h2>
          <p className="mt-1 text-sm text-slate-500">Quick check</p>
        </div>
        <span
          className={`inline-flex w-fit items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClasses(
            freshness,
          )}`}
        >
          {statusLabel(freshness)}
        </span>
      </div>

      <dl className="mt-4 grid gap-3 sm:grid-cols-3">
        {items.map((item) => (
          <div key={item.label} className="rounded-md border border-slate-800 bg-slate-900/50 px-4 py-3">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {item.label}
            </dt>
            <dd className="mt-1 text-sm leading-6 text-slate-200">{item.value}</dd>
          </div>
        ))}
      </dl>

      <p className="mt-3 text-xs leading-5 text-slate-500">{note}</p>
    </section>
  );
}
