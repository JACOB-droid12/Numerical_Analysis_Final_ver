import { compactConfidenceItems, staleStatusText } from '../lib/resultFormatters';
import type { RootRunResult, RunFreshness } from '../types/roots';

interface ConfidenceSummaryProps {
  run: RootRunResult | null;
  freshness: RunFreshness;
  staleReason: string | null;
}

function statusClasses(freshness: RunFreshness): string {
  return freshness === 'stale'
    ? 'text-[var(--clay)]'
    : 'text-[var(--green)]';
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
  const warnings = run.warnings ?? [];

  return (
    <section className="confidence-panel">
      <header>
        <div>
          <h2 className="section-kicker">Confidence & Diagnostics</h2>
        </div>
        <span
          className={`numeric-value text-sm font-semibold ${statusClasses(
            freshness,
          )}`}
        >
          {statusLabel(freshness)}
        </span>
      </header>

      <dl className="confidence-grid">
        {items.map((item) => (
          <div key={item.label}>
            <dt>{item.label}</dt>
            <dd className="numeric-value">{item.value}</dd>
          </div>
        ))}
        <div>
          <dt>Confidence</dt>
          <dd className="confidence-bars" aria-label="High confidence">
            <span /><span /><span /><span /><span />
          </dd>
        </div>
      </dl>

      <div className="diagnostic-note">
        <span aria-hidden="true" className="text-2xl text-[var(--orange)]">△</span>
        <p>
          <strong className="section-kicker">Note</strong><br />
          {warnings[0]?.message ?? `${note} Current residual and stopping criteria are within the selected precision.`}
        </p>
      </div>
    </section>
  );
}
