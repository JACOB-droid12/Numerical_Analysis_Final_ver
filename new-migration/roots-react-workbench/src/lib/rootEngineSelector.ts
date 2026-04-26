import type { AngleMode, MethodFormState, RootMethod, RootRunResult } from '../types/roots';
import { runModernRootMethodForUi } from './methods/modernRootEngineAdapter';
import type { ModernRootEngineInput } from './methods/modernRootEngine';
import { runRootMethod } from './rootEngineAdapter';

export type RootEngineMode = 'legacy' | 'modern';

const MODERN_FLAG_VALUE = 'modern';

function configuredFlag(): string | undefined {
  return import.meta.env?.VITE_ROOT_ENGINE;
}

export function selectedRootEngineName(flag = configuredFlag()): RootEngineMode {
  return flag === MODERN_FLAG_VALUE ? 'modern' : 'legacy';
}

function numberField(fields: MethodFormState, field: string): number {
  return Number(fields[field]);
}

function optionalTextField(fields: MethodFormState, field: string): string | undefined {
  const value = fields[field]?.trim();
  return value ? value : undefined;
}

function stoppingOptions(fields: MethodFormState, prefix: string) {
  const value = Number(fields[`${prefix}-stop-value`] ?? '');
  if (!Number.isFinite(value) || value <= 0) {
    return {};
  }

  if (fields[`${prefix}-stop-kind`] === 'epsilon') {
    return { tolerance: value };
  }

  return { maxIterations: Math.max(1, Math.trunc(value)) };
}

export function modernInputFromForm(
  method: RootMethod,
  fields: MethodFormState,
  angleMode: AngleMode,
): ModernRootEngineInput {
  switch (method) {
    case 'bisection':
      return {
        method: 'bisection',
        expression: fields['root-bis-expression'],
        lower: numberField(fields, 'root-bis-a'),
        upper: numberField(fields, 'root-bis-b'),
        angleMode,
        ...stoppingOptions(fields, 'root-bis'),
      };
    case 'falsePosition':
      return {
        method: 'false-position',
        expression: fields['root-fp-expression'],
        lower: numberField(fields, 'root-fp-a'),
        upper: numberField(fields, 'root-fp-b'),
        angleMode,
        ...stoppingOptions(fields, 'root-fp'),
      };
    case 'secant':
      return {
        method: 'secant',
        expression: fields['root-secant-expression'],
        x0: numberField(fields, 'root-secant-x0'),
        x1: numberField(fields, 'root-secant-x1'),
        angleMode,
        ...stoppingOptions(fields, 'root-secant'),
      };
    case 'fixedPoint':
      return {
        method: 'fixed-point',
        expression: fields['root-fpi-expression'],
        x0: numberField(fields, 'root-fpi-x0'),
        targetExpression: optionalTextField(fields, 'root-fpi-target-expression'),
        angleMode,
        ...stoppingOptions(fields, 'root-fpi'),
      };
    case 'newton': {
      const derivativeExpression = optionalTextField(fields, 'root-newton-df');
      const derivativeMode = derivativeExpression === 'auto' ? 'numeric' : 'provided';
      return {
        method: 'newton-raphson',
        expression: fields['root-newton-expression'],
        derivativeExpression: derivativeMode === 'provided' ? derivativeExpression : undefined,
        derivativeMode,
        x0: numberField(fields, 'root-newton-x0'),
        angleMode,
        ...stoppingOptions(fields, 'root-newton'),
      };
    }
    default:
      throw new Error(`Unsupported root method: ${method}`);
  }
}

export function runSelectedRootMethod(
  method: RootMethod,
  fields: MethodFormState,
  angleMode: AngleMode,
  engineMode: RootEngineMode = selectedRootEngineName(),
): RootRunResult {
  if (engineMode === 'modern') {
    return runModernRootMethodForUi(modernInputFromForm(method, fields, angleMode));
  }

  return runRootMethod(method, fields, angleMode);
}
