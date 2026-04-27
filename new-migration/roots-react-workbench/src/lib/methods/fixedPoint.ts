import { evaluateExpression, type AngleMode } from '../math/evaluator';

export type FixedPointInput = {
  expression: string;
  x0: number;
  tolerance?: number;
  maxIterations?: number;
  angleMode?: AngleMode;
  targetExpression?: string;
  extraSeeds?: number[];
  batchExpressions?: string[];
  seedScan?: FixedPointSeedScanInput;
};

export type FixedPointSeedScanInput = {
  min: number;
  max: number;
  steps: number;
};

export type FixedPointApproximation = {
  iteration: number;
  xCurrent: number;
  xNext: number;
  gValue: number;
  error?: number;
  residual?: number;
};

export type FixedPointFailureApproximation = Omit<
  FixedPointApproximation,
  'xNext' | 'gValue'
> & {
  xNext?: number;
  gValue?: number;
};

export type FixedPointBatchStatus =
  | 'converged'
  | 'slow'
  | 'diverged'
  | 'undefined'
  | 'cycle-detected'
  | 'max-iterations';

export type FixedPointBatchEntry = {
  rank: number;
  gExpression: string;
  canonical: string;
  x0: number;
  approximation: number | null;
  iterations: number;
  stopReason: string;
  status: FixedPointBatchStatus;
  error: number | null;
  residual: number | null;
  targetResidual: number | null;
  targetResidualAbs: number | null;
  observedRate: number | null;
  warnings: Array<{ code: string; message: string }>;
  result: FixedPointResult;
};

export type FixedPointBatchResult = {
  entries: FixedPointBatchEntry[];
  scan?: {
    range: FixedPointSeedScanInput;
    seeds: number[];
  };
  note: string;
};

export type FixedPointResult =
  | {
      ok: true;
      root: number;
      iterations: number;
      approximations: FixedPointApproximation[];
      stopReason:
        | 'exact-fixed-point'
        | 'tolerance-satisfied'
        | 'residual-tolerance-satisfied'
        | 'max-iterations';
      batch?: FixedPointBatchResult;
    }
  | {
      ok: false;
      reason:
        | 'invalid-expression'
        | 'invalid-starting-value'
        | 'non-finite-evaluation'
        | 'complex-evaluation'
        | 'divergence-detected'
        | 'cycle-detected'
        | 'max-iterations'
        | 'unknown-error';
      message: string;
      approximations?: FixedPointFailureApproximation[];
      batch?: FixedPointBatchResult;
    };

type FixedPointFailure = Extract<FixedPointResult, { ok: false }>;

const DEFAULT_TOLERANCE = 1e-10;
const DEFAULT_MAX_ITERATIONS = 100;
const ZERO_TOLERANCE = 1e-14;
const DIVERGENCE_LIMIT = 1e8;

function isApproximatelyZero(value: number, tolerance = ZERO_TOLERANCE): boolean {
  return Math.abs(value) <= tolerance;
}

function mapEvaluationFailure(
  expression: string,
  x: number,
  code: 'invalid-expression' | 'evaluation-error',
  message: string,
  approximations?: FixedPointFailureApproximation[],
): FixedPointFailure {
  const lowerMessage = message.toLowerCase();

  if (code === 'invalid-expression') {
    return {
      ok: false,
      reason: 'invalid-expression',
      message,
      approximations,
    };
  }

  if (lowerMessage.includes('non-finite')) {
    return {
      ok: false,
      reason: 'non-finite-evaluation',
      message: `f(${x}) is non-finite for ${expression}: ${message}`,
      approximations,
    };
  }

  if (lowerMessage.includes('complex')) {
    return {
      ok: false,
      reason: 'complex-evaluation',
      message: `f(${x}) is complex for ${expression}: ${message}`,
      approximations,
    };
  }

  return {
    ok: false,
    reason: 'unknown-error',
    message,
    approximations,
  };
}

function evaluateReal(
  expression: string,
  x: number,
  angleMode: AngleMode,
  approximations?: FixedPointFailureApproximation[],
): { ok: true; value: number } | FixedPointFailure {
  const result = evaluateExpression(
    expression,
    { x },
    { mode: 'legacy-compatible', angleMode },
  );

  if (!result.ok) {
    return mapEvaluationFailure(
      expression,
      x,
      result.error.code,
      result.error.message,
      approximations,
    );
  }

  if (typeof result.value !== 'number') {
    return {
      ok: false,
      reason: 'unknown-error',
      message: `f(${x}) did not evaluate to a real number.`,
      approximations,
    };
  }

  if (!Number.isFinite(result.value)) {
    return {
      ok: false,
      reason: 'non-finite-evaluation',
      message: `f(${x}) evaluated to a non-finite value.`,
      approximations,
    };
  }

  return {
    ok: true,
    value: result.value,
  };
}

function findCycle(
  previousValues: number[],
  candidate: number,
): boolean {
  return previousValues.some((value) => {
    const scale = Math.max(1, Math.abs(value), Math.abs(candidate));
    return Math.abs(value - candidate) <= Math.max(ZERO_TOLERANCE, Number.EPSILON * scale);
  });
}

function splitBatchExpressions(expression: string, batchExpressions?: string[]): string[] {
  const formulas: string[] = [];
  const seen = new Set<string>();

  for (const candidate of [expression, ...(batchExpressions ?? [])]) {
    const trimmed = candidate.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    formulas.push(trimmed);
  }

  return formulas;
}

function addUniqueSeed(seeds: number[], seen: Set<number>, value: number): boolean {
  if (!Number.isFinite(value) || seen.has(value)) return false;
  seen.add(value);
  seeds.push(value);
  return true;
}

function scanSeedsFor(scan?: FixedPointSeedScanInput): { seeds: number[]; scan?: FixedPointBatchResult['scan'] } {
  if (
    !scan ||
    !Number.isFinite(scan.min) ||
    !Number.isFinite(scan.max) ||
    scan.min >= scan.max ||
    !Number.isInteger(scan.steps) ||
    scan.steps < 1
  ) {
    return { seeds: [] };
  }

  const seeds: number[] = [];
  for (let index = 0; index <= scan.steps; index += 1) {
    seeds.push(scan.min + ((scan.max - scan.min) * index) / scan.steps);
  }

  return {
    seeds,
    scan: {
      range: scan,
      seeds: [],
    },
  };
}

function lastError(result: FixedPointResult): number | null {
  const rows = 'approximations' in result ? result.approximations : undefined;
  const last = rows?.[rows.length - 1];
  return typeof last?.error === 'number' && Number.isFinite(last.error) ? last.error : null;
}

function lastResidual(result: FixedPointResult): number | null {
  const rows = 'approximations' in result ? result.approximations : undefined;
  const last = rows?.[rows.length - 1];
  return typeof last?.residual === 'number' && Number.isFinite(last.residual) ? last.residual : null;
}

function approximationFor(result: FixedPointResult): number | null {
  if (result.ok) return Number.isFinite(result.root) ? result.root : null;

  const rows = result.approximations;
  const last = rows?.[rows.length - 1];
  const candidate = last?.xNext ?? last?.xCurrent;
  return typeof candidate === 'number' && Number.isFinite(candidate) ? candidate : null;
}

function observedRate(result: FixedPointResult): number | null {
  const rows = 'approximations' in result ? result.approximations : undefined;
  const errors = rows
    ?.map((row) => row.error)
    .filter((error): error is number => typeof error === 'number' && Number.isFinite(error) && error > 0);
  if (!errors || errors.length < 2) return null;
  return errors[errors.length - 1] / errors[errors.length - 2];
}

function statusFor(result: FixedPointResult, targetResidualAbs: number | null, tolerance: number): FixedPointBatchStatus {
  if (!result.ok) {
    if (result.reason === 'divergence-detected') return 'diverged';
    if (result.reason === 'cycle-detected') return 'cycle-detected';
    return 'undefined';
  }

  if (result.stopReason === 'max-iterations') return 'max-iterations';
  if (targetResidualAbs != null && targetResidualAbs > tolerance) return 'slow';
  return 'converged';
}

function statusScore(status: FixedPointBatchStatus): number {
  switch (status) {
    case 'converged':
      return 0;
    case 'slow':
      return 1000;
    case 'max-iterations':
      return 2000;
    case 'cycle-detected':
      return 3000;
    case 'undefined':
      return 4000;
    case 'diverged':
      return 5000;
    default:
      return 9000;
  }
}

function buildFixedPointBatch(
  input: FixedPointInput,
  tolerance: number,
  maxIterations: number,
  angleMode: AngleMode,
): FixedPointBatchResult | null {
  const formulas = splitBatchExpressions(input.expression, input.batchExpressions);
  const seeds: number[] = [];
  const seenSeeds = new Set<number>();
  addUniqueSeed(seeds, seenSeeds, input.x0);
  for (const seed of input.extraSeeds ?? []) {
    addUniqueSeed(seeds, seenSeeds, seed);
  }

  const scanned = scanSeedsFor(input.seedScan);
  for (const seed of scanned.seeds) {
    if (addUniqueSeed(seeds, seenSeeds, seed)) {
      scanned.scan?.seeds.push(seed);
    }
  }

  const hasAdvancedControls =
    formulas.length > 1 ||
    seeds.length > 1 ||
    (scanned.scan?.seeds.length ?? 0) > 0;
  if (!hasAdvancedControls) return null;

  const unranked = formulas.flatMap((formula, formulaIndex) => seeds.map((seed, seedIndex) => {
    const result = runFixedPointSingle({
      expression: formula,
      x0: seed,
      tolerance,
      maxIterations,
      angleMode,
      targetExpression: input.targetExpression,
    });
    const targetResidual = lastResidual(result);
    const targetResidualAbs = targetResidual == null ? null : Math.abs(targetResidual);
    const status = statusFor(result, targetResidualAbs, tolerance);

    return {
      rank: 0,
      gExpression: formula,
      canonical: formula,
      x0: seed,
      approximation: approximationFor(result),
      iterations: result.ok ? result.iterations : result.approximations?.length ?? 0,
      stopReason: result.ok ? result.stopReason : result.reason,
      status,
      error: lastError(result),
      residual: targetResidual,
      targetResidual,
      targetResidualAbs,
      observedRate: observedRate(result),
      warnings: [] as Array<{ code: string; message: string }>,
      result,
      formulaIndex,
      seedIndex,
    };
  }));

  const ranked = unranked
    .slice()
    .sort((left, right) => {
      const statusDelta = statusScore(left.status) - statusScore(right.status);
      if (statusDelta !== 0) return statusDelta;
      const iterationDelta = left.iterations - right.iterations;
      if (iterationDelta !== 0) return iterationDelta;
      const metricDelta = (left.targetResidualAbs ?? left.error ?? Number.POSITIVE_INFINITY)
        - (right.targetResidualAbs ?? right.error ?? Number.POSITIVE_INFINITY);
      if (metricDelta !== 0) return metricDelta;
      const formulaDelta = left.formulaIndex - right.formulaIndex;
      if (formulaDelta !== 0) return formulaDelta;
      return left.seedIndex - right.seedIndex;
    })
    .map((entry, index) => {
      const { formulaIndex: _formulaIndex, seedIndex: _seedIndex, ...publicEntry } = entry;
      return {
        ...publicEntry,
        rank: index + 1,
      };
    });

  return {
    entries: ranked,
    ...(scanned.scan == null ? {} : { scan: scanned.scan }),
    note: input.targetExpression?.trim()
      ? 'Modern ranking uses Fixed Point candidate status, iterations, and target residual. The best-ranked candidate supplies the main table.'
      : 'Modern ranking uses Fixed Point candidate status, iterations, and successive-approximation error. The best-ranked candidate supplies the main table.',
  };
}

function validateAdvancedFixedPointInput(input: FixedPointInput): FixedPointFailure | null {
  if (input.extraSeeds?.some((seed) => !Number.isFinite(seed))) {
    return {
      ok: false,
      reason: 'invalid-starting-value',
      message: 'Fixed Point extra seeds must be finite numeric values.',
    };
  }

  if (
    input.seedScan &&
    (
      !Number.isFinite(input.seedScan.min) ||
      !Number.isFinite(input.seedScan.max) ||
      input.seedScan.min >= input.seedScan.max ||
      !Number.isInteger(input.seedScan.steps) ||
      input.seedScan.steps < 1
    )
  ) {
    return {
      ok: false,
      reason: 'invalid-starting-value',
      message: 'Fixed Point seed scan requires finite min < max and steps >= 1.',
    };
  }

  return null;
}

function runFixedPointSingle(input: FixedPointInput): FixedPointResult {
  const {
    expression,
    x0,
    tolerance = DEFAULT_TOLERANCE,
    maxIterations = DEFAULT_MAX_ITERATIONS,
    angleMode = 'rad',
    targetExpression,
  } = input;

  if (
    !expression.trim() ||
    !Number.isFinite(x0) ||
    !Number.isFinite(tolerance) ||
    tolerance <= 0 ||
    !Number.isInteger(maxIterations) ||
    maxIterations < 1
  ) {
    return {
      ok: false,
      reason: 'invalid-starting-value',
      message: 'Fixed Point requires a valid expression, finite x0, tolerance > 0, and maxIterations >= 1.',
    };
  }

  let xCurrent = x0;
  const approximations: FixedPointApproximation[] = [];
  const seenValues: number[] = [xCurrent];

  for (let iteration = 1; iteration <= maxIterations; iteration += 1) {
    const failureRows = approximations as FixedPointFailureApproximation[];
    const gResult = evaluateReal(expression, xCurrent, angleMode, failureRows);
    if (!gResult.ok) {
      return gResult;
    }

    const xNext = gResult.value;
    const error = Math.abs(xNext - xCurrent);
    let residual: number | undefined;

    if (targetExpression?.trim()) {
      const partialRows: FixedPointFailureApproximation[] = [
        ...failureRows,
        {
          iteration,
          xCurrent,
          xNext,
          gValue: xNext,
          error,
        },
      ];
      const residualResult = evaluateReal(targetExpression, xNext, angleMode, partialRows);
      if (!residualResult.ok) {
        return residualResult;
      }
      residual = residualResult.value;
    }

    const row: FixedPointApproximation = {
      iteration,
      xCurrent,
      xNext,
      gValue: xNext,
      error,
      ...(residual == null ? {} : { residual }),
    };
    approximations.push(row);

    if (isApproximatelyZero(error)) {
      return {
        ok: true,
        root: xNext,
        iterations: iteration,
        approximations,
        stopReason: 'exact-fixed-point',
      };
    }

    if (residual != null && Math.abs(residual) <= tolerance) {
      return {
        ok: true,
        root: xNext,
        iterations: iteration,
        approximations,
        stopReason: 'residual-tolerance-satisfied',
      };
    }

    if (error <= tolerance) {
      return {
        ok: true,
        root: xNext,
        iterations: iteration,
        approximations,
        stopReason: 'tolerance-satisfied',
      };
    }

    if (Math.abs(xNext) > DIVERGENCE_LIMIT) {
      return {
        ok: false,
        reason: 'divergence-detected',
        message: 'Fixed Point iterate exceeded the divergence guardrail.',
        approximations,
      };
    }

    if (findCycle(seenValues, xNext)) {
      return {
        ok: false,
        reason: 'cycle-detected',
        message: 'Fixed Point repeated a previous iterate before satisfying tolerance.',
        approximations,
      };
    }

    seenValues.push(xNext);
    xCurrent = xNext;
  }

  return {
    ok: true,
    root: xCurrent,
    iterations: approximations.length,
    approximations,
    stopReason: 'max-iterations',
  };
}

export function runFixedPoint(input: FixedPointInput): FixedPointResult {
  const advancedFailure = validateAdvancedFixedPointInput(input);
  if (advancedFailure) {
    return advancedFailure;
  }

  const tolerance = input.tolerance ?? DEFAULT_TOLERANCE;
  const maxIterations = input.maxIterations ?? DEFAULT_MAX_ITERATIONS;
  const angleMode = input.angleMode ?? 'rad';
  const batch = buildFixedPointBatch(input, tolerance, maxIterations, angleMode);
  if (!batch) {
    return runFixedPointSingle(input);
  }

  const best = batch.entries[0]?.result ?? runFixedPointSingle(input);
  return best.ok
    ? { ...best, batch }
    : { ...best, batch };
}
