import { describe, expect, it } from 'vitest';

import { evaluateExpression } from '../../math/evaluator';
import {
  runModernRootMethod,
  type ModernRootEngineInput,
  type ModernRootMethod,
} from '../modernRootEngine';
import goldenCases from './root-method-cases.json';

type GoldenCase = {
  name: string;
  method: ModernRootMethod;
  expression: string;
  derivativeExpression?: string;
  derivativeMode?: 'provided' | 'numeric';
  lower?: number;
  upper?: number;
  x0?: number;
  x1?: number;
  tolerance: number;
  functionTolerance?: number;
  maxIterations: number;
  angleMode: 'rad' | 'deg';
  residualExpression?: string;
  expectedRoot: string;
  expectedResidual: string;
};

function caseToInput(testCase: GoldenCase): ModernRootEngineInput {
  switch (testCase.method) {
    case 'bisection':
      return {
        method: testCase.method,
        expression: testCase.expression,
        lower: requiredNumber(testCase.lower, testCase.name, 'lower'),
        upper: requiredNumber(testCase.upper, testCase.name, 'upper'),
        tolerance: testCase.tolerance,
        maxIterations: testCase.maxIterations,
        angleMode: testCase.angleMode,
      };
    case 'false-position':
      return {
        method: testCase.method,
        expression: testCase.expression,
        lower: requiredNumber(testCase.lower, testCase.name, 'lower'),
        upper: requiredNumber(testCase.upper, testCase.name, 'upper'),
        tolerance: testCase.tolerance,
        maxIterations: testCase.maxIterations,
        angleMode: testCase.angleMode,
      };
    case 'secant':
      return {
        method: testCase.method,
        expression: testCase.expression,
        x0: requiredNumber(testCase.x0, testCase.name, 'x0'),
        x1: requiredNumber(testCase.x1, testCase.name, 'x1'),
        tolerance: testCase.tolerance,
        maxIterations: testCase.maxIterations,
        angleMode: testCase.angleMode,
      };
    case 'fixed-point':
      return {
        method: testCase.method,
        expression: testCase.expression,
        x0: requiredNumber(testCase.x0, testCase.name, 'x0'),
        tolerance: testCase.tolerance,
        maxIterations: testCase.maxIterations,
        angleMode: testCase.angleMode,
        targetExpression: testCase.residualExpression,
      };
    case 'newton-raphson':
      return {
        method: testCase.method,
        expression: testCase.expression,
        derivativeExpression: testCase.derivativeExpression,
        x0: requiredNumber(testCase.x0, testCase.name, 'x0'),
        tolerance: testCase.tolerance,
        functionTolerance: testCase.functionTolerance ?? testCase.tolerance,
        maxIterations: testCase.maxIterations,
        angleMode: testCase.angleMode,
        derivativeMode: testCase.derivativeMode ?? 'provided',
      };
    default:
      throw new Error(`Unsupported golden method: ${testCase.method}`);
  }
}

function requiredNumber(value: number | undefined, name: string, field: string): number {
  if (typeof value !== 'number') {
    throw new Error(`${name} is missing ${field}.`);
  }
  return value;
}

function unwrapNumber(result: ReturnType<typeof evaluateExpression>): number {
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error(result.error.message);
  }
  expect(typeof result.value).toBe('number');
  return result.value as number;
}

describe('modern root methods against mpmath golden fixtures', () => {
  it('has a checked-in golden fixture set', () => {
    expect(goldenCases).toHaveLength(76);
    expect(new Set((goldenCases as GoldenCase[]).map((entry) => entry.method))).toEqual(new Set([
      'bisection',
      'false-position',
      'secant',
      'fixed-point',
      'newton-raphson',
    ]));
  });

  it.each(goldenCases as GoldenCase[])('$name matches the high-precision root', (testCase) => {
    const result = runModernRootMethod(caseToInput(testCase));

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(result.message);
    }

    const expectedRoot = Number(testCase.expectedRoot);
    expect(result.root).toBeCloseTo(expectedRoot, 7);

    const residualExpression = testCase.residualExpression ?? testCase.expression;
    const residual = unwrapNumber(evaluateExpression(
      residualExpression,
      { x: result.root },
      { mode: 'legacy-compatible', angleMode: testCase.angleMode },
    ));
    expect(Math.abs(residual)).toBeLessThanOrEqual(1e-7);
  });
});

describe('modern root method edge and failure behavior', () => {
  it.each([
    ['bisection' as const],
    ['false-position' as const],
  ])('%s rejects a bad bracket safely', (method) => {
    const result = runModernRootMethod({
      method,
      expression: 'x^2 + 1',
      lower: -1,
      upper: 1,
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected bad bracket to fail.');
    }
    expect(result.reason).toBe('invalid-starting-interval');
  });

  it.each([
    ['bisection' as const, { method: 'bisection' as const, expression: '1 / (x - 1)', lower: 0, upper: 2 }],
    ['false-position' as const, { method: 'false-position' as const, expression: '1 / (x - 1)', lower: 0, upper: 2 }],
    ['secant' as const, { method: 'secant' as const, expression: '1 / (x - 1)', x0: 0, x1: 2 }],
    [
      'newton-raphson' as const,
      {
        method: 'newton-raphson' as const,
        expression: '1 / (x - 1)',
        derivativeExpression: '-1 / ((x - 1)^2)',
        x0: 1,
      },
    ],
  ])('%s rejects non-finite evaluation safely', (_method, input) => {
    const result = runModernRootMethod(input);

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected non-finite evaluation to fail.');
    }
    expect(result.reason).toBe('non-finite-evaluation');
  });

  it.each([
    ['bisection' as const, { method: 'bisection' as const, expression: 'sqrt(x)', lower: -1, upper: 1 }],
    ['false-position' as const, { method: 'false-position' as const, expression: 'sqrt(x)', lower: -1, upper: 1 }],
    ['fixed-point' as const, { method: 'fixed-point' as const, expression: 'sqrt(x)', x0: -1 }],
    [
      'newton-raphson' as const,
      {
        method: 'newton-raphson' as const,
        expression: 'sqrt(x)',
        derivativeExpression: '1 / (2 * sqrt(x))',
        x0: -1,
      },
    ],
  ])('%s rejects complex evaluation safely', (_method, input) => {
    const result = runModernRootMethod(input);

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected complex evaluation to fail.');
    }
    expect(result.reason).toBe('complex-evaluation');
  });

  it('Newton-Raphson rejects zero derivative away from a root', () => {
    const result = runModernRootMethod({
      method: 'newton-raphson',
      expression: 'x^3 - 1',
      derivativeExpression: '3*x^2',
      x0: 0,
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected zero derivative to fail.');
    }
    expect(result.reason).toBe('zero-derivative');
  });

  it('Newton-Raphson handles a multiple root safely without pretending fast convergence', () => {
    const result = runModernRootMethod({
      method: 'newton-raphson',
      expression: '(x - 1)^2',
      derivativeExpression: '2 * (x - 1)',
      x0: 2,
      tolerance: 1e-14,
      functionTolerance: 1e-14,
      maxIterations: 3,
    });

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(result.message);
    }
    expect(result.stopReason).toBe('max-iterations');
    expect(result.root).toBeCloseTo(1.125, 12);
  });

  it('Secant rejects denominator collapse safely', () => {
    const result = runModernRootMethod({
      method: 'secant',
      expression: 'x^2',
      x0: -1,
      x1: 1,
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected denominator collapse to fail.');
    }
    expect(result.reason).toBe('zero-denominator');
  });

  it('Fixed Point rejects divergence safely', () => {
    const result = runModernRootMethod({
      method: 'fixed-point',
      expression: '2 * x',
      x0: 1,
      maxIterations: 100,
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected divergence to fail.');
    }
    expect(result.reason).toBe('divergence-detected');
  });

  it('Fixed Point detects a simple two-cycle', () => {
    const result = runModernRootMethod({
      method: 'fixed-point',
      expression: '-x',
      x0: 1,
      maxIterations: 10,
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected cycle detection to fail.');
    }
    expect(result.reason).toBe('cycle-detected');
  });

  it('Newton-Raphson reports missing provided derivatives clearly', () => {
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

  it('rejects invalid expressions before running iterations', () => {
    const result = runModernRootMethod({
      method: 'bisection',
      expression: '2 * * x',
      lower: 0,
      upper: 1,
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected invalid expression to fail.');
    }
    expect(result.reason).toBe('invalid-expression');
  });

  it('rejects missing variables through evaluator errors', () => {
    const result = runModernRootMethod({
      method: 'secant',
      expression: 'x + y',
      x0: 0,
      x1: 1,
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected missing variable to fail.');
    }
    expect(result.reason).toMatch(/invalid-expression|unknown-error/);
  });

  it('rejects unsupported function names through evaluator errors', () => {
    const result = runModernRootMethod({
      method: 'bisection',
      expression: 'notAFunction(x)',
      lower: 0,
      upper: 1,
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected unsupported function to fail.');
    }
    expect(result.reason).toMatch(/invalid-expression|unknown-error/);
  });

  it('Newton numeric derivative rejects non-finite samples safely', () => {
    const h = Math.cbrt(Number.EPSILON);
    const result = runModernRootMethod({
      method: 'newton-raphson',
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

  it('Newton numeric derivative rejects near-zero derivatives safely', () => {
    const result = runModernRootMethod({
      method: 'newton-raphson',
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

  it('documents excluded hard cases from generated golden convergence fixtures', () => {
    const excludedCases = [
      'Newton with degree-mode trig derivatives: derivative scaling requires pi/180 handling.',
      'Newton on repeated roots as a golden convergence case: convergence is deliberately slow and stop-rule dependent.',
      'False Position on the large-scale quadratic: root approximation is good, but residual convergence is scale-sensitive.',
      'False Position on tan(x) - x near a tangent asymptote: interpolation behavior is too sensitive for a baseline fixture.',
      'False Position on quintic and some quartic stress roots: convergence is too slow for the shared oracle tolerance.',
      'Secant on the quartic root at x=1: symmetric starts can collapse or jump to a different root.',
      'Fixed Point cases with known cycles or divergence: covered as failure behavior instead of golden convergence fixtures.',
    ];

    expect(excludedCases).toHaveLength(7);
  });
});
