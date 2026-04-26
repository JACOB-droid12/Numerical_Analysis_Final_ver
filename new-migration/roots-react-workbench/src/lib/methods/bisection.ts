import { evaluateExpression, type AngleMode } from '../math/evaluator';

export type BisectionInput = {
  expression: string;
  lower: number;
  upper: number;
  tolerance?: number;
  maxIterations?: number;
  angleMode?: AngleMode;
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
};

export type BisectionResult =
  | {
      ok: true;
      root: number;
      iterations: number;
      approximations: BisectionApproximation[];
      stopReason: 'exact-root' | 'tolerance-satisfied' | 'max-iterations';
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
    };

type BisectionFailure = Extract<BisectionResult, { ok: false }>;

const DEFAULT_TOLERANCE = 1e-10;
const DEFAULT_MAX_ITERATIONS = 100;
const ZERO_TOLERANCE = 1e-14;

function isApproximatelyZero(value: number): boolean {
  return Math.abs(value) <= ZERO_TOLERANCE;
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
      message: 'Bisection requires a valid expression, lower < upper, tolerance > 0, and maxIterations >= 1.',
    };
  }

  let left = lower;
  let right = upper;
  let fLeftResult = evaluateReal(expression, left, angleMode);
  if (!fLeftResult.ok) {
    return fLeftResult;
  }
  let fLeft = fLeftResult.value;

  const fRightResult = evaluateReal(expression, right, angleMode);
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
      message: 'Bisection requires f(lower) and f(upper) to have opposite signs.',
    };
  }

  const approximations: BisectionApproximation[] = [];
  let previousMidpoint: number | undefined;
  let midpoint = (left + right) / 2;

  for (let iteration = 1; iteration <= maxIterations; iteration += 1) {
    midpoint = (left + right) / 2;
    const fMidpointResult = evaluateReal(expression, midpoint, angleMode);
    if (!fMidpointResult.ok) {
      return fMidpointResult;
    }

    const fMidpoint = fMidpointResult.value;
    const error = previousMidpoint == null
      ? undefined
      : Math.abs(midpoint - previousMidpoint);

    approximations.push({
      iteration,
      lower: left,
      upper: right,
      midpoint,
      fLower: fLeft,
      fUpper: fRight,
      fMidpoint,
      ...(error == null ? {} : { error }),
    });

    if (isApproximatelyZero(fMidpoint)) {
      return {
        ok: true,
        root: midpoint,
        iterations: iteration,
        approximations,
        stopReason: 'exact-root',
      };
    }

    if (error != null && error <= tolerance) {
      return {
        ok: true,
        root: midpoint,
        iterations: iteration,
        approximations,
        stopReason: 'tolerance-satisfied',
      };
    }

    if (Math.sign(fLeft) === Math.sign(fMidpoint)) {
      left = midpoint;
      fLeft = fMidpoint;
    } else {
      right = midpoint;
      fRight = fMidpoint;
    }

    previousMidpoint = midpoint;
  }

  return {
    ok: true,
    root: midpoint,
    iterations: approximations.length,
    approximations,
    stopReason: 'max-iterations',
  };
}
