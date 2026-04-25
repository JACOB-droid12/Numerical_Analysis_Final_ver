import { diagnosticsPreviewText, formatValue, stopReasonLabel } from '../lib/resultFormatters';
import type { RootRunResult } from '../types/roots';

interface DiagnosticsPanelProps {
  run: RootRunResult;
  compact?: boolean;
}

function bracketDiagnostics(run: RootRunResult) {
  if (run.method !== 'bisection' && run.method !== 'falsePosition') {
    return null;
  }

  const summary = run.summary;
  const initial = run.initial;
  const signAnalysis = initial?.hasDisagreement
    ? 'The starting bracket shows a sign disagreement.'
    : initial?.note ?? 'No initial sign analysis was reported.';

  return (
    <div className="space-y-3">
      <h3 className="section-kicker">
        Bracket diagnostics
      </h3>
      <dl className="grid gap-3 sm:grid-cols-3">
        <div className="diagnostic-tile rounded-[6px] border hairline px-4 py-3">
          <dt className="section-kicker text-[0.68rem]">
            Interval status
          </dt>
          <dd className="mt-1 text-sm text-[var(--text)]">
            {summary?.intervalStatus ?? 'No interval status reported.'}
          </dd>
        </div>
        <div className="diagnostic-tile rounded-[6px] border hairline px-4 py-3">
          <dt className="section-kicker text-[0.68rem]">
            Initial sign analysis
          </dt>
          <dd className="mt-1 text-sm leading-6 text-[var(--text)]">{signAnalysis}</dd>
        </div>
        <div className="diagnostic-tile rounded-[6px] border hairline px-4 py-3">
          <dt className="section-kicker text-[0.68rem]">
            Residual
          </dt>
          <dd className="numeric-value mt-1 text-sm text-[var(--text)]">
            {formatValue(summary?.residual)} {summary?.residualBasis ? `(${summary.residualBasis})` : ''}
          </dd>
        </div>
      </dl>
    </div>
  );
}

export function DiagnosticsPanel({ run, compact = false }: DiagnosticsPanelProps) {
  if (compact) {
    return (
      <section className="diagnostic-panel compact rounded-[6px] border hairline p-3">
        <h2 className="section-kicker">
          Diagnostic preview
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--text)]">{diagnosticsPreviewText(run)}</p>
      </section>
    );
  }

  const warnings = run.warnings ?? [];

  return (
    <section className="diagnostic-panel rounded-[6px] border hairline p-4">
      <div className="space-y-3">
        <h2 className="section-kicker">
          Diagnostics
        </h2>
        {warnings.length ? (
          <ul className="space-y-2">
            {warnings.map((warning, index) => (
              <li
                key={`${warning.code}-${index}`}
                className="warning-item rounded-[6px] border px-4 py-3 text-sm text-[var(--red)]"
              >
                {warning.message}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[var(--text)]">No warnings reported.</p>
        )}
      </div>

      <div className="mt-5 border-t hairline pt-5">
        <h3 className="section-kicker">
          Stop reason
        </h3>
        <p className="mt-2 text-sm text-[var(--text)]">
          {stopReasonLabel(run.summary?.stopReason, run.method)}
        </p>
      </div>

      <div className="mt-5 space-y-5">
        {bracketDiagnostics(run)}
      </div>
    </section>
  );
}
