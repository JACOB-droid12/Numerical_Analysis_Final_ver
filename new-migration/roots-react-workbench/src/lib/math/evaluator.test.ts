import { describe, expect, it } from 'vitest';

import {
  compileExpression,
  evaluateExpression,
  normalizeMathError,
  type MathEvaluationResult,
} from './evaluator';

function unwrapNumber(result: MathEvaluationResult): number {
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error(result.error.message);
  }
  expect(typeof result.value).toBe('number');
  return result.value as number;
}

describe('math.js evaluator wrapper', () => {
  it('evaluates arithmetic precedence and parentheses', () => {
    expect(unwrapNumber(evaluateExpression('2 + 3 * 4'))).toBe(14);
    expect(unwrapNumber(evaluateExpression('(2 + 3) * 4'))).toBe(20);
  });

  it('evaluates powers, square roots, and constants', () => {
    expect(unwrapNumber(evaluateExpression('2^3'))).toBe(8);
    expect(unwrapNumber(evaluateExpression('sqrt(9)'))).toBe(3);
    expect(unwrapNumber(evaluateExpression('pi'))).toBeCloseTo(Math.PI, 14);
    expect(unwrapNumber(evaluateExpression('e'))).toBeCloseTo(Math.E, 14);
  });

  it('defines ln as natural log and log as base-10 log at the wrapper boundary', () => {
    expect(unwrapNumber(evaluateExpression('ln(e)'))).toBeCloseTo(1, 14);
    expect(unwrapNumber(evaluateExpression('log(100)'))).toBeCloseTo(2, 14);
  });

  it('evaluates trigonometric functions in radians by default', () => {
    expect(unwrapNumber(evaluateExpression('sin(pi / 2)'))).toBeCloseTo(1, 14);
    expect(unwrapNumber(evaluateExpression('cos(pi)'))).toBeCloseTo(-1, 14);
    expect(unwrapNumber(evaluateExpression('tan(pi / 4)'))).toBeCloseTo(1, 14);
  });

  it('evaluates trigonometric functions in degrees when requested', () => {
    expect(unwrapNumber(evaluateExpression('sin(90)', undefined, { angleMode: 'deg' })))
      .toBeCloseTo(1, 14);
    expect(unwrapNumber(evaluateExpression('cos(180)', undefined, { angleMode: 'deg' })))
      .toBeCloseTo(-1, 14);
    expect(unwrapNumber(evaluateExpression('tan(45)', undefined, { angleMode: 'deg' })))
      .toBeCloseTo(1, 14);
  });

  it('evaluates variable x from scope', () => {
    expect(unwrapNumber(evaluateExpression('x^3 - x - 1', { x: 2 }))).toBe(5);
  });

  it('can compile once and evaluate with different scopes', () => {
    const compiled = compileExpression('x^2 + 1');

    expect(compiled.ok).toBe(true);
    if (!compiled.ok) {
      throw new Error(compiled.error.message);
    }

    expect(unwrapNumber(compiled.compiled.evaluate({ x: 2 }))).toBe(5);
    expect(unwrapNumber(compiled.compiled.evaluate({ x: 3 }))).toBe(10);
  });

  it('returns a normalized error for invalid syntax', () => {
    const result = evaluateExpression('2 + * 3');

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected invalid syntax to fail.');
    }

    expect(result.error.code).toBe('invalid-expression');
    expect(result.error.message).toBeTruthy();
  });

  it('documents division by zero as a successful Infinity value', () => {
    const result = evaluateExpression('1 / 0');

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(result.error.message);
    }

    expect(result.value).toBe(Number.POSITIVE_INFINITY);
  });

  it('documents sqrt(-1) as a math.js complex result', () => {
    const result = evaluateExpression('sqrt(-1)');

    expect(result.ok).toBe(true);
    if (!result.ok) {
      throw new Error(result.error.message);
    }

    expect(String(result.value)).toBe('i');
    expect(result.value).toMatchObject({ re: 0, im: 1 });
  });

  it('normalizes non-Error throwables', () => {
    expect(normalizeMathError('failed')).toMatchObject({
      code: 'evaluation-error',
      message: 'failed',
    });
  });

  it('documents intentional differences from the legacy expression engine', () => {
    // Legacy ExpressionEngine treats both ln(x) and log(x) as natural logarithm.
    // This wrapper keeps ln(x) natural and makes log(x) base-10 for calculator UX.
    expect(unwrapNumber(evaluateExpression('log(e)'))).toBeCloseTo(Math.LOG10E, 14);

    // Legacy trig also supports degree mode when angleMode is passed; math.js is
    // radian-native, so the wrapper injects degree-aware trig functions.
    expect(unwrapNumber(evaluateExpression('sin(90)', undefined, { angleMode: 'deg' })))
      .toBeCloseTo(1, 14);
  });

  it('uses natural log semantics in legacy-compatible mode', () => {
    expect(unwrapNumber(evaluateExpression(
      'log(100)',
      undefined,
      { mode: 'legacy-compatible' },
    ))).toBeCloseTo(Math.log(100), 14);
    expect(unwrapNumber(evaluateExpression(
      'ln(e)',
      undefined,
      { mode: 'legacy-compatible' },
    ))).toBeCloseTo(1, 14);
  });

  it('rejects non-finite results in legacy-compatible mode', () => {
    const result = evaluateExpression('1 / 0', undefined, { mode: 'legacy-compatible' });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected non-finite legacy-compatible result to fail.');
    }

    expect(result.error.code).toBe('evaluation-error');
    expect(result.error.message).toMatch(/non-finite/);
  });

  it('rejects complex domain results in legacy-compatible mode', () => {
    for (const expression of ['ln(-1)', 'sqrt(-1)']) {
      const result = evaluateExpression(expression, undefined, { mode: 'legacy-compatible' });

      expect(result.ok).toBe(false);
      if (result.ok) {
        throw new Error(`Expected ${expression} to fail in legacy-compatible mode.`);
      }

      expect(result.error.code).toBe('evaluation-error');
      expect(result.error.message).toMatch(/complex/);
    }
  });

  it('keeps degree trig and scope support in legacy-compatible mode', () => {
    expect(unwrapNumber(evaluateExpression(
      'sin(90)',
      undefined,
      { angleMode: 'deg', mode: 'legacy-compatible' },
    ))).toBeCloseTo(1, 14);
    expect(unwrapNumber(evaluateExpression(
      'x^3 - x - 1',
      { x: 2 },
      { mode: 'legacy-compatible' },
    ))).toBe(5);
  });

  it('keeps invalid syntax normalized in legacy-compatible mode', () => {
    const result = evaluateExpression('2 + * 3', undefined, { mode: 'legacy-compatible' });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected invalid syntax to fail.');
    }

    expect(result.error.code).toBe('invalid-expression');
  });
});
