import type { RunFreshness } from '../types/roots';

interface CompareMethodsCalloutProps {
  visible: boolean;
  freshness: RunFreshness;
}

function buttonText(freshness: RunFreshness): string {
  return freshness === 'stale' ? 'Re-run before comparing' : 'Compare methods (next phase)';
}

export function CompareMethodsCallout({ visible, freshness }: CompareMethodsCalloutProps) {
  if (!visible) {
    return null;
  }

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-950/80 p-4 shadow-sm shadow-slate-950/20">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Compare methods
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Reserved for the next phase of the launchpad.
          </p>
        </div>
        <button
          type="button"
          disabled
          className="inline-flex items-center justify-center rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-500"
        >
          {buttonText(freshness)}
        </button>
      </div>
    </section>
  );
}
