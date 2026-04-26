import { METHOD_BY_NAME } from '../config/methods';
import type { IterationRow, RootMethod, RootRunResult, RunFreshness } from '../types/roots';

const EMPTY = 'Not calculated yet';
const FALLBACK = '-';

export function methodLabel(method: RootMethod | undefined): string {
  if (!method) return EMPTY;
  return METHOD_BY_NAME.get(method)?.label ?? method;
}

function isObjectLike(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function formatRationalLike(value: Record<string, unknown>, digits: number): string | null {
  if (!Object.prototype.hasOwnProperty.call(value, 'sign')) return null;
  const sign = Number(value.sign);
  const num = value.num;
  const den = value.den;
  if (!Number.isFinite(sign) || (sign !== -1 && sign !== 0 && sign !== 1)) return null;
  if (typeof num !== 'bigint' && typeof num !== 'number') return null;
  if (typeof den !== 'bigint' && typeof den !== 'number') return null;
  const numerator = `${typeof num === 'bigint' ? num.toString() : String(num)}`;
  const denominator = `${typeof den === 'bigint' ? den.toString() : String(den)}`;
  if (denominator === '1') {
    return sign < 0 ? `-${numerator}` : numerator;
  }
  const numericNum = typeof num === 'bigint' ? Number(num) : num;
  const numericDen = typeof den === 'bigint' ? Number(den) : den;
  if (Number.isFinite(numericNum) && Number.isFinite(numericDen) && numericDen !== 0) {
    return Number(((sign < 0 ? -1 : 1) * Number(numericNum)) / Number(numericDen)).toPrecision(digits);
  }
  return sign < 0 && numerator !== '0' ? `-${numerator}/${denominator}` : `${numerator}/${denominator}`;
}

function formatComplexLike(value: Record<string, unknown>, digits: number): string | null {
  if (!Object.prototype.hasOwnProperty.call(value, 're') || !Object.prototype.hasOwnProperty.call(value, 'im')) {
    return null;
  }
  const re = formatValue(value.re, digits);
  const im = formatValue(value.im, digits);
  if (re === FALLBACK && im === FALLBACK) return null;
  if (im === '0' || im === '0.0') return re;
  const signedIm = String(im).startsWith('-') ? `- ${String(im).slice(1)}` : `+ ${im}`;
  return `${re} ${signedIm}i`;
}

function formatPointLike(value: Record<string, unknown>, digits: number): string | null {
  const hasExact = Object.prototype.hasOwnProperty.call(value, 'exact');
  const hasApprox = Object.prototype.hasOwnProperty.call(value, 'approx');
  const hasMachine = Object.prototype.hasOwnProperty.call(value, 'machine');
  if (!hasExact && !hasApprox && !hasMachine) return null;

  const exact = hasExact ? formatValue(value.exact, digits) : null;
  const approx = hasApprox ? formatValue(value.approx, digits) : null;
  const machine = hasMachine ? formatValue(value.machine, digits) : null;

  const exactPart = exact && exact !== FALLBACK ? exact : null;
  const approxPart = approx && approx !== FALLBACK ? approx : null;
  const machinePart = machine && machine !== FALLBACK ? machine : null;

  if (exactPart && approxPart && exactPart !== approxPart) {
    return `E: ${exactPart} / M: ${approxPart}`;
  }
  if (exactPart && machinePart && exactPart !== machinePart) {
    return `E: ${exactPart} / M: ${machinePart}`;
  }
  if (exactPart) return exactPart;
  if (approxPart) return approxPart;
  if (machinePart) return machinePart;
  return null;
}

function formatBracketPoint(
  point: unknown,
  signDisplay: RootRunResult['signDisplay'],
  digits: number,
): string {
  if (!isObjectLike(point)) return formatValue(point, digits);

  const reference = Object.prototype.hasOwnProperty.call(point, 'reference')
    ? formatValue(point.reference, digits)
    : null;
  const machine = Object.prototype.hasOwnProperty.call(point, 'machine')
    ? formatValue(point.machine, digits)
    : null;
  const exact = Object.prototype.hasOwnProperty.call(point, 'exact')
    ? formatValue(point.exact, digits)
    : null;
  const approx = Object.prototype.hasOwnProperty.call(point, 'approx')
    ? formatValue(point.approx, digits)
    : null;

  const referenceValue = reference && reference !== FALLBACK ? reference : null;
  const machineValue = machine && machine !== FALLBACK ? machine : null;
  const exactValue = exact && exact !== FALLBACK ? exact : null;
  const approxValue = approx && approx !== FALLBACK ? approx : null;

  const exactSide = exactValue ?? referenceValue ?? approxValue;
  const machineSide = machineValue ?? approxValue ?? referenceValue;

  if (signDisplay === 'exact') return exactSide ?? machineSide ?? FALLBACK;
  if (signDisplay === 'machine') return machineSide ?? exactSide ?? FALLBACK;
  if (exactSide && machineSide && exactSide !== machineSide) {
    return `E: ${exactSide} / M: ${machineSide}`;
  }
  return exactSide ?? machineSide ?? FALLBACK;
}

function formatArrayLike(value: unknown[], digits: number): string {
  return `[${value.map((item) => formatValue(item, digits)).join(', ')}]`;
}

function formatObjectEntries(value: Record<string, unknown>, digits: number): string {
  const entries = Object.entries(value).map(([key, entry]) => `${key}: ${formatValue(entry, digits)}`);
  return `{ ${entries.join(', ')} }`;
}

function formatSign(sign: unknown): string {
  if (sign === 0) return '0';
  if (typeof sign === 'number') return sign < 0 ? '-' : '+';
  if (typeof sign === 'string') {
    const normalized = sign.trim();
    if (normalized === '0') return '0';
    if (normalized === '-' || normalized === '-1') return '-';
    if (normalized === '+' || normalized === '1') return '+';
  }
  return '?';
}

function formatSignPair(signDisplay: RootRunResult['signDisplay'], exactSign: unknown, machineSign: unknown): string {
  if (signDisplay === 'exact') return `E(${formatSign(exactSign)})`;
  if (signDisplay === 'machine') return `M(${formatSign(machineSign)})`;
  return `E(${formatSign(exactSign)}) / M(${formatSign(machineSign)})`;
}

export function formatValue(value: unknown, digits = 12): string {
  if (value == null) return 'N/A';
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return String(value);
    return Number(value.toPrecision(digits)).toString();
  }
  if (typeof value === 'bigint') return value.toString();
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return formatArrayLike(value, digits);
  if (isObjectLike(value)) {
    const pointLike = formatPointLike(value, digits);
    if (pointLike) return pointLike;

    const complexLike = formatComplexLike(value, digits);
    if (complexLike) return complexLike;

    const rationalLike = formatRationalLike(value, digits);
    if (rationalLike) return rationalLike;

    if ('approx' in value) {
      return formatValue(value.approx, digits);
    }
    if ('machine' in value) {
      return formatValue(value.machine, digits);
    }
    if ('value' in value) {
      return formatValue(value.value, digits);
    }
    if ('re' in value || 'im' in value || 'num' in value || 'den' in value) {
      return formatObjectEntries(value, digits);
    }
    return formatObjectEntries(value, digits);
  }
  return String(value);
}

export function stopReasonLabel(reason: string | null | undefined, method?: RootMethod): string {
  const map: Record<string, string> = {
    'iteration-limit': 'Completed the requested iterations',
    'iteration-cap': 'Stopped at the safety cap',
    'tolerance-reached': 'Reached the requested tolerance',
    'tolerance-satisfied': 'Tolerance reached',
    'function-tolerance-satisfied': 'Function tolerance reached',
    'residual-tolerance-satisfied': 'Residual tolerance reached',
    'tolerance-already-met': 'Starting interval already meets the tolerance',
    'endpoint-root': 'An endpoint is already the root',
    'exact-root': 'Exact root found',
    'exact-fixed-point': 'Exact fixed point found',
    'exact-zero': method === 'fixedPoint' ? 'The iteration reached an exact fixed point' : 'Reference value is exactly zero',
    'machine-zero': 'Machine value is zero or near zero',
    'invalid-starting-interval': 'Not a valid starting bracket',
    'invalid-bracket': 'The interval does not bracket a sign change',
    'discontinuity-detected': 'Stopped at a discontinuity or singularity',
    'singularity-encountered': 'Function evaluation failed during the iteration',
    'non-finite-evaluation': 'Function evaluation returned a non-finite value',
    'complex-evaluation': 'Complex result rejected',
    'derivative-zero': 'Derivative is zero, so the method cannot continue',
    'missing-derivative': 'Missing derivative',
    'zero-denominator': 'Zero denominator',
    'zero-derivative': 'Derivative is zero, so the method cannot continue',
    stagnation: 'The method stalled because the denominator is near zero',
    diverged: 'Iteration diverged',
    'divergence-detected': 'Divergence detected',
    'diverged-step': 'Step grew too quickly',
    'step-small-residual-large': 'Step is small but residual remains large',
    'retained-endpoint-stagnation': 'Same endpoint retained too long',
    'stagnation-detected': 'Stagnation detected',
    'cycle-detected': 'Iteration entered a cycle',
    'sample-root': 'Sample point is a root',
    'invalid-input': 'Invalid input',
  };

  return reason ? map[reason] ?? reason : EMPTY;
}

export function diagnosticsPreviewText(run: RootRunResult): string {
  if (run.warnings?.length) {
    const message = run.warnings[0]?.message?.trim();
    return message || 'Warnings were reported for this run.';
  }

  const stop = stopReasonLabel(run.summary?.stopReason, run.method);
  const metric = formatValue(run.summary?.error ?? run.summary?.bound ?? run.summary?.residual);
  return `${stop}; final metric: ${metric}.`;
}

export interface ConfidenceItem {
  label: string;
  value: string;
}

export type ConfidenceTone = 'success' | 'review' | 'warning' | 'danger' | 'stale';

export interface ConfidenceStatus {
  label: string;
  tone: ConfidenceTone;
  bars: number;
  ariaLabel: string;
  note: string;
}

export interface MethodFormulaDisplay {
  caption: string;
  formula: string;
}

const HIGH_CONFIDENCE_REASONS = new Set([
  'tolerance-reached',
  'tolerance-already-met',
  'endpoint-root',
  'exact-zero',
  'machine-zero',
]);

const MEDIUM_CONFIDENCE_REASONS = new Set([
  'iteration-limit',
  'iteration-cap',
  'retained-endpoint-stagnation',
  'step-small-residual-large',
]);

const LOW_CONFIDENCE_REASONS = new Set([
  'invalid-starting-interval',
  'invalid-bracket',
  'discontinuity-detected',
  'singularity-encountered',
  'non-finite-evaluation',
  'derivative-zero',
  'stagnation',
  'diverged',
  'diverged-step',
  'cycle-detected',
  'invalid-input',
]);

export function graphCaption(method: RootMethod): string {
  const captions: Record<RootMethod, string> = {
    bisection: 'Bisection should contract the active bracket linearly by halving the interval each step.',
    falsePosition: 'False position uses secant-line interpolation inside the bracket, so progress can be uneven when one endpoint is retained.',
    newton: 'Newton-Raphson can converge quadratically near a simple root when the derivative stays well behaved.',
    secant: 'The secant method usually converges superlinearly near a simple root without requiring an explicit derivative.',
    fixedPoint: 'Fixed-point iteration converges when repeated g(x) evaluations pull the guesses toward a stable fixed point.',
  };

  return captions[method];
}

export function methodFormulaDisplay(method: RootMethod): MethodFormulaDisplay {
  const formulas: Record<RootMethod, MethodFormulaDisplay> = {
    bisection: {
      caption: 'Bisection midpoint formula:',
      formula: 'c_n = (a_n + b_n) / 2',
    },
    falsePosition: {
      caption: 'False position interpolation formula:',
      formula: 'c_n = (a_n f(b_n) - b_n f(a_n)) / (f(b_n) - f(a_n))',
    },
    newton: {
      caption: 'Newton-Raphson iteration formula:',
      formula: "x_{n+1} = x_n - f(x_n) / f'(x_n)",
    },
    secant: {
      caption: 'Secant iteration formula:',
      formula: 'x_{n+1} = x_n - f(x_n)(x_n - x_{n-1}) / (f(x_n) - f(x_{n-1}))',
    },
    fixedPoint: {
      caption: 'Fixed-point iteration formula:',
      formula: 'x_{n+1} = g(x_n)',
    },
  };

  return formulas[method];
}

export function confidenceStatus(
  run: RootRunResult,
  freshness: RunFreshness,
  staleReason: string | null,
): ConfidenceStatus {
  if (freshness === 'stale') {
    const note = staleReason
      ? `Stale result: ${staleReason}`
      : 'Stale result: inputs or settings changed after this run.';
    return {
      label: 'Stale',
      tone: 'stale',
      bars: 0,
      ariaLabel: 'Stale confidence',
      note,
    };
  }

  const firstWarning = run.warnings?.find((warning) => warning.message?.trim())?.message.trim();
  if (firstWarning) {
    const wrongTarget = run.warnings?.some((warning) => warning.code === 'wrong-fixed-point-target');
    return {
      label: wrongTarget ? 'Low' : 'Review',
      tone: wrongTarget ? 'danger' : 'warning',
      bars: wrongTarget ? 1 : 2,
      ariaLabel: wrongTarget ? 'Low confidence, 1 of 5 bars' : 'Review confidence, 2 of 5 bars',
      note: firstWarning,
    };
  }

  const reason = run.summary?.stopReason ?? null;
  const stop = stopReasonLabel(reason, run.method);

  if (reason && HIGH_CONFIDENCE_REASONS.has(reason)) {
    return {
      label: 'High',
      tone: 'success',
      bars: 5,
      ariaLabel: 'High confidence, 5 of 5 bars',
      note: `Current result: ${stop}. The stopping evidence matches the selected precision settings.`,
    };
  }

  if (reason && MEDIUM_CONFIDENCE_REASONS.has(reason)) {
    return {
      label: reason === 'iteration-cap' ? 'Review' : 'Medium',
      tone: 'review',
      bars: 3,
      ariaLabel: 'Medium confidence, 3 of 5 bars',
      note:
        reason === 'iteration-cap'
          ? `${stop}. Treat this as a review result, not a high-confidence convergence result.`
          : `Current result: ${stop}. Inspect the table before tightening precision or increasing iterations.`,
    };
  }

  if (reason && LOW_CONFIDENCE_REASONS.has(reason)) {
    return {
      label: 'Low',
      tone: 'danger',
      bars: 1,
      ariaLabel: 'Low confidence, 1 of 5 bars',
      note: `${stop}. Change the inputs, method, or precision settings before relying on this result.`,
    };
  }

  return {
    label: 'Current',
    tone: 'review',
    bars: 3,
    ariaLabel: 'Current confidence, 3 of 5 bars',
    note: `Current result: ${stop}. Review the final metric and diagnostics for this method.`,
  };
}

export function compactConfidenceItems(run: RootRunResult): ConfidenceItem[] {
  return [
    {
      label: 'Stop',
      value: stopReasonLabel(run.summary?.stopReason ?? null, run.method),
    },
    {
      label: 'Metric',
      value: formatValue(run.summary?.error ?? run.summary?.bound ?? run.summary?.residual),
    },
    {
      label: 'Basis',
      value: run.summary?.residualBasis ?? (run.decisionBasis ? `${run.decisionBasis} signs` : 'Current precision'),
    },
  ];
}

export function staleStatusText(staleReason: string | null): string {
  return staleReason ?? 'This result is from the most recent successful run.';
}

export function stoppingText(run: RootRunResult | null): string {
  if (!run?.stopping) return EMPTY;
  const stopping = run.stopping;
  if (stopping.kind === 'epsilon') {
    const toleranceLabel = stopping.toleranceType ? `${stopping.toleranceType} ` : '';
    const actual = stopping.actualIterations ?? run.rows?.length ?? stopping.iterationsRequired ?? 0;
    const planned = stopping.plannedIterations;
    const iterationText =
      planned != null && actual != null && planned !== actual
        ? `iterations tried = ${actual} (planned ${planned})`
        : `iterations tried = ${actual}`;
    return `${toleranceLabel}epsilon = ${stopping.input}, ${iterationText}`;
  }
  if (run.method === 'bisection') {
    return `n = ${stopping.input}, epsilon <= ${formatValue(stopping.epsilonBound)}`;
  }
  return `n = ${stopping.input}, final |error| = ${formatValue(run.summary?.error)}`;
}

export function interpretationText(run: RootRunResult | null): string {
  if (!run?.summary) return 'Run the method to see a short interpretation.';
  const reason = run.summary.stopReason;
  if (reason === 'iteration-limit') {
    return 'You stopped after the requested iterations, so this is the answer for the fixed-n version of the problem.';
  }
  if (reason === 'tolerance-reached') {
    return 'The method met the requested tolerance under the current precision settings.';
  }
  if (reason === 'endpoint-root') {
    return 'One endpoint is already the root, so no iteration is needed.';
  }
  if (reason === 'exact-zero' || reason === 'machine-zero') {
    return run.method === 'fixedPoint'
      ? 'The iteration landed on a fixed point under the current precision rule.'
      : 'The function value is zero or machine-zero at the reported approximation.';
  }
  if (reason === 'cycle-detected') {
    return 'The fixed-point iteration repeated a cycle instead of settling to one value.';
  }
  if (reason === 'iteration-cap') {
    return 'The safety cap was reached before the requested tolerance was met.';
  }
  return stopReasonLabel(reason, run.method);
}

export function nextActionText(run: RootRunResult | null): string {
  if (!run?.summary) return 'Run the method to see the next recommended action.';
  const reason = run.summary.stopReason;
  if (reason === 'iteration-limit') return 'Need a smaller error? Increase n or switch to tolerance mode.';
  if (reason === 'tolerance-reached') return 'Copy the answer or open the evidence if you need to show work.';
  if (reason === 'invalid-bracket' || reason === 'invalid-starting-interval') return 'Choose an interval where the endpoint signs differ.';
  if (reason === 'derivative-zero') return 'Try a different starting value or check the derivative.';
  if (reason === 'iteration-cap') return 'Change the starting value or method if the table is not improving.';
  return 'Review the diagnostics and iteration table before changing inputs.';
}

export function answerText(run: RootRunResult | null): string {
  if (!run?.summary) return '';
  return [
    `Method: ${methodLabel(run.method)}`,
    `Approximate root: ${formatValue(run.summary.approximation, 18)}`,
    `Stopping result: ${stopReasonLabel(run.summary.stopReason, run.method)}`,
    `Stopping parameters: ${stoppingText(run)}`,
  ].join('\n');
}

export function solutionText(run: RootRunResult | null): string {
  if (!run) return '';
  const steps = solutionSteps(run);
  const config = METHOD_BY_NAME.get(run.method);
  const tableHeaders = tableHeadersForRun(run);
  const table =
    config && run.rows?.length
      ? [
          tableHeaders.join(' | '),
          ...run.rows.map((row) => tableValuesForRow(run.method, row, run).join(' | ')),
        ]
      : [];
  const helperLines: string[] = [];
  if (run.helpers?.requiredIterations) {
    helperLines.push(
      `Required iterations: N = ${run.helpers.requiredIterations.requiredIterations} for tolerance ${run.helpers.requiredIterations.tolerance}.`,
    );
  }
  if (run.helpers?.derivative) {
    helperLines.push(`Newton derivative (${run.helpers.derivative.source}): ${run.helpers.derivative.canonical}`);
  }
  if (run.helpers?.newtonInitial) {
    helperLines.push(`Newton initial value: ${formatValue(run.helpers.newtonInitial.x0, 18)} (${run.helpers.newtonInitial.strategy}).`);
  }
  if (run.helpers?.fixedPointBatch?.entries.length) {
    helperLines.push('Fixed-point ranking:');
    run.helpers.fixedPointBatch.entries.slice(0, 6).forEach((entry) => {
      helperLines.push(
        `${entry.rank}. ${entry.canonical || entry.gExpression}, x0=${formatValue(entry.x0)}, status=${entry.status}, iterations=${entry.iterations}, target residual=${formatValue(entry.targetResidual ?? entry.residual)}`,
      );
    });
  }
  if (run.helpers?.bracketScan?.solutions.length) {
    helperLines.push('All-root bracket scan:');
    run.helpers.bracketScan.solutions.forEach((solution, index) => {
      helperLines.push(
        `${index + 1}. [${formatValue(solution.a)}, ${formatValue(solution.b)}] -> ${formatValue(solution.approximation)} (${stopReasonLabel(solution.stopReason, 'bisection')})`,
      );
    });
  }
  return [
    `Method: ${methodLabel(run.method)}`,
    `Expression: ${run.canonical || run.expression || 'N/A'}`,
    `Approximate root: ${formatValue(run.summary?.approximation, 18)}`,
    `Stopping condition: ${stoppingText(run)}`,
    `Stopping result: ${stopReasonLabel(run.summary?.stopReason, run.method)}`,
    `Final residual: ${formatValue(run.summary?.residual, 18)}`,
    '',
    'Steps:',
    ...steps.map((step, index) => `${index + 1}. ${step}`),
    ...(helperLines.length ? ['', 'Workflow checks:', ...helperLines] : []),
    ...(table.length ? ['', 'Iteration table:', ...table] : []),
    '',
    `Final answer: x ≈ ${formatValue(run.summary?.approximation, 18)}.`,
  ].join('\n');
}

export function solutionSteps(run: RootRunResult): string[] {
  const expression = run.canonical || run.expression || 'the expression';
  const approx = formatValue(run.summary?.approximation, 18);
  const count = run.rows?.length ?? 0;
  const machine = run.machine ? `Use ${run.machine.k}-digit ${run.machine.mode} arithmetic.` : '';

  if (run.method === 'bisection') {
    return [
      `Apply Bisection to f(x) = ${expression}.`,
      `Use the current bracket and selected sign decision basis.`,
      run.stopping?.kind === 'epsilon'
        ? `Stop when the requested tolerance is met: epsilon = ${run.stopping.input}.`
        : `Run for n = ${run.stopping?.input ?? count} iterations.`,
      `The approximate root after ${count} iteration${count === 1 ? '' : 's'} is x ≈ ${approx}.`,
      machine,
    ].filter(Boolean);
  }

  if (run.method === 'falsePosition') {
    return [
      `Apply False Position to f(x) = ${expression}.`,
      'Use linear interpolation inside the active bracket.',
      run.stopping?.kind === 'epsilon'
        ? `Stop when the requested tolerance is met: epsilon = ${run.stopping.input}.`
        : `Run for n = ${run.stopping?.input ?? count} iterations.`,
      `The approximate root after ${count} iteration${count === 1 ? '' : 's'} is x ≈ ${approx}.`,
      machine,
    ].filter(Boolean);
  }

  if (run.method === 'newton') {
    return [
      `Apply Newton-Raphson to f(x) = ${expression}.`,
      "Use x next = x - f(x) / f'(x).",
      run.stopping?.kind === 'epsilon'
        ? `Stop when |x next - x| < epsilon = ${run.stopping.input}.`
        : `Run for n = ${run.stopping?.input ?? count} iterations.`,
      `The approximate root after ${count} iteration${count === 1 ? '' : 's'} is x ≈ ${approx}.`,
      machine,
    ].filter(Boolean);
  }

  if (run.method === 'secant') {
    return [
      `Apply the Secant method to f(x) = ${expression}.`,
      'Use x next = x - f(x)(x - x prev) / (f(x) - f(x prev)).',
      run.stopping?.kind === 'epsilon'
        ? `Stop when |x next - x| < epsilon = ${run.stopping.input}.`
        : `Run for n = ${run.stopping?.input ?? count} iterations.`,
      `The approximate root after ${count} iteration${count === 1 ? '' : 's'} is x ≈ ${approx}.`,
      machine,
    ].filter(Boolean);
  }

  return [
    `Apply fixed-point iteration with g(x) = ${expression}.`,
    'Use x next = g(x).',
    run.stopping?.kind === 'epsilon'
      ? `Stop when |x next - x| < epsilon = ${run.stopping.input}.`
      : `Run for n = ${run.stopping?.input ?? count} iterations.`,
    `The approximate fixed point after ${count} iteration${count === 1 ? '' : 's'} is x ≈ ${approx}.`,
    machine,
  ].filter(Boolean);
}

function bracketSignsText(row: IterationRow, signDisplay: RootRunResult['signDisplay']): string {
  const exactSigns = isObjectLike(row.exactSigns) ? row.exactSigns : {};
  const machineSigns = isObjectLike(row.machineSigns) ? row.machineSigns : {};
  const labels = ['a', 'b', 'c'] as const;

  return labels
    .map((label) => `${label}: ${formatSignPair(signDisplay, exactSigns[label], machineSigns[label])}`)
    .join(', ');
}

function bracketDecisionText(decision: unknown): string {
  if (decision === 'left') return 'Keep [a, c]';
  if (decision === 'right') return 'Keep [c, b]';
  return decision == null ? '' : String(decision);
}

export function tableValuesForRow(
  method: RootMethod,
  row: IterationRow,
  run?: { engine?: unknown; signDisplay?: RootRunResult['signDisplay'] } | null,
): string[] {
  if (run?.engine === 'modern') {
    if (method === 'bisection') {
      return [
        String(row.iteration),
        formatValue(row.lower ?? row.a),
        formatValue(row.upper ?? row.b),
        formatValue(row.midpoint ?? row.c),
        formatValue(row.fMidpoint ?? row.fc),
        formatValue(row.error),
      ];
    }
    if (method === 'falsePosition') {
      return [
        String(row.iteration),
        formatValue(row.lower ?? row.a),
        formatValue(row.upper ?? row.b),
        formatValue(row.point ?? row.c),
        formatValue(row.fPoint ?? row.fc),
        formatValue(row.error),
      ];
    }
    if (method === 'secant') {
      return [
        String(row.iteration),
        formatValue(row.xPrevious ?? row.xPrev),
        formatValue(row.xCurrent ?? row.xn),
        formatValue(row.xNext),
        formatValue(row.fNext),
        formatValue(row.error),
      ];
    }
    if (method === 'newton') {
      return [
        String(row.iteration),
        formatValue(row.xCurrent ?? row.xn),
        formatValue(row.fCurrent ?? row.fxn),
        formatValue(row.derivativeCurrent ?? row.dfxn),
        formatValue(row.xNext),
        formatValue(row.error),
      ];
    }
    return [
      String(row.iteration),
      formatValue(row.xCurrent ?? row.xn),
      formatValue(row.xNext ?? row.gxn),
      formatValue(row.error),
      formatValue(row.residual),
    ];
  }

  if (method === 'bisection' || method === 'falsePosition') {
    return [
      String(row.iteration),
      formatValue(row.a),
      formatValue(row.b),
      formatValue(row.c),
      formatBracketPoint(row.fa, run?.signDisplay ?? 'both', 12),
      formatBracketPoint(row.fb, run?.signDisplay ?? 'both', 12),
      formatBracketPoint(row.fc, run?.signDisplay ?? 'both', 12),
      bracketSignsText(row, run?.signDisplay ?? 'both'),
      bracketDecisionText(row.decision),
      formatValue(row.width),
      formatValue(row.bound),
      formatValue(row.error),
      String(row.note ?? ''),
    ];
  }
  if (method === 'newton') {
    return [
      String(row.iteration),
      formatValue(row.xn),
      formatValue(row.fxn),
      formatValue(row.dfxn),
      formatValue(row.xNext),
      formatValue(row.error),
      String(row.note ?? ''),
    ];
  }
  if (method === 'secant') {
    return [
      String(row.iteration),
      formatValue(row.xPrev),
      formatValue(row.xn),
      formatValue(row.fxPrev),
      formatValue(row.fxn),
      formatValue(row.xNext),
      formatValue(row.error),
      String(row.note ?? ''),
    ];
  }
  return [
    String(row.iteration),
    formatValue(row.xn),
    formatValue(row.gxn),
    formatValue(row.error),
    String(row.note ?? ''),
  ];
}

export function tableHeadersForRun(run: RootRunResult, fallbackHeaders?: string[]): string[] {
  if (run.engine !== 'modern') {
    return fallbackHeaders ?? METHOD_BY_NAME.get(run.method)?.tableHeaders ?? [];
  }

  if (run.method === 'bisection') {
    return ['n', 'aₙ', 'bₙ', 'pₙ', 'f(pₙ)', 'Error'];
  }
  if (run.method === 'falsePosition') {
    return ['n', 'aₙ', 'bₙ', 'pₙ', 'f(pₙ)', 'Error'];
  }
  if (run.method === 'secant') {
    return ['n', 'pₙ₋₂', 'pₙ₋₁', 'pₙ', 'f(pₙ)', 'Error'];
  }
  if (run.method === 'newton') {
    return ['n', 'pₙ', 'f(pₙ)', 'f′(pₙ)', 'pₙ₊₁', 'Error'];
  }
  return ['n', 'pₙ₋₁', 'pₙ = g(pₙ₋₁)', 'Error', 'Residual'];
}
