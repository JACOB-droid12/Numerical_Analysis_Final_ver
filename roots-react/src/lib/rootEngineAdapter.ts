import type {
  AngleMode,
  DecisionBasis,
  MachineConfig,
  MachineMode,
  MethodFormState,
  RootMethod,
  RootRunResult,
  SignDisplay,
  StoppingInput,
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

export function runFixedPointCandidate(
  gExpression: string,
  x0: string,
  candidateMachine: MachineConfig,
  candidateStopping: StoppingInput,
  angleMode: AngleMode,
): RootRunResult {
  return requireRootEngine().runFixedPoint({
    gExpression,
    x0,
    machine: candidateMachine,
    stopping: candidateStopping,
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

export function errorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'The root calculation could not finish.';
}
