import { describe, expect, it } from 'vitest';

import { compareFixedPointFormulas } from './fixedPointComparison';

const cubeRoot21 = Math.cbrt(21);
const cubeRoot21Formulas = [
  { label: 'a', expression: '(20*x + 21 / x^2) / 21' },
  { label: 'b', expression: 'x - (x^3 - 21) / (3*x^2)' },
  { label: 'c', expression: 'x - (x^3 - 21*x) / (x^2 - 21)' },
  { label: 'd', expression: 'sqrt(21 / x)' },
];

describe('fixed-point comparison utility', () => {
  it('runs all four Midterm cube-root formulas from p0 = 1', () => {
    const result = compareFixedPointFormulas({
      formulas: cubeRoot21Formulas,
      x0: 1,
      targetValue: cubeRoot21,
      tolerance: 1e-8,
      maxIterations: 120,
    });

    expect(result.entries.map((entry) => entry.label)).toEqual(['a', 'b', 'c', 'd']);
    expect(result.entries.every((entry) => entry.expression.length > 0)).toBe(true);
  });

  it('builds comparison table rows shaped as n | (a) | (b) | (c) | (d)', () => {
    const result = compareFixedPointFormulas({
      formulas: cubeRoot21Formulas,
      x0: 1,
      targetValue: cubeRoot21,
      tolerance: 1e-8,
      maxIterations: 8,
    });

    expect(result.tableHeaders).toEqual(['n', '(a)', '(b)', '(c)', '(d)']);
    expect(result.tableRows[0]).toMatchObject({
      n: 0,
      a: 1,
      b: 1,
      c: 1,
      d: 1,
    });
    expect(result.tableRows[1]).toHaveProperty('a');
    expect(result.tableRows[1]).toHaveProperty('b');
    expect(result.tableRows[1]).toHaveProperty('c');
    expect(result.tableRows[1]).toHaveProperty('d');
  });

  it('shows the convergent Midterm formulas approaching 21^(1/3)', () => {
    const result = compareFixedPointFormulas({
      formulas: cubeRoot21Formulas,
      x0: 1,
      targetValue: cubeRoot21,
      tolerance: 1e-8,
      maxIterations: 120,
    });

    const byLabel = new Map(result.entries.map((entry) => [entry.label, entry]));
    expect(byLabel.get('a')?.approximation).toBeCloseTo(2.75892418, 6);
    expect(byLabel.get('b')?.approximation).toBeCloseTo(2.75892418, 8);
    expect(byLabel.get('d')?.approximation).toBeCloseTo(2.75892418, 7);
    expect(byLabel.get('c')?.targetError).toBeGreaterThan(1);
  });

  it('marks divergent, undefined, and cycle paths safely', () => {
    const result = compareFixedPointFormulas({
      formulas: [
        { label: 'diverged', expression: '2*x' },
        { label: 'undefined', expression: '1 / (x - 1)' },
        { label: 'cycle', expression: '-x' },
      ],
      x0: 1,
      tolerance: 1e-8,
      maxIterations: 40,
    });

    const statuses = Object.fromEntries(
      result.entries.map((entry) => [entry.label, entry.status]),
    );
    expect(statuses.diverged).toBe('diverged');
    expect(statuses.undefined).toBe('undefined');
    expect(statuses.cycle).toBe('cycle-detected');
  });

  it('ranks formulas deterministically by convergence speed and target error', () => {
    const result = compareFixedPointFormulas({
      formulas: cubeRoot21Formulas,
      x0: 1,
      targetValue: cubeRoot21,
      tolerance: 1e-8,
      maxIterations: 120,
    });

    expect(result.ranking.map((entry) => entry.label)).toEqual(['b', 'd', 'a', 'c']);
    expect(result.note).toMatch(/target error/i);
  });
});
