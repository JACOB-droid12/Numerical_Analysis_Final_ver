import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';

import { describe, expect, it } from 'vitest';

import { runFixedPoint, type FixedPointResult } from './fixedPoint';

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

function expectSuccessful(result: FixedPointResult) {
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error(result.message);
  }

  return result;
}

function legacyApproximationNumber(result: { summary?: { approximation?: unknown } }): number {
  return C.requireRealNumber(result.summary?.approximation, 'legacy approximation');
}

describe('math.js-backed isolated fixed point', () => {
  it('solves the cosine fixed point from x0 = 1 in radians', () => {
    const result = expectSuccessful(runFixedPoint({
      expression: 'cos(x)',
      x0: 1,
      tolerance: 1e-10,
      maxIterations: 100,
    }));

    expect(result.root).toBeCloseTo(0.739085133, 9);
    expect(result.stopReason).toMatch(/exact-fixed-point|tolerance-satisfied/);
    expect(result.approximations.length).toBeGreaterThan(0);
    expect(result.batch).toBeUndefined();
  });

  it('runs the same fixed-point formula from extra seeds without changing single-run rows', () => {
    const result = expectSuccessful(runFixedPoint({
      expression: 'cos(x)',
      x0: 1,
      extraSeeds: [0, 2],
      tolerance: 1e-8,
      maxIterations: 100,
    }));

    expect(result.batch?.entries.map((entry) => entry.x0)).toEqual([1, 0, 2]);
    expect(result.batch?.entries.every((entry) => entry.gExpression === 'cos(x)')).toBe(true);
    expect(result.batch?.entries.every((entry) => entry.status === 'converged')).toBe(true);
    expect(result.approximations).toEqual(result.batch?.entries[0].result.ok
      ? result.batch.entries[0].result.approximations
      : []);
  });

  it('rejects invalid extra seed values instead of silently ignoring them', () => {
    const result = runFixedPoint({
      expression: 'cos(x)',
      x0: 1,
      extraSeeds: [Number.NaN],
      tolerance: 1e-8,
      maxIterations: 100,
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected invalid extra seed to fail.');
    }
    expect(result.reason).toBe('invalid-starting-value');
  });

  it('runs batch g(x) expressions from the shared primary seed and ignores empty formulas', () => {
    const result = expectSuccessful(runFixedPoint({
      expression: 'cos(x)',
      batchExpressions: ['sqrt(x + 1)', '', '2*x'],
      x0: 1,
      targetExpression: 'x - cos(x)',
      tolerance: 1e-8,
      maxIterations: 80,
    }));

    expect(result.batch?.entries.map((entry) => entry.gExpression)).toEqual([
      'cos(x)',
      'sqrt(x + 1)',
      '2*x',
    ]);
    expect(result.batch?.entries.map((entry) => entry.status)).toContain('diverged');
    expect(result.batch?.entries[0].targetResidual).toBeTypeOf('number');
  });

  it('adds deterministic seed-scan candidates to the fixed-point batch', () => {
    const result = expectSuccessful(runFixedPoint({
      expression: 'cos(x)',
      x0: 1,
      seedScan: { min: 0, max: 1, steps: 2 },
      tolerance: 1e-8,
      maxIterations: 100,
    }));

    expect(result.batch?.scan).toMatchObject({
      range: { min: 0, max: 1, steps: 2 },
      seeds: [0, 0.5],
    });
    expect(result.batch?.entries.map((entry) => entry.x0)).toEqual([0.5, 1, 0]);
  });

  it('solves sqrt(x + 1) from x0 = 1 and records target residuals', () => {
    const result = expectSuccessful(runFixedPoint({
      expression: 'sqrt(x + 1)',
      targetExpression: 'x^2 - x - 1',
      x0: 1,
      tolerance: 1e-10,
      maxIterations: 100,
    }));

    expect(result.root).toBeCloseTo(1.618033988749895, 9);
    expect(result.stopReason).toMatch(/exact-fixed-point|tolerance-satisfied|residual-tolerance-satisfied/);
    expect(result.approximations.some((row) => row.residual != null)).toBe(true);
  });

  it('returns an exact fixed point when g(x0) equals x0', () => {
    const result = expectSuccessful(runFixedPoint({
      expression: 'x',
      x0: 2,
    }));

    expect(result.root).toBe(2);
    expect(result.iterations).toBe(1);
    expect(result.stopReason).toBe('exact-fixed-point');
  });

  it('rejects non-finite evaluations safely', () => {
    const result = runFixedPoint({
      expression: '1 / (x - 1)',
      x0: 1,
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected non-finite evaluation to fail.');
    }
    expect(result.reason).toBe('non-finite-evaluation');
  });

  it('rejects complex evaluations in legacy-compatible real mode', () => {
    const result = runFixedPoint({
      expression: 'sqrt(x)',
      x0: -1,
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected complex evaluation to fail.');
    }
    expect(result.reason).toBe('complex-evaluation');
  });

  it('reports max-iteration stop when the iteration cap is reached', () => {
    const result = expectSuccessful(runFixedPoint({
      expression: 'cos(x)',
      x0: 1,
      tolerance: 1e-16,
      maxIterations: 2,
    }));

    expect(result.stopReason).toBe('max-iterations');
    expect(result.iterations).toBe(2);
    expect(result.approximations).toHaveLength(2);
  });

  it('detects divergence before exhausting the default iteration cap', () => {
    const result = runFixedPoint({
      expression: '2 * x',
      x0: 1,
      maxIterations: 100,
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected divergence to fail.');
    }
    expect(result.reason).toBe('divergence-detected');
    expect(result.approximations?.length).toBeGreaterThan(0);
  });

  it('detects a simple two-cycle', () => {
    const result = runFixedPoint({
      expression: '-x',
      x0: 1,
      maxIterations: 10,
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected cycle detection to fail.');
    }
    expect(result.reason).toBe('cycle-detected');
    expect(result.approximations).toHaveLength(2);
  });

  it('supports degree-mode expressions through the evaluator wrapper', () => {
    const result = expectSuccessful(runFixedPoint({
      expression: 'cos(x)',
      x0: 1,
      tolerance: 1e-12,
      maxIterations: 20,
      angleMode: 'deg',
    }));

    expect(result.root).toBeCloseTo(0.9998477415, 9);
    expect(result.stopReason).toMatch(/exact-fixed-point|tolerance-satisfied/);
  });

  it('returns normalized invalid-expression failures', () => {
    const result = runFixedPoint({
      expression: 'x + * 1',
      x0: 1,
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected invalid expression to fail.');
    }
    expect(result.reason).toBe('invalid-expression');
  });
});

describe('isolated fixed point comparison with legacy RootEngine', () => {
  it('matches legacy on normal cos(x) convergence', () => {
    const legacyResult = R.runFixedPoint({
      gExpression: 'cos(x)',
      x0: '1',
      machine,
      stopping: { kind: 'epsilon', value: '1e-10' },
      angleMode: 'rad',
    });

    const isolatedResult = expectSuccessful(runFixedPoint({
      expression: 'cos(x)',
      x0: 1,
      tolerance: 1e-10,
      maxIterations: 100,
      angleMode: 'rad',
    }));

    expect(legacyResult.summary.stopReason).toMatch(/tolerance-reached|exact-zero|machine-zero/);
    expect(isolatedResult.stopReason).toMatch(/exact-fixed-point|tolerance-satisfied/);
    expect(isolatedResult.root).toBeCloseTo(legacyApproximationNumber(legacyResult), 9);
  });

  it('matches legacy non-finite rejection at the high level', () => {
    const legacyResult = R.runFixedPoint({
      gExpression: '1 / (x - 1)',
      x0: '1',
      machine,
      stopping: { kind: 'iterations', value: '10' },
      angleMode: 'rad',
    });

    const isolatedResult = runFixedPoint({
      expression: '1 / (x - 1)',
      x0: 1,
      maxIterations: 10,
      angleMode: 'rad',
    });

    expect(legacyResult.summary.stopReason).toMatch(/singularity-encountered|non-finite-evaluation/);
    expect(isolatedResult.ok).toBe(false);
    if (isolatedResult.ok) {
      throw new Error('Expected isolated non-finite evaluation to fail.');
    }
    expect(isolatedResult.reason).toBe('non-finite-evaluation');
  });

  it('documents divergence handling for g(x) = 2x', () => {
    const legacyResult = R.runFixedPoint({
      gExpression: '2 * x',
      x0: '1',
      machine,
      stopping: { kind: 'iterations', value: '40' },
      angleMode: 'rad',
    });

    const isolatedResult = runFixedPoint({
      expression: '2 * x',
      x0: 1,
      maxIterations: 40,
      angleMode: 'rad',
    });

    expect(legacyResult.summary.stopReason).toBe('diverged');
    expect(isolatedResult.ok).toBe(false);
    if (isolatedResult.ok) {
      throw new Error('Expected isolated divergence to fail.');
    }
    expect(isolatedResult.reason).toBe('divergence-detected');
  });
});
