import { describe, expect, it } from 'vitest';

import {
  hasValidApproximation,
  isInvalidRun,
  resultFailureMessage,
} from './rootEngineAdapter';
import type { RootRunResult } from '../types/roots';

function result(overrides: Partial<RootRunResult> = {}): RootRunResult {
  return {
    method: 'newton',
    summary: {
      approximation: 1.414,
      stopReason: 'tolerance-reached',
    },
    rows: [],
    ...overrides,
  };
}

describe('root engine adapter result classification', () => {
  it('accepts finite approximations from successful runs', () => {
    expect(hasValidApproximation(result())).toBe(true);
    expect(isInvalidRun(result())).toBe(false);
  });

  it('rejects failure stop reasons even when an approximation exists', () => {
    const invalid = result({
      summary: {
        approximation: 1,
        stopReason: 'derivative-zero',
      },
    });

    expect(hasValidApproximation(invalid)).toBe(false);
    expect(isInvalidRun(invalid)).toBe(true);
    expect(resultFailureMessage(invalid)).toBe(
      'The derivative is zero or too close to zero, so the method cannot continue.',
    );
  });

  it('keeps partial failure runs renderable when iteration rows exist', () => {
    const partial = result({
      summary: {
        approximation: 1,
        stopReason: 'derivative-zero',
      },
      rows: [{ iteration: 1, xn: 1, note: 'derivative stopped' }],
    });

    expect(hasValidApproximation(partial)).toBe(false);
    expect(isInvalidRun(partial)).toBe(false);
  });

  it('uses stop detail before generic failure messages', () => {
    expect(resultFailureMessage(result({
      summary: {
        approximation: null,
        stopReason: 'invalid-input',
        stopDetail: 'x0 is required.',
      },
    }))).toBe('x0 is required.');
  });

  it('rejects missing and non-finite numeric approximations', () => {
    expect(isInvalidRun(result({ summary: { approximation: null, stopReason: 'tolerance-reached' } }))).toBe(true);
    expect(isInvalidRun(result({
      summary: {
        approximation: Number.POSITIVE_INFINITY,
        stopReason: 'tolerance-reached',
      },
    }))).toBe(true);
  });
});
