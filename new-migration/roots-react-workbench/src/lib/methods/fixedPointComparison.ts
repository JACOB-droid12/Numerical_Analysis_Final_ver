import type { AngleMode } from '../math/evaluator';
import { runFixedPoint, type FixedPointResult } from './fixedPoint';

export type FixedPointComparisonStatus =
  | 'converged'
  | 'slow'
  | 'diverged'
  | 'undefined'
  | 'cycle-detected'
  | 'max-iterations';

export type FixedPointComparisonFormula = {
  label: string;
  expression: string;
};

export type FixedPointComparisonInput = {
  formulas: FixedPointComparisonFormula[];
  x0: number;
  tolerance?: number;
  maxIterations?: number;
  angleMode?: AngleMode;
  targetValue?: number;
  targetExpression?: string;
};

export type FixedPointComparisonEntry = {
  label: string;
  expression: string;
  rank: number;
  status: FixedPointComparisonStatus;
  approximation: number | null;
  iterations: number;
  successiveError: number | null;
  targetError: number | null;
  stopReason: string;
  result: FixedPointResult;
  note: string;
};

export type FixedPointComparisonTableRow = {
  n: number;
  [label: string]: number | null;
};

export type FixedPointComparisonResult = {
  entries: FixedPointComparisonEntry[];
  ranking: FixedPointComparisonEntry[];
  tableHeaders: string[];
  tableRows: FixedPointComparisonTableRow[];
  targetValue?: number;
  note: string;
};

const DEFAULT_TOLERANCE = 1e-10;
const DEFAULT_MAX_ITERATIONS = 100;

function lastSuccessiveError(result: FixedPointResult): number | null {
  const approximations = 'approximations' in result ? result.approximations : undefined;
  const last = approximations?.[approximations.length - 1];
  return typeof last?.error === 'number' && Number.isFinite(last.error)
    ? last.error
    : null;
}

function approximationFor(result: FixedPointResult): number | null {
  if (result.ok) {
    return Number.isFinite(result.root) ? result.root : null;
  }

  const approximations = result.approximations;
  const last = approximations?.[approximations.length - 1];
  const candidate = last?.xNext ?? last?.xCurrent;
  return typeof candidate === 'number' && Number.isFinite(candidate) ? candidate : null;
}

function targetErrorFor(approximation: number | null, targetValue?: number): number | null {
  if (approximation == null || targetValue == null || !Number.isFinite(targetValue)) {
    return null;
  }

  return Math.abs(approximation - targetValue);
}

function statusFor(
  result: FixedPointResult,
  targetError: number | null,
  tolerance: number,
): FixedPointComparisonStatus {
  if (!result.ok) {
    if (result.reason === 'divergence-detected') return 'diverged';
    if (result.reason === 'cycle-detected') return 'cycle-detected';
    return 'undefined';
  }

  if (targetError != null) {
    return targetError <= tolerance ? 'converged' : 'slow';
  }

  if (result.stopReason === 'max-iterations') return 'max-iterations';
  return 'converged';
}

function noteFor(status: FixedPointComparisonStatus, result: FixedPointResult): string {
  if (status === 'slow') {
    return 'The iteration produced a fixed point or iterate, but it has not reached the target tolerance.';
  }
  if (status === 'undefined' && !result.ok) {
    return result.message;
  }
  if (status === 'diverged') {
    return 'The iterate exceeded the Modern divergence guardrail.';
  }
  if (status === 'cycle-detected') {
    return 'The iteration repeated a previous value before satisfying tolerance.';
  }
  if (status === 'max-iterations') {
    return 'The iteration reached the configured maximum before satisfying tolerance.';
  }
  return 'Reached the comparison tolerance.';
}

function statusScore(status: FixedPointComparisonStatus): number {
  switch (status) {
    case 'converged':
      return 0;
    case 'slow':
      return 1000;
    case 'max-iterations':
      return 2000;
    case 'cycle-detected':
      return 3000;
    case 'undefined':
      return 4000;
    case 'diverged':
      return 5000;
    default:
      return 9000;
  }
}

function comparisonMetric(entry: FixedPointComparisonEntry): number {
  return entry.targetError
    ?? entry.successiveError
    ?? Number.POSITIVE_INFINITY;
}

function rankEntries(entries: FixedPointComparisonEntry[]): FixedPointComparisonEntry[] {
  return entries
    .slice()
    .sort((left, right) => {
      const statusDelta = statusScore(left.status) - statusScore(right.status);
      if (statusDelta !== 0) return statusDelta;

      if (left.status === 'converged') {
        const iterationDelta = left.iterations - right.iterations;
        if (iterationDelta !== 0) return iterationDelta;
      }

      const metricDelta = comparisonMetric(left) - comparisonMetric(right);
      if (metricDelta !== 0) return metricDelta;

      const iterationDelta = left.iterations - right.iterations;
      if (iterationDelta !== 0) return iterationDelta;

      return left.label.localeCompare(right.label);
    })
    .map((entry, index) => ({
      ...entry,
      rank: index + 1,
    }));
}

function tableRowsFor(
  formulas: FixedPointComparisonFormula[],
  x0: number,
  entries: FixedPointComparisonEntry[],
): FixedPointComparisonTableRow[] {
  const maxRows = entries.reduce((max, entry) => {
    const length = 'approximations' in entry.result
      ? entry.result.approximations?.length ?? 0
      : 0;
    return Math.max(max, length);
  }, 0);
  const rows: FixedPointComparisonTableRow[] = [];

  for (let index = 0; index <= maxRows; index += 1) {
    const row: FixedPointComparisonTableRow = { n: index };
    for (const formula of formulas) {
      if (index === 0) {
        row[formula.label] = x0;
        continue;
      }

      const entry = entries.find((candidate) => candidate.label === formula.label);
      const approximation = 'approximations' in (entry?.result ?? {})
        ? entry?.result.approximations?.[index - 1]
        : undefined;
      row[formula.label] = approximation?.xNext ?? null;
    }
    rows.push(row);
  }

  return rows;
}

export function compareFixedPointFormulas(
  input: FixedPointComparisonInput,
): FixedPointComparisonResult {
  const tolerance = input.tolerance ?? DEFAULT_TOLERANCE;
  const maxIterations = input.maxIterations ?? DEFAULT_MAX_ITERATIONS;
  const angleMode = input.angleMode ?? 'rad';

  const unrankedEntries = input.formulas.map((formula): FixedPointComparisonEntry => {
    const result = runFixedPoint({
      expression: formula.expression,
      x0: input.x0,
      tolerance,
      maxIterations,
      angleMode,
      targetExpression: input.targetExpression,
    });
    const approximation = approximationFor(result);
    const targetError = targetErrorFor(approximation, input.targetValue);
    const status = statusFor(result, targetError, tolerance);

    return {
      label: formula.label,
      expression: formula.expression,
      rank: 0,
      status,
      approximation,
      iterations: result.ok
        ? result.iterations
        : result.approximations?.length ?? 0,
      successiveError: lastSuccessiveError(result),
      targetError,
      stopReason: result.ok ? result.stopReason : result.reason,
      result,
      note: noteFor(status, result),
    };
  });
  const ranking = rankEntries(unrankedEntries);
  const rankByLabel = new Map(ranking.map((entry) => [entry.label, entry.rank]));
  const entries = unrankedEntries.map((entry) => ({
    ...entry,
    rank: rankByLabel.get(entry.label) ?? 0,
  }));

  return {
    entries,
    ranking,
    tableHeaders: ['n', ...input.formulas.map((formula) => `(${formula.label})`)],
    tableRows: tableRowsFor(input.formulas, input.x0, entries),
    ...(input.targetValue == null ? {} : { targetValue: input.targetValue }),
    note: input.targetValue == null
      ? 'Ranking uses convergence status, iteration count, and final successive approximation error.'
      : 'Ranking uses convergence status, iterations to tolerance, and final target error when available.',
  };
}
