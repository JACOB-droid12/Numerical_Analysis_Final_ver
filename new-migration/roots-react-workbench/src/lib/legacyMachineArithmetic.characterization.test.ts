import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';

import { describe, expect, it } from 'vitest';

// These tests characterize existing Legacy machine arithmetic behavior. They are not ideal-theory tests.

type LegacyWindow = {
  CalcEngine: Record<string, any>;
  RootEngine: Record<string, any>;
};

function loadEditableEngines(): LegacyWindow {
  const legacyWindow = {} as LegacyWindow;
  const context = vm.createContext({
    window: legacyWindow,
    console,
  });

  for (const file of [
    'math-engine.js',
    'calc-engine.js',
    'expression-engine.js',
    'root-engine.js',
  ]) {
    const source = readFileSync(resolve(process.cwd(), file), 'utf8');
    vm.runInContext(source, context, { filename: file });
  }

  return legacyWindow;
}

const { CalcEngine: C, RootEngine: R } = loadEditableEngines();

function asNumber(value: unknown): number | null {
  if (value == null) return null;
  return C.requireRealNumber(value, 'legacy value');
}

function pointMachineNumber(point: unknown): number | null {
  if (point && typeof point === 'object' && 'machine' in point) {
    return asNumber((point as { machine: unknown }).machine);
  }
  return asNumber(point);
}

function expectCloseArray(actual: Array<number | null>, expected: Array<number | null>, digits = 12) {
  expect(actual).toHaveLength(expected.length);
  actual.forEach((value, index) => {
    const expectedValue = expected[index];
    if (expectedValue == null) {
      expect(value).toBeNull();
    } else {
      expect(value).not.toBeNull();
      expect(value as number).toBeCloseTo(expectedValue, digits);
    }
  });
}

function bisectionRun(mode: 'round' | 'chop') {
  return R.runBisection({
    expression: 'x^3 - x - 1',
    interval: { a: '1', b: '2' },
    machine: { k: 5, mode },
    stopping: { kind: 'iterations', value: '5' },
    decisionBasis: 'machine',
    signDisplay: 'both',
    angleMode: 'rad',
    skipScan: true,
  });
}

function falsePositionRun(mode: 'round' | 'chop') {
  return R.runFalsePosition({
    expression: 'x^2 - 4',
    interval: { a: '0', b: '3' },
    machine: { k: 5, mode },
    stopping: { kind: 'iterations', value: '5' },
    decisionBasis: 'machine',
    signDisplay: 'both',
    angleMode: 'rad',
  });
}

function newtonRun(mode: 'round' | 'chop') {
  return R.runNewtonRaphson({
    expression: 'x^2 - 2',
    dfExpression: '2*x',
    x0: '1',
    machine: { k: 8, mode },
    stopping: { kind: 'iterations', value: '5' },
    angleMode: 'rad',
  });
}

function fixedPointRun(mode: 'round' | 'chop') {
  return R.runFixedPoint({
    gExpression: 'cos(x)',
    x0: '1',
    machine: { k: 8, mode },
    stopping: { kind: 'iterations', value: '5' },
    angleMode: 'rad',
  });
}

describe('legacy machine arithmetic characterization', () => {
  it('stores bisection midpoints and stepwise f(p) values with 5-digit rounding', () => {
    const result = bisectionRun('round');

    expect(result.summary.stopReason).toBe('iteration-limit');
    expect(asNumber(result.summary.approximation)).toBeCloseTo(1.3438, 12);
    expect(pointMachineNumber(result.summary.residual)).toBeCloseTo(0.0828, 12);

    expectCloseArray(result.rows.map((row: Record<string, unknown>) => asNumber(row.c)), [
      1.5,
      1.25,
      1.375,
      1.3125,
      1.3438,
    ]);
    expectCloseArray(result.rows.map((row: Record<string, unknown>) => pointMachineNumber(row.fc)), [
      0.875,
      -0.2969,
      0.2246,
      -0.0515,
      0.0828,
    ]);
    expect(result.rows.map((row: Record<string, unknown>) => row.decision)).toEqual([
      'left',
      'right',
      'left',
      'right',
      'left',
    ]);
    expect(result.rows.map((row: Record<string, unknown>) => row.machineSigns)).toEqual([
      { a: -1, b: 1, c: 1 },
      { a: -1, b: 1, c: -1 },
      { a: -1, b: 1, c: 1 },
      { a: -1, b: 1, c: -1 },
      { a: -1, b: 1, c: 1 },
    ]);
  });

  it('stores bisection midpoints and stepwise f(p) values with 5-digit chopping', () => {
    const result = bisectionRun('chop');

    expect(result.summary.stopReason).toBe('iteration-limit');
    expect(asNumber(result.summary.approximation)).toBeCloseTo(1.3437, 12);
    expect(pointMachineNumber(result.summary.residual)).toBeCloseTo(0.0823, 12);

    expectCloseArray(result.rows.map((row: Record<string, unknown>) => asNumber(row.c)), [
      1.5,
      1.25,
      1.375,
      1.3125,
      1.3437,
    ]);
    expectCloseArray(result.rows.map((row: Record<string, unknown>) => pointMachineNumber(row.fc)), [
      0.875,
      -0.2969,
      0.2246,
      -0.0516,
      0.0823,
    ]);
    expect(result.rows.map((row: Record<string, unknown>) => row.decision)).toEqual([
      'left',
      'right',
      'left',
      'right',
      'left',
    ]);
  });

  it('stores false-position points and f(p) values with 5-digit rounding', () => {
    const result = falsePositionRun('round');

    expect(result.summary.stopReason).toBe('iteration-limit');
    expect(asNumber(result.summary.approximation)).toBeCloseTo(1.9987, 12);
    expect(pointMachineNumber(result.summary.residual)).toBeCloseTo(-0.0052, 12);

    expectCloseArray(result.rows.map((row: Record<string, unknown>) => asNumber(row.c)), [
      1.3333,
      1.8461,
      1.9682,
      1.9936,
      1.9987,
    ]);
    expectCloseArray(result.rows.map((row: Record<string, unknown>) => pointMachineNumber(row.fc)), [
      -2.2223,
      -0.5919,
      -0.1262,
      -0.0256,
      -0.0052,
    ]);
    expect(result.rows.map((row: Record<string, unknown>) => row.decision)).toEqual([
      'right',
      'right',
      'right',
      'right',
      'right',
    ]);
  });

  it('stores false-position points and f(p) values with 5-digit chopping', () => {
    const result = falsePositionRun('chop');

    expect(result.summary.stopReason).toBe('iteration-limit');
    expect(asNumber(result.summary.approximation)).toBeCloseTo(1.9987, 12);
    expect(pointMachineNumber(result.summary.residual)).toBeCloseTo(-0.0052, 12);

    expectCloseArray(result.rows.map((row: Record<string, unknown>) => asNumber(row.c)), [
      1.3333,
      1.8461,
      1.9682,
      1.9936,
      1.9987,
    ]);
    expectCloseArray(result.rows.map((row: Record<string, unknown>) => pointMachineNumber(row.fc)), [
      -2.2224,
      -0.592,
      -0.1262,
      -0.0256,
      -0.0052,
    ]);
    expect(result.rows.map((row: Record<string, unknown>) => row.decision)).toEqual([
      'right',
      'right',
      'right',
      'right',
      'right',
    ]);
  });

  it('stores Newton-Raphson iterates using 8-digit rounding', () => {
    const result = newtonRun('round');

    expect(result.summary.stopReason).toBe('iteration-limit');
    expect(asNumber(result.summary.approximation)).toBeCloseTo(1.4142136, 12);
    expect(asNumber(result.summary.residual)).toBeCloseTo(1.0642496e-7, 15);

    expectCloseArray(result.rows.map((row: Record<string, unknown>) => asNumber(row.xNext)), [
      1.5,
      1.4166667,
      1.4142157,
      1.4142136,
      1.4142136,
    ]);
    expectCloseArray(result.rows.map((row: Record<string, unknown>) => asNumber(row.fxn)), [
      -1,
      0.25,
      0.0069445389,
      0.0000060461265,
      1.0642496e-7,
    ], 15);
    expectCloseArray(result.rows.map((row: Record<string, unknown>) => asNumber(row.dfxn)), [
      2,
      3,
      2.8333334,
      2.8284314,
      2.8284272,
    ]);
    expectCloseArray(result.rows.map((row: Record<string, unknown>) => {
      const xn = asNumber(row.xn);
      const xNext = asNumber(row.xNext);
      return xn == null || xNext == null ? null : xn - xNext;
    }), [
      -0.5,
      0.0833333,
      0.002451,
      0.0000021,
      0,
    ]);
  });

  it('stores Newton-Raphson iterates using 8-digit chopping', () => {
    const result = newtonRun('chop');

    expect(result.summary.stopReason).toBe('iteration-limit');
    expect(asNumber(result.summary.approximation)).toBeCloseTo(1.4142135, 12);
    expect(asNumber(result.summary.residual)).toBeCloseTo(-1.7641775e-7, 15);

    expectCloseArray(result.rows.map((row: Record<string, unknown>) => asNumber(row.xNext)), [
      1.5,
      1.4166666,
      1.4142156,
      1.4142135,
      1.4142135,
    ]);
    expectCloseArray(result.rows.map((row: Record<string, unknown>) => asNumber(row.fxn)), [
      -1,
      0.25,
      0.0069442555,
      0.0000057632833,
      -1.7641775e-7,
    ], 15);
  });

  it('stops secant without crashing when machine-stored denominator stagnates', () => {
    const result = R.runSecant({
      expression: 'x^2',
      x0: '-1',
      x1: '1',
      machine: { k: 5, mode: 'round' },
      stopping: { kind: 'iterations', value: '5' },
      angleMode: 'rad',
    });

    expect(result.summary.stopReason).toBe('stagnation');
    expect(asNumber(result.summary.approximation)).toBe(1);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].note).toBe('f(xₙ) ≈ f(xₙ₋₁), method stalled');
    expect(asNumber(result.rows[0].fxPrev)).toBe(1);
    expect(asNumber(result.rows[0].fxn)).toBe(1);
    expect(result.rows[0].xNext).toBeNull();
  });

  it('stores fixed-point cos(x) iterates using 8-digit rounding', () => {
    const result = fixedPointRun('round');

    expect(result.summary.stopReason).toBe('iteration-limit');
    expect(asNumber(result.summary.approximation)).toBeCloseTo(0.70136877, 12);
    expect(asNumber(result.summary.residual)).toBeCloseTo(0.06259092, 12);

    expectCloseArray(result.rows.map((row: Record<string, unknown>) => asNumber(row.gxn)), [
      0.54030231,
      0.85755321,
      0.65428979,
      0.79348036,
      0.70136877,
    ]);
    expectCloseArray(result.rows.map((row: Record<string, unknown>) => row.error as number), [
      0.45969769,
      0.3172509,
      0.20326342,
      0.13919057,
      0.09211159,
    ]);
  });

  it('stores fixed-point cos(x) iterates using 8-digit chopping', () => {
    const result = fixedPointRun('chop');

    expect(result.summary.stopReason).toBe('iteration-limit');
    expect(asNumber(result.summary.approximation)).toBeCloseTo(0.70136876, 12);
    expect(asNumber(result.summary.residual)).toBeCloseTo(0.06259093, 12);

    expectCloseArray(result.rows.map((row: Record<string, unknown>) => asNumber(row.gxn)), [
      0.5403023,
      0.85755321,
      0.65428978,
      0.79348035,
      0.70136876,
    ]);
    expectCloseArray(result.rows.map((row: Record<string, unknown>) => row.error as number), [
      0.4596977,
      0.31725091,
      0.20326343,
      0.13919057,
      0.09211159,
    ]);
  });
});
