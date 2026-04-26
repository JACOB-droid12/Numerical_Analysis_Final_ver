import { evaluateExpression, type AngleMode } from '../math/evaluator';

export type SignLabel = 'negative' | 'zero' | 'positive' | 'unavailable';

export type BracketEvaluation =
  | {
      ok: true;
      fLower: number;
      fUpper: number;
      lowerSign: SignLabel;
      upperSign: SignLabel;
      hasSignChange: boolean;
      bracketSatisfied: boolean;
    }
  | {
      ok: false;
      message: string;
    };

function finiteNumber(value: number, label: string): number {
  if (!Number.isFinite(value)) {
    throw new RangeError(`${label} must be finite.`);
  }
  return value;
}

function positiveNumber(value: number, label: string): number {
  finiteNumber(value, label);
  if (value <= 0) {
    throw new RangeError(`${label} must be greater than zero.`);
  }
  return value;
}

function nonnegativeInteger(value: number, label: string): number {
  if (!Number.isInteger(value) || value < 0) {
    throw new RangeError(`${label} must be a nonnegative integer.`);
  }
  return value;
}

export function requiredBisectionIterations(lower: number, upper: number, tolerance: number): number {
  const width = Math.abs(finiteNumber(upper, 'upper') - finiteNumber(lower, 'lower'));
  const epsilon = positiveNumber(tolerance, 'tolerance');
  if (width === 0) {
    return 0;
  }
  return Math.max(0, Math.ceil(Math.log2(width / epsilon)));
}

export function bisectionToleranceFromIterations(lower: number, upper: number, iterations: number): number {
  const width = Math.abs(finiteNumber(upper, 'upper') - finiteNumber(lower, 'lower'));
  const count = nonnegativeInteger(iterations, 'iterations');
  return width / 2 ** count;
}

export function signOf(value: number): SignLabel {
  if (!Number.isFinite(value)) return 'unavailable';
  if (value === 0) return 'zero';
  return value < 0 ? 'negative' : 'positive';
}

function evaluateAt(expression: string, x: number, angleMode: AngleMode) {
  return evaluateExpression(expression, { x }, { mode: 'legacy-compatible', angleMode });
}

export function evaluateBracket(
  expression: string,
  lower: number,
  upper: number,
  angleMode: AngleMode,
): BracketEvaluation {
  if (!expression.trim()) {
    return { ok: false, message: 'Enter f(x) to evaluate the interval.' };
  }
  if (!Number.isFinite(lower) || !Number.isFinite(upper)) {
    return { ok: false, message: 'Enter finite interval endpoints.' };
  }

  const lowerResult = evaluateAt(expression, lower, angleMode);
  if (!lowerResult.ok || typeof lowerResult.value !== 'number') {
    return {
      ok: false,
      message: lowerResult.ok ? 'f(a) did not evaluate to a real number.' : lowerResult.error.message,
    };
  }

  const upperResult = evaluateAt(expression, upper, angleMode);
  if (!upperResult.ok || typeof upperResult.value !== 'number') {
    return {
      ok: false,
      message: upperResult.ok ? 'f(b) did not evaluate to a real number.' : upperResult.error.message,
    };
  }

  const fLower = lowerResult.value;
  const fUpper = upperResult.value;
  const lowerSign = signOf(fLower);
  const upperSign = signOf(fUpper);
  const product = fLower * fUpper;
  const hasSignChange = Number.isFinite(product) && product < 0;

  return {
    ok: true,
    fLower,
    fUpper,
    lowerSign,
    upperSign,
    hasSignChange,
    bracketSatisfied: hasSignChange,
  };
}

