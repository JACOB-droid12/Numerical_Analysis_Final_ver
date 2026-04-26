import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';

import { describe, expect, it } from 'vitest';

import {
  runModernRootMethod,
  type ModernRootEngineInput,
  type ModernRootEngineResult,
} from './modernRootEngine';

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

function expectSuccessful(result: ModernRootEngineResult) {
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error(result.message);
  }

  return result;
}

function legacyApproximationNumber(result: { summary?: { approximation?: unknown } }): number {
  return C.requireRealNumber(result.summary?.approximation, 'legacy approximation');
}

describe('modern root engine facade', () => {
  it('runs bisection on x^3 - x - 1', () => {
    const result = expectSuccessful(runModernRootMethod({
      method: 'bisection',
      expression: 'x^3 - x - 1',
      lower: 1,
      upper: 2,
      tolerance: 1e-10,
    }));

    expect(result.method).toBe('bisection');
    expect(result.root).toBeCloseTo(plasticRoot, 8);
    expect(result.details.ok).toBe(true);
  });

  it('runs false position on x^3 - x - 1', () => {
    const result = expectSuccessful(runModernRootMethod({
      method: 'false-position',
      expression: 'x^3 - x - 1',
      lower: 1,
      upper: 2,
      tolerance: 1e-10,
    }));

    expect(result.method).toBe('false-position');
    expect(result.root).toBeCloseTo(plasticRoot, 7);
  });

  it('runs secant on x^3 - x - 1', () => {
    const result = expectSuccessful(runModernRootMethod({
      method: 'secant',
      expression: 'x^3 - x - 1',
      x0: 1,
      x1: 2,
      tolerance: 1e-10,
    }));

    expect(result.method).toBe('secant');
    expect(result.root).toBeCloseTo(plasticRoot, 10);
  });

  it('runs fixed point on cos(x)', () => {
    const result = expectSuccessful(runModernRootMethod({
      method: 'fixed-point',
      expression: 'cos(x)',
      x0: 1,
      tolerance: 1e-10,
      maxIterations: 100,
    }));

    expect(result.method).toBe('fixed-point');
    expect(result.root).toBeCloseTo(cosineFixedPoint, 9);
  });

  it('runs Newton-Raphson on x^3 - x - 1 with a provided derivative', () => {
    const result = expectSuccessful(runModernRootMethod({
      method: 'newton-raphson',
      expression: 'x^3 - x - 1',
      derivativeExpression: '3*x^2 - 1',
      x0: 1.5,
      tolerance: 1e-10,
    }));

    expect(result.method).toBe('newton-raphson');
    expect(result.root).toBeCloseTo(plasticRoot, 10);
  });

  it('runs Newton-Raphson on x^3 - x - 1 with a numeric derivative', () => {
    const result = expectSuccessful(runModernRootMethod({
      method: 'newton-raphson',
      expression: 'x^3 - x - 1',
      derivativeMode: 'numeric',
      x0: 1.5,
      tolerance: 1e-10,
    }));

    expect(result.method).toBe('newton-raphson');
    expect(result.root).toBeCloseTo(plasticRoot, 10);
  });

  it('returns an invalid-method failure for unsafe unknown method calls', () => {
    const result = runModernRootMethod({
      method: 'unknown-method',
      expression: 'x',
      x0: 1,
    } as unknown as ModernRootEngineInput);

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected unknown method to fail.');
    }
    expect(result.method).toBe('unknown');
    expect(result.reason).toBe('invalid-method');
  });

  it('preserves invalid bracket failures', () => {
    const result = runModernRootMethod({
      method: 'bisection',
      expression: 'x^2 + 1',
      lower: -1,
      upper: 1,
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected invalid bracket to fail.');
    }
    expect(result.method).toBe('bisection');
    expect(result.reason).toBe('invalid-starting-interval');
    expect(result.details?.ok).toBe(false);
  });

  it('preserves missing Newton derivative failures', () => {
    const result = runModernRootMethod({
      method: 'newton-raphson',
      expression: 'x^2 - 4',
      x0: 3,
      derivativeMode: 'provided',
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected missing derivative to fail.');
    }
    expect(result.reason).toBe('missing-derivative');
  });

  it('preserves complex and non-finite evaluation failures', () => {
    const complexResult = runModernRootMethod({
      method: 'fixed-point',
      expression: 'sqrt(x)',
      x0: -1,
    });
    expect(complexResult.ok).toBe(false);
    if (complexResult.ok) {
      throw new Error('Expected complex evaluation to fail.');
    }
    expect(complexResult.reason).toBe('complex-evaluation');

    const nonFiniteResult = runModernRootMethod({
      method: 'secant',
      expression: '1 / (x - 1)',
      x0: 0,
      x1: 2,
    });
    expect(nonFiniteResult.ok).toBe(false);
    if (nonFiniteResult.ok) {
      throw new Error('Expected non-finite evaluation to fail.');
    }
    expect(nonFiniteResult.reason).toBe('non-finite-evaluation');
  });
});

describe('modern root engine facade comparison with legacy RootEngine', () => {
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

    const modernResult = expectSuccessful(runModernRootMethod({
      method: 'bisection',
      expression: 'x^3 - x - 1',
      lower: 1,
      upper: 2,
      tolerance: 1e-10,
    }));

    expect(legacyResult.summary.stopReason).toBe('tolerance-reached');
    expect(modernResult.root).toBeCloseTo(legacyApproximationNumber(legacyResult), 8);
  });

  it('compares false-position usable approximation', () => {
    const legacyResult = R.runFalsePosition({
      expression: 'x^3 - x - 1',
      interval: { a: '1', b: '2' },
      machine,
      stopping: { kind: 'iterations', value: '40' },
      decisionBasis: 'machine',
      signDisplay: 'both',
      angleMode: 'rad',
    });

    const modernResult = expectSuccessful(runModernRootMethod({
      method: 'false-position',
      expression: 'x^3 - x - 1',
      lower: 1,
      upper: 2,
      maxIterations: 40,
    }));

    expect(legacyResult.summary.stopReason).toBe('retained-endpoint-stagnation');
    expect(modernResult.root).toBeCloseTo(legacyApproximationNumber(legacyResult), 6);
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

    const modernResult = expectSuccessful(runModernRootMethod({
      method: 'secant',
      expression: 'x^3 - x - 1',
      x0: 1,
      x1: 2,
      maxIterations: 40,
    }));

    expect(modernResult.root).toBeCloseTo(legacyApproximationNumber(legacyResult), 10);
  });

  it('compares fixed-point normal convergence', () => {
    const legacyResult = R.runFixedPoint({
      gExpression: 'cos(x)',
      x0: '1',
      machine,
      stopping: { kind: 'epsilon', value: '1e-10' },
      angleMode: 'rad',
    });

    const modernResult = expectSuccessful(runModernRootMethod({
      method: 'fixed-point',
      expression: 'cos(x)',
      x0: 1,
      tolerance: 1e-10,
      maxIterations: 100,
    }));

    expect(modernResult.root).toBeCloseTo(legacyApproximationNumber(legacyResult), 9);
  });

  it('compares Newton normal convergence with a provided derivative', () => {
    const legacyResult = R.runNewtonRaphson({
      expression: 'x^3 - x - 1',
      dfExpression: '3*x^2 - 1',
      x0: '1.5',
      machine,
      stopping: { kind: 'iterations', value: '40' },
      angleMode: 'rad',
    });

    const modernResult = expectSuccessful(runModernRootMethod({
      method: 'newton-raphson',
      expression: 'x^3 - x - 1',
      derivativeExpression: '3*x^2 - 1',
      x0: 1.5,
      maxIterations: 40,
    }));

    expect(modernResult.root).toBeCloseTo(legacyApproximationNumber(legacyResult), 10);
  });
});
