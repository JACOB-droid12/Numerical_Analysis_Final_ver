import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';

import { describe, expect, it } from 'vitest';

import { runBisection, type BisectionResult } from './bisection';

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

function expectSuccessful(result: BisectionResult) {
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error(result.message);
  }

  return result;
}

function legacyApproximationNumber(result: { summary?: { approximation?: unknown } }): number {
  return C.requireRealNumber(result.summary?.approximation, 'legacy approximation');
}

describe('math.js-backed isolated bisection', () => {
  it('solves x^3 - x - 1 on [1, 2]', () => {
    const result = expectSuccessful(runBisection({
      expression: 'x^3 - x - 1',
      lower: 1,
      upper: 2,
      tolerance: 1e-10,
    }));

    expect(result.root).toBeCloseTo(plasticRoot, 8);
    expect(result.stopReason).toMatch(/exact-root|tolerance-satisfied/);
    expect(result.approximations.length).toBeGreaterThan(0);
  });

  it('solves x^2 - 4 on [0, 3]', () => {
    const result = expectSuccessful(runBisection({
      expression: 'x^2 - 4',
      lower: 0,
      upper: 3,
      tolerance: 1e-10,
    }));

    expect(result.root).toBeCloseTo(2, 9);
    expect(result.stopReason).toMatch(/exact-root|tolerance-satisfied/);
  });

  it('returns an exact endpoint root without iterating', () => {
    const result = expectSuccessful(runBisection({
      expression: 'x - 1',
      lower: 1,
      upper: 3,
    }));

    expect(result.root).toBe(1);
    expect(result.iterations).toBe(0);
    expect(result.approximations).toHaveLength(0);
    expect(result.stopReason).toBe('exact-root');
  });

  it('rejects invalid starting brackets', () => {
    const result = runBisection({
      expression: 'x^2 + 1',
      lower: -1,
      upper: 1,
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected invalid bracket to fail.');
    }
    expect(result.reason).toBe('invalid-starting-interval');
  });

  it('rejects non-finite evaluations encountered during iteration', () => {
    const result = runBisection({
      expression: '1 / (x - 1)',
      lower: 0,
      upper: 2,
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected division by zero path to fail.');
    }
    expect(result.reason).toBe('non-finite-evaluation');
  });

  it('rejects complex evaluations in legacy-compatible real mode', () => {
    const result = runBisection({
      expression: 'sqrt(x)',
      lower: -1,
      upper: 1,
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected complex evaluation to fail.');
    }
    expect(result.reason).toBe('complex-evaluation');
  });

  it('reports max-iteration stop when the iteration cap is reached', () => {
    const result = expectSuccessful(runBisection({
      expression: 'x^3 - x - 1',
      lower: 1,
      upper: 2,
      tolerance: 1e-16,
      maxIterations: 3,
    }));

    expect(result.stopReason).toBe('max-iterations');
    expect(result.iterations).toBe(3);
    expect(result.approximations).toHaveLength(3);
  });

  it('supports degree-mode expressions through the evaluator wrapper', () => {
    const result = expectSuccessful(runBisection({
      expression: 'cos(x)',
      lower: 0,
      upper: 180,
      tolerance: 1e-10,
      angleMode: 'deg',
    }));

    expect(result.root).toBeCloseTo(90, 8);
    expect(result.stopReason).toMatch(/exact-root|tolerance-satisfied/);
  });

  it('returns normalized invalid-expression failures', () => {
    const result = runBisection({
      expression: 'x + * 1',
      lower: 0,
      upper: 1,
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected invalid expression to fail.');
    }
    expect(result.reason).toBe('invalid-expression');
  });
});

describe('isolated bisection comparison with legacy RootEngine', () => {
  it('matches legacy on the normal x^3 - x - 1 bisection case', () => {
    const legacyResult = R.runBisection({
      expression: 'x^3 - x - 1',
      interval: { a: '1', b: '2' },
      machine,
      stopping: { kind: 'epsilon', value: '1e-10', toleranceType: 'absolute' },
      decisionBasis: 'machine',
      signDisplay: 'both',
      angleMode: 'rad',
    });

    const isolatedResult = expectSuccessful(runBisection({
      expression: 'x^3 - x - 1',
      lower: 1,
      upper: 2,
      tolerance: 1e-10,
      angleMode: 'rad',
    }));

    expect(legacyResult.summary.stopReason).toBe('tolerance-reached');
    expect(isolatedResult.stopReason).toMatch(/exact-root|tolerance-satisfied/);
    expect(isolatedResult.root).toBeCloseTo(legacyApproximationNumber(legacyResult), 8);
  });

  it('matches legacy invalid-bracket failure at the high level', () => {
    const legacyResult = R.runBisection({
      expression: 'x^2 + 1',
      interval: { a: '-1', b: '1' },
      machine,
      stopping: { kind: 'iterations', value: '10' },
      decisionBasis: 'machine',
      signDisplay: 'both',
      angleMode: 'rad',
    });

    const isolatedResult = runBisection({
      expression: 'x^2 + 1',
      lower: -1,
      upper: 1,
      maxIterations: 10,
      angleMode: 'rad',
    });

    expect(legacyResult.summary.stopReason).toBe('invalid-starting-interval');
    expect(isolatedResult.ok).toBe(false);
    if (isolatedResult.ok) {
      throw new Error('Expected isolated invalid bracket to fail.');
    }
    expect(isolatedResult.reason).toBe('invalid-starting-interval');
  });
});
