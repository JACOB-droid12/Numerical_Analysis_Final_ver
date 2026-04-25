import { describe, expect, it } from 'vitest';

import {
  compactConfidenceItems,
  confidenceStatus,
  formatValue,
  methodFormulaDisplay,
  solutionSteps,
  stopReasonLabel,
} from './resultFormatters';
import type { RootRunResult } from '../types/roots';

function run(overrides: Partial<RootRunResult> = {}): RootRunResult {
  return {
    method: 'bisection',
    expression: 'x^2 - 2',
    canonical: 'x^2 - 2',
    rows: [{ iteration: 1 }, { iteration: 2 }],
    summary: {
      approximation: 1.414,
      stopReason: 'tolerance-reached',
      error: 0.001,
    },
    stopping: {
      kind: 'iterations',
      input: '2',
    },
    ...overrides,
  };
}

describe('result formatters', () => {
  it('formats exact/machine point-like values without losing both sides', () => {
    expect(formatValue({ exact: 1 / 3, machine: 0.3333 }, 5)).toBe('E: 0.33333 / M: 0.3333');
  });

  it('classifies confidence from freshness, warnings, and stop reasons', () => {
    expect(confidenceStatus(run(), 'current', null)).toMatchObject({
      label: 'High',
      tone: 'success',
      bars: 5,
    });

    expect(confidenceStatus(run(), 'stale', 'Inputs changed.')).toMatchObject({
      label: 'Stale',
      tone: 'stale',
      bars: 0,
      note: 'Stale result: Inputs changed.',
    });

    expect(confidenceStatus(run({ warnings: [{ code: 'review', message: 'Check convergence.' }] }), 'current', null))
      .toMatchObject({
        label: 'Review',
        tone: 'warning',
        bars: 2,
        note: 'Check convergence.',
      });

    expect(confidenceStatus(run({ summary: { approximation: null, stopReason: 'invalid-bracket' } }), 'current', null))
      .toMatchObject({
        label: 'Low',
        tone: 'danger',
        bars: 1,
      });
  });

  it('keeps method formulas method-specific', () => {
    expect(methodFormulaDisplay('bisection').formula).toBe('c_n = (a_n + b_n) / 2');
    expect(methodFormulaDisplay('secant').formula).not.toContain("f'(x_n)");
    expect(solutionSteps(run({ method: 'secant' })).join('\n')).not.toContain('Newton-Raphson');
  });

  it('summarizes stop reason, metric, and basis for confidence cards', () => {
    expect(stopReasonLabel('derivative-zero', 'newton')).toBe('Derivative is zero, so the method cannot continue');
    expect(compactConfidenceItems(run({ decisionBasis: 'machine' }))).toEqual([
      { label: 'Stop', value: 'Reached the requested tolerance' },
      { label: 'Metric', value: '0.001' },
      { label: 'Basis', value: 'machine signs' },
    ]);
  });
});
