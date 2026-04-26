import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';

import { describe, expect, it } from 'vitest';

import { runSecant, type SecantResult } from './secant';

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

function expectSuccessful(result: SecantResult) {
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error(result.message);
  }

  return result;
}

function legacyApproximationNumber(result: { summary?: { approximation?: unknown } }): number {
  return C.requireRealNumber(result.summary?.approximation, 'legacy approximation');
}

describe('math.js-backed isolated secant', () => {
  it('solves x^3 - x - 1 from x0 = 1 and x1 = 2', () => {
    const result = expectSuccessful(runSecant({
      expression: 'x^3 - x - 1',
      x0: 1,
      x1: 2,
      tolerance: 1e-10,
    }));

    expect(result.root).toBeCloseTo(plasticRoot, 10);
    expect(result.stopReason).toMatch(/exact-root|function-tolerance-satisfied|tolerance-satisfied/);
    expect(result.approximations.length).toBeGreaterThan(0);
  });

  it('solves x^2 - 4 from x0 = 0 and x1 = 3', () => {
    const result = expectSuccessful(runSecant({
      expression: 'x^2 - 4',
      x0: 0,
      x1: 3,
      tolerance: 1e-10,
    }));

    expect(result.root).toBeCloseTo(2, 10);
    expect(result.stopReason).toMatch(/exact-root|function-tolerance-satisfied|tolerance-satisfied/);
  });

  it('returns an exact starting root without iterating', () => {
    const result = expectSuccessful(runSecant({
      expression: 'x - 1',
      x0: 1,
      x1: 3,
    }));

    expect(result.root).toBe(1);
    expect(result.iterations).toBe(0);
    expect(result.approximations).toHaveLength(0);
    expect(result.stopReason).toBe('exact-root');
  });

  it('rejects zero or near-zero secant denominators with partial history', () => {
    const result = runSecant({
      expression: 'x^2',
      x0: -1,
      x1: 1,
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected zero denominator to fail.');
    }
    expect(result.reason).toBe('zero-denominator');
    expect(result.approximations).toHaveLength(1);
    expect(result.approximations?.[0]).toMatchObject({
      xPrevious: -1,
      xCurrent: 1,
      fPrevious: 1,
      fCurrent: 1,
    });
  });

  it('returns non-finite evaluation failures with useful partial history', () => {
    const result = runSecant({
      expression: '1 / (x - 1)',
      x0: 0,
      x1: 2,
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected non-finite evaluation to fail.');
    }
    expect(result.reason).toBe('non-finite-evaluation');
    const lastApproximation = result.approximations?.[result.approximations.length - 1];
    expect(lastApproximation).toMatchObject({ xNext: 1 });
  });

  it('rejects complex evaluations in legacy-compatible real mode', () => {
    const result = runSecant({
      expression: 'sqrt(x)',
      x0: -1,
      x1: 1,
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected complex evaluation to fail.');
    }
    expect(result.reason).toBe('complex-evaluation');
  });

  it('reports max-iteration stop when the iteration cap is reached', () => {
    const result = expectSuccessful(runSecant({
      expression: 'x^3 - x - 1',
      x0: 1,
      x1: 2,
      tolerance: 1e-16,
      maxIterations: 2,
    }));

    expect(result.stopReason).toBe('max-iterations');
    expect(result.iterations).toBe(2);
    expect(result.approximations).toHaveLength(2);
  });

  it('supports degree-mode expressions through the evaluator wrapper', () => {
    const result = expectSuccessful(runSecant({
      expression: 'cos(x)',
      x0: 0,
      x1: 180,
      tolerance: 1e-10,
      angleMode: 'deg',
    }));

    expect(result.root).toBeCloseTo(90, 12);
    expect(result.stopReason).toBe('exact-root');
  });

  it('returns normalized invalid-expression failures', () => {
    const result = runSecant({
      expression: 'x + * 1',
      x0: 0,
      x1: 1,
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected invalid expression to fail.');
    }
    expect(result.reason).toBe('invalid-expression');
  });
});

describe('isolated secant comparison with legacy RootEngine', () => {
  it('matches legacy on normal x^3 - x - 1 convergence', () => {
    const legacyResult = R.runSecant({
      expression: 'x^3 - x - 1',
      x0: '1',
      x1: '2',
      machine,
      stopping: { kind: 'iterations', value: '40' },
      angleMode: 'rad',
    });

    const isolatedResult = expectSuccessful(runSecant({
      expression: 'x^3 - x - 1',
      x0: 1,
      x1: 2,
      maxIterations: 40,
      angleMode: 'rad',
    }));

    expect(legacyResult.summary.stopReason).toMatch(/tolerance-reached|iteration-limit|machine-zero/);
    expect(isolatedResult.stopReason).toMatch(/exact-root|function-tolerance-satisfied|tolerance-satisfied/);
    expect(isolatedResult.root).toBeCloseTo(legacyApproximationNumber(legacyResult), 10);
  });

  it('documents denominator collapse as zero-denominator versus legacy stagnation', () => {
    const legacyResult = R.runSecant({
      expression: 'x^2',
      x0: '-1',
      x1: '1',
      machine,
      stopping: { kind: 'iterations', value: '10' },
      angleMode: 'rad',
    });

    const isolatedResult = runSecant({
      expression: 'x^2',
      x0: -1,
      x1: 1,
      maxIterations: 10,
      angleMode: 'rad',
    });

    expect(legacyResult.summary.stopReason).toBe('stagnation');
    expect(isolatedResult.ok).toBe(false);
    if (isolatedResult.ok) {
      throw new Error('Expected isolated denominator collapse to fail.');
    }
    expect(isolatedResult.reason).toBe('zero-denominator');
  });

  it('documents non-finite jump handling at the high level', () => {
    const legacyResult = R.runSecant({
      expression: '1 / (x - 1)',
      x0: '0',
      x1: '2',
      machine,
      stopping: { kind: 'iterations', value: '10' },
      angleMode: 'rad',
    });

    const isolatedResult = runSecant({
      expression: '1 / (x - 1)',
      x0: 0,
      x1: 2,
      maxIterations: 10,
      angleMode: 'rad',
    });

    expect(legacyResult.summary.stopReason).toMatch(/singularity-encountered|non-finite-evaluation/);
    expect(isolatedResult.ok).toBe(false);
    if (isolatedResult.ok) {
      throw new Error('Expected isolated non-finite jump to fail.');
    }
    expect(isolatedResult.reason).toBe('non-finite-evaluation');
    const lastApproximation = isolatedResult.approximations?.[
      isolatedResult.approximations.length - 1
    ];
    expect(lastApproximation?.xNext).toBe(1);
  });
});
