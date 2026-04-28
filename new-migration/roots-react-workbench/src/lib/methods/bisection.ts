import { evaluateExpression, type AngleMode } from '../math/evaluator';
import {
  applyCalculationPrecision,
  createPrecisionPolicy,
  type PrecisionPolicy,
} from './precisionPolicy';
import {
  scanBisectionBrackets,
  type BisectionScanOptions,
  type BisectionScanResult,
} from './bisectionScan';

export type BisectionToleranceType = 'absolute' | 'relative' | 'residual' | 'interval';
export type BisectionDecisionBasis = 'machine' | 'exact';
export type BisectionSignDisplay = 'both' | 'exact' | 'machine';
export type BisectionSign = -1 | 0 | 1;

export type BisectionInput = {
  expression: string;
  lower: number;
  upper: number;
  tolerance?: number;
  toleranceType?: BisectionToleranceType;
  maxIterations?: number;
  angleMode?: AngleMode;
  precisionPolicy?: PrecisionPolicy;
  decisionBasis?: BisectionDecisionBasis;
  signDisplay?: BisectionSignDisplay;
  scan?: BisectionScanOptions | null;
};

export type BisectionApproximation = {
  iteration: number;
  lower: number;
  upper: number;
  midpoint: number;
  fLower: number;
  fUpper: number;
  fMidpoint: number;
  error?: number;
  relativeError?: number;
  residual?: number;
  bound?: number;
  exactSigns?: { a: BisectionSign; b: BisectionSign; c: BisectionSign };
  machineSigns?: { a: BisectionSign; b: BisectionSign; c: BisectionSign };
  decision?: 'left' | 'right';
  decisionBasis?: BisectionDecisionBasis;
  note?: string;
};

export type BisectionResult =
  | {
      ok: true;
      root: number;
      iterations: number;
      approximations: BisectionApproximation[];
      stopReason: 'exact-root' | 'tolerance-satisfied' | 'max-iterations';
      scan?: BisectionScanResult;
    }
  | {
      ok: false;
      reason:
        | 'invalid-expression'
        | 'invalid-interval'
        | 'invalid-starting-interval'
        | 'non-finite-evaluation'
        | 'complex-evaluation'
        | 'max-iterations'
        | 'unknown-error';
      message: string;
      scan?: BisectionScanResult;
    };

type BisectionFailure = Extract<BisectionResult, { ok: false }>;

const DEFAULT_TOLERANCE = 1e-10;
const DEFAULT_MAX_ITERATIONS = 100;
const ZERO_TOLERANCE = 1e-14;

function isApproximatelyZero(value: number): boolean {
  return Math.abs(value) <= ZERO_TOLERANCE;
}

function sign(value: number): BisectionSign {
  if (isApproximatelyZero(value)) return 0;
  return value < 0 ? -1 : 1;
}

function toleranceSatisfied(
  type: BisectionToleranceType,
  tolerance: number,
  row: BisectionApproximation,
): boolean {
  switch (type) {
    case 'relative':
      return row.relativeError != null && row.relativeError <= tolerance;
    case 'residual':
      return row.residual != null && row.residual <= tolerance;
    case 'interval':
      return row.bound != null && row.bound <= tolerance;
    case 'absolute':
    default:
      return row.error != null && row.error <= tolerance;
  }
}

function applyBisectionPrecision(value: number, policy: PrecisionPolicy): number {
  return applyCalculationPrecision(value, policy);
}

function mapEvaluationFailure(
  expression: string,
  x: number,
  code: 'invalid-expression' | 'evaluation-error',
  message: string,
): BisectionFailure {
  const lowerMessage = message.toLowerCase();

  if (code === 'invalid-expression') {
    return {
      ok: false,
      reason: 'invalid-expression',
      message,
    };
  }

  if (lowerMessage.includes('non-finite')) {
    return {
      ok: false,
      reason: 'non-finite-evaluation',
      message: `f(${x}) is non-finite for ${expression}: ${message}`,
    };
  }

  if (lowerMessage.includes('complex')) {
    return {
      ok: false,
      reason: 'complex-evaluation',
      message: `f(${x}) is complex for ${expression}: ${message}`,
    };
  }

  return {
    ok: false,
    reason: 'unknown-error',
    message,
  };
}

function evaluateReal(
  expression: string,
  x: number,
  angleMode: AngleMode,
): { ok: true; value: number } | BisectionFailure {
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
    );
  }

  if (typeof result.value !== 'number') {
    return {
      ok: false,
      reason: 'unknown-error',
      message: `f(${x}) did not evaluate to a real number.`,
    };
  }

  if (!Number.isFinite(result.value)) {
    return {
      ok: false,
      reason: 'non-finite-evaluation',
      message: `f(${x}) evaluated to a non-finite value.`,
    };
  }

  return {
    ok: true,
    value: result.value,
  };
}

export function runBisection(input: BisectionInput): BisectionResult {
  const {
    expression,
    lower,
    upper,
    tolerance = DEFAULT_TOLERANCE,
    toleranceType = 'absolute',
    maxIterations = DEFAULT_MAX_ITERATIONS,
    angleMode = 'rad',
    precisionPolicy = createPrecisionPolicy(),
    decisionBasis = 'machine',
    scan,
  } = input;

  const scanResult = scan
    ? scanBisectionBrackets(expression, { ...scan, angleMode: scan.angleMode ?? angleMode })
    : undefined;

  if (
    !expression.trim() ||
    !Number.isFinite(lower) ||
    !Number.isFinite(upper) ||
    lower >= upper ||
    !Number.isFinite(tolerance) ||
    tolerance <= 0 ||
    !Number.isInteger(maxIterations) ||
    maxIterations < 1
  ) {
    return {
      ok: false,
      reason: 'invalid-interval',
      message: 'Bisection requires a valid expression, lower < upper, tolerance > 0, and maxIterations >= 1.',
      ...(scanResult == null ? {} : { scan: scanResult }),
    };
  }

  let left = applyBisectionPrecision(lower, precisionPolicy);
  let right = applyBisectionPrecision(upper, precisionPolicy);
  if (!Number.isFinite(left) || !Number.isFinite(right) || left >= right) {
    return {
      ok: false,
      reason: 'invalid-interval',
      message: 'Bisection requires a valid precision-applied interval with lower < upper.',
      ...(scanResult == null ? {} : { scan: scanResult }),
    };
  }

  let exactLeftResult = evaluateReal(expression, left, angleMode);
  if (!exactLeftResult.ok) {
    return {
      ...exactLeftResult,
      ...(scanResult == null ? {} : { scan: scanResult }),
    };
  }
  let exactLeft = exactLeftResult.value;

  let fLeftResult = evaluateReal(expression, left, angleMode);
  if (!fLeftResult.ok) {
    return {
      ...fLeftResult,
      ...(scanResult == null ? {} : { scan: scanResult }),
    };
  }
  let fLeft = applyBisectionPrecision(fLeftResult.value, precisionPolicy);

  let exactRightResult = evaluateReal(expression, right, angleMode);
  if (!exactRightResult.ok) {
    return {
      ...exactRightResult,
      ...(scanResult == null ? {} : { scan: scanResult }),
    };
  }
  let exactRight = exactRightResult.value;

  const fRightResult = evaluateReal(expression, right, angleMode);
  if (!fRightResult.ok) {
    return {
      ...fRightResult,
      ...(scanResult == null ? {} : { scan: scanResult }),
    };
  }
  let fRight = applyBisectionPrecision(fRightResult.value, precisionPolicy);

  if (isApproximatelyZero(fLeft)) {
    return {
      ok: true,
      root: left,
      iterations: 0,
      approximations: [],
      stopReason: 'exact-root',
      ...(scanResult == null ? {} : { scan: scanResult }),
    };
  }

  if (isApproximatelyZero(fRight)) {
    return {
      ok: true,
      root: right,
      iterations: 0,
      approximations: [],
      stopReason: 'exact-root',
      ...(scanResult == null ? {} : { scan: scanResult }),
    };
  }

  const startingLeftSign = decisionBasis === 'exact' ? sign(exactLeft) : sign(fLeft);
  const startingRightSign = decisionBasis === 'exact' ? sign(exactRight) : sign(fRight);
  if (startingLeftSign === startingRightSign) {
    return {
      ok: false,
      reason: 'invalid-starting-interval',
      message: 'Bisection requires f(lower) and f(upper) to have opposite signs.',
      ...(scanResult == null ? {} : { scan: scanResult }),
    };
  }

  const approximations: BisectionApproximation[] = [];
  let previousMidpoint: number | undefined;
  let midpoint = applyBisectionPrecision(left + (right - left) / 2, precisionPolicy);

  for (let iteration = 1; iteration <= maxIterations; iteration += 1) {
    const rawMidpoint = left + (right - left) / 2;
    midpoint = applyBisectionPrecision(rawMidpoint, precisionPolicy);
    const exactMidpointResult = evaluateReal(expression, rawMidpoint, angleMode);
    if (!exactMidpointResult.ok) {
      return {
        ...exactMidpointResult,
        ...(scanResult == null ? {} : { scan: scanResult }),
      };
    }

    const fMidpointResult = evaluateReal(expression, midpoint, angleMode);
    if (!fMidpointResult.ok) {
      return {
        ...fMidpointResult,
        ...(scanResult == null ? {} : { scan: scanResult }),
      };
    }

    const fMidpoint = applyBisectionPrecision(fMidpointResult.value, precisionPolicy);
    const error = previousMidpoint == null
      ? undefined
      : applyBisectionPrecision(Math.abs(midpoint - previousMidpoint), precisionPolicy);
    const relativeError = error == null || isApproximatelyZero(midpoint)
      ? undefined
      : applyBisectionPrecision(error / Math.abs(midpoint), precisionPolicy);
    const residual = applyBisectionPrecision(Math.abs(fMidpoint), precisionPolicy);
    const bound = applyBisectionPrecision(Math.abs(right - left) / 2, precisionPolicy);
    const exactSigns = {
      a: sign(exactLeft),
      b: sign(exactRight),
      c: sign(exactMidpointResult.value),
    };
    const machineSigns = {
      a: sign(fLeft),
      b: sign(fRight),
      c: sign(fMidpoint),
    };
    const selectedSigns = decisionBasis === 'exact' ? exactSigns : machineSigns;
    const decision = selectedSigns.a * selectedSigns.c < 0 ? 'left' : 'right';
    const signsDisagree =
      exactSigns.a !== machineSigns.a ||
      exactSigns.b !== machineSigns.b ||
      exactSigns.c !== machineSigns.c;

    const row: BisectionApproximation = {
      iteration,
      lower: left,
      upper: right,
      midpoint,
      fLower: fLeft,
      fUpper: fRight,
      fMidpoint,
      ...(error == null ? {} : { error }),
      ...(relativeError == null ? {} : { relativeError }),
      residual,
      bound,
      exactSigns,
      machineSigns,
      decision,
      decisionBasis,
      note: signsDisagree
        ? 'Exact and machine sign values disagree; decision used the configured basis.'
        : '',
    };

    approximations.push(row);

    if (isApproximatelyZero(fMidpoint)) {
      return {
        ok: true,
        root: midpoint,
        iterations: iteration,
        approximations,
        stopReason: 'exact-root',
        ...(scanResult == null ? {} : { scan: scanResult }),
      };
    }

    if (toleranceSatisfied(toleranceType, tolerance, row)) {
      return {
        ok: true,
        root: midpoint,
        iterations: iteration,
        approximations,
        stopReason: 'tolerance-satisfied',
        ...(scanResult == null ? {} : { scan: scanResult }),
      };
    }

    if (decision === 'right') {
      left = midpoint;
      fLeft = fMidpoint;
      exactLeft = exactMidpointResult.value;
    } else {
      right = midpoint;
      fRight = fMidpoint;
      exactRight = exactMidpointResult.value;
    }

    previousMidpoint = midpoint;
  }

  return {
    ok: true,
    root: midpoint,
    iterations: approximations.length,
    approximations,
    stopReason: 'max-iterations',
    ...(scanResult == null ? {} : { scan: scanResult }),
  };
}
