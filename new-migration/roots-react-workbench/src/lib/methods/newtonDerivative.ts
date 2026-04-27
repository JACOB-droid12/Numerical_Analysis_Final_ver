import { evaluateExpression, type AngleMode } from '../math/evaluator';

export type NewtonDerivativeMode = 'provided' | 'numeric' | 'auto';
export type NewtonDerivativeSource = 'user' | 'numeric';

export type NewtonDerivative = {
  expression: string;
  derivativeExpression?: string;
  source: NewtonDerivativeSource;
  canonical: string;
  note: string;
};

export type NewtonDerivativeFailure = {
  ok: false;
  reason:
    | 'invalid-expression'
    | 'invalid-derivative-expression'
    | 'missing-derivative'
    | 'non-finite-evaluation'
    | 'complex-evaluation'
    | 'unknown-error';
  message: string;
};

export type NewtonDerivativeResolution =
  | ({ ok: true } & NewtonDerivative)
  | NewtonDerivativeFailure;

export type NewtonDerivativeEvaluation =
  | { ok: true; value: number }
  | NewtonDerivativeFailure;

const DERIVATIVE_TOLERANCE = 1e-12;
const NUMERIC_DERIVATIVE_STEP_FACTOR = Math.cbrt(Number.EPSILON);

function mapEvaluationFailure(
  expression: string,
  x: number,
  code: 'invalid-expression' | 'evaluation-error',
  message: string,
  expressionRole: 'function' | 'derivative',
): NewtonDerivativeFailure {
  const lowerMessage = message.toLowerCase();

  if (code === 'invalid-expression') {
    return {
      ok: false,
      reason: expressionRole === 'derivative'
        ? 'invalid-derivative-expression'
        : 'invalid-expression',
      message,
    };
  }

  if (lowerMessage.includes('non-finite')) {
    return {
      ok: false,
      reason: 'non-finite-evaluation',
      message: `${expressionRole === 'derivative' ? "f'" : 'f'}(${x}) is non-finite for ${expression}: ${message}`,
    };
  }

  if (lowerMessage.includes('complex')) {
    return {
      ok: false,
      reason: 'complex-evaluation',
      message: `${expressionRole === 'derivative' ? "f'" : 'f'}(${x}) is complex for ${expression}: ${message}`,
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
  expressionRole: 'function' | 'derivative',
): NewtonDerivativeEvaluation {
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
    );
  }

  if (typeof result.value !== 'number') {
    return {
      ok: false,
      reason: 'unknown-error',
      message: `${expressionRole === 'derivative' ? "f'" : 'f'}(${x}) did not evaluate to a real number.`,
    };
  }

  if (!Number.isFinite(result.value)) {
    return {
      ok: false,
      reason: 'non-finite-evaluation',
      message: `${expressionRole === 'derivative' ? "f'" : 'f'}(${x}) evaluated to a non-finite value.`,
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
): NewtonDerivativeEvaluation {
  const h = numericDerivativeStep(x);
  const forward = evaluateReal(expression, x + h, angleMode, 'derivative');
  if (!forward.ok) {
    return forward;
  }

  const backward = evaluateReal(expression, x - h, angleMode, 'derivative');
  if (!backward.ok) {
    return backward;
  }

  const derivative = (forward.value - backward.value) / (2 * h);
  if (!Number.isFinite(derivative)) {
    return {
      ok: false,
      reason: 'non-finite-evaluation',
      message: `Numeric derivative at x=${x} evaluated to a non-finite value.`,
    };
  }

  return { ok: true, value: derivative };
}

export function createNewtonDerivative(options: {
  expression: string;
  derivativeExpression?: string;
  derivativeMode?: NewtonDerivativeMode;
}): NewtonDerivativeResolution {
  const requested = options.derivativeExpression?.trim();
  const mode = options.derivativeMode ?? (requested === 'auto' ? 'auto' : 'provided');

  if (mode === 'numeric' || mode === 'auto' || requested === 'auto') {
    return {
      ok: true,
      expression: options.expression,
      source: 'numeric',
      canonical: 'numeric central difference',
      note: 'Modern auto derivative uses numeric central difference; symbolic differentiation is deferred.',
    };
  }

  if (!requested) {
    return {
      ok: false,
      reason: 'missing-derivative',
      message: 'Provided derivative mode requires derivativeExpression.',
    };
  }

  return {
    ok: true,
    expression: options.expression,
    derivativeExpression: requested,
    source: 'user',
    canonical: requested,
    note: 'Using the derivative entered by the user.',
  };
}

export function evaluateNewtonDerivative(
  derivative: NewtonDerivative,
  x: number,
  angleMode: AngleMode,
): NewtonDerivativeEvaluation {
  if (derivative.source === 'numeric') {
    return evaluateNumericDerivative(derivative.expression, x, angleMode);
  }

  return evaluateReal(
    derivative.derivativeExpression ?? '',
    x,
    angleMode,
    'derivative',
  );
}

export function isNewtonDerivativeTooSmall(value: number): boolean {
  return Math.abs(value) <= DERIVATIVE_TOLERANCE;
}
