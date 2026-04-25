import { runFixedPointCandidate } from './rootEngineAdapter';
import { formatValue } from './resultFormatters';
import type {
  AngleMode,
  FixedPointRankingConfig,
  FixedPointRankingResult,
  FixedPointRankingRow,
  FixedPointRankingStatus,
  MachineConfig,
  RootRunResult,
  StoppingInput,
} from '../types/roots';

function numericApproximation(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (typeof value === 'bigint') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  if (typeof value === 'object' && value !== null) {
    const record = value as Record<string, unknown>;
    if ('sign' in record && 'num' in record && 'den' in record) {
      const sign = numericApproximation(record.sign);
      const num = numericApproximation(record.num);
      const den = numericApproximation(record.den);
      if (sign != null && num != null && den != null && den !== 0) {
        return (sign < 0 ? -1 : 1) * (num / den);
      }
    }
    if ('re' in record || 'im' in record) {
      const re = numericApproximation(record.re);
      const im = numericApproximation(record.im);
      if (re != null && (im == null || Math.abs(im) < 1e-12)) {
        return re;
      }
      return null;
    }
    return numericApproximation(
      record.approx ?? record.machine ?? record.reference ?? record.value ?? null,
    );
  }
  return null;
}

function classify(run: RootRunResult, targetValue: number): FixedPointRankingStatus {
  const reason = run.summary?.stopReason;
  if (reason === 'cycle-detected') return 'cycle';
  if (reason === 'diverged' || reason === 'diverged-step' || reason === 'iteration-cap') return 'diverged';
  if (reason === 'singularity-encountered' || reason === 'non-finite-evaluation' || reason === 'invalid-input') {
    return 'undefined';
  }
  if (reason === 'stagnation' || reason === 'step-small-residual-large') return 'stalled';

  const approximation = numericApproximation(run.summary?.approximation);
  if (approximation == null) return 'undefined';
  const finalError = Math.abs(approximation - targetValue);
  if (finalError > 0.01) return 'off-target';
  if (
    reason === 'tolerance-reached' ||
    reason === 'exact-zero' ||
    reason === 'machine-zero' ||
    reason === 'iteration-limit'
  ) {
    return 'converged';
  }
  return 'stalled';
}

function noteFor(status: FixedPointRankingStatus, run: RootRunResult | null): string {
  if (!run) return 'The candidate could not be evaluated.';
  if (status === 'converged') return 'Converged to the target root.';
  if (status === 'off-target') return 'Settled, but not near 21^(1/3).';
  if (status === 'cycle') return 'Detected a repeating cycle.';
  if (status === 'diverged') return 'Values moved away or hit the safety cap.';
  if (status === 'undefined') return run.summary?.stopDetail || 'Evaluation became undefined.';
  return run.summary?.stopDetail || 'Iteration stalled before a reliable answer.';
}

export function runFixedPointRanking(
  presetId: string,
  ranking: FixedPointRankingConfig,
  x0: string,
  machine: MachineConfig,
  stopping: StoppingInput,
  angleMode: AngleMode,
): FixedPointRankingResult {
  const rows: FixedPointRankingRow[] = ranking.candidates.map((candidate) => {
    try {
      const run = runFixedPointCandidate(candidate.gExpression, x0, machine, stopping, angleMode);
      const approximation = numericApproximation(run.summary?.approximation);
      const finalError = approximation == null ? null : Math.abs(approximation - ranking.targetValue);
      const status = classify(run, ranking.targetValue);
      return {
        candidate,
        status,
        rank: null,
        iterations: run.rows?.length ?? 0,
        finalValue: run.summary?.approximation ?? null,
        finalError,
        stopReason: run.summary?.stopReason ?? null,
        note: noteFor(status, run),
        run,
      };
    } catch (error) {
      return {
        candidate,
        status: 'undefined',
        rank: null,
        iterations: 0,
        finalValue: null,
        finalError: null,
        stopReason: null,
        note: error instanceof Error ? error.message : 'The candidate could not be evaluated.',
        run: null,
      };
    }
  });

  rows
    .filter((row) => row.status === 'converged')
    .sort((left, right) => {
      if (left.iterations !== right.iterations) return left.iterations - right.iterations;
      return (left.finalError ?? Number.POSITIVE_INFINITY) - (right.finalError ?? Number.POSITIVE_INFINITY);
    })
    .forEach((row, index) => {
      row.rank = index + 1;
    });

  return {
    presetId,
    target: ranking.target,
    targetValue: ranking.targetValue,
    p0: x0,
    rows,
  };
}

export function rankingSummary(result: FixedPointRankingResult | null): string {
  if (!result) return '';
  const winner = result.rows.find((row) => row.rank === 1);
  if (!winner) return `No candidate converged to ${result.target}.`;
  return `${winner.candidate.id.toUpperCase()} ranks first: ${formatValue(winner.finalValue, 12)} in ${winner.iterations} iterations.`;
}
