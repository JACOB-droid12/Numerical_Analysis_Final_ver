import { formatValue, stopReasonLabel } from '../lib/resultFormatters';
import type { FixedPointBatchEntry, RootRunResult } from '../types/roots';

interface WorkflowPanelProps {
  run: RootRunResult;
}

function statusLabel(entry: FixedPointBatchEntry): string {
  if (entry.status === 'wrong-target') return 'Wrong target';
  if (entry.status === 'iteration-limit') return 'Review';
  return entry.status.replace(/-/g, ' ');
}

export function WorkflowPanel({ run }: WorkflowPanelProps) {
  const helpers = run.helpers;
  if (!helpers) return null;

  const hasContent =
    helpers.requiredIterations ||
    helpers.bracketScan ||
    helpers.derivative ||
    helpers.newtonInitial ||
    helpers.fixedPointBatch;

  if (!hasContent) return null;

  return (
    <section className="workflow-panel">
      <header>
        <div>
          <h2 className="section-kicker">Workflow helpers</h2>
          <p className="mt-1 text-sm muted-copy">Generated checks for quiz-style setup, ranking, and guardrails.</p>
        </div>
      </header>

      <div className="workflow-stack">
        {helpers.requiredIterations ? (
          <article className="workflow-block">
            <h3>Required iterations</h3>
            <p>
              N = <strong>{helpers.requiredIterations.requiredIterations}</strong> for tolerance{' '}
              <span className="numeric-value">{helpers.requiredIterations.tolerance}</span>.
            </p>
            <p className="muted-copy">{helpers.requiredIterations.note}</p>
          </article>
        ) : null}

        {helpers.derivative ? (
          <article className="workflow-block">
            <h3>Newton setup</h3>
            <p>
              Derivative source: <strong>{helpers.derivative.source}</strong>
            </p>
            <p className="numeric-value">{helpers.derivative.canonical || helpers.derivative.expression}</p>
            {helpers.newtonInitial ? (
              <p>
                x0 source: <strong>{helpers.newtonInitial.strategy}</strong>, x0 ={' '}
                <span className="numeric-value">{formatValue(helpers.newtonInitial.x0)}</span>.
              </p>
            ) : null}
            <p className="muted-copy">{helpers.derivative.note}</p>
          </article>
        ) : null}

        {helpers.bracketScan ? (
          <article className="workflow-block">
            <h3>Bracket scan</h3>
            <p>
              Range{' '}
              <span className="numeric-value">
                [{formatValue(helpers.bracketScan.range.min)}, {formatValue(helpers.bracketScan.range.max)}]
              </span>{' '}
              with {helpers.bracketScan.range.steps} sample steps found {helpers.bracketScan.candidates.length}{' '}
              candidate{helpers.bracketScan.candidates.length === 1 ? '' : 's'}.
            </p>
            <div className="table-shell premium-scrollbar mt-3">
              <table className="iteration-table numeric-value">
                <thead>
                  <tr>
                    <th>Bracket</th>
                    <th>Kind</th>
                    <th>Approximation</th>
                    <th>Stop</th>
                    <th>Residual</th>
                  </tr>
                </thead>
                <tbody>
                  {helpers.bracketScan.solutions.map((solution, index) => (
                    <tr key={`${index}-${formatValue(solution.a)}-${formatValue(solution.b)}`}>
                      <td>[{formatValue(solution.a)}, {formatValue(solution.b)}]</td>
                      <td>{helpers.bracketScan?.candidates[index]?.kind ?? 'candidate'}</td>
                      <td>{formatValue(solution.approximation)}</td>
                      <td>{stopReasonLabel(solution.stopReason, 'bisection')}</td>
                      <td>{formatValue(solution.residual)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="muted-copy">{helpers.bracketScan.note}</p>
          </article>
        ) : null}

        {helpers.fixedPointBatch ? (
          <article className="workflow-block">
            <h3>Fixed-point ranking</h3>
            <p className="muted-copy">{helpers.fixedPointBatch.note}</p>
            <div className="table-shell premium-scrollbar mt-3">
              <table className="iteration-table numeric-value">
                <thead>
                  <tr>
                    <th>Rank</th>
                    <th>g(x)</th>
                    <th>x0</th>
                    <th>Approximation</th>
                    <th>Iterations</th>
                    <th>Status</th>
                    <th>Target residual</th>
                    <th>Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {helpers.fixedPointBatch.entries.map((entry) => (
                    <tr key={`${entry.rank}-${entry.gExpression}-${formatValue(entry.x0)}`}>
                      <td>{entry.rank}</td>
                      <td>{entry.canonical || entry.gExpression}</td>
                      <td>{formatValue(entry.x0)}</td>
                      <td>{formatValue(entry.approximation)}</td>
                      <td>{entry.iterations}</td>
                      <td>{statusLabel(entry)}</td>
                      <td>{formatValue(entry.targetResidual ?? entry.residual)}</td>
                      <td>{entry.observedRate == null ? 'N/A' : formatValue(entry.observedRate)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </article>
        ) : null}
      </div>
    </section>
  );
}
