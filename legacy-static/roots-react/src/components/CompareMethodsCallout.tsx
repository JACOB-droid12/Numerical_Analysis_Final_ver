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
    <section className="panel-card">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="section-kicker">
            Compare methods
          </h2>
          <p className="mt-1 text-sm muted-copy">
            Reserved for the next phase of the launchpad.
          </p>
        </div>
        <button
          type="button"
          disabled
          className="inline-flex items-center justify-center rounded-[6px] border border-[rgba(243,234,216,0.1)] bg-[rgba(4,8,11,0.34)] px-3 py-2 text-sm font-medium text-[var(--quiet)]"
        >
          {buttonText(freshness)}
        </button>
      </div>
    </section>
  );
}
