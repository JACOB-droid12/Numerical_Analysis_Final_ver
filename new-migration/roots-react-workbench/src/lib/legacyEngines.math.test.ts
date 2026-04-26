import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';

import { describe, expect, it } from 'vitest';

type LegacyWindow = {
  MathEngine: Record<string, any>;
  CalcEngine: Record<string, any>;
  ExpressionEngine: Record<string, any>;
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

const engines = loadEditableEngines();
const { MathEngine: M, CalcEngine: C, ExpressionEngine: E, RootEngine: R } = engines;

function evalNumber(expression: string, context: Record<string, unknown> = {}): number {
  const ast = E.parseExpression(expression, { allowVariable: true });
  return C.requireRealNumber(E.evaluateValue(ast, context), expression);
}

function parseScalar(value: string) {
  return M.parseRational(value);
}

function approximationNumber(result: { summary?: { approximation?: unknown } }): number {
  return C.requireRealNumber(result.summary?.approximation, 'approximation');
}

const machine = { k: 16, mode: 'round' };
const iterationStop = { kind: 'iterations', value: '40' };
const epsilonStop = { kind: 'epsilon', value: '1e-10' };
const plasticRoot = 1.324717957244746;

describe('editable expression engine baseline', () => {
  it('preserves arithmetic precedence and parentheses', () => {
    expect(evalNumber('2 + 3 * 4')).toBe(14);
    expect(evalNumber('(2 + 3) * 4')).toBe(20);
  });

  it('evaluates powers, constants, roots, and logarithms', () => {
    expect(evalNumber('2^3')).toBe(8);
    expect(evalNumber('pi')).toBeCloseTo(Math.PI, 14);
    expect(evalNumber('e')).toBeCloseTo(Math.E, 14);
    expect(evalNumber('sqrt(9)')).toBe(3);
    expect(evalNumber('ln(e)')).toBeCloseTo(1, 14);
    expect(evalNumber('log(e)')).toBeCloseTo(1, 14);
  });

  it('evaluates trigonometric functions in radians', () => {
    expect(evalNumber('sin(pi / 2)', { angleMode: 'rad' })).toBeCloseTo(1, 14);
    expect(evalNumber('cos(pi)', { angleMode: 'rad' })).toBeCloseTo(-1, 14);
    expect(evalNumber('tan(pi / 4)', { angleMode: 'rad' })).toBeCloseTo(1, 14);
  });

  it('evaluates trigonometric functions in degrees', () => {
    expect(evalNumber('sin(90)', { angleMode: 'deg' })).toBeCloseTo(1, 14);
    expect(evalNumber('cos(180)', { angleMode: 'deg' })).toBeCloseTo(-1, 14);
    expect(evalNumber('tan(45)', { angleMode: 'deg' })).toBeCloseTo(1, 14);
  });

  it('evaluates variable x from the provided context', () => {
    expect(evalNumber('x^2 + 2x + 1', { x: parseScalar('3') })).toBe(16);
  });

  it('rejects invalid syntax and division by zero', () => {
    expect(() => E.parseExpression('2 + * 3', { allowVariable: true })).toThrow();
    expect(() => evalNumber('1 / 0')).toThrow();
  });

  it('rejects real logarithm domain errors and preserves complex square roots', () => {
    expect(() => evalNumber('ln(-1)')).toThrow(/greater than 0/);

    const ast = E.parseExpression('sqrt(-1)', { allowVariable: true });
    const value = E.evaluateValue(ast, { angleMode: 'rad' });

    expect(C.isCalcValue(value)).toBe(true);
    expect(value.re).toBeCloseTo(0, 14);
    expect(value.im).toBeCloseTo(1, 14);
    expect(() => C.requireRealNumber(value, 'sqrt(-1)')).toThrow(/must be real/);
  });
});

describe('editable root engine baseline', () => {
  it('solves x^3 - x - 1 with bisection on [1, 2]', () => {
    const result = R.runBisection({
      expression: 'x^3 - x - 1',
      interval: { a: '1', b: '2' },
      machine,
      stopping: { ...epsilonStop, toleranceType: 'absolute' },
      decisionBasis: 'machine',
      signDisplay: 'both',
      angleMode: 'rad',
    });

    expect(result.summary.stopReason).toBe('tolerance-reached');
    expect(approximationNumber(result)).toBeCloseTo(plasticRoot, 8);
  });

  it('solves x^3 - x - 1 with Newton-Raphson from x0 = 1.5', () => {
    const result = R.runNewtonRaphson({
      expression: 'x^3 - x - 1',
      dfExpression: 'auto',
      x0: '1.5',
      machine,
      stopping: iterationStop,
      angleMode: 'rad',
    });

    expect(result.summary.stopReason).toMatch(/tolerance-reached|iteration-limit|machine-zero/);
    expect(approximationNumber(result)).toBeCloseTo(plasticRoot, 10);
  });

  it('solves x^3 - x - 1 with the secant method from x0 = 1 and x1 = 2', () => {
    const result = R.runSecant({
      expression: 'x^3 - x - 1',
      x0: '1',
      x1: '2',
      machine,
      stopping: iterationStop,
      angleMode: 'rad',
    });

    expect(result.summary.stopReason).toMatch(/tolerance-reached|iteration-limit|machine-zero/);
    expect(approximationNumber(result)).toBeCloseTo(plasticRoot, 10);
  });

  it('solves x^3 - x - 1 with false position on [1, 2]', () => {
    const result = R.runFalsePosition({
      expression: 'x^3 - x - 1',
      interval: { a: '1', b: '2' },
      machine,
      stopping: iterationStop,
      decisionBasis: 'machine',
      signDisplay: 'both',
      angleMode: 'rad',
    });

    expect(result.summary.stopReason).toBe('retained-endpoint-stagnation');
    expect(approximationNumber(result)).toBeCloseTo(plasticRoot, 6);
  });

  it('reports a bad bisection bracket when endpoint signs do not differ', () => {
    const result = R.runBisection({
      expression: 'x^2 + 1',
      interval: { a: '-1', b: '1' },
      machine,
      stopping: iterationStop,
      decisionBasis: 'machine',
      signDisplay: 'both',
      angleMode: 'rad',
    });

    expect(result.summary.stopReason).toBe('invalid-starting-interval');
    expect(result.summary.approximation).toBeNull();
  });

  it('reports derivative-zero for Newton when the derivative vanishes away from a root', () => {
    const result = R.runNewtonRaphson({
      expression: 'x^3 - 1',
      dfExpression: 'auto',
      x0: '0',
      machine,
      stopping: iterationStop,
      angleMode: 'rad',
    });

    expect(result.summary.stopReason).toBe('derivative-zero');
    expect(approximationNumber(result)).toBe(0);
  });

  it('reports secant stagnation when the denominator is near zero', () => {
    const result = R.runSecant({
      expression: 'x^2',
      x0: '-1',
      x1: '1',
      machine,
      stopping: iterationStop,
      angleMode: 'rad',
    });

    expect(result.summary.stopReason).toBe('stagnation');
    expect(approximationNumber(result)).toBe(1);
  });

  it('keeps max-iteration fixed-point runs marked as iteration-limited', () => {
    const result = R.runFixedPoint({
      gExpression: 'x + 1',
      x0: '0',
      machine,
      stopping: { kind: 'iterations', value: '3' },
      angleMode: 'rad',
    });

    expect(result.summary.stopReason).toBe('iteration-limit');
    expect(result.rows).toHaveLength(3);
    expect(approximationNumber(result)).toBe(3);
  });
});
