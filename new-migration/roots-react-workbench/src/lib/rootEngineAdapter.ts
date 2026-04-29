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
    scan:
      fields['root-bis-scan-enabled'] === 'yes'
        ? {
            min: fields['root-bis-scan-min'],
            max: fields['root-bis-scan-max'],
            steps: fields['root-bis-scan-steps'],
          }
        : null,
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
    interval: { a: fields['root-newton-a'], b: fields['root-newton-b'] },
    initialStrategy: fields['root-newton-initial-strategy'],
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
    gExpressions: fields['root-fpi-batch-expressions'],
    xSeeds: fields['root-fpi-seeds'],
    seedScan: {
      min: fields['root-fpi-scan-min'],
      max: fields['root-fpi-scan-max'],
      steps: fields['root-fpi-scan-steps'],
    },
    targetExpression: fields['root-fpi-target-expression'],
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
  'complex-evaluation',
  'missing-derivative',
  'invalid-derivative-expression',
  'derivative-zero',
  'diverged',
  'diverged-step',
  'stagnation',
  'retained-endpoint-stagnation',
  'step-small-residual-large',
  'cycle-detected',
]);

const FAILURE_MESSAGES: Record<string, string> = {
  'invalid-input': 'Check the required inputs. Make sure f(x) is filled in and each number is finite.',
  'invalid-starting-interval': 'This interval is not a valid bracket yet. Choose a and b so f(a) and f(b) have opposite signs.',
  'invalid-bracket': 'This interval is not a valid bracket yet. Choose a and b so f(a) and f(b) have opposite signs.',
  'discontinuity-detected': 'The method reached a discontinuity or singularity. Try an interval or starting value away from undefined points.',
  'relative-tolerance-invalid': 'The relative tolerance check could not be completed for this interval. Try an absolute tolerance or a different bracket.',
  'singularity-encountered': 'The function became undefined during the iteration. Check the formula and avoid singular points.',
  'non-finite-evaluation': 'The function produced a non-finite value such as Infinity or NaN during the iteration. Check the formula and starting values.',
  'complex-evaluation': 'The function produced a complex value. This root method expects real-number results.',
  'missing-derivative': 'Newton-Raphson needs a derivative. Enter f′(x), or use Auto derivative when available.',
  'invalid-derivative-expression': 'Check f′(x). The derivative formula could not be evaluated as a real-number expression.',
  'derivative-zero': 'The derivative is zero or too close to zero at the current point. Try a different starting value.',
  diverged: 'The iteration moved away from a reliable root. Try a different starting value or method.',
  'diverged-step': 'The next step grew too large to trust convergence. Try a different starting value.',
  stagnation: 'The method stalled because the denominator is near zero. Try different starting values.',
  'retained-endpoint-stagnation': 'False Position kept the same endpoint for too long. Try a tighter bracket or Bisection for a steadier table.',
  'step-small-residual-large': 'The step is small, but f(x) is still too large to confirm a root. Try more iterations or a different start.',
  'cycle-detected': 'The iteration is repeating values instead of settling. Try a different fixed-point formula or starting value.',
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
  if ((result.rows?.length ?? 0) > 0) {
    return false;
  }
  const helpers = result.helpers;
  if (
    (helpers?.bracketScan?.candidates.length ?? 0) > 0 ||
    (helpers?.fixedPointBatch?.entries.length ?? 0) > 0
  ) {
    return false;
  }
  return !hasValidApproximation(result);
}

export function resultFailureMessage(result: RootRunResult): string {
  const detail = result.summary?.stopDetail?.trim();
  const reason = result.summary?.stopReason;
  const reasonMessage = typeof reason === 'string' ? FAILURE_MESSAGES[reason] : undefined;

  if (reasonMessage) {
    return reasonMessage;
  }

  if (detail) {
    if (
      result.summary?.stopReason === 'invalid-input' &&
      /expression|syntax|parse|unexpected|end of/i.test(detail)
    ) {
      return `Check the expression: ${detail}`;
    }
    return detail;
  }

  const warning = result.warnings?.[0]?.message?.trim();
  if (warning) {
    return warning;
  }

  return 'The root calculation could not finish. Check the required inputs and run again.';
}

export function errorMessage(error: unknown): string {
  if (!(error instanceof Error)) {
    return 'The root calculation could not finish.';
  }

  return /expression|syntax|parse|unexpected|end of/i.test(error.message)
    ? `Check the expression: ${error.message}`
    : error.message;
}
