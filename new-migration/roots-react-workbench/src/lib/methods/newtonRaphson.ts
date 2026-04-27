import { evaluateExpression, type AngleMode } from '../math/evaluator';
import {
  createNewtonDerivative,
  evaluateNewtonDerivative,
  isNewtonDerivativeTooSmall,
  type NewtonDerivativeFailure,
  type NewtonDerivativeMode,
  type NewtonDerivative,
} from './newtonDerivative';
import {
  resolveNewtonStart,
  type NewtonInitialStrategy,
  type NewtonStartHelper,
} from './newtonStartStrategy';

export type NewtonRaphsonInput = {
  expression: string;
  derivativeExpression?: string;
  x0?: number;
  interval?: { lower?: number; upper?: number } | null;
  initialStrategy?: NewtonInitialStrategy;
  tolerance?: number;
  functionTolerance?: number;
  maxIterations?: number;
  angleMode?: AngleMode;
  derivativeMode?: NewtonDerivativeMode;
};

export type NewtonRaphsonApproximation = {
  iteration: number;
  xCurrent: number;
  fCurrent: number;
  derivativeCurrent: number;
  correction: number;
  xNext: number;
  fNext: number;
  error?: number;
};

export type NewtonRaphsonFailureApproximation = Omit<
  NewtonRaphsonApproximation,
  'fCurrent' | 'derivativeCurrent' | 'correction' | 'xNext' | 'fNext'
> & {
  fCurrent?: number;
  derivativeCurrent?: number;
  correction?: number;
  xNext?: number;
  fNext?: number;
};

export type NewtonRaphsonResult =
  | {
      ok: true;
      root: number;
      iterations: number;
      approximations: NewtonRaphsonApproximation[];
      initial: NewtonStartHelper;
      derivative: NewtonDerivative;
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

function isApproximatelyZero(value: number, tolerance = ZERO_TOLERANCE): boolean {
  return Math.abs(value) <= tolerance;
}

function derivativeFailureWithRows(
  failure: NewtonDerivativeFailure,
  approximations?: NewtonRaphsonFailureApproximation[],
): NewtonRaphsonFailure {
  return {
    ...failure,
    approximations,
  };
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
    interval,
    initialStrategy,
  } = input;

  if (
    !expression.trim() ||
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
      message: 'Newton-Raphson requires a valid expression, tolerances > 0, and maxIterations >= 1.',
    };
  }

  const derivative = createNewtonDerivative({
    expression,
    derivativeExpression,
    derivativeMode,
  });
  if (!derivative.ok) {
    return derivativeFailureWithRows(derivative);
  }

  const start = resolveNewtonStart({
    x0,
    interval,
    strategy: initialStrategy,
    evaluateCandidate: (candidateX) => {
      const value = evaluateReal(expression, candidateX, angleMode, 'function');
      if (!value.ok) {
        throw new Error(value.message);
      }
      return value.value;
    },
  });
  if (!start.ok) {
    return {
      ok: false,
      reason: start.reason,
      message: start.message,
    };
  }

  let xCurrent = start.value;
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
        initial: start.helper,
        derivative,
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
    const derivativeResult = evaluateNewtonDerivative(
      derivative,
      xCurrent,
      angleMode,
    );
    if (!derivativeResult.ok) {
      return derivativeFailureWithRows(derivativeResult, derivativePartialRows);
    }
    const derivativeCurrent = derivativeResult.value;

    if (isNewtonDerivativeTooSmall(derivativeCurrent)) {
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

    const correction = fCurrent / derivativeCurrent;
    const xNext = xCurrent - correction;
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
            correction,
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
        correction,
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
      correction,
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
        initial: start.helper,
        derivative,
        stopReason: 'exact-root',
      };
    }

    if (Math.abs(fNext) <= functionTolerance) {
      return {
        ok: true,
        root: xNext,
        iterations: iteration,
        approximations,
        initial: start.helper,
        derivative,
        stopReason: 'function-tolerance-satisfied',
      };
    }

    if (error <= tolerance) {
      return {
        ok: true,
        root: xNext,
        iterations: iteration,
        approximations,
        initial: start.helper,
        derivative,
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
    initial: start.helper,
    derivative,
    stopReason: 'max-iterations',
  };
}
