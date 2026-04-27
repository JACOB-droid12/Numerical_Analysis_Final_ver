import { evaluateExpression, type AngleMode } from '../math/evaluator';

export type BisectionScanOptions = {
  min?: number;
  max?: number;
  steps?: number;
  angleMode?: AngleMode;
};

export type BisectionScanCandidate = {
  lower: number;
  upper: number;
  fLower: number;
  fUpper: number;
  kind: 'sign-change' | 'endpoint-root';
  note?: string;
};

export type BisectionScanResult =
  | {
      ok: true;
      range: { min: number; max: number; steps: number };
      candidates: BisectionScanCandidate[];
      warnings: string[];
      note: string;
    }
  | {
      ok: false;
      range: { min: number; max: number; steps: number };
      candidates: [];
      warnings: string[];
      note: string;
      message: string;
    };

const DEFAULT_SCAN_MIN = -10;
const DEFAULT_SCAN_MAX = 10;
const DEFAULT_SCAN_STEPS = 20;
const ZERO_TOLERANCE = 1e-14;

function sign(value: number): number {
  if (Math.abs(value) <= ZERO_TOLERANCE) return 0;
  return value < 0 ? -1 : 1;
}

function normalizeScanOptions(options: BisectionScanOptions = {}) {
  const min = options.min ?? DEFAULT_SCAN_MIN;
  const max = options.max ?? DEFAULT_SCAN_MAX;
  const steps = options.steps ?? DEFAULT_SCAN_STEPS;

  return {
    min,
    max,
    steps,
    angleMode: options.angleMode ?? 'rad',
  };
}

function evaluateScanPoint(
  expression: string,
  x: number,
  angleMode: AngleMode,
): { ok: true; value: number } | { ok: false; message: string } {
  const result = evaluateExpression(
    expression,
    { x },
    { mode: 'legacy-compatible', angleMode },
  );

  if (!result.ok) {
    return { ok: false, message: result.error.message };
  }

  if (typeof result.value !== 'number' || !Number.isFinite(result.value)) {
    return { ok: false, message: `f(${x}) did not evaluate to a finite real number.` };
  }

  return { ok: true, value: result.value };
}

export function scanBisectionBrackets(
  expression: string,
  options: BisectionScanOptions = {},
): BisectionScanResult {
  const normalized = normalizeScanOptions(options);
  const range = {
    min: normalized.min,
    max: normalized.max,
    steps: normalized.steps,
  };

  if (
    !expression.trim() ||
    !Number.isFinite(range.min) ||
    !Number.isFinite(range.max) ||
    range.min >= range.max ||
    !Number.isInteger(range.steps) ||
    range.steps < 1
  ) {
    return {
      ok: false,
      range,
      candidates: [],
      warnings: ['Invalid bracket scan options.'],
      note: 'Bracket scan requires a non-empty expression, min < max, and at least one step.',
      message: 'Invalid bracket scan options.',
    };
  }

  const candidates: BisectionScanCandidate[] = [];
  const warnings: string[] = [];
  const stepWidth = (range.max - range.min) / range.steps;
  let previousX = range.min;
  let previous = evaluateScanPoint(expression, previousX, normalized.angleMode);

  if (!previous.ok) {
    warnings.push(previous.message);
  } else if (sign(previous.value) === 0) {
    candidates.push({
      lower: previousX,
      upper: previousX,
      fLower: previous.value,
      fUpper: previous.value,
      kind: 'endpoint-root',
      note: 'Scan point evaluated to an endpoint root.',
    });
  }

  for (let index = 1; index <= range.steps; index += 1) {
    const currentX = index === range.steps
      ? range.max
      : range.min + stepWidth * index;
    const current = evaluateScanPoint(expression, currentX, normalized.angleMode);

    if (!current.ok) {
      warnings.push(current.message);
      previousX = currentX;
      previous = current;
      continue;
    }

    if (sign(current.value) === 0) {
      candidates.push({
        lower: currentX,
        upper: currentX,
        fLower: current.value,
        fUpper: current.value,
        kind: 'endpoint-root',
        note: 'Scan point evaluated to an endpoint root.',
      });
    }

    if (previous.ok && sign(previous.value) * sign(current.value) < 0) {
      candidates.push({
        lower: previousX,
        upper: currentX,
        fLower: previous.value,
        fUpper: current.value,
        kind: 'sign-change',
      });
    }

    previousX = currentX;
    previous = current;
  }

  return {
    ok: true,
    range,
    candidates,
    warnings,
    note: candidates.length > 0
      ? `Found ${candidates.length} bracket candidate${candidates.length === 1 ? '' : 's'}.`
      : 'No sign-change bracket candidates were found in the scan range.',
  };
}
