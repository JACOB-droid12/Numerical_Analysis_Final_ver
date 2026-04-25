import { diagnosticsPreviewText, formatValue, stopReasonLabel } from '../lib/resultFormatters';
import type { RootRunResult } from '../types/roots';
import { StoppingCheckPanel } from './StoppingCheckPanel';

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
      <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
        Bracket diagnostics
      </h3>
      <dl className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-md border border-slate-800 bg-slate-900/50 px-4 py-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Interval status
          </dt>
          <dd className="mt-1 text-sm text-slate-200">
            {summary?.intervalStatus ?? 'No interval status reported.'}
          </dd>
        </div>
        <div className="rounded-md border border-slate-800 bg-slate-900/50 px-4 py-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Initial sign analysis
          </dt>
          <dd className="mt-1 text-sm leading-6 text-slate-200">{signAnalysis}</dd>
        </div>
        <div className="rounded-md border border-slate-800 bg-slate-900/50 px-4 py-3">
          <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Residual
          </dt>
          <dd className="mt-1 text-sm text-slate-200">
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
      <section className="rounded-lg border border-slate-800 bg-slate-900/60 p-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Diagnostic preview
        </h2>
        <p className="mt-2 text-sm leading-6 text-slate-200">{diagnosticsPreviewText(run)}</p>
      </section>
    );
  }

  const warnings = run.warnings ?? [];

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-950/80 p-4 shadow-sm shadow-slate-950/20">
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Diagnostics
        </h2>
        {warnings.length ? (
          <ul className="space-y-2">
            {warnings.map((warning, index) => (
              <li
                key={`${warning.code}-${index}`}
                className="rounded-md border border-amber-900/60 bg-amber-950/40 px-4 py-3 text-sm text-amber-100"
              >
                {warning.message}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate-300">No warnings reported.</p>
        )}
      </div>

      <div className="mt-5 border-t border-slate-800 pt-5">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
          Stop reason
        </h3>
        <p className="mt-2 text-sm text-slate-200">
          {stopReasonLabel(run.summary?.stopReason, run.method)}
        </p>
      </div>

      <div className="mt-5 space-y-5">
        <StoppingCheckPanel run={run} />
        {bracketDiagnostics(run)}
      </div>
    </section>
  );
}
