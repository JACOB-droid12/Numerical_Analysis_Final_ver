import { describe, expect, it } from 'vitest';

import { buildConvergenceGraphPoints } from './ConvergenceGraph';
import { modernRootResultToUiResult } from '../lib/methods/modernRootEngineAdapter';
import { runModernRootMethod } from '../lib/methods/modernRootEngine';
import type { RootRunResult } from '../types/roots';

function run(overrides: Partial<RootRunResult>): RootRunResult {
  return {
    method: 'bisection',
    rows: [],
    ...overrides,
  };
}

describe('buildConvergenceGraphPoints', () => {
  it('plots bisection iterations against midpoint/root estimate values', () => {
    const points = buildConvergenceGraphPoints(run({
      method: 'bisection',
      rows: [
        { iteration: 1, a: 1, b: 2, c: 1.5, error: 0.5 },
        { iteration: 2, a: 1, b: 1.5, c: 1.25, error: 0.25 },
      ],
    }));

    expect(points).toEqual([
      { x: 1, y: 1.5 },
      { x: 2, y: 1.25 },
    ]);
  });

  it('plots false position iterations against interpolation point values', () => {
    const points = buildConvergenceGraphPoints(run({
      method: 'falsePosition',
      rows: [
        { iteration: 1, a: 0, b: 3, c: 1.333333333, error: null },
        { iteration: 2, a: 1.333333333, b: 3, c: 1.846153846, error: 0.512820513 },
      ],
    }));

    expect(points).toEqual([
      { x: 1, y: 1.333333333 },
      { x: 2, y: 1.846153846 },
    ]);
  });

  it('plots secant iterations against xNext values', () => {
    const points = buildConvergenceGraphPoints(run({
      method: 'secant',
      rows: [
        { iteration: 1, xPrev: 1, xn: 2, xNext: 1.166666667, error: 0.833333333 },
        { iteration: 2, xPrev: 2, xn: 1.166666667, xNext: 1.253112033, error: 0.086445366 },
      ],
    }));

    expect(points).toEqual([
      { x: 1, y: 1.166666667 },
      { x: 2, y: 1.253112033 },
    ]);
  });

  it('plots newton iterations against xNext values', () => {
    const points = buildConvergenceGraphPoints(run({
      method: 'newton',
      rows: [
        { iteration: 1, xn: 1.5, xNext: 1.347826087, error: 0.152173913 },
        { iteration: 2, xn: 1.347826087, xNext: 1.325200399, error: 0.022625688 },
      ],
    }));

    expect(points).toEqual([
      { x: 1, y: 1.347826087 },
      { x: 2, y: 1.325200399 },
    ]);
  });

  it('plots legacy-like fixed point rows against gxn before xn', () => {
    const points = buildConvergenceGraphPoints(run({
      method: 'fixedPoint',
      rows: [
        { iteration: 1, xn: 1, gxn: 0.540302306, error: 0.459697694 },
        { iteration: 2, xn: 0.540302306, gxn: 0.857553216, error: 0.31725091 },
      ],
    }));

    expect(points).toEqual([
      { x: 1, y: 0.540302306 },
      { x: 2, y: 0.857553216 },
    ]);
  });

  it('uses xn as a fixed point fallback only when next-value fields are missing', () => {
    const points = buildConvergenceGraphPoints(run({
      method: 'fixedPoint',
      rows: [
        { iteration: 1, xn: 1, error: null },
        { iteration: 2, xn: 0.540302306, error: 0.459697694 },
      ],
    }));

    expect(points).toEqual([
      { x: 1, y: 1 },
      { x: 2, y: 0.540302306 },
    ]);
  });

  it('plots modern adapted fixed point rows against xNext values', () => {
    const modernResult = runModernRootMethod({
      method: 'fixed-point',
      expression: 'cos(x)',
      targetExpression: 'x - cos(x)',
      x0: 1,
      maxIterations: 3,
    });
    const adapted = modernRootResultToUiResult(modernResult, {
      method: 'fixed-point',
      expression: 'cos(x)',
      targetExpression: 'x - cos(x)',
      x0: 1,
      maxIterations: 3,
    });

    const points = buildConvergenceGraphPoints(adapted);

    expect(points[0]).toEqual({ x: 1, y: 0.5403023058681398 });
    expect(points[1]?.y).toBeCloseTo(0.857553216, 9);
  });

  it('filters rows without finite iteration or estimate values', () => {
    const points = buildConvergenceGraphPoints(run({
      method: 'secant',
      rows: [
        { iteration: 1, xNext: Number.POSITIVE_INFINITY },
        { iteration: 2, xNext: null },
        { iteration: 3, xNext: 1.25 },
      ],
    }));

    expect(points).toEqual([{ x: 3, y: 1.25 }]);
  });

  it('plots finite approximation error values in error mode', () => {
    const points = buildConvergenceGraphPoints(run({
      method: 'newton',
      rows: [
        { iteration: 1, xNext: 1.5, error: 0.5 },
        { iteration: 2, xNext: 1.25, approxError: 0.25 },
        { iteration: 3, xNext: 1.125, approximateError: '0.125' },
      ],
    }), 'error');

    expect(points).toEqual([
      { x: 1, y: 0.5 },
      { x: 2, y: 0.25 },
      { x: 3, y: 0.125 },
    ]);
  });

  it('filters rows without finite approximation error values in error mode', () => {
    const points = buildConvergenceGraphPoints(run({
      method: 'secant',
      rows: [
        { iteration: 1, xNext: 1.4, error: Number.POSITIVE_INFINITY },
        { iteration: 2, xNext: 1.41 },
        { iteration: 3, xNext: 1.414, ea: 0.004 },
        { iteration: 4, xNext: 1.4142, absError: 'not numeric' },
        { iteration: 5, xNext: 1.41421, relativeError: '1e-5' },
      ],
    }), 'error');

    expect(points).toEqual([
      { x: 3, y: 0.004 },
      { x: 5, y: 0.00001 },
    ]);
  });

  it('plots residual values in residual mode', () => {
    const points = buildConvergenceGraphPoints(run({
      method: 'fixedPoint',
      rows: [
        { iteration: 1, xNext: 0.5, residual: 0.25 },
        { iteration: 2, xNext: 0.75, residual: '0.0625' },
      ],
    }), 'residual');

    expect(points).toEqual([
      { x: 1, y: 0.25 },
      { x: 2, y: 0.0625 },
    ]);
  });

  it('plots absolute f(pn) values in residual mode when using f-value fields', () => {
    const points = buildConvergenceGraphPoints(run({
      method: 'bisection',
      rows: [
        { iteration: 1, c: 1.5, fMidpoint: -0.125 },
        { iteration: 2, c: 1.25, fpn: 0.0625 },
        { iteration: 3, c: 1.375, fNext: -0.01 },
      ],
    }), 'residual');

    expect(points).toEqual([
      { x: 1, y: 0.125 },
      { x: 2, y: 0.0625 },
      { x: 3, y: 0.01 },
    ]);
  });

  it('filters rows without finite residual values in residual mode', () => {
    const points = buildConvergenceGraphPoints(run({
      method: 'newton',
      rows: [
        { iteration: 1, xNext: 1.5, residual: Number.NaN },
        { iteration: 2, xNext: 1.4 },
        { iteration: 3, xNext: 1.414, fxn: -0.002 },
      ],
    }), 'residual');

    expect(points).toEqual([{ x: 3, y: 0.002 }]);
  });

  it('returns fewer than two points when a mode lacks enough finite data', () => {
    const points = buildConvergenceGraphPoints(run({
      method: 'bisection',
      rows: [
        { iteration: 1, c: 1.5, error: null },
        { iteration: 2, c: 1.25, error: 0.25 },
      ],
    }), 'error');

    expect(points).toEqual([{ x: 2, y: 0.25 }]);
  });
});
