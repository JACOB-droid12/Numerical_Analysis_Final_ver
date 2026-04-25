import { compactConfidenceItems, confidenceStatus } from '../lib/resultFormatters';
import type { RootRunResult, RunFreshness } from '../types/roots';

interface ConfidenceSummaryProps {
  run: RootRunResult | null;
  freshness: RunFreshness;
  staleReason: string | null;
}

export function ConfidenceSummary({ run, freshness, staleReason }: ConfidenceSummaryProps) {
  if (!run) {
    return null;
  }

  const items = compactConfidenceItems(run);
  const status = confidenceStatus(run, freshness, staleReason);
  const confidenceBars = Array.from({ length: 5 }, (_, index) => index < status.bars);

  return (
    <section className={`confidence-panel confidence-panel--${status.tone}`}>
      <header>
        <div>
          <h2 className="section-kicker">Confidence & Diagnostics</h2>
        </div>
        <span className={`confidence-status confidence-status--${status.tone}`}>
          {status.label}
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
          <dd className={`confidence-bars confidence-bars--${status.tone}`} aria-label={status.ariaLabel}>
            {confidenceBars.map((filled, index) => (
              <span
                key={index}
                className={filled ? 'confidence-bar-filled' : 'confidence-bar-empty'}
              />
            ))}
          </dd>
        </div>
      </dl>

      <div className="diagnostic-note">
        <span aria-hidden="true" className="diagnostic-note-icon">△</span>
        <p>
          <strong className="section-kicker">Note</strong><br />
          {status.note}
        </p>
      </div>
    </section>
  );
}
