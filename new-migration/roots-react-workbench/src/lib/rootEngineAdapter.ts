import type {
  AngleMode,
  DecisionBasis,
  MachineMode,
  MethodFormState,
  RootMethod,
  RootRunResult,
  SignDisplay,
  StoppingKind,
  ToleranceType,
} from '../types/roots';

function requireRootEngine() {
  const engine = window.RootEngine;
  if (!engine) {
    throw new Error('RootEngine is not loaded yet.');
  }
  return engine;
}

function machine(fields: MethodFormState, prefix: string) {
  return {
    k: Number(fields[`${prefix}-k`]),
    mode: (fields[`${prefix}-mode`] || 'round') as MachineMode,
  };
}

function stopping(fields: MethodFormState, prefix: string) {
  return {
    kind: (fields[`${prefix}-stop-kind`] || 'iterations') as StoppingKind,
    value: fields[`${prefix}-stop-value`] ?? '4',
    toleranceType: fields[`${prefix}-tolerance-type`] as ToleranceType | undefined,
  };
}

function runBisection(fields: MethodFormState, angleMode: AngleMode): RootRunResult {
  return requireRootEngine().runBisection({
    expression: fields['root-bis-expression'],
    interval: { a: fields['root-bis-a'], b: fields['root-bis-b'] },
    machine: machine(fields, 'root-bis'),
    stopping: stopping(fields, 'root-bis'),
    decisionBasis: (fields['root-bis-decision-basis'] || 'machine') as DecisionBasis,
    signDisplay: (fields['root-bis-sign-display'] || 'both') as SignDisplay,
    angleMode,
  });
}

function runNewton(fields: MethodFormState, angleMode: AngleMode): RootRunResult {
  return requireRootEngine().runNewtonRaphson({
    expression: fields['root-newton-expression'],
    dfExpression: fields['root-newton-df'],
    x0: fields['root-newton-x0'],
    machine: machine(fields, 'root-newton'),
    stopping: stopping(fields, 'root-newton'),
    angleMode,
  });
}

function runSecant(fields: MethodFormState, angleMode: AngleMode): RootRunResult {
  return requireRootEngine().runSecant({
    expression: fields['root-secant-expression'],
    x0: fields['root-secant-x0'],
    x1: fields['root-secant-x1'],
    machine: machine(fields, 'root-secant'),
    stopping: stopping(fields, 'root-secant'),
    angleMode,
  });
}

function runFalsePosition(fields: MethodFormState, angleMode: AngleMode): RootRunResult {
  return requireRootEngine().runFalsePosition({
    expression: fields['root-fp-expression'],
    interval: { a: fields['root-fp-a'], b: fields['root-fp-b'] },
    machine: machine(fields, 'root-fp'),
    stopping: stopping(fields, 'root-fp'),
    decisionBasis: (fields['root-fp-decision-basis'] || 'machine') as DecisionBasis,
    signDisplay: (fields['root-fp-sign-display'] || 'both') as SignDisplay,
    angleMode,
  });
}

function runFixedPoint(fields: MethodFormState, angleMode: AngleMode): RootRunResult {
  return requireRootEngine().runFixedPoint({
    gExpression: fields['root-fpi-expression'],
    x0: fields['root-fpi-x0'],
    machine: machine(fields, 'root-fpi'),
    stopping: stopping(fields, 'root-fpi'),
    angleMode,
  });
}

export function runRootMethod(
  method: RootMethod,
  fields: MethodFormState,
  angleMode: AngleMode,
): RootRunResult {
  switch (method) {
    case 'bisection':
      return runBisection(fields, angleMode);
    case 'newton':
      return runNewton(fields, angleMode);
    case 'secant':
      return runSecant(fields, angleMode);
    case 'falsePosition':
      return runFalsePosition(fields, angleMode);
    case 'fixedPoint':
      return runFixedPoint(fields, angleMode);
    default:
      throw new Error(`Unsupported root method: ${method}`);
  }
}

const FAILURE_STOP_REASONS = new Set([
  'invalid-input',
  'invalid-starting-interval',
  'invalid-bracket',
  'discontinuity-detected',
  'relative-tolerance-invalid',
  'singularity-encountered',
  'non-finite-evaluation',
  'derivative-zero',
  'diverged',
  'diverged-step',
  'stagnation',
  'retained-endpoint-stagnation',
  'step-small-residual-large',
  'cycle-detected',
]);

const FAILURE_MESSAGES: Record<string, string> = {
  'invalid-input': 'The root calculation could not finish because one or more inputs are invalid.',
  'invalid-starting-interval': 'Choose an interval where the endpoint signs differ.',
  'invalid-bracket': 'Choose an interval where the endpoint signs differ.',
  'discontinuity-detected': 'The method stopped at a discontinuity or singularity.',
  'relative-tolerance-invalid': 'The relative tolerance check could not be completed for this interval.',
  'singularity-encountered': 'Function evaluation failed during the iteration.',
  'non-finite-evaluation': 'Function evaluation returned a non-finite value.',
  'derivative-zero': 'The derivative is zero or too close to zero, so the method cannot continue.',
  diverged: 'The iteration diverged before a reliable approximation was found.',
  'diverged-step': 'The step grew too quickly to trust convergence.',
  stagnation: 'The method stalled because the denominator is near zero.',
  'retained-endpoint-stagnation': 'False Position retained the same endpoint too long to trust convergence.',
  'step-small-residual-large': 'The step is small, but the residual remains too large to confirm convergence.',
  'cycle-detected': 'The iteration entered a cycle instead of settling to one value.',
};

function hasFailureStopReason(result: RootRunResult): boolean {
  const reason = result.summary?.stopReason;
  return typeof reason === 'string' && FAILURE_STOP_REASONS.has(reason);
}

export function hasValidApproximation(result: RootRunResult): boolean {
  if (hasFailureStopReason(result)) {
    return false;
  }

  const approximation = result.summary?.approximation;
  if (approximation == null) {
    return false;
  }

  return typeof approximation !== 'number' || Number.isFinite(approximation);
}

export function isInvalidRun(result: RootRunResult): boolean {
  return !hasValidApproximation(result);
}

export function resultFailureMessage(result: RootRunResult): string {
  const detail = result.summary?.stopDetail?.trim();
  if (detail) {
    return detail;
  }

  const reason = result.summary?.stopReason;
  if (typeof reason === 'string' && FAILURE_MESSAGES[reason]) {
    return FAILURE_MESSAGES[reason];
  }

  const warning = result.warnings?.[0]?.message?.trim();
  if (warning) {
    return warning;
  }

  return 'The root calculation could not finish. Check the required inputs and run again.';
}

export function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'The root calculation could not finish.';
}
