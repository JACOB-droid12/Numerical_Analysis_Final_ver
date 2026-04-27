import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';

import { describe, expect, it } from 'vitest';

import { runNewtonRaphson, type NewtonRaphsonResult } from './newtonRaphson';

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

function expectSuccessful(result: NewtonRaphsonResult) {
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error(result.message);
  }

  return result;
}

function legacyApproximationNumber(result: { summary?: { approximation?: unknown } }): number {
  return C.requireRealNumber(result.summary?.approximation, 'legacy approximation');
}

describe('math.js-backed isolated Newton-Raphson', () => {
  it('solves x^3 - x - 1 from x0 = 1.5 with a provided derivative', () => {
    const result = expectSuccessful(runNewtonRaphson({
      expression: 'x^3 - x - 1',
      derivativeExpression: '3*x^2 - 1',
      x0: 1.5,
      tolerance: 1e-10,
    }));

    expect(result.root).toBeCloseTo(plasticRoot, 10);
    expect(result.stopReason).toMatch(/exact-root|function-tolerance-satisfied|tolerance-satisfied/);
    expect(result.approximations.length).toBeGreaterThan(0);
  });

  it('solves x^2 - 4 from x0 = 3 with a provided derivative', () => {
    const result = expectSuccessful(runNewtonRaphson({
      expression: 'x^2 - 4',
      derivativeExpression: '2*x',
      x0: 3,
      tolerance: 1e-10,
    }));

    expect(result.root).toBeCloseTo(2, 10);
    expect(result.stopReason).toMatch(/exact-root|function-tolerance-satisfied|tolerance-satisfied/);
  });

  it('returns an exact starting root without iterating', () => {
    const result = expectSuccessful(runNewtonRaphson({
      expression: 'x - 1',
      derivativeExpression: '1',
      x0: 1,
    }));

    expect(result.root).toBe(1);
    expect(result.iterations).toBe(0);
    expect(result.approximations).toHaveLength(0);
    expect(result.stopReason).toBe('exact-root');
  });

  it('returns an exact starting root without sampling a numeric derivative', () => {
    const result = expectSuccessful(runNewtonRaphson({
      expression: 'x - 1',
      derivativeMode: 'numeric',
      x0: 1,
    }));

    expect(result.root).toBe(1);
    expect(result.iterations).toBe(0);
    expect(result.approximations).toHaveLength(0);
    expect(result.stopReason).toBe('exact-root');
  });

  it('fails clearly when provided derivative mode has no derivative expression', () => {
    const result = runNewtonRaphson({
      expression: 'x^2 - 4',
      derivativeMode: 'provided',
      x0: 3,
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected missing derivative to fail.');
    }
    expect(result.reason).toBe('missing-derivative');
  });

  it('solves x^3 - x - 1 with a numeric derivative', () => {
    const result = expectSuccessful(runNewtonRaphson({
      expression: 'x^3 - x - 1',
      derivativeMode: 'numeric',
      x0: 1.5,
      tolerance: 1e-10,
    }));

    expect(result.root).toBeCloseTo(plasticRoot, 10);
    expect(result.approximations[0].derivativeCurrent).toBeCloseTo(5.75, 6);
  });

  it('solves x^2 - 4 with a numeric derivative', () => {
    const result = expectSuccessful(runNewtonRaphson({
      expression: 'x^2 - 4',
      derivativeMode: 'numeric',
      x0: 3,
      tolerance: 1e-10,
    }));

    expect(result.root).toBeCloseTo(2, 10);
  });

  it('solves cos(x) - x with a numeric derivative', () => {
    const result = expectSuccessful(runNewtonRaphson({
      expression: 'cos(x) - x',
      derivativeMode: 'numeric',
      x0: 0.7,
      tolerance: 1e-10,
    }));

    expect(result.root).toBeCloseTo(0.7390851332151607, 10);
  });

  it('rejects zero derivatives safely', () => {
    const result = runNewtonRaphson({
      expression: 'x^3 - 1',
      derivativeExpression: '3*x^2',
      x0: 0,
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected near-zero derivative to fail.');
    }
    expect(result.reason).toBe('zero-derivative');
    expect(result.approximations?.length).toBeGreaterThan(0);
  });

  it('rejects zero numeric derivatives safely', () => {
    const result = runNewtonRaphson({
      expression: 'x^2 + 1',
      derivativeMode: 'numeric',
      x0: 0,
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected near-zero numeric derivative to fail.');
    }
    expect(result.reason).toBe('zero-derivative');
  });

  it('rejects non-finite function evaluations safely', () => {
    const result = runNewtonRaphson({
      expression: '1 / (x - 1)',
      derivativeExpression: '-1 / ((x - 1)^2)',
      x0: 1,
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected non-finite function evaluation to fail.');
    }
    expect(result.reason).toBe('non-finite-evaluation');
  });

  it('rejects non-finite derivative evaluations safely', () => {
    const result = runNewtonRaphson({
      expression: 'sqrt(x) + 1',
      derivativeExpression: '1 / (2 * sqrt(x))',
      x0: 0,
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected non-finite derivative evaluation to fail.');
    }
    expect(result.reason).toBe('non-finite-evaluation');
  });

  it('rejects non-finite numeric derivative samples safely', () => {
    const h = Math.cbrt(Number.EPSILON);
    const result = runNewtonRaphson({
      expression: 'ln(x) + 10',
      derivativeMode: 'numeric',
      x0: h,
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected non-finite numeric derivative sample to fail.');
    }
    expect(result.reason).toBe('non-finite-evaluation');
  });

  it('rejects complex evaluations in legacy-compatible real mode', () => {
    const result = runNewtonRaphson({
      expression: 'sqrt(x)',
      derivativeExpression: '1 / (2 * sqrt(x))',
      x0: -1,
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected complex evaluation to fail.');
    }
    expect(result.reason).toBe('complex-evaluation');
  });

  it('rejects complex numeric derivative samples in legacy-compatible real mode', () => {
    const result = runNewtonRaphson({
      expression: 'sqrt(x) + 1',
      derivativeMode: 'numeric',
      x0: 0,
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected complex numeric derivative sample to fail.');
    }
    expect(result.reason).toBe('complex-evaluation');
  });

  it('reports max-iteration stop when the iteration cap is reached', () => {
    const result = expectSuccessful(runNewtonRaphson({
      expression: 'x^3 - x - 1',
      derivativeExpression: '3*x^2 - 1',
      x0: 1.5,
      tolerance: 1e-16,
      functionTolerance: 1e-16,
      maxIterations: 2,
    }));

    expect(result.stopReason).toBe('max-iterations');
    expect(result.iterations).toBe(2);
    expect(result.approximations).toHaveLength(2);
  });

  it('reports max-iteration stop with numeric derivatives', () => {
    const result = expectSuccessful(runNewtonRaphson({
      expression: 'x^3 - x - 1',
      derivativeMode: 'numeric',
      x0: 1.5,
      tolerance: 1e-16,
      functionTolerance: 1e-16,
      maxIterations: 2,
    }));

    expect(result.stopReason).toBe('max-iterations');
    expect(result.iterations).toBe(2);
    expect(result.approximations).toHaveLength(2);
  });

  it('makes the professor stopping rule explicit as successive approximations below epsilon', () => {
    const result = expectSuccessful(runNewtonRaphson({
      expression: 'x^2 - 2',
      derivativeExpression: '2*x',
      x0: 1,
      tolerance: 0.0001,
      functionTolerance: 1e-30,
      maxIterations: 20,
    }));

    expect(result.stopReason).toBe('tolerance-satisfied');
    const lastRow = result.approximations[result.approximations.length - 1];
    expect(lastRow.error).toBeLessThan(0.0001);
    expect(result.root).toBeCloseTo(Math.SQRT2, 8);
  });

  it('uses interval midpoint x0 when x0 is missing for x^3 - 2*x^2 - 5', () => {
    const result = expectSuccessful(runNewtonRaphson({
      expression: 'x^3 - 2*x^2 - 5',
      derivativeMode: 'numeric',
      interval: { lower: 1, upper: 4 },
      initialStrategy: 'midpoint',
      tolerance: 0.0001,
      functionTolerance: 1e-30,
      maxIterations: 30,
    }));

    expect(result.initial?.strategy).toBe('midpoint');
    expect(result.initial?.x0).toBe(2.5);
    expect(result.root).toBeCloseTo(2.69064745, 8);
    const lastRow = result.approximations[result.approximations.length - 1];
    expect(lastRow?.error).toBeLessThan(0.0001);
  });

  it('solves x^3 + 3*x^2 - 1 from interval midpoint', () => {
    const result = expectSuccessful(runNewtonRaphson({
      expression: 'x^3 + 3*x^2 - 1',
      derivativeMode: 'numeric',
      interval: { lower: -3, upper: -2 },
      initialStrategy: 'midpoint',
      tolerance: 0.0001,
      functionTolerance: 1e-30,
      maxIterations: 30,
    }));

    expect(result.root).toBeCloseTo(-2.87938524, 8);
    const lastRow = result.approximations[result.approximations.length - 1];
    expect(lastRow?.error).toBeLessThan(0.0001);
  });

  it('solves x - cos(x) from interval midpoint', () => {
    const result = expectSuccessful(runNewtonRaphson({
      expression: 'x - cos(x)',
      derivativeMode: 'numeric',
      interval: { lower: 0, upper: Math.PI / 2 },
      initialStrategy: 'midpoint',
      tolerance: 0.0001,
      functionTolerance: 1e-30,
      maxIterations: 30,
    }));

    expect(result.root).toBeCloseTo(0.73908513, 8);
    const lastRow = result.approximations[result.approximations.length - 1];
    expect(lastRow?.error).toBeLessThan(0.0001);
  });

  it('solves x - 0.8 - 0.2*sin(x) from interval midpoint', () => {
    const result = expectSuccessful(runNewtonRaphson({
      expression: 'x - 0.8 - 0.2*sin(x)',
      derivativeMode: 'numeric',
      interval: { lower: 0, upper: Math.PI / 2 },
      initialStrategy: 'midpoint',
      tolerance: 0.0001,
      functionTolerance: 1e-30,
      maxIterations: 30,
    }));

    expect(result.root).toBeCloseTo(0.96433389, 8);
    const lastRow = result.approximations[result.approximations.length - 1];
    expect(lastRow?.error).toBeLessThan(0.0001);
  });

  it('supports degree-mode trig functions with numeric derivatives', () => {
    const result = expectSuccessful(runNewtonRaphson({
      expression: 'cos(x)',
      derivativeMode: 'numeric',
      x0: 80,
      tolerance: 1e-10,
      angleMode: 'deg',
    }));

    expect(result.root).toBeCloseTo(90, 8);
  });

  it('supports degree mode for non-trig expressions', () => {
    // Trig Newton derivatives in degree mode need pi/180 scaling. This baseline
    // intentionally avoids f(x)=cos(x), f'(x)=-sin(x) until derivative semantics
    // are specified for degree-mode trig.
    const result = expectSuccessful(runNewtonRaphson({
      expression: 'x^2 - 4',
      derivativeExpression: '2*x',
      x0: 3,
      angleMode: 'deg',
    }));

    expect(result.root).toBeCloseTo(2, 10);
  });

  it('returns invalid derivative expression failures distinctly', () => {
    const result = runNewtonRaphson({
      expression: 'x^2 - 4',
      derivativeExpression: '2 * * x',
      x0: 3,
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected invalid derivative expression to fail.');
    }
    expect(result.reason).toBe('invalid-derivative-expression');
  });
});

describe('isolated Newton-Raphson comparison with legacy RootEngine', () => {
  it('matches legacy on normal x^3 - x - 1 convergence with a provided derivative', () => {
    const legacyResult = R.runNewtonRaphson({
      expression: 'x^3 - x - 1',
      dfExpression: '3*x^2 - 1',
      x0: '1.5',
      machine,
      stopping: { kind: 'iterations', value: '40' },
      angleMode: 'rad',
    });

    const isolatedResult = expectSuccessful(runNewtonRaphson({
      expression: 'x^3 - x - 1',
      derivativeExpression: '3*x^2 - 1',
      x0: 1.5,
      maxIterations: 40,
      angleMode: 'rad',
    }));

    expect(legacyResult.summary.stopReason).toMatch(/tolerance-reached|iteration-limit|machine-zero/);
    expect(isolatedResult.stopReason).toMatch(/exact-root|function-tolerance-satisfied|tolerance-satisfied/);
    expect(isolatedResult.root).toBeCloseTo(legacyApproximationNumber(legacyResult), 10);
  });

  it('matches legacy exact starting root behavior at the high level', () => {
    const legacyResult = R.runNewtonRaphson({
      expression: 'x - 1',
      dfExpression: '1',
      x0: '1',
      machine,
      stopping: { kind: 'iterations', value: '10' },
      angleMode: 'rad',
    });

    const isolatedResult = expectSuccessful(runNewtonRaphson({
      expression: 'x - 1',
      derivativeExpression: '1',
      x0: 1,
      maxIterations: 10,
      angleMode: 'rad',
    }));

    expect(legacyResult.summary.stopReason).toBe('exact-zero');
    expect(isolatedResult.stopReason).toBe('exact-root');
    expect(isolatedResult.root).toBeCloseTo(legacyApproximationNumber(legacyResult), 12);
  });

  it('documents zero derivative behavior', () => {
    const legacyResult = R.runNewtonRaphson({
      expression: 'x^3 - 1',
      dfExpression: '3*x^2',
      x0: '0',
      machine,
      stopping: { kind: 'iterations', value: '10' },
      angleMode: 'rad',
    });

    const isolatedResult = runNewtonRaphson({
      expression: 'x^3 - 1',
      derivativeExpression: '3*x^2',
      x0: 0,
      maxIterations: 10,
      angleMode: 'rad',
    });

    expect(legacyResult.summary.stopReason).toBe('derivative-zero');
    expect(isolatedResult.ok).toBe(false);
    if (isolatedResult.ok) {
      throw new Error('Expected isolated zero derivative to fail.');
    }
    expect(isolatedResult.reason).toBe('zero-derivative');
  });

  it('matches legacy non-finite rejection at the high level', () => {
    const legacyResult = R.runNewtonRaphson({
      expression: '1 / (x - 1)',
      dfExpression: '-1 / ((x - 1)^2)',
      x0: '1',
      machine,
      stopping: { kind: 'iterations', value: '10' },
      angleMode: 'rad',
    });

    const isolatedResult = runNewtonRaphson({
      expression: '1 / (x - 1)',
      derivativeExpression: '-1 / ((x - 1)^2)',
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
});
