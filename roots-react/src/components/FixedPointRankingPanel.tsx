import { Trophy } from 'lucide-react';

import { formatValue, stopReasonLabel } from '../lib/resultFormatters';
import type { FixedPointComparisonResult } from '../types/roots';

interface FixedPointRankingPanelProps {
  result: FixedPointComparisonResult;
}

function outcomeLabel(outcome: string): string {
  if (outcome === 'convergent') return 'Convergent';
  if (outcome === 'undefined') return 'Undefined';
  if (outcome === 'cycle') return 'Cycle';
  if (outcome === 'stalled') return 'Stalled';
  if (outcome === 'diverged') return 'Diverged';
  return 'Other';
}

export function FixedPointRankingPanel({ result }: FixedPointRankingPanelProps) {
  const convergentRows = result.rows
    .filter((row) => row.rank != null)
    .sort((left, right) => (left.rank ?? 0) - (right.rank ?? 0));
  const otherRows = result.rows.filter((row) => row.rank == null);

  return (
    <section className="ranking-panel">
      <header>
        <div>
          <h2 className="section-kicker">Fixed-point ranking</h2>
          <p className="mt-1 text-sm muted-copy">
            Target {result.targetLabel}, p0 = {result.initialValue}
          </p>
        </div>
        <Trophy aria-hidden="true" />
      </header>

      <div className="ranking-table-shell premium-scrollbar">
        <table className="iteration-table numeric-value">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Formula</th>
              <th>Outcome</th>
              <th>Iterations</th>
              <th>Final value</th>
              <th>Final step</th>
              <th>Stop</th>
            </tr>
          </thead>
          <tbody>
            {[...convergentRows, ...otherRows].map((row) => (
              <tr key={row.candidate.id}>
                <td>{row.rank ?? '-'}</td>
                <td>{row.candidate.label}. {row.candidate.expression}</td>
                <td>{outcomeLabel(row.outcome)}</td>
                <td>{row.iterations}</td>
                <td>{formatValue(row.finalValue, 14)}</td>
                <td>{formatValue(row.finalStep, 14)}</td>
                <td>{stopReasonLabel(row.stopReason, 'fixedPoint')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {otherRows.length ? (
        <p className="table-footnote">
          Non-ranked formulas did not meet the convergence classification for this run.
        </p>
      ) : null}
    </section>
  );
}
