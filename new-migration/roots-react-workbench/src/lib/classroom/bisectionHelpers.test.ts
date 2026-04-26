import { describe, expect, it } from 'vitest';

import {
  bisectionToleranceFromIterations,
  evaluateBracket,
  requiredBisectionIterations,
  signOf,
} from './bisectionHelpers';

describe('bisection classroom helpers', () => {
  it('computes required iterations from tolerance', () => {
    expect(requiredBisectionIterations(1, 2, 0.01)).toBe(7);
    expect(requiredBisectionIterations(-2, 2, 0.001)).toBe(12);
  });

  it('computes guaranteed tolerance from iteration count', () => {
    expect(bisectionToleranceFromIterations(1, 2, 7)).toBeCloseTo(0.0078125, 12);
    expect(bisectionToleranceFromIterations(-2, 2, 12)).toBeCloseTo(0.0009765625, 12);
  });

  it('evaluates valid bracket signs and IVT condition', () => {
    const result = evaluateBracket('x^3 - x - 1', 1, 2, 'rad');

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.message);
    expect(result.fLower).toBe(-1);
    expect(result.fUpper).toBe(5);
    expect(result.lowerSign).toBe('negative');
    expect(result.upperSign).toBe('positive');
    expect(result.hasSignChange).toBe(true);
    expect(result.bracketSatisfied).toBe(true);
  });

  it('evaluates invalid bracket signs safely', () => {
    const result = evaluateBracket('x^2 + 1', -1, 1, 'rad');

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.message);
    expect(result.fLower).toBe(2);
    expect(result.fUpper).toBe(2);
    expect(result.hasSignChange).toBe(false);
    expect(result.bracketSatisfied).toBe(false);
  });

  it('labels signs and rejects invalid helper inputs', () => {
    expect(signOf(-2)).toBe('negative');
    expect(signOf(0)).toBe('zero');
    expect(signOf(2)).toBe('positive');
    expect(signOf(Number.POSITIVE_INFINITY)).toBe('unavailable');
    expect(() => requiredBisectionIterations(1, 2, 0)).toThrow(/greater than zero/);
    expect(() => bisectionToleranceFromIterations(1, 2, -1)).toThrow(/nonnegative integer/);
  });
});

