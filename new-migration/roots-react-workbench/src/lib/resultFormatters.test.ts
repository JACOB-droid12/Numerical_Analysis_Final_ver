import { describe, expect, it } from 'vitest';

import {
  compactConfidenceItems,
  confidenceStatus,
  formatValue,
  methodFormulaDisplay,
  solutionSteps,
  stopReasonLabel,
  tableValuesForRow,
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
    expect(stopReasonLabel('function-tolerance-satisfied', 'newton')).toBe('Function tolerance reached');
    expect(stopReasonLabel('exact-root', 'bisection')).toBe('Exact root found');
    expect(stopReasonLabel('complex-evaluation', 'fixedPoint')).toBe('Complex result rejected');
    expect(stopReasonLabel('missing-derivative', 'newton')).toBe('Missing derivative');
    expect(compactConfidenceItems(run({ decisionBasis: 'machine' }))).toEqual([
      { label: 'Stop', value: 'Reached the requested tolerance' },
      { label: 'Metric', value: '0.001' },
      { label: 'Basis', value: 'machine signs' },
    ]);
  });

  it('keeps standard precision display unchanged for modern table rows', () => {
    const values = tableValuesForRow(
      'bisection',
      { iteration: 1, lower: 1.23456789, upper: 2, midpoint: 1.617283945, fMidpoint: 0.123456789, error: 0.382716055 },
      { engine: 'modern' },
      { mode: 'standard', digits: 5 },
    );

    expect(values).toEqual(['1', '1.23456789', '2', '1.617283945', '0.123456789', '0.382716055']);
  });

  it('applies chopping and rounding display to modern table rows only', () => {
    const row = {
      iteration: 1,
      xCurrent: 3.1415926535,
      fCurrent: -0.123456789,
      derivativeCurrent: 2.718281828,
      xNext: 3.187004405,
      error: 0.0454117515,
    };

    expect(tableValuesForRow('newton', row, { engine: 'modern' }, { mode: 'chop', digits: 5 })).toEqual([
      '1',
      '3.1415',
      '-0.12345',
      '2.7182',
      '-0.045417',
      '3.187',
      '0.045411',
    ]);

    expect(tableValuesForRow('newton', row, { engine: 'modern' }, { mode: 'round', digits: 5 })).toEqual([
      '1',
      '3.1416',
      '-0.12346',
      '2.7183',
      '-0.045417',
      '3.187',
      '0.045412',
    ]);

    const legacyValues = tableValuesForRow(
      'newton',
      { iteration: 1, xn: 3.1415926535, fxn: -0.123456789, dfxn: 2.718281828, xNext: 3.187004405 },
      { engine: 'legacy' },
      { mode: 'chop', digits: 5 },
    );
    expect(legacyValues[1]).toBe('3.1415926535');
  });
});
