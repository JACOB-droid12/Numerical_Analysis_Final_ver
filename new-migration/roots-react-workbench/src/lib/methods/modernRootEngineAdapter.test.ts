import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';

import { describe, expect, it } from 'vitest';

import { METHOD_CONFIG_BY_ID } from '../../config/methods';
import { rowsToCsv } from '../csv';
import {
  answerText,
  confidenceStatus,
  solutionText,
  tableHeadersForRun,
  tableValuesForRow,
} from '../resultFormatters';
import type { PrecisionDisplayConfig, RootRunResult } from '../../types/roots';
import {
  modernRootResultToUiResult,
  runModernRootMethodForUi,
} from './modernRootEngineAdapter';
import { runModernRootMethod } from './modernRootEngine';

type LegacyWindow = {
  MathEngine: Record<string, any>;
  CalcEngine: Record<string, any>;
  ExpressionEngine: Record<string, any>;
  RootEngine: Record<string, any>;
};

function loadEditableLegacyEngines(): LegacyWindow {
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

const legacy = loadEditableLegacyEngines();
const { CalcEngine: C, RootEngine: R } = legacy;
const machine = { k: 16, mode: 'round' };
const plasticRoot = 1.324717957244746;
const cosineFixedPoint = 0.7390851332151607;

function legacyApproximationNumber(result: { summary?: { approximation?: unknown } }): number {
  return C.requireRealNumber(result.summary?.approximation, 'legacy approximation');
}

function expectUiSuccess(run: RootRunResult): RootRunResult {
  expect(run.summary?.approximation).not.toBeNull();
  expect(run.rows?.length ?? 0).toBeGreaterThan(0);
  return run;
}

function csvFor(run: RootRunResult, precisionDisplay?: PrecisionDisplayConfig): string {
  const config = METHOD_CONFIG_BY_ID[run.method];
  const headers = tableHeadersForRun(run, config.tableHeaders);
  const rows = run.rows ?? [];
  return rowsToCsv([
    headers,
    ...rows.map((row) => {
      const values = tableValuesForRow(run.method, row, run, precisionDisplay);
      return Array.from({ length: headers.length }, (_, index) => values[index] ?? '');
    }),
  ]);
}

describe('modern root engine UI adapter', () => {
  it('converts bisection results into UI-compatible shape', () => {
    const run = expectUiSuccess(runModernRootMethodForUi({
      method: 'bisection',
      expression: 'x^3 - x - 1',
      lower: 1,
      upper: 2,
      tolerance: 1e-10,
    }));

    expect(run.method).toBe('bisection');
    expect(run.summary?.approximation).toBeCloseTo(plasticRoot, 8);
    expect(run.summary?.stopReason).toBe('tolerance-reached');
    expect(run.rows?.[0]).toHaveProperty('a');
    expect(run.rows?.[0]).toHaveProperty('c');
    expect(tableHeadersForRun(run)).toEqual([
      'n',
      'aₙ',
      'bₙ',
      'pₙ',
      'f(pₙ)',
      'Approx. Error',
    ]);
    expect(tableValuesForRow(run.method, run.rows?.[0] ?? { iteration: 1 }, run)).toHaveLength(6);
  });

  it('converts false position results into UI-compatible shape', () => {
    const run = expectUiSuccess(runModernRootMethodForUi({
      method: 'false-position',
      expression: 'x^3 - x - 1',
      lower: 1,
      upper: 2,
      tolerance: 1e-10,
    }));

    expect(run.method).toBe('falsePosition');
    expect(run.summary?.approximation).toBeCloseTo(plasticRoot, 7);
    expect(run.rows?.[0]).toHaveProperty('a');
    expect(run.rows?.[0]).toHaveProperty('c');
    expect(tableHeadersForRun(run)).toEqual(['n', 'aₙ', 'bₙ', 'pₙ', 'f(pₙ)', 'Approx. Error']);
    expect(tableValuesForRow(run.method, run.rows?.[0] ?? { iteration: 1 }, run)).toHaveLength(6);
  });

  it('preserves selected false-position decision controls in the UI result', () => {
    const run = expectUiSuccess(runModernRootMethodForUi({
      method: 'false-position',
      expression: 'x - 1.234575',
      lower: 1.2345,
      upper: 1.2346,
      maxIterations: 2,
      decisionBasis: 'exact',
      signDisplay: 'machine',
    }));

    expect(run.method).toBe('falsePosition');
    expect(run.decisionBasis).toBe('exact');
    expect(run.signDisplay).toBe('machine');
    expect(run.rows?.[0]).toHaveProperty('exactSigns');
    expect(run.rows?.[0]).toHaveProperty('machineSigns');
    expect(run.rows?.[0]).toHaveProperty('decision');
    expect(tableHeadersForRun(run)).toEqual(['n', 'aₙ', 'bₙ', 'pₙ', 'f(pₙ)', 'Approx. Error']);
  });

  it('converts secant results into UI-compatible shape', () => {
    const run = expectUiSuccess(runModernRootMethodForUi({
      method: 'secant',
      expression: 'x^3 - x - 1',
      x0: 1,
      x1: 2,
      tolerance: 1e-10,
    }));

    expect(run.method).toBe('secant');
    expect(run.summary?.approximation).toBeCloseTo(plasticRoot, 10);
    expect(run.rows?.[0]).toHaveProperty('xPrev');
    expect(run.rows?.[0]).toHaveProperty('xNext');
    expect(run.rows?.[0]).toHaveProperty('fNext');
    expect(tableHeadersForRun(run)).toEqual([
      'n',
      'pₙ₋₂',
      'pₙ₋₁',
      'pₙ',
      'f(pₙ)',
      'Approx. Error',
    ]);
  });

  it('converts fixed point results into UI-compatible shape', () => {
    const run = expectUiSuccess(runModernRootMethodForUi({
      method: 'fixed-point',
      expression: 'cos(x)',
      x0: 1,
      tolerance: 1e-10,
      maxIterations: 100,
    }));

    expect(run.method).toBe('fixedPoint');
    expect(run.summary?.approximation).toBeCloseTo(cosineFixedPoint, 9);
    expect(run.rows?.[0]).toHaveProperty('xn');
    expect(run.rows?.[0]).toHaveProperty('gxn');
    expect(run.rows?.[0]).toHaveProperty('gValue');
    expect(tableHeadersForRun(run)).toEqual([
      'n',
      'pₙ₋₁',
      'pₙ = g(pₙ₋₁)',
      'Approx. Error',
      'Residual',
    ]);
  });

  it('exposes modern fixed-point advanced-control candidates through workflow helpers', () => {
    const run = expectUiSuccess(runModernRootMethodForUi({
      method: 'fixed-point',
      expression: 'cos(x)',
      x0: 1,
      extraSeeds: [0],
      batchExpressions: ['sqrt(x + 1)', ''],
      seedScan: { min: 0, max: 1, steps: 2 },
      targetExpression: 'x - cos(x)',
      tolerance: 1e-8,
      maxIterations: 100,
    }));

    const batch = run.helpers?.fixedPointBatch;
    expect(batch?.entries.length).toBeGreaterThanOrEqual(4);
    expect(batch?.entries.some((entry) => entry.x0 === 0)).toBe(true);
    expect(batch?.entries.some((entry) => entry.gExpression === 'sqrt(x + 1)')).toBe(true);
    expect(batch?.note).toMatch(/ranking/i);
    expect(tableHeadersForRun(run)).toEqual([
      'n',
      'pₙ₋₁',
      'pₙ = g(pₙ₋₁)',
      'Approx. Error',
      'Residual',
    ]);
  });

  it('converts Newton-Raphson results into UI-compatible shape', () => {
    const run = expectUiSuccess(runModernRootMethodForUi({
      method: 'newton-raphson',
      expression: 'x^3 - x - 1',
      derivativeExpression: '3*x^2 - 1',
      x0: 1.5,
      tolerance: 1e-10,
    }));

    expect(run.method).toBe('newton');
    expect(run.dfExpression).toBe('3*x^2 - 1');
    expect(run.helpers?.derivative?.source).toBe('user');
    expect(run.summary?.approximation).toBeCloseTo(plasticRoot, 10);
    expect(run.rows?.[0]).toHaveProperty('dfxn');
    expect(run.rows?.[0]).toHaveProperty('fNext');
    expect(tableHeadersForRun(run)).toEqual([
      'n',
      'pₙ',
      'f(pₙ)',
      'f′(pₙ)',
      'f(pₙ)/f′(pₙ)',
      'pₙ₊₁',
      'Approx. Error',
    ]);
    const firstRow = run.rows?.[0] ?? { iteration: 1 };
    const values = tableValuesForRow(run.method, firstRow, run);
    expect(values).toHaveLength(7);
    expect(Number(values[4])).toBeCloseTo(Number(firstRow.fCurrent) / Number(firstRow.derivativeCurrent), 12);
  });

  it('converts Newton-Raphson numeric derivative results into UI-compatible shape', () => {
    const run = expectUiSuccess(runModernRootMethodForUi({
      method: 'newton-raphson',
      expression: 'x^3 - x - 1',
      derivativeMode: 'numeric',
      x0: 1.5,
      tolerance: 1e-10,
    }));

    expect(run.method).toBe('newton');
    expect(run.dfExpression).toBeUndefined();
    expect(run.helpers?.derivative?.source).toBe('numeric');
    expect(run.summary?.approximation).toBeCloseTo(plasticRoot, 10);
    expect(run.rows?.[0]).toHaveProperty('dfxn');
  });

  it('also adapts an already-run modern result', () => {
    const input = {
      method: 'secant' as const,
      expression: 'x^3 - x - 1',
      x0: 1,
      x1: 2,
      tolerance: 1e-10,
    };
    const modernResult = runModernRootMethod(input);
    const run = modernRootResultToUiResult(modernResult, input);

    expect(run.method).toBe('secant');
    expect(run.modernResult).toBe(modernResult);
    expect(run.summary?.approximation).toBeCloseTo(plasticRoot, 10);
  });

  it('converts invalid bracket failures cleanly', () => {
    const run = runModernRootMethodForUi({
      method: 'bisection',
      expression: 'x^2 + 1',
      lower: -1,
      upper: 1,
    });

    expect(run.summary?.approximation).toBeNull();
    expect(run.summary?.stopReason).toBe('invalid-starting-interval');
    expect(run.summary?.stopDetail).toMatch(/opposite signs/);
  });

  it('converts missing Newton derivative failures cleanly', () => {
    const run = runModernRootMethodForUi({
      method: 'newton-raphson',
      expression: 'x^2 - 4',
      x0: 3,
      derivativeMode: 'provided',
    });

    expect(run.method).toBe('newton');
    expect(run.summary?.approximation).toBeNull();
    expect(run.summary?.stopReason).toBe('invalid-input');
    expect(run.summary?.stopDetail).toMatch(/derivativeExpression/);
  });

  it('converts complex and non-finite failures cleanly', () => {
    const complexRun = runModernRootMethodForUi({
      method: 'fixed-point',
      expression: 'sqrt(x)',
      x0: -1,
    });
    expect(complexRun.summary?.approximation).toBeNull();
    expect(complexRun.summary?.stopReason).toBe('non-finite-evaluation');
    expect(complexRun.summary?.stopDetail).toMatch(/complex/);

    const nonFiniteRun = runModernRootMethodForUi({
      method: 'secant',
      expression: '1 / (x - 1)',
      x0: 0,
      x1: 2,
    });
    expect(nonFiniteRun.summary?.approximation).toBeNull();
    expect(nonFiniteRun.summary?.stopReason).toBe('non-finite-evaluation');
    expect(nonFiniteRun.rows?.length ?? 0).toBeGreaterThan(0);
  });

  it('produces results consumable by existing result formatters', () => {
    const run = runModernRootMethodForUi({
      method: 'bisection',
      expression: 'x^3 - x - 1',
      lower: 1,
      upper: 2,
      tolerance: 1e-10,
    });

    expect(answerText(run)).toContain('Approximate root');
    expect(solutionText(run)).toContain('Iteration table');
    expect(confidenceStatus(run, 'current', null)).toMatchObject({
      label: 'High',
      tone: 'success',
    });
  });

  it('produces rows consumable by CSV helpers', () => {
    const run = runModernRootMethodForUi({
      method: 'newton-raphson',
      expression: 'x^2 - 4',
      derivativeExpression: '2*x',
      x0: 3,
      tolerance: 1e-10,
    });

    const csv = csvFor(run);
    expect(csv).toContain('f′(pₙ)');
    expect(csv).toContain('f(pₙ)/f′(pₙ)');
    expect(csv).toContain('pₙ₊₁');
    expect(csv).toContain('Approx. Error');
    expect(csv.split('\r\n').length).toBe((run.rows?.length ?? 0) + 1);
  });

  it('uses the selected modern precision display for CSV values', () => {
    const run = runModernRootMethodForUi({
      method: 'bisection',
      expression: 'x^3 - x - 1',
      lower: 1,
      upper: 2,
      maxIterations: 3,
    });

    const standardCsv = csvFor(run, { mode: 'standard', digits: 5 });
    const choppedCsv = csvFor(run, { mode: 'chop', digits: 5 });
    const roundedCsv = csvFor(run, { mode: 'round', digits: 5 });

    expect(standardCsv).toContain('1.25');
    expect(choppedCsv).toContain('1.25');
    expect(choppedCsv).toContain('-0.29687');
    expect(roundedCsv).toContain('-0.29688');
    expect(run.summary?.approximation).toBeTypeOf('number');
  });

  it('keeps raw modern Newton root unchanged for display precision formatting', () => {
    const run = runModernRootMethodForUi({
      method: 'newton-raphson',
      expression: 'x^2 - 2',
      derivativeExpression: '2*x',
      x0: 1,
      tolerance: 1e-12,
    });

    expect(run.summary?.approximation).toBeCloseTo(Math.SQRT2, 11);
  });

  it('leaves legacy table and CSV headers unchanged', () => {
    const legacyRun: RootRunResult = {
      method: 'bisection',
      rows: [{ iteration: 1, a: 1, b: 2, c: 1.5, error: 0.5 }],
      signDisplay: 'both',
    };
    const headers = tableHeadersForRun(legacyRun, METHOD_CONFIG_BY_ID.bisection.tableHeaders);
    const csv = rowsToCsv([
      headers,
      tableValuesForRow(legacyRun.method, legacyRun.rows?.[0] ?? { iteration: 1 }, legacyRun),
    ]);

    expect(headers).toEqual(METHOD_CONFIG_BY_ID.bisection.tableHeaders);
    expect(csv).toContain('Signs');
    expect(csv).not.toContain('pₙ');
  });
});

describe('modern UI adapter comparison with legacy RootEngine output', () => {
  it('compares bisection normal convergence', () => {
    const legacyResult = R.runBisection({
      expression: 'x^3 - x - 1',
      interval: { a: '1', b: '2' },
      machine,
      stopping: { kind: 'epsilon', value: '1e-10', toleranceType: 'absolute' },
      decisionBasis: 'machine',
      signDisplay: 'both',
      angleMode: 'rad',
    });
    const modernRun = runModernRootMethodForUi({
      method: 'bisection',
      expression: 'x^3 - x - 1',
      lower: 1,
      upper: 2,
      tolerance: 1e-10,
    });

    expect(modernRun.summary?.approximation).toBeCloseTo(legacyApproximationNumber(legacyResult), 8);
    expect(modernRun.rows?.length ?? 0).toBeGreaterThan(0);
  });

  it('compares secant normal convergence', () => {
    const legacyResult = R.runSecant({
      expression: 'x^3 - x - 1',
      x0: '1',
      x1: '2',
      machine,
      stopping: { kind: 'iterations', value: '40' },
      angleMode: 'rad',
    });
    const modernRun = runModernRootMethodForUi({
      method: 'secant',
      expression: 'x^3 - x - 1',
      x0: 1,
      x1: 2,
      maxIterations: 40,
    });

    expect(modernRun.summary?.approximation).toBeCloseTo(legacyApproximationNumber(legacyResult), 10);
  });

  it('compares fixed point normal convergence', () => {
    const legacyResult = R.runFixedPoint({
      gExpression: 'cos(x)',
      x0: '1',
      machine,
      stopping: { kind: 'epsilon', value: '1e-10' },
      angleMode: 'rad',
    });
    const modernRun = runModernRootMethodForUi({
      method: 'fixed-point',
      expression: 'cos(x)',
      x0: 1,
      tolerance: 1e-10,
      maxIterations: 100,
    });

    expect(modernRun.summary?.approximation).toBeCloseTo(legacyApproximationNumber(legacyResult), 9);
  });

  it('compares Newton-Raphson normal convergence with a provided derivative', () => {
    const legacyResult = R.runNewtonRaphson({
      expression: 'x^3 - x - 1',
      dfExpression: '3*x^2 - 1',
      x0: '1.5',
      machine,
      stopping: { kind: 'iterations', value: '40' },
      angleMode: 'rad',
    });
    const modernRun = runModernRootMethodForUi({
      method: 'newton-raphson',
      expression: 'x^3 - x - 1',
      derivativeExpression: '3*x^2 - 1',
      x0: 1.5,
      maxIterations: 40,
    });

    expect(modernRun.summary?.approximation).toBeCloseTo(legacyApproximationNumber(legacyResult), 10);
  });
});
