import { describe, expect, it } from 'vitest';

import {
  bisectionSetupLines,
  bracketSetupLines,
  compactConfidenceItems,
  confidenceStatus,
  formatPrecisionDisplayValue,
  formatValue,
  methodFormulaDisplay,
  solutionSteps,
  solutionText,
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
    expect(methodFormulaDisplay('bisection').formula).toBe('pₙ = aₙ + (bₙ − aₙ)/2');
    expect(methodFormulaDisplay('newton').formula).toBe('pₙ₊₁ = pₙ − f(pₙ)/f′(pₙ)');
    expect(methodFormulaDisplay('fixedPoint').formula).toBe('pₙ = g(pₙ₋₁)');
    expect(methodFormulaDisplay('secant').formula).not.toContain("f'(x_n)");
    expect(solutionSteps(run({ method: 'secant' })).join('\n')).not.toContain('Newton-Raphson');
  });

  it('builds professor-style bisection setup lines from the first row', () => {
    const lines = bisectionSetupLines(run({
      method: 'bisection',
      rows: [{
        iteration: 1,
        a: 1,
        b: 2,
        c: 1.5,
        fa: -1,
        fb: 5,
        fc: 0.875,
        exactSigns: { a: -1, b: 1, c: 1 },
        machineSigns: { a: -1, b: 1, c: 1 },
      }],
    }));

    expect(lines).toContain('f(a) = -1');
    expect(lines).toContain('sgn(f(a)) = -');
    expect(lines).toContain('f(b) = 5');
    expect(lines).toContain('sgn(f(b)) = +');
    expect(lines).toContain('Bracket condition: sgn(f(a))sgn(f(b)) < 0 is satisfied.');
    expect(lines).toContain('Since f(a) and f(b) have opposite signs, the Intermediate Value Theorem guarantees a root in [1, 2].');
    expect(lines).toContain('Midpoint formula: pₙ = aₙ + (bₙ − aₙ)/2.');
    expect(lines).toContain('Iteration decision: use sgn(f(aₙ))sgn(f(pₙ)) < 0 to choose the next bracket.');
    expect(lines).toContain('sgn_exact(f(aₙ)) = -');
    expect(lines).toContain('sgn_machine(f(aₙ)) = -');
    expect(lines).toContain('Exact sign test: sgn_exact(f(aₙ))sgn_exact(f(pₙ)) < 0');
    expect(lines).toContain('Machine sign test: sgn_machine(f(aₙ))sgn_machine(f(pₙ)) < 0');
  });

  it('honors exact, machine, and both bracket sign display settings', () => {
    const base = run({
      method: 'bisection',
      rows: [{
        iteration: 1,
        a: 1,
        b: 2,
        c: 1.5,
        fa: -1,
        fb: 5,
        fc: 0.875,
        exactSigns: { a: -1, b: 1, c: 1 },
        machineSigns: { a: -1, b: 1, c: -1 },
        note: 'Exact and machine sign values disagree; decision used the configured basis.',
      }],
    });

    const exactLines = bracketSetupLines({ ...base, signDisplay: 'exact' });
    expect(exactLines).toContain('sgn_exact(f(aₙ)) = -');
    expect(exactLines.join('\n')).not.toContain('sgn_machine');

    const machineLines = bracketSetupLines({ ...base, signDisplay: 'machine' });
    expect(machineLines).toContain('sgn_machine(f(pₙ)) = -');
    expect(machineLines.join('\n')).not.toContain('sgn_exact');

    const bothLines = bracketSetupLines({ ...base, signDisplay: 'both' });
    expect(bothLines.join('\n')).toContain('sgn_exact(f(pₙ)) = +');
    expect(bothLines.join('\n')).toContain('sgn_machine(f(pₙ)) = -');
    expect(bothLines.join('\n')).toContain('Sign disagreement note: Exact and machine sign values disagree');
  });

  it('builds professor-style false-position sign setup without changing table headers', () => {
    const falsePositionRun = run({
      method: 'falsePosition',
      signDisplay: 'machine',
      decisionBasis: 'machine',
      rows: [{
        iteration: 1,
        lower: 0,
        upper: 3,
        point: 1.3333333333333333,
        fLower: -4,
        fUpper: 5,
        fPoint: -2.2222222222222223,
        exactSigns: { a: -1, b: 1, c: -1 },
        machineSigns: { a: -1, b: 1, c: -1 },
      }],
    });

    const lines = bracketSetupLines(falsePositionRun);
    expect(lines).toContain('False position formula: pₙ = (aₙf(bₙ) − bₙf(aₙ)) / (f(bₙ) − f(aₙ)).');
    expect(lines).toContain('Decision basis used: machine signs');
    expect(lines).toContain('sgn_machine(f(aₙ)) = -');
    expect(lines).toContain('sgn_machine(f(pₙ)) = -');
    expect(lines.join('\n')).not.toContain('sgn_exact');
    expect(solutionText(falsePositionRun)).toContain('False Position setup:');
  });

  it('summarizes stop reason, metric, and basis for confidence cards', () => {
    expect(stopReasonLabel('derivative-zero', 'newton')).toBe('Derivative is zero at the current point');
    expect(stopReasonLabel('function-tolerance-satisfied', 'newton')).toBe('Function tolerance reached');
    expect(stopReasonLabel('exact-root', 'bisection')).toBe('Exact root found');
    expect(stopReasonLabel('complex-evaluation', 'fixedPoint')).toBe('The function produced a complex value');
    expect(stopReasonLabel('missing-derivative', 'newton')).toBe('Newton-Raphson needs a derivative');
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

  it('formats final modern root display with selected significant-digit precision', () => {
    const sqrtTwo = 1.4142135623730951;

    expect(formatPrecisionDisplayValue(sqrtTwo, { mode: 'round', digits: 8 })).toBe('1.4142136');
    expect(formatPrecisionDisplayValue(sqrtTwo, { mode: 'chop', digits: 8 })).toBe('1.4142135');
    expect(formatPrecisionDisplayValue(sqrtTwo, { mode: 'standard', digits: 8 })).toBe('1.41421356237');
  });
});
