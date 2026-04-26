import { evaluateExpression, type AngleMode } from '../math/evaluator';

export type SecantInput = {
  expression: string;
  x0: number;
  x1: number;
  tolerance?: number;
  maxIterations?: number;
  angleMode?: AngleMode;
};

export type SecantApproximation = {
  iteration: number;
  xPrevious: number;
  xCurrent: number;
  xNext: number;
  fPrevious: number;
  fCurrent: number;
  fNext: number;
  error?: number;
};

export type SecantFailureApproximation = Omit<SecantApproximation, 'xNext' | 'fNext'> & {
  xNext?: number;
  fNext?: number;
};

export type SecantResult =
  | {
      ok: true;
      root: number;
      iterations: number;
      approximations: SecantApproximation[];
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
        | 'invalid-starting-values'
        | 'non-finite-evaluation'
        | 'complex-evaluation'
        | 'zero-denominator'
        | 'max-iterations'
        | 'unknown-error';
      message: string;
      approximations?: SecantFailureApproximation[];
    };

type SecantFailure = Extract<SecantResult, { ok: false }>;

const DEFAULT_TOLERANCE = 1e-10;
const DEFAULT_MAX_ITERATIONS = 100;
const ZERO_TOLERANCE = 1e-14;
const DENOMINATOR_TOLERANCE = 1e-12;

function isApproximatelyZero(value: number): boolean {
  return Math.abs(value) <= ZERO_TOLERANCE;
}

function mapEvaluationFailure(
  expression: string,
  x: number,
  code: 'invalid-expression' | 'evaluation-error',
  message: string,
  approximations?: SecantFailureApproximation[],
): SecantFailure {
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
  approximations?: SecantFailureApproximation[],
): { ok: true; value: number } | SecantFailure {
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

export function runSecant(input: SecantInput): SecantResult {
  const {
    expression,
    x0,
    x1,
    tolerance = DEFAULT_TOLERANCE,
    maxIterations = DEFAULT_MAX_ITERATIONS,
    angleMode = 'rad',
  } = input;

  if (
    !expression.trim() ||
    !Number.isFinite(x0) ||
    !Number.isFinite(x1) ||
    !Number.isFinite(tolerance) ||
    tolerance <= 0 ||
    !Number.isInteger(maxIterations) ||
    maxIterations < 1
  ) {
    return {
      ok: false,
      reason: 'invalid-starting-values',
      message: 'Secant requires a valid expression, finite starting values, tolerance > 0, and maxIterations >= 1.',
    };
  }

  let xPrevious = x0;
  let xCurrent = x1;
  let fPreviousResult = evaluateReal(expression, xPrevious, angleMode);
  if (!fPreviousResult.ok) {
    return fPreviousResult;
  }
  let fPrevious = fPreviousResult.value;

  let fCurrentResult = evaluateReal(expression, xCurrent, angleMode);
  if (!fCurrentResult.ok) {
    return fCurrentResult;
  }
  let fCurrent = fCurrentResult.value;

  if (isApproximatelyZero(fPrevious)) {
    return {
      ok: true,
      root: xPrevious,
      iterations: 0,
      approximations: [],
      stopReason: 'exact-root',
    };
  }

  if (isApproximatelyZero(fCurrent)) {
    return {
      ok: true,
      root: xCurrent,
      iterations: 0,
      approximations: [],
      stopReason: 'exact-root',
    };
  }

  const approximations: SecantApproximation[] = [];

  for (let iteration = 1; iteration <= maxIterations; iteration += 1) {
    const denominator = fCurrent - fPrevious;
    const failureRows = approximations as SecantFailureApproximation[];

    if (Math.abs(denominator) <= DENOMINATOR_TOLERANCE) {
      return {
        ok: false,
        reason: 'zero-denominator',
        message: 'Secant denominator is zero or too close to zero.',
        approximations: [
          ...failureRows,
          {
            iteration,
            xPrevious,
            xCurrent,
            fPrevious,
            fCurrent,
          },
        ],
      };
    }

    const xNext = xCurrent - (fCurrent * (xCurrent - xPrevious)) / denominator;
    if (!Number.isFinite(xNext)) {
      return {
        ok: false,
        reason: 'non-finite-evaluation',
        message: 'Secant produced a non-finite next point.',
        approximations: [
          ...failureRows,
          {
            iteration,
            xPrevious,
            xCurrent,
            xNext,
            fPrevious,
            fCurrent,
          },
        ],
      };
    }

    const partialRows: SecantFailureApproximation[] = [
      ...failureRows,
      {
        iteration,
        xPrevious,
        xCurrent,
        xNext,
        fPrevious,
        fCurrent,
      },
    ];
    const fNextResult = evaluateReal(expression, xNext, angleMode, partialRows);
    if (!fNextResult.ok) {
      return fNextResult;
    }

    const fNext = fNextResult.value;
    const error = Math.abs(xNext - xCurrent);

    approximations.push({
      iteration,
      xPrevious,
      xCurrent,
      xNext,
      fPrevious,
      fCurrent,
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

    if (Math.abs(fNext) <= tolerance) {
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

    xPrevious = xCurrent;
    fPrevious = fCurrent;
    xCurrent = xNext;
    fCurrent = fNext;
  }

  return {
    ok: true,
    root: xCurrent,
    iterations: approximations.length,
    approximations,
    stopReason: 'max-iterations',
  };
}
