import type { IterationRow, RootMethod, RootRunResult } from '../../types/roots';
import type { BisectionResult } from './bisection';
import type { FalsePositionResult } from './falsePosition';
import type { FixedPointResult } from './fixedPoint';
import type { NewtonRaphsonResult } from './newtonRaphson';
import type { SecantResult } from './secant';
import {
  runModernRootMethod,
  type ModernRootEngineInput,
  type ModernRootEngineResult,
  type ModernRootMethod,
} from './modernRootEngine';

type ModernUiRootRunResult = RootRunResult & {
  engine: 'modern';
  modernMethod: ModernRootMethod | 'unknown';
  modernResult: ModernRootEngineResult;
};

type ModernFailureDetails = Extract<ModernRootEngineResult, { ok: false }>['details'];
type FailureApproximationRecord = {
  iteration: number;
  error?: number | null;
  [key: string]: unknown;
};
type DetailsWithFailureApproximations = {
  approximations?: FailureApproximationRecord[];
};

const MODERN_TO_UI_METHOD: Record<ModernRootMethod, RootMethod> = {
  bisection: 'bisection',
  'false-position': 'falsePosition',
  secant: 'secant',
  'fixed-point': 'fixedPoint',
  'newton-raphson': 'newton',
};

const SUCCESS_STOP_REASON_MAP: Record<string, string> = {
  'exact-root': 'exact-zero',
  'exact-fixed-point': 'exact-zero',
  'tolerance-satisfied': 'tolerance-reached',
  'function-tolerance-satisfied': 'tolerance-reached',
  'residual-tolerance-satisfied': 'tolerance-reached',
  'max-iterations': 'iteration-limit',
  'stagnation-detected': 'retained-endpoint-stagnation',
};

const FAILURE_REASON_MAP: Record<string, string> = {
  'invalid-expression': 'invalid-input',
  'invalid-derivative-expression': 'invalid-input',
  'missing-derivative': 'invalid-input',
  'invalid-interval': 'invalid-input',
  'invalid-starting-value': 'invalid-input',
  'invalid-starting-values': 'invalid-input',
  'invalid-starting-interval': 'invalid-starting-interval',
  'non-finite-evaluation': 'non-finite-evaluation',
  'complex-evaluation': 'non-finite-evaluation',
  'zero-denominator': 'stagnation',
  'zero-derivative': 'derivative-zero',
  'divergence-detected': 'diverged',
  'cycle-detected': 'cycle-detected',
  'max-iterations': 'iteration-limit',
  'unknown-error': 'invalid-input',
  'invalid-method': 'invalid-input',
};

function sign(value: number): number {
  if (Math.abs(value) <= 1e-14) return 0;
  return value < 0 ? -1 : 1;
}

function methodForModern(method: ModernRootMethod | 'unknown'): RootMethod {
  return method === 'unknown' ? 'bisection' : MODERN_TO_UI_METHOD[method];
}

function expressionForInput(input?: ModernRootEngineInput): string | undefined {
  return input?.expression;
}

function derivativeForInput(input?: ModernRootEngineInput): string | undefined {
  return input?.method === 'newton-raphson' ? input.derivativeExpression : undefined;
}

function decisionBasisForInput(input?: ModernRootEngineInput): RootRunResult['decisionBasis'] {
  if (input?.method === 'bisection') {
    return input.decisionBasis ?? 'machine';
  }

  return input?.method === 'false-position' ? input.decisionBasis ?? 'machine' : null;
}

function signDisplayForInput(input?: ModernRootEngineInput): RootRunResult['signDisplay'] {
  if (input?.method === 'bisection') {
    return 'both';
  }

  if (input?.method === 'false-position') {
    return input.signDisplay ?? 'both';
  }

  return null;
}

function stoppingFor(
  result: ModernRootEngineResult,
  input?: ModernRootEngineInput,
): RootRunResult['stopping'] {
  const failureDetails = result.ok
    ? null
    : result.details as DetailsWithFailureApproximations | undefined;
  const iterations = result.ok ? result.iterations : failureDetails?.approximations?.length ?? 0;
  const tolerance = input && 'tolerance' in input ? input.tolerance : undefined;
  const maxIterations = input && 'maxIterations' in input ? input.maxIterations : undefined;

  return {
    kind: tolerance != null ? 'epsilon' : 'iterations',
    input: tolerance ?? maxIterations ?? iterations,
    epsilon: tolerance ?? null,
    epsilonBound: tolerance ?? null,
    actualIterations: iterations,
    maxIterations: maxIterations ?? iterations,
  };
}

function lastError(rows: IterationRow[]): number | null {
  const last = rows[rows.length - 1];
  return typeof last?.error === 'number' ? last.error : null;
}

function lastResidual(result: ModernRootEngineResult): number | null {
  if (!result.ok) return null;

  const details = result.details as { approximations: Array<Record<string, unknown>> };
  const rows = details.approximations;
  const last = rows[rows.length - 1];
  if (!last) return null;

  if (typeof last.fMidpoint === 'number') return last.fMidpoint;
  if (typeof last.fPoint === 'number') return last.fPoint;
  if (typeof last.fNext === 'number') return last.fNext;
  if ('residual' in last && typeof last.residual === 'number') return last.residual;
  return null;
}

function bracketDecision(fLower: number, fCandidate: number): 'left' | 'right' {
  return sign(fLower) === 0 || sign(fLower) * sign(fCandidate) <= 0 ? 'left' : 'right';
}

function bisectionRows(result: ModernRootEngineResult): IterationRow[] {
  if (result.method !== 'bisection') return [];
  const details = result.details as Extract<BisectionResult, { ok: true }>;
  return details.approximations.map((row) => ({
    iteration: row.iteration,
    lower: row.lower,
    upper: row.upper,
    midpoint: row.midpoint,
    fLower: row.fLower,
    fUpper: row.fUpper,
    fMidpoint: row.fMidpoint,
    a: row.lower,
    b: row.upper,
    c: row.midpoint,
    fa: row.fLower,
    fb: row.fUpper,
    fc: row.fMidpoint,
    exactSigns: row.exactSigns ?? { a: sign(row.fLower), b: sign(row.fUpper), c: sign(row.fMidpoint) },
    machineSigns: row.machineSigns ?? { a: sign(row.fLower), b: sign(row.fUpper), c: sign(row.fMidpoint) },
    decision: row.decision ?? bracketDecision(row.fLower, row.fMidpoint),
    width: Math.abs(row.upper - row.lower),
    bound: row.bound ?? Math.abs(row.upper - row.lower) / 2,
    error: row.error ?? null,
    note: row.note ?? '',
  }));
}

function falsePositionRows(result: ModernRootEngineResult): IterationRow[] {
  if (result.method !== 'false-position') return [];
  const details = result.details as Extract<FalsePositionResult, { ok: true }>;
  return details.approximations.map((row) => ({
    iteration: row.iteration,
    lower: row.lower,
    upper: row.upper,
    point: row.point,
    fLower: row.fLower,
    fUpper: row.fUpper,
    fPoint: row.fPoint,
    a: row.lower,
    b: row.upper,
    c: row.point,
    fa: row.fLower,
    fb: row.fUpper,
    fc: row.fPoint,
    exactSigns: row.exactSigns ?? { a: sign(row.fLower), b: sign(row.fUpper), c: sign(row.fPoint) },
    machineSigns: row.machineSigns ?? { a: sign(row.fLower), b: sign(row.fUpper), c: sign(row.fPoint) },
    decision: row.decision ?? bracketDecision(row.fLower, row.fPoint),
    width: Math.abs(row.upper - row.lower),
    bound: null,
    error: row.error ?? null,
    note: row.note || (result.ok && result.stopReason === 'stagnation-detected'
      ? 'Retained endpoint or repeated interpolation progress was detected.'
      : ''),
  }));
}

function secantRows(result: ModernRootEngineResult): IterationRow[] {
  if (result.method !== 'secant') return [];
  const details = result.details as Extract<SecantResult, { ok: true }>;
  return details.approximations.map((row) => ({
    iteration: row.iteration,
    xPrevious: row.xPrevious,
    xCurrent: row.xCurrent,
    fPrevious: row.fPrevious,
    fCurrent: row.fCurrent,
    fNext: row.fNext,
    xPrev: row.xPrevious,
    xn: row.xCurrent,
    fxPrev: row.fPrevious,
    fxn: row.fCurrent,
    xNext: row.xNext,
    error: row.error ?? null,
    note: row.fNext == null ? 'Method stopped before evaluating f(x next).' : '',
  }));
}

function fixedPointRows(result: ModernRootEngineResult): IterationRow[] {
  if (result.method !== 'fixed-point') return [];
  const details = result.details as Extract<FixedPointResult, { ok: true }>;
  return details.approximations.map((row) => ({
    iteration: row.iteration,
    xCurrent: row.xCurrent,
    xNext: row.xNext,
    gValue: row.gValue,
    xn: row.xCurrent,
    gxn: row.xNext,
    error: row.error ?? null,
    residual: row.residual,
    note: row.residual != null ? `Target residual: ${row.residual}` : '',
  }));
}

function newtonRows(result: ModernRootEngineResult): IterationRow[] {
  if (result.method !== 'newton-raphson') return [];
  const details = result.details as Extract<NewtonRaphsonResult, { ok: true }>;
  return details.approximations.map((row) => ({
    iteration: row.iteration,
    xCurrent: row.xCurrent,
    fCurrent: row.fCurrent,
    derivativeCurrent: row.derivativeCurrent,
    correction: row.correction,
    fNext: row.fNext,
    xn: row.xCurrent,
    fxn: row.fCurrent,
    dfxn: row.derivativeCurrent,
    fxOverDfx: row.correction,
    xNext: row.xNext,
    error: row.error ?? null,
    note: row.fNext == null ? 'Method stopped before evaluating f(x next).' : '',
  }));
}

function rowsFor(result: ModernRootEngineResult): IterationRow[] {
  switch (result.method) {
    case 'bisection':
      return bisectionRows(result);
    case 'false-position':
      return falsePositionRows(result);
    case 'secant':
      return secantRows(result);
    case 'fixed-point':
      return fixedPointRows(result);
    case 'newton-raphson':
      return newtonRows(result);
    default:
      return [];
  }
}

function failureRows(details: ModernFailureDetails): IterationRow[] {
  const failureDetails = details as DetailsWithFailureApproximations | undefined;
  return failureDetails?.approximations?.map((row) => ({
    ...row,
    xn: row.xCurrent,
    xPrev: row.xPrevious,
    fxPrev: row.fPrevious,
    fxn: row.fCurrent,
    dfxn: row.derivativeCurrent,
    gxn: row.gValue ?? row.xNext,
    note: 'Method stopped before producing a complete UI row.',
  })) ?? [];
}

function successSummary(
  result: Extract<ModernRootEngineResult, { ok: true }>,
  rows: IterationRow[],
): RootRunResult['summary'] {
  return {
    approximation: result.root,
    stopReason: SUCCESS_STOP_REASON_MAP[result.stopReason] ?? result.stopReason,
    residual: lastResidual(result),
    residualBasis: 'modern',
    error: lastError(rows),
    bound: result.method === 'bisection' ? rows[rows.length - 1]?.bound as number | null : null,
    stopDetail: result.stopReason === 'max-iterations'
      ? 'Modern engine reached the configured iteration limit.'
      : '',
  };
}

function failureSummary(
  result: Extract<ModernRootEngineResult, { ok: false }>,
): RootRunResult['summary'] {
  return {
    approximation: null,
    stopReason: FAILURE_REASON_MAP[result.reason] ?? result.reason,
    residual: null,
    residualBasis: 'modern',
    error: null,
    bound: null,
    stopDetail: result.message,
  };
}

function bisectionScanHelper(
  result: ModernRootEngineResult,
): RootRunResult['helpers'] {
  if (result.method !== 'bisection') return undefined;

  const details = result.details as BisectionResult | undefined;
  const scan = details && 'scan' in details ? details.scan : undefined;
  if (!scan) return undefined;

  return {
    bracketScan: {
      range: scan.range,
      candidates: scan.candidates.map((candidate) => ({
        kind: candidate.kind,
        a: candidate.lower,
        b: candidate.upper,
        fa: candidate.fLower,
        fb: candidate.fUpper,
        note: candidate.note,
      })),
      solutions: [],
      warnings: scan.warnings,
      note: scan.note,
    },
  };
}

function fixedPointBatchHelper(
  result: ModernRootEngineResult,
): RootRunResult['helpers'] {
  if (result.method !== 'fixed-point') return undefined;

  const details = result.details as FixedPointResult | undefined;
  const batch = details && 'batch' in details ? details.batch : undefined;
  if (!batch) return undefined;

  return {
    fixedPointBatch: {
      entries: batch.entries.map((entry) => ({
        rank: entry.rank,
        gExpression: entry.gExpression,
        canonical: entry.canonical,
        x0: entry.x0,
        approximation: entry.approximation,
        iterations: entry.iterations,
        stopReason: entry.stopReason,
        status: entry.status,
        error: entry.error,
        residual: entry.residual,
        targetResidual: entry.targetResidual,
        targetResidualAbs: entry.targetResidualAbs,
        observedRate: entry.observedRate,
        warnings: entry.warnings,
      })),
      note: batch.scan
        ? `${batch.note} Seed scan sampled ${batch.scan.seeds.length} additional seed(s) in [${batch.scan.range.min}, ${batch.scan.range.max}].`
        : batch.note,
    },
  };
}

function helpersFor(
  result: ModernRootEngineResult,
  input?: ModernRootEngineInput,
): RootRunResult['helpers'] {
  const scanHelper = bisectionScanHelper(result);
  if (scanHelper) return scanHelper;

  const fixedPointHelper = fixedPointBatchHelper(result);
  if (fixedPointHelper) return fixedPointHelper;

  if (input?.method !== 'newton-raphson') return undefined;

  const details = result.details as NewtonRaphsonResult | undefined;
  if (details?.ok) {
    return {
      derivative: {
        expression: details.derivative.derivativeExpression ?? details.derivative.canonical,
        canonical: details.derivative.canonical,
        source: details.derivative.source,
        note: details.derivative.note,
      },
      newtonInitial: {
        strategy: details.initial.strategy,
        x0: details.initial.x0,
        interval: details.initial.interval
          ? { a: details.initial.interval.lower, b: details.initial.interval.upper }
          : undefined,
        candidates: details.initial.candidates.map((candidate) => ({
          label: candidate.label,
          x: candidate.x,
          fx: candidate.fx ?? null,
          absFx: candidate.absFx ?? Number.POSITIVE_INFINITY,
          note: candidate.note,
        })),
        note: details.initial.note,
      },
    };
  }

  if (input.derivativeMode === 'numeric') {
    return {
      derivative: {
        expression: 'numeric central difference',
        canonical: 'numeric central difference',
        source: 'numeric',
        note: 'Derivative was approximated by the isolated modern Newton-Raphson method.',
      },
    };
  }

  if (!input.derivativeExpression) return undefined;

  return {
    derivative: {
      expression: input.derivativeExpression,
      canonical: input.derivativeExpression,
      source: 'user',
      note: 'Derivative was supplied to the isolated modern Newton-Raphson method.',
    },
  };
}

export function modernRootResultToUiResult(
  modernResult: ModernRootEngineResult,
  input?: ModernRootEngineInput,
): ModernUiRootRunResult {
  const method = methodForModern(modernResult.method);
  const rows = modernResult.ok ? rowsFor(modernResult) : failureRows(modernResult.details);

  return {
    engine: 'modern',
    modernMethod: modernResult.method,
    modernResult,
    method,
    expression: expressionForInput(input),
    dfExpression: derivativeForInput(input),
    canonical: expressionForInput(input),
    machine: undefined,
    stopping: stoppingFor(modernResult, input),
    summary: modernResult.ok ? successSummary(modernResult, rows) : failureSummary(modernResult),
    initial: null,
    decisionBasis: decisionBasisForInput(input),
    signDisplay: signDisplayForInput(input),
    rows,
    warnings: [],
    helpers: helpersFor(modernResult, input),
  };
}

export function runModernRootMethodForUi(input: ModernRootEngineInput): ModernUiRootRunResult {
  return modernRootResultToUiResult(runModernRootMethod(input), input);
}
