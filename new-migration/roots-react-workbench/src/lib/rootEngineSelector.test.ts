import { afterEach, describe, expect, it, vi } from 'vitest';

import { createDefaultFormState } from '../config/methods';
import type { AngleMode, MethodFormState, RootRunResult } from '../types/roots';
import {
  modernInputFromForm,
  runSelectedRootMethod,
  selectedRootEngineName,
} from './rootEngineSelector';

function bisectionFields(overrides: MethodFormState = {}): MethodFormState {
  return {
    ...createDefaultFormState().bisection,
    'root-bis-expression': 'x^2 - 4',
    'root-bis-a': '0',
    'root-bis-b': '3',
    'root-bis-stop-kind': 'epsilon',
    'root-bis-stop-value': '1e-10',
    ...overrides,
  };
}

function falsePositionFields(overrides: MethodFormState = {}): MethodFormState {
  return {
    ...createDefaultFormState().falsePosition,
    'root-fp-expression': 'x^2 - 4',
    'root-fp-a': '0',
    'root-fp-b': '3',
    'root-fp-stop-kind': 'epsilon',
    'root-fp-stop-value': '1e-10',
    ...overrides,
  };
}

function newtonFields(overrides: MethodFormState = {}): MethodFormState {
  return {
    ...createDefaultFormState().newton,
    'root-newton-expression': 'x^2 - 4',
    'root-newton-df': 'auto',
    'root-newton-x0': '3',
    'root-newton-stop-kind': 'epsilon',
    'root-newton-stop-value': '1e-10',
    ...overrides,
  };
}

function fixedPointFields(overrides: MethodFormState = {}): MethodFormState {
  return {
    ...createDefaultFormState().fixedPoint,
    'root-fpi-expression': 'cos(x)',
    'root-fpi-x0': '1',
    'root-fpi-stop-kind': 'epsilon',
    'root-fpi-stop-value': '1e-8',
    ...overrides,
  };
}

function legacyResult(): RootRunResult {
  return {
    engine: 'legacy-test',
    method: 'bisection',
    summary: {
      approximation: 2,
      stopReason: 'legacy-stub',
    },
    rows: [{ iteration: 1 }],
  };
}

function stubLegacyRootEngine(result = legacyResult()) {
  const runBisection = vi.fn(() => result);
  vi.stubGlobal('window', {
    RootEngine: {
      runBisection,
    },
  });
  return { runBisection };
}

describe('root engine selector', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('uses modern when the env flag is missing', () => {
    vi.stubEnv('VITE_ROOT_ENGINE', undefined);
    const legacy = stubLegacyRootEngine();

    const result = runSelectedRootMethod('bisection', bisectionFields(), 'rad');

    expect(selectedRootEngineName()).toBe('modern');
    expect(legacy.runBisection).not.toHaveBeenCalled();
    expect(result.engine).toBe('modern');
    expect(result.summary?.approximation).toBeCloseTo(2, 9);
  });

  it('uses legacy when VITE_ROOT_ENGINE is legacy', () => {
    vi.stubEnv('VITE_ROOT_ENGINE', 'legacy');
    const legacy = stubLegacyRootEngine();

    const result = runSelectedRootMethod('bisection', bisectionFields(), 'rad');

    expect(selectedRootEngineName()).toBe('legacy');
    expect(legacy.runBisection).toHaveBeenCalledOnce();
    expect(result.engine).toBe('legacy-test');
  });

  it('uses modern when VITE_ROOT_ENGINE is modern', () => {
    vi.stubEnv('VITE_ROOT_ENGINE', 'modern');
    const legacy = stubLegacyRootEngine();

    const result = runSelectedRootMethod('bisection', bisectionFields(), 'rad');

    expect(selectedRootEngineName()).toBe('modern');
    expect(legacy.runBisection).not.toHaveBeenCalled();
    expect(result.engine).toBe('modern');
    expect(result.summary?.approximation).toBeCloseTo(2, 9);
  });

  it('uses explicit runtime legacy selection even when env starts modern', () => {
    vi.stubEnv('VITE_ROOT_ENGINE', 'modern');
    const legacy = stubLegacyRootEngine();

    const result = runSelectedRootMethod('bisection', bisectionFields(), 'rad', 'legacy');

    expect(selectedRootEngineName()).toBe('modern');
    expect(legacy.runBisection).toHaveBeenCalledOnce();
    expect(result.engine).toBe('legacy-test');
  });

  it('uses explicit runtime modern selection even when env starts legacy', () => {
    vi.stubEnv('VITE_ROOT_ENGINE', 'legacy');
    const legacy = stubLegacyRootEngine();

    const result = runSelectedRootMethod('bisection', bisectionFields(), 'rad', 'modern');

    expect(selectedRootEngineName()).toBe('legacy');
    expect(legacy.runBisection).not.toHaveBeenCalled();
    expect(result.engine).toBe('modern');
    expect(result.summary?.approximation).toBeCloseTo(2, 9);
  });

  it('falls back to modern for unknown values', () => {
    vi.stubEnv('VITE_ROOT_ENGINE', 'experimental');
    const legacy = stubLegacyRootEngine();

    const result = runSelectedRootMethod('bisection', bisectionFields(), 'rad');

    expect(selectedRootEngineName()).toBe('modern');
    expect(legacy.runBisection).not.toHaveBeenCalled();
    expect(result.engine).toBe('modern');
    expect(result.summary?.approximation).toBeCloseTo(2, 9);
  });

  it('converts form state into modern input without invoking legacy code', () => {
    const input = modernInputFromForm('bisection', bisectionFields(), 'deg' as AngleMode);

    expect(input).toMatchObject({
      method: 'bisection',
      expression: 'x^2 - 4',
      lower: 0,
      upper: 3,
      tolerance: 1e-10,
      angleMode: 'deg',
    });
  });

  it('converts modern bisection parity controls from form state', () => {
    const input = modernInputFromForm('bisection', bisectionFields({
      'root-bis-scan-enabled': 'yes',
      'root-bis-scan-min': '-10',
      'root-bis-scan-max': '10',
      'root-bis-scan-steps': '20',
      'root-bis-tolerance-type': 'relative',
      'root-bis-decision-basis': 'exact',
      'root-bis-sign-display': 'machine',
    }), 'rad');

    expect(input).toMatchObject({
      method: 'bisection',
      toleranceType: 'relative',
      decisionBasis: 'exact',
      signDisplay: 'machine',
      scan: {
        min: -10,
        max: 10,
        steps: 20,
      },
    });
  });

  it('converts modern false-position sign controls from form state', () => {
    const input = modernInputFromForm('falsePosition', falsePositionFields({
      'root-fp-decision-basis': 'exact',
      'root-fp-sign-display': 'machine',
    }), 'rad');

    expect(input).toMatchObject({
      method: 'false-position',
      decisionBasis: 'exact',
      signDisplay: 'machine',
    });
  });

  it('maps Newton auto derivative to numeric mode for modern input', () => {
    const input = modernInputFromForm('newton', newtonFields(), 'rad');

    expect(input).toMatchObject({
      method: 'newton-raphson',
      expression: 'x^2 - 4',
      x0: 3,
      derivativeMode: 'numeric',
      tolerance: 1e-10,
      angleMode: 'rad',
    });
    expect('derivativeExpression' in input && input.derivativeExpression).toBeFalsy();
  });

  it('maps Newton interval midpoint start to modern input when x0 is blank', () => {
    const input = modernInputFromForm('newton', newtonFields({
      'root-newton-x0': '',
      'root-newton-a': '1',
      'root-newton-b': '4',
      'root-newton-initial-strategy': 'midpoint',
    }), 'rad');

    expect(input).toMatchObject({
      method: 'newton-raphson',
      x0: undefined,
      interval: { lower: 1, upper: 4 },
      initialStrategy: 'midpoint',
    });
  });

  it('keeps provided Newton derivative expressions in provided mode', () => {
    const input = modernInputFromForm(
      'newton',
      newtonFields({ 'root-newton-df': '2*x' }),
      'rad',
    );

    expect(input).toMatchObject({
      method: 'newton-raphson',
      derivativeExpression: '2*x',
      derivativeMode: 'provided',
    });
  });

  it('converts modern fixed-point advanced controls from form state', () => {
    const input = modernInputFromForm('fixedPoint', fixedPointFields({
      'root-fpi-seeds': '0, 0.5; 2',
      'root-fpi-batch-expressions': 'sqrt(x + 1)\n\n2*x',
      'root-fpi-scan-min': '-1',
      'root-fpi-scan-max': '1',
      'root-fpi-scan-steps': '4',
    }), 'rad');

    expect(input).toMatchObject({
      method: 'fixed-point',
      extraSeeds: [0, 0.5, 2],
      batchExpressions: ['sqrt(x + 1)', '2*x'],
      seedScan: { min: -1, max: 1, steps: 4 },
    });
  });

  it('runs Newton successfully in modern mode with the UI auto derivative default', () => {
    vi.stubEnv('VITE_ROOT_ENGINE', 'modern');

    const result = runSelectedRootMethod('newton', newtonFields(), 'rad');

    expect(result.engine).toBe('modern');
    expect(result.method).toBe('newton');
    expect(result.helpers?.derivative?.source).toBe('numeric');
    expect(result.summary?.approximation).toBeCloseTo(2, 9);
  });

  it('preserves modern failure results in a UI-compatible shape', () => {
    vi.stubEnv('VITE_ROOT_ENGINE', 'modern');

    const result = runSelectedRootMethod(
      'bisection',
      bisectionFields({
        'root-bis-expression': 'x^2 + 1',
        'root-bis-a': '-1',
        'root-bis-b': '1',
      }),
      'rad',
    );

    expect(result.engine).toBe('modern');
    expect(result.summary?.approximation).toBeNull();
    expect(result.summary?.stopReason).toBe('invalid-starting-interval');
    expect(result.summary?.stopDetail).toMatch(/opposite signs/);
  });
});
