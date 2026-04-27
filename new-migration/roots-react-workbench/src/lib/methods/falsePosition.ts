import { evaluateExpression, type AngleMode } from '../math/evaluator';
import {
  applyCalculationPrecision,
  createPrecisionPolicy,
  type PrecisionPolicy,
} from './precisionPolicy';

export type FalsePositionInput = {
  expression: string;
  lower: number;
  upper: number;
  tolerance?: number;
  maxIterations?: number;
  angleMode?: AngleMode;
  precisionPolicy?: PrecisionPolicy;
  decisionBasis?: FalsePositionDecisionBasis;
  signDisplay?: FalsePositionSignDisplay;
};

export type FalsePositionDecisionBasis = 'exact' | 'machine';
export type FalsePositionSignDisplay = 'both' | 'exact' | 'machine';
export type FalsePositionSign = -1 | 0 | 1;

export type FalsePositionApproximation = {
  iteration: number;
  lower: number;
  upper: number;
  point: number;
  fLower: number;
  fUpper: number;
  fPoint: number;
  error?: number;
  exactSigns?: { a: FalsePositionSign; b: FalsePositionSign; c: FalsePositionSign };
  machineSigns?: { a: FalsePositionSign; b: FalsePositionSign; c: FalsePositionSign };
  decision?: 'left' | 'right';
  decisionBasis?: FalsePositionDecisionBasis;
  note?: string;
};

export type FalsePositionResult =
  | {
      ok: true;
      root: number;
      iterations: number;
      approximations: FalsePositionApproximation[];
      stopReason:
        | 'exact-root'
        | 'tolerance-satisfied'
        | 'function-tolerance-satisfied'
        | 'max-iterations'
        | 'stagnation-detected';
    }
  | {
      ok: false;
      reason:
        | 'invalid-expression'
        | 'invalid-interval'
        | 'invalid-starting-interval'
        | 'non-finite-evaluation'
        | 'complex-evaluation'
        | 'zero-denominator'
        | 'stagnation-detected'
        | 'max-iterations'
        | 'unknown-error';
      message: string;
    };

type FalsePositionFailure = Extract<FalsePositionResult, { ok: false }>;

const DEFAULT_TOLERANCE = 1e-10;
const DEFAULT_MAX_ITERATIONS = 100;
const ZERO_TOLERANCE = 1e-14;
const DENOMINATOR_TOLERANCE = 1e-12;
const STAGNATION_WINDOW = 25;

function isApproximatelyZero(value: number): boolean {
  return Math.abs(value) <= ZERO_TOLERANCE;
}

function sign(value: number): FalsePositionSign {
  if (isApproximatelyZero(value)) return 0;
  return value < 0 ? -1 : 1;
}

function applyFalsePositionPrecision(value: number, policy: PrecisionPolicy): number {
  return applyCalculationPrecision(value, policy);
}

function mapEvaluationFailure(
  expression: string,
  x: number,
  code: 'invalid-expression' | 'evaluation-error',
  message: string,
): FalsePositionFailure {
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
): { ok: true; value: number } | FalsePositionFailure {
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

export function runFalsePosition(input: FalsePositionInput): FalsePositionResult {
  const {
    expression,
    lower,
    upper,
    tolerance = DEFAULT_TOLERANCE,
    maxIterations = DEFAULT_MAX_ITERATIONS,
    angleMode = 'rad',
    precisionPolicy = createPrecisionPolicy(),
    decisionBasis = 'machine',
  } = input;

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
      message: 'False Position requires a valid expression, lower < upper, tolerance > 0, and maxIterations >= 1.',
    };
  }

  let left = applyFalsePositionPrecision(lower, precisionPolicy);
  let right = applyFalsePositionPrecision(upper, precisionPolicy);
  if (!Number.isFinite(left) || !Number.isFinite(right) || left >= right) {
    return {
      ok: false,
      reason: 'invalid-interval',
      message: 'False Position requires a valid precision-applied interval with lower < upper.',
    };
  }

  const exactLeftResult = evaluateReal(expression, left, angleMode);
  if (!exactLeftResult.ok) {
    return exactLeftResult;
  }
  let exactLeft = exactLeftResult.value;
  let fLeft = applyFalsePositionPrecision(exactLeft, precisionPolicy);

  const exactRightResult = evaluateReal(expression, right, angleMode);
  if (!exactRightResult.ok) {
    return exactRightResult;
  }
  let exactRight = exactRightResult.value;
  let fRight = applyFalsePositionPrecision(exactRight, precisionPolicy);

  if (isApproximatelyZero(fLeft)) {
    return {
      ok: true,
      root: left,
      iterations: 0,
      approximations: [],
      stopReason: 'exact-root',
    };
  }

  if (isApproximatelyZero(fRight)) {
    return {
      ok: true,
      root: right,
      iterations: 0,
      approximations: [],
      stopReason: 'exact-root',
    };
  }

  const startingLeftSign = decisionBasis === 'exact' ? sign(exactLeft) : sign(fLeft);
  const startingRightSign = decisionBasis === 'exact' ? sign(exactRight) : sign(fRight);
  if (startingLeftSign === startingRightSign) {
    return {
      ok: false,
      reason: 'invalid-starting-interval',
      message: 'False Position requires f(lower) and f(upper) to have opposite signs.',
    };
  }

  const approximations: FalsePositionApproximation[] = [];
  let previousPoint: number | undefined;
  let point = (left + right) / 2;
  let retainedSide: 'left' | 'right' | null = null;
  let retainedCount = 0;

  for (let iteration = 1; iteration <= maxIterations; iteration += 1) {
    if (left >= right && approximations.length > 0) {
      return {
        ok: true,
        root: point,
        iterations: approximations.length,
        approximations,
        stopReason: 'stagnation-detected',
      };
    }

    const denominator = applyFalsePositionPrecision(fRight - fLeft, precisionPolicy);
    if (Math.abs(denominator) <= DENOMINATOR_TOLERANCE) {
      return {
        ok: false,
        reason: 'zero-denominator',
        message: 'False Position denominator is zero or too close to zero.',
      };
    }

    const width = applyFalsePositionPrecision(right - left, precisionPolicy);
    const numerator = applyFalsePositionPrecision(fRight * width, precisionPolicy);
    const correction = applyFalsePositionPrecision(numerator / denominator, precisionPolicy);
    const rawPoint = right - correction;
    point = applyFalsePositionPrecision(rawPoint, precisionPolicy);
    if (!Number.isFinite(point)) {
      return {
        ok: false,
        reason: 'non-finite-evaluation',
        message: 'False Position produced a non-finite point.',
      };
    }

    const exactPointResult = evaluateReal(expression, rawPoint, angleMode);
    if (!exactPointResult.ok) {
      return exactPointResult;
    }

    const fPointResult = evaluateReal(expression, point, angleMode);
    if (!fPointResult.ok) {
      return fPointResult;
    }

    const fPoint = applyFalsePositionPrecision(fPointResult.value, precisionPolicy);
    const error = previousPoint == null
      ? undefined
      : applyFalsePositionPrecision(Math.abs(point - previousPoint), precisionPolicy);
    const exactSigns = {
      a: sign(exactLeft),
      b: sign(exactRight),
      c: sign(exactPointResult.value),
    };
    const machineSigns = {
      a: sign(fLeft),
      b: sign(fRight),
      c: sign(fPoint),
    };
    const selectedSigns = decisionBasis === 'exact' ? exactSigns : machineSigns;
    const decision = selectedSigns.a * selectedSigns.c < 0 ? 'left' : 'right';
    const signsDisagree =
      exactSigns.a !== machineSigns.a ||
      exactSigns.b !== machineSigns.b ||
      exactSigns.c !== machineSigns.c;

    approximations.push({
      iteration,
      lower: left,
      upper: right,
      point,
      fLower: fLeft,
      fUpper: fRight,
      fPoint,
      ...(error == null ? {} : { error }),
      exactSigns,
      machineSigns,
      decision,
      decisionBasis,
      note: signsDisagree
        ? 'Exact and machine sign values disagree; decision used the configured basis.'
        : '',
    });

    if (isApproximatelyZero(fPoint)) {
      return {
        ok: true,
        root: point,
        iterations: iteration,
        approximations,
        stopReason: 'exact-root',
      };
    }

    if (Math.abs(fPoint) <= tolerance) {
      return {
        ok: true,
        root: point,
        iterations: iteration,
        approximations,
        stopReason: 'function-tolerance-satisfied',
      };
    }

    if (error != null && error <= tolerance) {
      return {
        ok: true,
        root: point,
        iterations: iteration,
        approximations,
        stopReason: 'tolerance-satisfied',
      };
    }

    const retainedThisIteration = decision === 'left' ? 'right' : 'left';
    if (retainedSide === retainedThisIteration) {
      retainedCount += 1;
    } else {
      retainedSide = retainedThisIteration;
      retainedCount = 1;
    }

    if (retainedCount >= STAGNATION_WINDOW) {
      return {
        ok: true,
        root: point,
        iterations: iteration,
        approximations,
        stopReason: 'stagnation-detected',
      };
    }

    if (decision === 'right') {
      left = point;
      fLeft = fPoint;
      exactLeft = exactPointResult.value;
    } else {
      right = point;
      fRight = fPoint;
      exactRight = exactPointResult.value;
    }

    previousPoint = point;
  }

  return {
    ok: true,
    root: point,
    iterations: approximations.length,
    approximations,
    stopReason: 'max-iterations',
  };
}
