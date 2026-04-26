import { evaluateExpression, type AngleMode } from '../math/evaluator';

export type FixedPointInput = {
  expression: string;
  x0: number;
  tolerance?: number;
  maxIterations?: number;
  angleMode?: AngleMode;
  targetExpression?: string;
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

export function runFixedPoint(input: FixedPointInput): FixedPointResult {
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
