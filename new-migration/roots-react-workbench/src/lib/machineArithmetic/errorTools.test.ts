import { describe, expect, it } from 'vitest';

import {
  absoluteError,
  maximumAbsoluteError,
  relativeError,
  significantDigits,
} from './errorTools';

describe('round-off error utilities', () => {
  it('matches the quiz-style square root of 3 example', () => {
    const trueValue = '1.73205081';
    const approximation = '1.7325897';

    expect(absoluteError(trueValue, approximation)).toBe('0.00053889');
    expect(Number(relativeError(trueValue, approximation))).toBeCloseTo(0.00031113, 8);
    expect(significantDigits(trueValue, approximation)).toBe(4);
    expect(Number(maximumAbsoluteError(trueValue, 4))).toBeCloseTo(0.00086603, 8);
  });

  it('computes absolute and relative error for negative values', () => {
    expect(absoluteError('-10', '-9.9')).toBe('0.1');
    expect(relativeError('-10', '-9.9')).toBe('0.01');
  });

  it('handles exact zero relative error and rejects undefined zero-reference relative error', () => {
    expect(relativeError(0, 0)).toBe('0');
    expect(significantDigits(0, 0)).toBe(Number.POSITIVE_INFINITY);
    expect(() => relativeError(0, '0.1')).toThrow(/undefined/);
  });

  it('handles very small and very large error values', () => {
    expect(absoluteError('1e-12', '1.1e-12')).toBe('0.0000000000001');
    expect(relativeError('1e12', '999999999999')).toBe('0.000000000001');
    expect(maximumAbsoluteError('1e12', 4)).toBe('500000000');
  });

  it('rejects invalid t and non-finite values', () => {
    expect(() => maximumAbsoluteError(1, -1)).toThrow(/nonnegative integer/);
    expect(() => maximumAbsoluteError(1, 1.5)).toThrow(/nonnegative integer/);
    expect(() => absoluteError(Number.NaN, 1)).toThrow(/finite/);
    expect(() => relativeError(1, Number.NEGATIVE_INFINITY)).toThrow(/finite/);
  });
});

