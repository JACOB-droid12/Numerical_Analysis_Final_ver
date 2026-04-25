interface EmptyStateProps {
  digits?: string | null;
  rounding?: string | null;
  stopKind?: string | null;
  stopValue?: string | null;
  maxIterations?: string | null;
}

export function EmptyState({ digits, rounding, stopKind, stopValue, maxIterations }: EmptyStateProps) {
  const isEpsilon = stopKind === 'epsilon';
  const toleranceDisplay = isEpsilon && stopValue ? stopValue : '-';
  const iterationsDisplay = !isEpsilon && maxIterations ? `0 / ${maxIterations}` : '0';

  return (
    <section className="empty-console">
      <div>
        <h2 className="section-kicker">Result Console</h2>
        <p className="empty-root numeric-value">--</p>
        <p className="muted-copy">Run the selected method to show the root estimate.</p>
      </div>

      <div className="empty-metrics">
        <div><span>Status</span><strong>Waiting</strong></div>
        <div><span>Digits</span><strong>{digits ?? '-'}</strong></div>
        {rounding ? <div><span>Rounding</span><strong>{rounding}</strong></div> : null}
        <div><span>Tolerance</span><strong>{toleranceDisplay}</strong></div>
        <div><span>Iterations</span><strong>{iterationsDisplay}</strong></div>
      </div>
    </section>
  );
}
