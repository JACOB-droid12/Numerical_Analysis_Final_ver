import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';

import { describe, expect, it } from 'vitest';

import { evaluateExpression, type MathEvaluationResult } from './evaluator';

type LegacyWindow = {
  MathEngine: Record<string, any>;
  CalcEngine: Record<string, any>;
  ExpressionEngine: Record<string, any>;
};

function loadEditableLegacyExpressionEngine(): LegacyWindow {
  const legacyWindow = {} as LegacyWindow;
  const context = vm.createContext({
    window: legacyWindow,
    console,
  });

  for (const file of [
    'math-engine.js',
    'calc-engine.js',
    'expression-engine.js',
  ]) {
    const source = readFileSync(resolve(process.cwd(), file), 'utf8');
    vm.runInContext(source, context, { filename: file });
  }

  return legacyWindow;
}

const legacy = loadEditableLegacyExpressionEngine();
const { MathEngine: M, CalcEngine: C, ExpressionEngine: E } = legacy;

function legacyNumber(
  expression: string,
  context: Record<string, unknown> = {},
): number {
  const ast = E.parseExpression(expression, { allowVariable: true });
  return C.requireRealNumber(E.evaluateValue(ast, context), expression);
}

function mathNumber(result: MathEvaluationResult): number {
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error(result.error.message);
  }
  expect(typeof result.value).toBe('number');
  return result.value as number;
}

function legacyValue(expression: string, context: Record<string, unknown> = {}) {
  const ast = E.parseExpression(expression, { allowVariable: true });
  return E.evaluateValue(ast, context);
}

function expectCompatibleNumber(
  expression: string,
  context: Record<string, unknown> = {},
  mathScope: Record<string, unknown> = {},
) {
  const actualLegacy = legacyNumber(expression, context);
  const actualMath = mathNumber(evaluateExpression(expression, mathScope, {
    angleMode: context.angleMode === 'deg' ? 'deg' : 'rad',
    mode: 'legacy-compatible',
  }));

  expect(actualMath).toBeCloseTo(actualLegacy, 12);
}

describe('math.js evaluator compatibility with legacy ExpressionEngine', () => {
  it.each([
    ['2 + 3 * 4'],
    ['(2 + 3) * 4'],
    ['2^3'],
    ['sqrt(9)'],
    ['ln(e)'],
    ['sin(pi / 2)'],
    ['cos(0)'],
    ['tan(pi / 4)'],
    ['exp(1)'],
    ['cbrt(8)'],
  ])('matches legacy numeric behavior for %s', (expression) => {
    expectCompatibleNumber(expression, { angleMode: 'rad' });
  });

  it('matches legacy variable x evaluation for x^3 - x - 1 at x = 2', () => {
    expectCompatibleNumber(
      'x^3 - x - 1',
      { x: M.parseRational('2'), angleMode: 'rad' },
      { x: 2 },
    );
  });

  it.each([
    ['sin(90)'],
    ['cos(180)'],
    ['tan(45)'],
  ])('matches legacy degree-mode behavior for %s', (expression) => {
    expectCompatibleNumber(expression, { angleMode: 'deg' }, {});
  });

  it('matches legacy log semantics in legacy-compatible mode', () => {
    const legacyLog = legacyNumber('log(100)', { angleMode: 'rad' });
    const mathLog = mathNumber(evaluateExpression(
      'log(100)',
      undefined,
      { angleMode: 'rad', mode: 'legacy-compatible' },
    ));

    expect(legacyLog).toBeCloseTo(Math.log(100), 12);
    expect(mathLog).toBeCloseTo(legacyLog, 12);
  });

  it('keeps calculator-mode log semantics documented as intentionally different', () => {
    const legacyLog = legacyNumber('log(100)', { angleMode: 'rad' });
    const calculatorLog = mathNumber(evaluateExpression(
      'log(100)',
      undefined,
      { angleMode: 'rad', mode: 'calculator' },
    ));

    expect(calculatorLog).toBeCloseTo(2, 12);
    expect(calculatorLog).not.toBeCloseTo(legacyLog, 12);
  });

  it('documents sqrt(-1) as complex-compatible with different object shapes', () => {
    const legacyComplex = legacyValue('sqrt(-1)', { angleMode: 'rad' });
    const mathResult = evaluateExpression(
      'sqrt(-1)',
      undefined,
      { angleMode: 'rad', mode: 'calculator' },
    );

    expect(C.isCalcValue(legacyComplex)).toBe(true);
    expect(legacyComplex.re).toBeCloseTo(0, 12);
    expect(legacyComplex.im).toBeCloseTo(1, 12);

    expect(mathResult.ok).toBe(true);
    if (!mathResult.ok) {
      throw new Error(mathResult.error.message);
    }

    expect(mathResult.value).toMatchObject({ re: 0, im: 1 });
    expect(String(mathResult.value)).toBe('i');
  });

  it('matches legacy division by zero rejection in legacy-compatible mode', () => {
    expect(() => legacyNumber('1 / 0', { angleMode: 'rad' })).toThrow();

    const mathResult = evaluateExpression(
      '1 / 0',
      undefined,
      { angleMode: 'rad', mode: 'legacy-compatible' },
    );
    expect(mathResult.ok).toBe(false);
    if (mathResult.ok) {
      throw new Error('Expected legacy-compatible division by zero to fail.');
    }
    expect(mathResult.error.message).toMatch(/non-finite/);
  });

  it('keeps calculator-mode division by zero documented as intentionally different', () => {
    expect(() => legacyNumber('1 / 0', { angleMode: 'rad' })).toThrow();

    const mathResult = evaluateExpression(
      '1 / 0',
      undefined,
      { angleMode: 'rad', mode: 'calculator' },
    );
    expect(mathResult.ok).toBe(true);
    if (!mathResult.ok) {
      throw new Error(mathResult.error.message);
    }
    expect(mathResult.value).toBe(Number.POSITIVE_INFINITY);
  });

  it('documents invalid syntax error behavior', () => {
    expect(() => E.parseExpression('2 + * 3', { allowVariable: true })).toThrow();

    const mathResult = evaluateExpression('2 + * 3', undefined, { mode: 'legacy-compatible' });
    expect(mathResult.ok).toBe(false);
    if (mathResult.ok) {
      throw new Error('Expected math.js wrapper syntax error.');
    }
    expect(mathResult.error.code).toBe('invalid-expression');
  });

  it('documents missing variable x error behavior', () => {
    expect(() => legacyNumber('x + 1', { angleMode: 'rad' })).toThrow(/Value for x is required/);

    const mathResult = evaluateExpression(
      'x + 1',
      undefined,
      { angleMode: 'rad', mode: 'legacy-compatible' },
    );
    expect(mathResult.ok).toBe(false);
    if (mathResult.ok) {
      throw new Error('Expected missing x to fail.');
    }
    expect(mathResult.error.message).toMatch(/Undefined symbol x/);
  });

  it('documents unsupported function error behavior', () => {
    expect(() => legacyNumber('foo(1)', { angleMode: 'rad' })).toThrow(/Unsupported function/);

    const mathResult = evaluateExpression(
      'foo(1)',
      undefined,
      { angleMode: 'rad', mode: 'legacy-compatible' },
    );
    expect(mathResult.ok).toBe(false);
    if (mathResult.ok) {
      throw new Error('Expected unsupported function to fail.');
    }
    expect(mathResult.error.message).toMatch(/Undefined function foo/);
  });

  it('matches legacy logarithm domain rejection in legacy-compatible mode', () => {
    expect(() => legacyNumber('ln(-1)', { angleMode: 'rad' })).toThrow(/greater than 0/);

    const mathResult = evaluateExpression(
      'ln(-1)',
      undefined,
      { angleMode: 'rad', mode: 'legacy-compatible' },
    );
    expect(mathResult.ok).toBe(false);
    if (mathResult.ok) {
      throw new Error('Expected legacy-compatible ln(-1) to fail.');
    }
    expect(mathResult.error.message).toMatch(/complex/);
  });

  it('keeps calculator-mode logarithm domain behavior documented as intentionally different', () => {
    expect(() => legacyNumber('ln(-1)', { angleMode: 'rad' })).toThrow(/greater than 0/);

    const mathResult = evaluateExpression(
      'ln(-1)',
      undefined,
      { angleMode: 'rad', mode: 'calculator' },
    );
    expect(mathResult.ok).toBe(true);
    if (!mathResult.ok) {
      throw new Error(mathResult.error.message);
    }

    // Migration risk: math.js returns a complex value for ln(-1), while the
    // legacy calculator rejects it when a real result is required.
    expect(mathResult.value).toMatchObject({ re: 0, im: Math.PI });
  });
});
