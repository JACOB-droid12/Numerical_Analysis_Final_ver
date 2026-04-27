import { describe, expect, it } from 'vitest';

import {
  createNewtonDerivative,
  evaluateNewtonDerivative,
  isNewtonDerivativeTooSmall,
} from './newtonDerivative';

describe('Newton-Raphson derivative helper', () => {
  it('uses a provided derivative expression', () => {
    const derivative = createNewtonDerivative({
      expression: 'x^2 - 2',
      derivativeExpression: '2*x',
      derivativeMode: 'provided',
    });

    expect(derivative.ok).toBe(true);
    if (!derivative.ok) throw new Error(derivative.message);
    expect(derivative.source).toBe('user');
    const value = evaluateNewtonDerivative(derivative, 2, 'rad');
    expect(value.ok && value.value).toBeCloseTo(4, 12);
  });

  it('maps auto derivative mode to numeric central difference', () => {
    const derivative = createNewtonDerivative({
      expression: 'x^2 - 2',
      derivativeExpression: 'auto',
      derivativeMode: 'auto',
    });

    expect(derivative.ok).toBe(true);
    if (!derivative.ok) throw new Error(derivative.message);
    expect(derivative.source).toBe('numeric');
    expect(derivative.note).toMatch(/numeric/i);
  });

  it('fails invalid provided derivatives clearly when evaluated', () => {
    const derivative = createNewtonDerivative({
      expression: 'x^2 - 2',
      derivativeExpression: '2 * * x',
      derivativeMode: 'provided',
    });

    expect(derivative.ok).toBe(true);
    if (!derivative.ok) throw new Error(derivative.message);
    const value = evaluateNewtonDerivative(derivative, 1, 'rad');
    expect(value.ok).toBe(false);
    if (value.ok) throw new Error('Expected invalid derivative evaluation to fail.');
    expect(value.reason).toBe('invalid-derivative-expression');
  });

  it('evaluates numeric derivatives for x^2 - 2', () => {
    const derivative = createNewtonDerivative({
      expression: 'x^2 - 2',
      derivativeMode: 'numeric',
    });

    expect(derivative.ok).toBe(true);
    if (!derivative.ok) throw new Error(derivative.message);
    const value = evaluateNewtonDerivative(derivative, Math.SQRT2, 'rad');
    expect(value.ok && value.value).toBeCloseTo(2 * Math.SQRT2, 6);
  });

  it('evaluates numeric derivatives for x - cos(x)', () => {
    const derivative = createNewtonDerivative({
      expression: 'x - cos(x)',
      derivativeMode: 'numeric',
    });

    expect(derivative.ok).toBe(true);
    if (!derivative.ok) throw new Error(derivative.message);
    const value = evaluateNewtonDerivative(derivative, 0.7, 'rad');
    expect(value.ok && value.value).toBeCloseTo(1 + Math.sin(0.7), 6);
  });

  it('identifies near-zero derivative values as unsafe', () => {
    expect(isNewtonDerivativeTooSmall(0)).toBe(true);
    expect(isNewtonDerivativeTooSmall(1e-14)).toBe(true);
    expect(isNewtonDerivativeTooSmall(1e-6)).toBe(false);
  });
});
