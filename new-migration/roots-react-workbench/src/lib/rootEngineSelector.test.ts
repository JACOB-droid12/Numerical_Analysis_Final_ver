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

  it('uses legacy when the env flag is missing', () => {
    vi.stubEnv('VITE_ROOT_ENGINE', undefined);
    const legacy = stubLegacyRootEngine();

    const result = runSelectedRootMethod('bisection', bisectionFields(), 'rad');

    expect(selectedRootEngineName()).toBe('legacy');
    expect(legacy.runBisection).toHaveBeenCalledOnce();
    expect(result.summary?.stopReason).toBe('legacy-stub');
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

  it('falls back to legacy for unknown values', () => {
    vi.stubEnv('VITE_ROOT_ENGINE', 'experimental');
    const legacy = stubLegacyRootEngine();

    const result = runSelectedRootMethod('bisection', bisectionFields(), 'rad');

    expect(selectedRootEngineName()).toBe('legacy');
    expect(legacy.runBisection).toHaveBeenCalledOnce();
    expect(result.summary?.stopReason).toBe('legacy-stub');
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
