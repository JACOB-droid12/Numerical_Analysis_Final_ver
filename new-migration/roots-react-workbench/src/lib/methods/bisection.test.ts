import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';

import { describe, expect, it } from 'vitest';

import { runBisection, type BisectionResult } from './bisection';
import { scanBisectionBrackets } from './bisectionScan';
import { createPrecisionPolicy } from './precisionPolicy';

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

  it('keeps the existing absolute successive-difference tolerance behavior as the default', () => {
    const defaultResult = expectSuccessful(runBisection({
      expression: 'x^2 - 4',
      lower: 0,
      upper: 3,
      tolerance: 0.1,
      maxIterations: 20,
    }));

    const explicitAbsoluteResult = expectSuccessful(runBisection({
      expression: 'x^2 - 4',
      lower: 0,
      upper: 3,
      tolerance: 0.1,
      toleranceType: 'absolute',
      maxIterations: 20,
    }));

    expect(explicitAbsoluteResult.root).toBe(defaultResult.root);
    expect(explicitAbsoluteResult.iterations).toBe(defaultResult.iterations);
    expect(explicitAbsoluteResult.stopReason).toBe('tolerance-satisfied');
  });

  it('supports relative successive-difference tolerance stopping', () => {
    const result = expectSuccessful(runBisection({
      expression: 'x^2 - 4',
      lower: 0,
      upper: 3,
      tolerance: 0.05,
      toleranceType: 'relative',
      maxIterations: 20,
    }));

    expect(result.stopReason).toBe('tolerance-satisfied');
    expect(result.iterations).toBe(5);
    expect(result.root).toBe(1.96875);
  });

  it('supports residual/function tolerance stopping', () => {
    const result = expectSuccessful(runBisection({
      expression: 'x^2 - 4',
      lower: 0,
      upper: 3,
      tolerance: 0.1,
      toleranceType: 'residual',
      maxIterations: 20,
    }));

    expect(result.stopReason).toBe('tolerance-satisfied');
    const lastRow = result.approximations[result.approximations.length - 1];
    expect(Math.abs(lastRow?.fMidpoint ?? Number.NaN)).toBeLessThanOrEqual(0.1);
  });

  it('supports interval-bound tolerance stopping', () => {
    const result = expectSuccessful(runBisection({
      expression: 'x^2 - 4',
      lower: 0,
      upper: 3,
      tolerance: 0.1,
      toleranceType: 'interval',
      maxIterations: 20,
    }));

    expect(result.stopReason).toBe('tolerance-satisfied');
    const lastRow = result.approximations[result.approximations.length - 1];
    expect(lastRow?.bound).toBeLessThanOrEqual(0.1);
  });

  it('keeps standard precision bisection behavior unchanged', () => {
    const defaultResult = expectSuccessful(runBisection({
      expression: 'x^3 - x - 1',
      lower: 1,
      upper: 2,
      maxIterations: 5,
      tolerance: 1e-16,
    }));

    const standardResult = expectSuccessful(runBisection({
      expression: 'x^3 - x - 1',
      lower: 1,
      upper: 2,
      maxIterations: 5,
      tolerance: 1e-16,
      precisionPolicy: createPrecisionPolicy({ mode: 'standard', digits: 5, rule: 'round' }),
    }));

    expect(standardResult.root).toBe(defaultResult.root);
    expect(standardResult.approximations).toEqual(defaultResult.approximations);
  });

  it('keeps display-only precision bisection internals unchanged', () => {
    const defaultResult = expectSuccessful(runBisection({
      expression: 'x^3 - x - 1',
      lower: 1,
      upper: 2,
      maxIterations: 5,
      tolerance: 1e-16,
    }));

    const displayOnlyResult = expectSuccessful(runBisection({
      expression: 'x^3 - x - 1',
      lower: 1,
      upper: 2,
      maxIterations: 5,
      tolerance: 1e-16,
      precisionPolicy: createPrecisionPolicy({ mode: 'display-only', digits: 5, rule: 'chop' }),
    }));

    expect(displayOnlyResult.root).toBe(defaultResult.root);
    expect(displayOnlyResult.approximations).toEqual(defaultResult.approximations);
  });

  it('uses calculation-level rounding for bisection operation boundaries', () => {
    const result = expectSuccessful(runBisection({
      expression: 'x^3 - x - 1',
      lower: 1,
      upper: 2,
      maxIterations: 5,
      tolerance: 1e-16,
      precisionPolicy: createPrecisionPolicy({ mode: 'calculation-level', digits: 5, rule: 'round' }),
    }));

    expect(result.stopReason).toBe('max-iterations');
    expect(result.root).toBeCloseTo(1.3438, 12);
    expect(result.approximations.map((row) => row.midpoint)).toEqual([
      1.5,
      1.25,
      1.375,
      1.3125,
      1.3438,
    ]);
    expect(result.approximations.map((row) => row.fMidpoint)).toEqual([
      0.875,
      -0.29688,
      0.22461,
      -0.051514,
      0.082832,
    ]);
  });

  it('uses calculation-level chopping for bisection operation boundaries', () => {
    const result = expectSuccessful(runBisection({
      expression: 'x^3 - x - 1',
      lower: 1,
      upper: 2,
      maxIterations: 5,
      tolerance: 1e-16,
      precisionPolicy: createPrecisionPolicy({ mode: 'calculation-level', digits: 5, rule: 'chop' }),
    }));

    expect(result.stopReason).toBe('max-iterations');
    expect(result.root).toBeCloseTo(1.3437, 12);
    expect(result.approximations.map((row) => row.midpoint)).toEqual([
      1.5,
      1.25,
      1.375,
      1.3125,
      1.3437,
    ]);
    expect(result.approximations.map((row) => row.fMidpoint)).toEqual([
      0.875,
      -0.29687,
      0.2246,
      -0.051513,
      0.08239,
    ]);
  });

  it('uses precision-applied values for calculation-level sign decisions', () => {
    const result = expectSuccessful(runBisection({
      expression: 'x - 1.234575',
      lower: 1.2345,
      upper: 1.2346,
      maxIterations: 2,
      tolerance: 1e-16,
      precisionPolicy: createPrecisionPolicy({ mode: 'calculation-level', digits: 5, rule: 'round' }),
    }));

    expect(result.approximations[0]).toMatchObject({
      lower: 1.2345,
      upper: 1.2346,
      midpoint: 1.2346,
    });
    expect(result.approximations[0].fMidpoint).toBeGreaterThan(0);
    expect(result.approximations[1]).toMatchObject({
      lower: 1.2345,
      upper: 1.2346,
    });
    expect(result.approximations[0].decision).toBe('left');
    expect(result.approximations[0].machineSigns?.c).toBe(1);
    expect(result.approximations[0].exactSigns?.c).toBe(-1);
  });

  it('can use exact/raw signs for bisection decisions', () => {
    const result = expectSuccessful(runBisection({
      expression: 'x - 1.234575',
      lower: 1.2345,
      upper: 1.2346,
      maxIterations: 2,
      tolerance: 1e-16,
      decisionBasis: 'exact',
      precisionPolicy: createPrecisionPolicy({ mode: 'calculation-level', digits: 5, rule: 'round' }),
    }));

    expect(result.approximations[0].decision).toBe('right');
    expect(result.approximations[0].machineSigns?.c).toBe(1);
    expect(result.approximations[0].exactSigns?.c).toBe(-1);
    expect(result.approximations[1]).toMatchObject({
      lower: 1.2346,
      upper: 1.2346,
    });
    expect(result.approximations[0].note).toMatch(/disagree/i);
  });

  it('keeps invalid bracket behavior safe with calculation-level precision', () => {
    const result = runBisection({
      expression: 'x^2 + 1',
      lower: -1,
      upper: 1,
      maxIterations: 10,
      precisionPolicy: createPrecisionPolicy({ mode: 'calculation-level', digits: 5, rule: 'round' }),
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected invalid bracket to fail.');
    }
    expect(result.reason).toBe('invalid-starting-interval');
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

describe('bisection bracket scan', () => {
  it('finds a bracket near [-1, 0]', () => {
    const result = scanBisectionBrackets('x^3 - 7*x^2 + 14*x + 6', {
      min: -10,
      max: 10,
      steps: 20,
    });

    expect(result.ok).toBe(true);
    expect(result.candidates).toEqual(expect.arrayContaining([
      expect.objectContaining({ lower: -1, upper: 0 }),
    ]));
  });

  it('finds a bracket near [1, 2]', () => {
    const result = scanBisectionBrackets('x^3 + 4*x^2 - 10', {
      min: -10,
      max: 10,
      steps: 20,
    });

    expect(result.ok).toBe(true);
    expect(result.candidates).toEqual(expect.arrayContaining([
      expect.objectContaining({ lower: 1, upper: 2 }),
    ]));
  });

  it('returns an empty result when no scan bracket exists', () => {
    const result = scanBisectionBrackets('x^2 + 1', {
      min: -3,
      max: 3,
      steps: 6,
    });

    expect(result.ok).toBe(true);
    expect(result.candidates).toEqual([]);
    expect(result.note).toMatch(/no sign-change/i);
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
