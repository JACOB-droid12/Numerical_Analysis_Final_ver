export function EmptyState() {
  return (
    <section className="empty-console">
      <div>
        <h2 className="section-kicker">Result Console</h2>
        <p className="empty-root numeric-value">--</p>
        <p className="muted-copy">Run the selected method to show the root estimate.</p>
      </div>

      <div className="empty-metrics">
        <div><span>Status</span><strong>Waiting</strong></div>
        <div><span>Tolerance</span><strong>Pending</strong></div>
        <div><span>Iterations</span><strong>Pending</strong></div>
      </div>
    </section>
  );
}
