import { describe, expect, it } from 'vitest';

import { resolveNewtonStart } from './newtonStartStrategy';

describe('Newton-Raphson starting strategy', () => {
  it('uses explicit x0 when it is provided', () => {
    const result = resolveNewtonStart({
      x0: 1.25,
      interval: { lower: 0, upper: 2 },
      strategy: 'midpoint',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.message);
    expect(result.value).toBe(1.25);
    expect(result.helper.strategy).toBe('manual');
  });

  it('uses the interval midpoint when x0 is missing', () => {
    const result = resolveNewtonStart({
      interval: { lower: 1, upper: 4 },
      strategy: 'midpoint',
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error(result.message);
    expect(result.value).toBe(2.5);
    expect(result.helper.strategy).toBe('midpoint');
  });

  it('fails clearly for an invalid interval', () => {
    const result = resolveNewtonStart({
      interval: { lower: 4, upper: 1 },
      strategy: 'midpoint',
    });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected invalid interval to fail.');
    expect(result.reason).toBe('invalid-starting-value');
    expect(result.message).toMatch(/lower < upper/i);
  });

  it('fails clearly when x0 and interval are both missing', () => {
    const result = resolveNewtonStart({});

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error('Expected missing start to fail.');
    expect(result.reason).toBe('invalid-starting-value');
    expect(result.message).toMatch(/x0 or interval/i);
  });
});
