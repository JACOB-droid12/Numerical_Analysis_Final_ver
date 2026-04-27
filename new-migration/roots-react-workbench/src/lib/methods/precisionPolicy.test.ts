import { describe, expect, it } from 'vitest';

import {
  applyCalculationPrecision,
  applyDisplayPrecision,
  createPrecisionPolicy,
  shouldApplyCalculationPrecision,
  shouldApplyDisplayPrecision,
} from './precisionPolicy';

describe('precision policy', () => {
  it('defaults to standard precision with 8 rounding digits', () => {
    expect(createPrecisionPolicy()).toEqual({
      mode: 'standard',
      digits: 8,
      rule: 'round',
    });
  });

  it('rejects invalid digit counts', () => {
    expect(() => createPrecisionPolicy({ digits: 0 })).toThrow(/positive integer/);
    expect(() => createPrecisionPolicy({ digits: -1 })).toThrow(/positive integer/);
    expect(() => createPrecisionPolicy({ digits: 2.5 })).toThrow(/positive integer/);
  });

  it('leaves calculation values unchanged for standard and display-only policies', () => {
    const value = Math.PI;

    expect(applyCalculationPrecision(value, createPrecisionPolicy())).toBe(value);
    expect(
      applyCalculationPrecision(
        value,
        createPrecisionPolicy({ mode: 'display-only', digits: 5, rule: 'chop' }),
      ),
    ).toBe(value);
  });

  it('rounds calculation values only for calculation-level policies', () => {
    expect(
      applyCalculationPrecision(
        Math.PI,
        createPrecisionPolicy({ mode: 'calculation-level', digits: 5, rule: 'round' }),
      ),
    ).toBe(3.1416);

    expect(
      applyCalculationPrecision(
        Math.SQRT2,
        createPrecisionPolicy({ mode: 'calculation-level', digits: 8, rule: 'round' }),
      ),
    ).toBe(1.4142136);
  });

  it('chops calculation values only for calculation-level policies', () => {
    expect(
      applyCalculationPrecision(
        Math.PI,
        createPrecisionPolicy({ mode: 'calculation-level', digits: 5, rule: 'chop' }),
      ),
    ).toBe(3.1415);

    expect(
      applyCalculationPrecision(
        Math.SQRT2,
        createPrecisionPolicy({ mode: 'calculation-level', digits: 8, rule: 'chop' }),
      ),
    ).toBe(1.4142135);
  });

  it('reports when calculation or display precision should be applied', () => {
    const standard = createPrecisionPolicy();
    const displayOnly = createPrecisionPolicy({ mode: 'display-only' });
    const calculationLevel = createPrecisionPolicy({ mode: 'calculation-level' });

    expect(shouldApplyCalculationPrecision(standard)).toBe(false);
    expect(shouldApplyCalculationPrecision(displayOnly)).toBe(false);
    expect(shouldApplyCalculationPrecision(calculationLevel)).toBe(true);

    expect(shouldApplyDisplayPrecision(standard)).toBe(false);
    expect(shouldApplyDisplayPrecision(displayOnly)).toBe(true);
    expect(shouldApplyDisplayPrecision(calculationLevel)).toBe(true);
  });

  it('applies display precision independently from calculation precision', () => {
    const displayOnly = createPrecisionPolicy({ mode: 'display-only', digits: 5, rule: 'round' });
    const calculationLevel = createPrecisionPolicy({ mode: 'calculation-level', digits: 5, rule: 'chop' });

    expect(applyCalculationPrecision(Math.PI, displayOnly)).toBe(Math.PI);
    expect(applyDisplayPrecision(Math.PI, displayOnly)).toBe('3.1416');

    expect(applyCalculationPrecision(Math.PI, calculationLevel)).toBe(3.1415);
    expect(applyDisplayPrecision(Math.PI, calculationLevel)).toBe('3.1415');
  });
});
