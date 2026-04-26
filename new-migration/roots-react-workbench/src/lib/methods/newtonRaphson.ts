import { evaluateExpression, type AngleMode } from '../math/evaluator';

export type NewtonRaphsonInput = {
  expression: string;
  derivativeExpression?: string;
  x0: number;
  tolerance?: number;
  functionTolerance?: number;
  maxIterations?: number;
  angleMode?: AngleMode;
  derivativeMode?: 'provided' | 'numeric';
};

export type NewtonRaphsonApproximation = {
  iteration: number;
  xCurrent: number;
  fCurrent: number;
  derivativeCurrent: number;
  xNext: number;
  fNext: number;
  error?: number;
};

export type NewtonRaphsonFailureApproximation = Omit<
  NewtonRaphsonApproximation,
  'fCurrent' | 'derivativeCurrent' | 'xNext' | 'fNext'
> & {
  fCurrent?: number;
  derivativeCurrent?: number;
  xNext?: number;
  fNext?: number;
};

export type NewtonRaphsonResult =
  | {
      ok: true;
      root: number;
      iterations: number;
      approximations: NewtonRaphsonApproximation[];
      stopReason:
        | 'exact-root'
        | 'tolerance-satisfied'
        | 'function-tolerance-satisfied'
        | 'max-iterations';
    }
  | {
      ok: false;
      reason:
        | 'invalid-expression'
        | 'invalid-derivative-expression'
        | 'missing-derivative'
        | 'invalid-starting-value'
        | 'non-finite-evaluation'
        | 'complex-evaluation'
        | 'zero-derivative'
        | 'max-iterations'
        | 'unknown-error';
      message: string;
      approximations?: NewtonRaphsonFailureApproximation[];
    };

type NewtonRaphsonFailure = Extract<NewtonRaphsonResult, { ok: false }>;

const DEFAULT_TOLERANCE = 1e-10;
const DEFAULT_FUNCTION_TOLERANCE = 1e-10;
const DEFAULT_MAX_ITERATIONS = 100;
const ZERO_TOLERANCE = 1e-14;
const DERIVATIVE_TOLERANCE = 1e-12;
const NUMERIC_DERIVATIVE_STEP_FACTOR = Math.cbrt(Number.EPSILON);

function isApproximatelyZero(value: number, tolerance = ZERO_TOLERANCE): boolean {
  return Math.abs(value) <= tolerance;
}

function mapEvaluationFailure(
  expression: string,
  x: number,
  code: 'invalid-expression' | 'evaluation-error',
  message: string,
  expressionRole: 'function' | 'derivative',
  approximations?: NewtonRaphsonFailureApproximation[],
): NewtonRaphsonFailure {
  const lowerMessage = message.toLowerCase();

  if (code === 'invalid-expression') {
    return {
      ok: false,
      reason: expressionRole === 'derivative'
        ? 'invalid-derivative-expression'
        : 'invalid-expression',
      message,
      approximations,
    };
  }

  if (lowerMessage.includes('non-finite')) {
    return {
      ok: false,
      reason: 'non-finite-evaluation',
      message: `${expressionRole === 'derivative' ? "f'" : 'f'}(${x}) is non-finite for ${expression}: ${message}`,
      approximations,
    };
  }

  if (lowerMessage.includes('complex')) {
    return {
      ok: false,
      reason: 'complex-evaluation',
      message: `${expressionRole === 'derivative' ? "f'" : 'f'}(${x}) is complex for ${expression}: ${message}`,
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
  expressionRole: 'function' | 'derivative',
  approximations?: NewtonRaphsonFailureApproximation[],
): { ok: true; value: number } | NewtonRaphsonFailure {
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
      expressionRole,
      approximations,
    );
  }

  if (typeof result.value !== 'number') {
    return {
      ok: false,
      reason: 'unknown-error',
      message: `${expressionRole === 'derivative' ? "f'" : 'f'}(${x}) did not evaluate to a real number.`,
      approximations,
    };
  }

  if (!Number.isFinite(result.value)) {
    return {
      ok: false,
      reason: 'non-finite-evaluation',
      message: `${expressionRole === 'derivative' ? "f'" : 'f'}(${x}) evaluated to a non-finite value.`,
      approximations,
    };
  }

  return {
    ok: true,
    value: result.value,
  };
}

function numericDerivativeStep(x: number): number {
  return NUMERIC_DERIVATIVE_STEP_FACTOR * Math.max(1, Math.abs(x));
}

function evaluateNumericDerivative(
  expression: string,
  x: number,
  angleMode: AngleMode,
  approximations?: NewtonRaphsonFailureApproximation[],
): { ok: true; value: number } | NewtonRaphsonFailure {
  const h = numericDerivativeStep(x);
  const forward = evaluateReal(expression, x + h, angleMode, 'derivative', approximations);
  if (!forward.ok) {
    return forward;
  }

  const backward = evaluateReal(expression, x - h, angleMode, 'derivative', approximations);
  if (!backward.ok) {
    return backward;
  }

  const derivative = (forward.value - backward.value) / (2 * h);
  if (!Number.isFinite(derivative)) {
    return {
      ok: false,
      reason: 'non-finite-evaluation',
      message: `Numeric derivative at x=${x} evaluated to a non-finite value.`,
      approximations,
    };
  }

  return {
    ok: true,
    value: derivative,
  };
}

function evaluateDerivative(
  expression: string,
  derivativeExpression: string | undefined,
  derivativeMode: 'provided' | 'numeric',
  x: number,
  angleMode: AngleMode,
  approximations?: NewtonRaphsonFailureApproximation[],
): { ok: true; value: number } | NewtonRaphsonFailure {
  // Symbolic differentiation is intentionally deferred; Modern beta supports
  // only user-provided derivatives or numeric central differences.
  if (derivativeMode === 'numeric') {
    return evaluateNumericDerivative(expression, x, angleMode, approximations);
  }

  if (!derivativeExpression?.trim()) {
    return {
      ok: false,
      reason: 'missing-derivative',
      message: 'Provided derivative mode requires derivativeExpression.',
      approximations,
    };
  }

  return evaluateReal(
    derivativeExpression,
    x,
    angleMode,
    'derivative',
    approximations,
  );
}

export function runNewtonRaphson(input: NewtonRaphsonInput): NewtonRaphsonResult {
  const {
    expression,
    derivativeExpression,
    x0,
    tolerance = DEFAULT_TOLERANCE,
    functionTolerance = DEFAULT_FUNCTION_TOLERANCE,
    maxIterations = DEFAULT_MAX_ITERATIONS,
    angleMode = 'rad',
    derivativeMode = 'provided',
  } = input;

  if (
    !expression.trim() ||
    !Number.isFinite(x0) ||
    !Number.isFinite(tolerance) ||
    tolerance <= 0 ||
    !Number.isFinite(functionTolerance) ||
    functionTolerance <= 0 ||
    !Number.isInteger(maxIterations) ||
    maxIterations < 1
  ) {
    return {
      ok: false,
      reason: 'invalid-starting-value',
      message: 'Newton-Raphson requires a valid expression, finite x0, tolerances > 0, and maxIterations >= 1.',
    };
  }

  if (derivativeMode === 'provided' && !derivativeExpression?.trim()) {
    return {
      ok: false,
      reason: 'missing-derivative',
      message: 'Provided derivative mode requires derivativeExpression.',
    };
  }

  let xCurrent = x0;
  const approximations: NewtonRaphsonApproximation[] = [];

  for (let iteration = 1; iteration <= maxIterations; iteration += 1) {
    const failureRows = approximations as NewtonRaphsonFailureApproximation[];
    const fCurrentResult = evaluateReal(
      expression,
      xCurrent,
      angleMode,
      'function',
      failureRows,
    );
    if (!fCurrentResult.ok) {
      return fCurrentResult;
    }
    const fCurrent = fCurrentResult.value;

    if (isApproximatelyZero(fCurrent)) {
      return {
        ok: true,
        root: xCurrent,
        iterations: approximations.length,
        approximations,
        stopReason: 'exact-root',
      };
    }

    const derivativePartialRows: NewtonRaphsonFailureApproximation[] = [
      ...failureRows,
      {
        iteration,
        xCurrent,
        fCurrent,
      },
    ];
    const derivativeResult = evaluateDerivative(
      expression,
      derivativeExpression,
      derivativeMode,
      xCurrent,
      angleMode,
      derivativePartialRows,
    );
    if (!derivativeResult.ok) {
      return derivativeResult;
    }
    const derivativeCurrent = derivativeResult.value;

    if (Math.abs(derivativeCurrent) <= DERIVATIVE_TOLERANCE) {
      return {
        ok: false,
        reason: 'zero-derivative',
        message: 'Newton-Raphson derivative is zero or too close to zero.',
        approximations: [
          ...failureRows,
          {
            iteration,
            xCurrent,
            fCurrent,
            derivativeCurrent,
          },
        ],
      };
    }

    const xNext = xCurrent - fCurrent / derivativeCurrent;
    if (!Number.isFinite(xNext)) {
      return {
        ok: false,
        reason: 'non-finite-evaluation',
        message: 'Newton-Raphson produced a non-finite next point.',
        approximations: [
          ...failureRows,
          {
            iteration,
            xCurrent,
            fCurrent,
            derivativeCurrent,
            xNext,
          },
        ],
      };
    }

    const nextPartialRows: NewtonRaphsonFailureApproximation[] = [
      ...failureRows,
      {
        iteration,
        xCurrent,
        fCurrent,
        derivativeCurrent,
        xNext,
      },
    ];
    const fNextResult = evaluateReal(
      expression,
      xNext,
      angleMode,
      'function',
      nextPartialRows,
    );
    if (!fNextResult.ok) {
      return fNextResult;
    }
    const fNext = fNextResult.value;
    const error = Math.abs(xNext - xCurrent);

    approximations.push({
      iteration,
      xCurrent,
      fCurrent,
      derivativeCurrent,
      xNext,
      fNext,
      error,
    });

    if (isApproximatelyZero(fNext)) {
      return {
        ok: true,
        root: xNext,
        iterations: iteration,
        approximations,
        stopReason: 'exact-root',
      };
    }

    if (Math.abs(fNext) <= functionTolerance) {
      return {
        ok: true,
        root: xNext,
        iterations: iteration,
        approximations,
        stopReason: 'function-tolerance-satisfied',
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
