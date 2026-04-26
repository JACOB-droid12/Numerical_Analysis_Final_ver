import { evaluateExpression, type AngleMode } from '../math/evaluator';

export type FalsePositionInput = {
  expression: string;
  lower: number;
  upper: number;
  tolerance?: number;
  maxIterations?: number;
  angleMode?: AngleMode;
};

export type FalsePositionApproximation = {
  iteration: number;
  lower: number;
  upper: number;
  point: number;
  fLower: number;
  fUpper: number;
  fPoint: number;
  error?: number;
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

  let left = lower;
  let right = upper;
  let fLeftResult = evaluateReal(expression, left, angleMode);
  if (!fLeftResult.ok) {
    return fLeftResult;
  }
  let fLeft = fLeftResult.value;

  let fRightResult = evaluateReal(expression, right, angleMode);
  if (!fRightResult.ok) {
    return fRightResult;
  }
  let fRight = fRightResult.value;

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

  if (Math.sign(fLeft) === Math.sign(fRight)) {
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
    const denominator = fLeft - fRight;
    if (Math.abs(denominator) <= DENOMINATOR_TOLERANCE) {
      return {
        ok: false,
        reason: 'zero-denominator',
        message: 'False Position denominator is zero or too close to zero.',
      };
    }

    point = right - (fRight * (left - right)) / denominator;
    if (!Number.isFinite(point)) {
      return {
        ok: false,
        reason: 'non-finite-evaluation',
        message: 'False Position produced a non-finite point.',
      };
    }

    const fPointResult = evaluateReal(expression, point, angleMode);
    if (!fPointResult.ok) {
      return fPointResult;
    }

    const fPoint = fPointResult.value;
    const error = previousPoint == null ? undefined : Math.abs(point - previousPoint);

    approximations.push({
      iteration,
      lower: left,
      upper: right,
      point,
      fLower: fLeft,
      fUpper: fRight,
      fPoint,
      ...(error == null ? {} : { error }),
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

    const replaceLeft = Math.sign(fLeft) === Math.sign(fPoint);
    const retainedThisIteration = replaceLeft ? 'right' : 'left';
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

    if (replaceLeft) {
      left = point;
      fLeft = fPoint;
    } else {
      right = point;
      fRight = fPoint;
    }

    previousPoint = point;
    fLeftResult = { ok: true, value: fLeft };
    fRightResult = { ok: true, value: fRight };
  }

  return {
    ok: true,
    root: point,
    iterations: approximations.length,
    approximations,
    stopReason: 'max-iterations',
  };
}
