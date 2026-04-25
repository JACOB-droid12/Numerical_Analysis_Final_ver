import { formatValue, stopReasonLabel, stoppingText } from '../lib/resultFormatters';
import type { RootRunResult } from '../types/roots';

interface StoppingCheckPanelProps {
  run: RootRunResult;
}

function finalMetric(run: RootRunResult): string {
  const summary = run.summary;
  if (summary?.bound != null) return `bound = ${formatValue(summary.bound)}`;
  if (summary?.error != null) return `error = ${formatValue(summary.error)}`;
  if (summary?.residual != null) return `residual = ${formatValue(summary.residual)}`;
  return 'metric unavailable';
}

export function StoppingCheckPanel({ run }: StoppingCheckPanelProps) {
  const rows = run.rows ?? [];
  const finalRow = rows.length ? rows[rows.length - 1] : undefined;

  return (
    <section className="stopping-panel">
      <h2 className="section-kicker">Stopping check</h2>
      <dl className="stopping-grid">
        <div>
          <dt>Reason</dt>
          <dd>{stopReasonLabel(run.summary?.stopReason, run.method)}</dd>
        </div>
        <div>
          <dt>Rule</dt>
          <dd>{stoppingText(run)}</dd>
        </div>
        <div>
          <dt>Final metric</dt>
          <dd className="numeric-value">{finalMetric(run)}</dd>
        </div>
        <div>
          <dt>Final row</dt>
          <dd className="numeric-value">
            {finalRow ? `n = ${finalRow.iteration}, error = ${formatValue(finalRow.error)}` : 'No row'}
          </dd>
        </div>
      </dl>
    </section>
  );
}
