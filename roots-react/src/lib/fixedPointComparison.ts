import type {
  FixedPointCandidateRun,
  FixedPointComparisonResult,
  FixedPointComparisonRow,
  FixedPointOutcomeKind,
  FixedPointRankingBlock,
  RootRunResult,
} from '../types/roots';

function numericValue(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'string') {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  if ('approx' in record) return numericValue(record.approx);
  if ('machine' in record) return numericValue(record.machine);
  if ('value' in record) return numericValue(record.value);
  if ('re' in record && 'im' in record) {
    const re = numericValue(record.re);
    const im = numericValue(record.im);
    return im === 0 ? re : null;
  }
  if ('sign' in record && 'num' in record && 'den' in record) {
    const sign = Number(record.sign);
    const num = typeof record.num === 'bigint' ? Number(record.num) : Number(record.num);
    const den = typeof record.den === 'bigint' ? Number(record.den) : Number(record.den);
    if (Number.isFinite(sign) && Number.isFinite(num) && Number.isFinite(den) && den !== 0) {
      return (sign < 0 ? -1 : 1) * (num / den);
    }
  }
  return null;
}

function isNearTarget(run: RootRunResult, targetValue: number | undefined): boolean {
  if (targetValue == null) return true;
  const finalValue = numericValue(run.summary?.approximation);
  if (finalValue == null) return false;
  return Math.abs(finalValue - targetValue) <= 0.001;
}

function classifyRun(
  run: RootRunResult | null,
  targetValue: number | undefined,
  errorMessage?: string,
): FixedPointOutcomeKind {
  if (!run) return errorMessage ? 'undefined' : 'other';
  const reason = run.summary?.stopReason;
  if (reason === 'tolerance-reached' || reason === 'exact-zero' || reason === 'machine-zero') {
    return isNearTarget(run, targetValue) ? 'convergent' : 'stalled';
  }
  if (reason === 'diverged' || reason === 'diverged-step') return 'diverged';
  if (reason === 'cycle-detected') return 'cycle';
  if (reason === 'stagnation' || reason === 'step-small-residual-large') return 'stalled';
  if (reason === 'non-finite-evaluation' || reason === 'singularity-encountered' || reason === 'invalid-input') {
    return 'undefined';
  }

  const step = numericValue(run.summary?.error);
  const finalValue = numericValue(run.summary?.approximation);
  if (Number.isFinite(step) && step != null && step < 0.0001 && finalValue != null && isNearTarget(run, targetValue)) {
    return 'convergent';
  }
  return reason === 'iteration-limit' && finalValue != null ? 'other' : 'other';
}

function score(row: FixedPointComparisonRow): number {
  const step = numericValue(row.finalStep);
  return row.iterations * 1_000_000 + (step ?? Number.MAX_SAFE_INTEGER);
}

function noteText(run: RootRunResult | null, errorMessage?: string): string {
  if (errorMessage) return errorMessage;
  const rows = run?.rows ?? [];
  const finalRow = rows.length ? rows[rows.length - 1] : undefined;
  const note = run?.summary?.stopDetail ?? finalRow?.note;
  return note == null ? '' : String(note);
}

export function buildFixedPointComparison(
  ranking: FixedPointRankingBlock,
  candidateRuns: FixedPointCandidateRun[],
): FixedPointComparisonResult {
  const rows = candidateRuns.map<FixedPointComparisonRow>((candidateRun) => {
    const result = candidateRun.result;
    const outcome = classifyRun(result, ranking.targetValue, candidateRun.errorMessage);
    return {
      candidate: candidateRun.candidate,
      outcome,
      rank: null,
      iterations: result?.rows?.length ?? 0,
      finalValue: result?.summary?.approximation ?? null,
      finalStep: result?.summary?.error ?? null,
      stopReason: result?.summary?.stopReason ?? null,
      note: noteText(result, candidateRun.errorMessage),
    };
  });

  const convergent = rows
    .filter((row) => row.outcome === 'convergent')
    .sort((left, right) => score(left) - score(right));

  convergent.forEach((row, index) => {
    row.rank = index + 1;
  });

  return {
    targetLabel: ranking.targetLabel,
    initialValue: ranking.initialValue,
    rows,
  };
}
