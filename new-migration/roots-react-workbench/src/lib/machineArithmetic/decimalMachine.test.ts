import { describe, expect, it } from 'vitest';

import {
  choppingRelativeErrorBound,
  chopToSignificantDigits,
  normalizeDecimal,
  roundingRelativeErrorBound,
  roundToSignificantDigits,
} from './decimalMachine';

describe('decimal machine arithmetic utilities', () => {
  it('normalizes decimal values into professor machine-number form', () => {
    expect(normalizeDecimal('3.14159265')).toEqual({
      sign: 1,
      mantissa: '0.314159265',
      exponent: 1,
      normalizedText: '0.314159265 × 10^1',
    });

    expect(normalizeDecimal('-0.0123')).toEqual({
      sign: -1,
      mantissa: '0.123',
      exponent: -1,
      normalizedText: '-0.123 × 10^-1',
    });

    expect(normalizeDecimal(0)).toEqual({
      sign: 0,
      mantissa: '0',
      exponent: 0,
      normalizedText: '0',
    });
  });

  it('matches lecture pi chopping and rounding examples', () => {
    expect(chopToSignificantDigits('3.141592653589793238462643383279', 5)).toBe('3.1415');
    expect(roundToSignificantDigits('3.141592653589793238462643383279', 5)).toBe('3.1416');
  });

  it('uses toward-zero chopping for negative numbers', () => {
    expect(chopToSignificantDigits('-3.14159265', 5)).toBe('-3.1415');
    expect(roundToSignificantDigits('-3.14159265', 5)).toBe('-3.1416');
  });

  it('handles very small and very large values deterministically', () => {
    expect(chopToSignificantDigits('0.000000123456789', 4)).toBe('0.0000001234');
    expect(roundToSignificantDigits('0.000000123456789', 4)).toBe('0.0000001235');
    expect(chopToSignificantDigits('987654321000000000000', 3)).toBe('987000000000000000000');
    expect(roundToSignificantDigits('987654321000000000000', 3)).toBe('988000000000000000000');
  });

  it('computes lecture relative error bounds', () => {
    expect(choppingRelativeErrorBound(5)).toBe('0.0001');
    expect(roundingRelativeErrorBound(5)).toBe('0.00005');
  });

  it('rejects invalid k and non-finite values', () => {
    expect(() => chopToSignificantDigits(1, 0)).toThrow(/positive integer/);
    expect(() => roundToSignificantDigits(1, 2.5)).toThrow(/positive integer/);
    expect(() => choppingRelativeErrorBound(-1)).toThrow(/positive integer/);
    expect(() => normalizeDecimal(Number.POSITIVE_INFINITY)).toThrow(/finite/);
  });
});

