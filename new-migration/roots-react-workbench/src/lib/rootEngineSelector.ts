import type { AngleMode, MethodFormState, RootMethod, RootRunResult } from '../types/roots';
import { runModernRootMethodForUi } from './methods/modernRootEngineAdapter';
import type { ModernRootEngineInput } from './methods/modernRootEngine';
import type { NewtonInitialStrategy } from './methods/newtonStartStrategy';
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

function optionalNumberField(fields: MethodFormState, field: string): number | undefined {
  const raw = fields[field]?.trim();
  if (!raw) {
    return undefined;
  }

  const value = Number(raw);
  return Number.isFinite(value) ? value : undefined;
}

function optionalTextField(fields: MethodFormState, field: string): string | undefined {
  const value = fields[field]?.trim();
  return value ? value : undefined;
}

function numericListField(fields: MethodFormState, field: string): number[] {
  return (fields[field] ?? '')
    .split(/[,\n;\s]+/)
    .map((value) => value.trim())
    .filter(Boolean)
    .map(Number);
}

function expressionListField(fields: MethodFormState, field: string): string[] {
  return (fields[field] ?? '')
    .split(/[\n;]/)
    .map((value) => value.trim())
    .filter(Boolean);
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

function bisectionToleranceType(fields: MethodFormState) {
  return fields['root-bis-tolerance-type'] === 'relative' ? 'relative' : 'absolute';
}

function bisectionDecisionBasis(fields: MethodFormState) {
  return fields['root-bis-decision-basis'] === 'exact' ? 'exact' : 'machine';
}

function bisectionSignDisplay(fields: MethodFormState) {
  const value = fields['root-bis-sign-display'];
  return value === 'exact' || value === 'machine' ? value : 'both';
}

function falsePositionDecisionBasis(fields: MethodFormState) {
  return fields['root-fp-decision-basis'] === 'exact' ? 'exact' : 'machine';
}

function falsePositionSignDisplay(fields: MethodFormState) {
  const value = fields['root-fp-sign-display'];
  return value === 'exact' || value === 'machine' ? value : 'both';
}

function bisectionScanOptions(fields: MethodFormState) {
  if (fields['root-bis-scan-enabled'] !== 'yes') {
    return null;
  }

  return {
    min: numberField(fields, 'root-bis-scan-min'),
    max: numberField(fields, 'root-bis-scan-max'),
    steps: Math.max(1, Math.trunc(numberField(fields, 'root-bis-scan-steps'))),
  };
}

function newtonInterval(fields: MethodFormState) {
  const lower = optionalNumberField(fields, 'root-newton-a');
  const upper = optionalNumberField(fields, 'root-newton-b');
  if (lower == null || upper == null) {
    return undefined;
  }

  return { lower, upper };
}

function newtonInitialStrategy(fields: MethodFormState): NewtonInitialStrategy | undefined {
  const value = fields['root-newton-initial-strategy'];
  if (
    value === 'midpoint' ||
    value === 'left' ||
    value === 'right' ||
    value === 'best-endpoint' ||
    value === 'best-of-three'
  ) {
    return value;
  }

  return undefined;
}

function fixedPointSeedScan(fields: MethodFormState) {
  const min = optionalNumberField(fields, 'root-fpi-scan-min');
  const max = optionalNumberField(fields, 'root-fpi-scan-max');
  if (min == null || max == null) {
    return undefined;
  }

  return {
    min,
    max,
    steps: Math.max(1, Math.trunc(numberField(fields, 'root-fpi-scan-steps') || 8)),
  };
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
        toleranceType: bisectionToleranceType(fields),
        decisionBasis: bisectionDecisionBasis(fields),
        signDisplay: bisectionSignDisplay(fields),
        scan: bisectionScanOptions(fields),
        ...stoppingOptions(fields, 'root-bis'),
      };
    case 'falsePosition':
      return {
        method: 'false-position',
        expression: fields['root-fp-expression'],
        lower: numberField(fields, 'root-fp-a'),
        upper: numberField(fields, 'root-fp-b'),
        angleMode,
        decisionBasis: falsePositionDecisionBasis(fields),
        signDisplay: falsePositionSignDisplay(fields),
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
        extraSeeds: numericListField(fields, 'root-fpi-seeds'),
        batchExpressions: expressionListField(fields, 'root-fpi-batch-expressions'),
        seedScan: fixedPointSeedScan(fields),
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
        x0: optionalNumberField(fields, 'root-newton-x0'),
        interval: newtonInterval(fields),
        initialStrategy: newtonInitialStrategy(fields),
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
