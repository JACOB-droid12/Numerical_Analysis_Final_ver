import { ListOrdered, Trophy } from 'lucide-react';

import { Button } from './ui/Button';
import { formatValue, stopReasonLabel } from '../lib/resultFormatters';
import type { FixedPointRankingResult, RootPreset, WorkbenchStatus } from '../types/roots';

interface FixedPointRankingPanelProps {
  preset: RootPreset | null;
  currentX0: string;
  result: FixedPointRankingResult | null;
  status: WorkbenchStatus;
  onRun: () => void;
}

function statusLabel(status: string) {
  return status.replace('-', ' ');
}

export function FixedPointRankingPanel({
  preset,
  currentX0,
  result,
  status,
  onRun,
}: FixedPointRankingPanelProps) {
  if (!preset?.ranking) {
    return null;
  }

  return (
    <section className="rounded-xl border border-cyan-400/20 bg-cyan-950/20 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-cyan-200">
            <ListOrdered aria-hidden="true" className="size-4" />
            <h3 className="text-sm font-semibold uppercase tracking-wide">
              Fixed-point ranking
            </h3>
          </div>
          <p className="mt-1 text-sm text-slate-300">
            Rank candidate g(x) formulas for {preset.ranking.target} from p0 = {result?.p0 ?? currentX0}.
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          disabled={status.kind === 'loading'}
          onClick={onRun}
        >
          <Trophy aria-hidden="true" className="size-4" />
          Run ranking
        </Button>
      </div>

      {result ? (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-cyan-900/60 text-xs uppercase tracking-wide text-cyan-200/80">
                <th className="px-3 py-2 font-semibold">Rank</th>
                <th className="px-3 py-2 font-semibold">Candidate</th>
                <th className="px-3 py-2 font-semibold">Class</th>
                <th className="px-3 py-2 font-semibold">Iterations</th>
                <th className="px-3 py-2 font-semibold">Final p</th>
                <th className="px-3 py-2 font-semibold">Final error</th>
                <th className="px-3 py-2 font-semibold">Stop</th>
              </tr>
            </thead>
            <tbody>
              {result.rows.map((row) => (
                <tr key={row.candidate.id} className="border-b border-cyan-950/80">
                  <td className="px-3 py-2 text-slate-100">
                    {row.rank == null ? '-' : row.rank}
                  </td>
                  <td className="max-w-[18rem] px-3 py-2 text-slate-200">
                    {row.candidate.label}
                  </td>
                  <td className="px-3 py-2 capitalize text-slate-200">
                    {statusLabel(row.status)}
                  </td>
                  <td className="px-3 py-2 text-slate-200">{row.iterations}</td>
                  <td className="px-3 py-2 text-slate-200">{formatValue(row.finalValue, 12)}</td>
                  <td className="px-3 py-2 text-slate-200">{formatValue(row.finalError, 12)}</td>
                  <td className="px-3 py-2 text-slate-300">
                    {stopReasonLabel(row.stopReason, 'fixedPoint')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-sm text-slate-300">
            Target value: {formatValue(result.targetValue, 12)}
          </p>
        </div>
      ) : (
        <p className="mt-3 text-sm text-slate-400">
          Run the ranking to classify converged, diverged, cycle, undefined, stalled, and off-target candidates.
        </p>
      )}
    </section>
  );
}
