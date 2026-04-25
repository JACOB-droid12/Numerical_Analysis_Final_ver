import { compactConfidenceItems } from '../lib/resultFormatters';
import type { RootMethod, RootRunResult, RunFreshness } from '../types/roots';

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

// --- Confidence scoring ---

const CONVERGED_REASONS = new Set([
  'tolerance-reached',
  'tolerance-already-met',
  'endpoint-root',
  'exact-zero',
  'machine-zero',
  'iteration-limit',
]);

const FAILURE_REASONS = new Set([
  'iteration-cap',
  'invalid-starting-interval',
  'invalid-bracket',
  'discontinuity-detected',
  'singularity-encountered',
  'non-finite-evaluation',
  'derivative-zero',
  'stagnation',
  'diverged',
  'diverged-step',
  'step-small-residual-large',
  'retained-endpoint-stagnation',
  'cycle-detected',
  'invalid-input',
]);

const LINEAR_METHODS: RootMethod[] = ['bisection', 'falsePosition', 'fixedPoint'];
const QUADRATIC_METHODS: RootMethod[] = ['newton', 'secant'];

function computeConfidenceScore(run: RootRunResult, freshness: RunFreshness): number {
  const stopReason = run.summary?.stopReason ?? null;

  // Non-converged / failure → score 1
  if (!stopReason || FAILURE_REASONS.has(stopReason)) {
    return freshness === 'stale' ? Math.min(1, 2) : 1;
  }

  const converged = CONVERGED_REASONS.has(stopReason);
  if (!converged) {
    // Unknown reason — treat conservatively
    const base = 1;
    return freshness === 'stale' ? Math.min(base, 2) : base;
  }

  // Determine iteration headroom
  const stopping = run.stopping;
  const actual =
    stopping?.actualIterations ??
    stopping?.iterationsRequired ??
    run.rows?.length ??
    0;
  const max =
    stopping?.maxIterations ??
    stopping?.plannedIterations ??
    stopping?.iterationsRequired ??
    null;
  const iterFraction = max != null && max > 0 ? actual / max : 0;
  const nearMax = iterFraction >= 0.9;

  // Determine residual vs tolerance gap
  const metric =
    typeof run.summary?.error === 'number'
      ? run.summary.error
      : typeof run.summary?.bound === 'number'
        ? run.summary.bound
        : typeof run.summary?.residual === 'number'
          ? run.summary.residual
          : null;
  const epsilon =
    stopping?.kind === 'epsilon' && typeof stopping.epsilon === 'number'
      ? stopping.epsilon
      : null;
  const residualFarBelow =
    metric != null && epsilon != null && Math.abs(metric) <= epsilon * 0.01;

  // Score 2: converged but exhausted most of the iteration budget
  if (nearMax) {
    return freshness === 'stale' ? Math.min(2, 2) : 2;
  }

  // Score 5: residual far below tolerance and comfortably within budget
  if (residualFarBelow && iterFraction <= 0.5) {
    const base = 5;
    return freshness === 'stale' ? Math.min(base, 2) : base;
  }

  // Score 4: quadratic method, converged, within tolerance
  if (QUADRATIC_METHODS.includes(run.method)) {
    const base = 4;
    return freshness === 'stale' ? Math.min(base, 2) : base;
  }

  // Score 3: linear method, converged within tolerance, iter count < 90% of max
  if (LINEAR_METHODS.includes(run.method)) {
    const base = 3;
    return freshness === 'stale' ? Math.min(base, 2) : base;
  }

  const base = 3;
  return freshness === 'stale' ? Math.min(base, 2) : base;
}

function confidenceLabel(score: number): string {
  if (score <= 2) return 'low';
  if (score <= 3) return 'medium';
  return 'high';
}

function barColor(score: number, filled: boolean): string {
  if (!filled) {
    return 'color-mix(in oklch, var(--quiet), transparent 70%)';
  }
  return score >= 3 ? 'var(--green)' : 'var(--clay)';
}

// --- Diagnostic note ---

type DiagnosticSeverity = 'failure' | 'warning' | null;

interface DiagnosticInfo {
  severity: DiagnosticSeverity;
  icon: string;
  color: string;
  title: string;
  message: string;
}

function getDiagnosticInfo(
  run: RootRunResult,
  freshness: RunFreshness,
  staleReason: string | null,
): DiagnosticInfo | null {
  const stopReason = run.summary?.stopReason ?? null;
  const warnings = run.warnings ?? [];
  const isFailure = !stopReason || FAILURE_REASONS.has(stopReason);
  const isStale = freshness === 'stale';
  const hasWarning = warnings.length > 0;

  // Priority: failure > stale > warning
  if (isFailure) {
    return {
      severity: 'failure',
      icon: '△',
      color: 'var(--red)',
      title: 'Did not converge',
      message:
        warnings[0]?.message ??
        'The method did not converge to a valid root. Review inputs and try again.',
    };
  }

  if (isStale) {
    return {
      severity: 'warning',
      icon: '△',
      color: 'var(--clay)',
      title: 'Outdated input',
      message:
        staleReason ??
        'The inputs have changed since this result was computed. Re-run to get a current answer.',
    };
  }

  if (hasWarning) {
    return {
      severity: 'warning',
      icon: '△',
      color: 'var(--clay)',
      title: 'Warning',
      message: warnings[0].message,
    };
  }

  return null;
}

export function ConfidenceSummary({ run, freshness, staleReason }: ConfidenceSummaryProps) {
  if (!run) {
    return null;
  }

  const items = compactConfidenceItems(run);
  const score = computeConfidenceScore(run, freshness);
  const label = confidenceLabel(score);
  const diagnostic = getDiagnosticInfo(run, freshness, staleReason);

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
          <dd
            className="confidence-bars"
            aria-label={`Confidence: ${score} of 5 (${label})`}
          >
            {Array.from({ length: 5 }, (_, i) => {
              const filled = i < score;
              return (
                <span
                  key={i}
                  style={{ background: barColor(score, filled) }}
                />
              );
            })}
          </dd>
        </div>
      </dl>

      {diagnostic ? (
        <div className="diagnostic-note">
          <span
            aria-hidden="true"
            className="text-2xl"
            style={{ color: diagnostic.color }}
          >
            {diagnostic.icon}
          </span>
          <p>
            <strong className="section-kicker">{diagnostic.title}</strong>
            <br />
            {diagnostic.message}
          </p>
        </div>
      ) : null}
    </section>
  );
}
