import { AlertTriangle, CheckCircle2, Circle } from 'lucide-react';

import {
  formatValue,
  interpretationText,
  nextActionText,
  stopReasonLabel,
  stoppingText,
} from '../lib/resultFormatters';
import type { RootRunResult } from '../types/roots';

interface StoppingCheckPanelProps {
  run: RootRunResult;
}

function stateFor(run: RootRunResult): 'pass' | 'warn' | 'neutral' {
  const reason = run.summary?.stopReason;
  if (
    reason === 'tolerance-reached' ||
    reason === 'exact-zero' ||
    reason === 'machine-zero' ||
    reason === 'endpoint-root' ||
    reason === 'iteration-limit'
  ) {
    return 'pass';
  }
  if (reason === 'invalid-bracket' || reason === 'invalid-input' || reason === 'diverged' || reason === 'cycle-detected') {
    return 'warn';
  }
  return 'neutral';
}

export function StoppingCheckPanel({ run }: StoppingCheckPanelProps) {
  const state = stateFor(run);
  const Icon = state === 'pass' ? CheckCircle2 : state === 'warn' ? AlertTriangle : Circle;
  const iconClass = state === 'pass' ? 'text-emerald-300' : state === 'warn' ? 'text-amber-300' : 'text-slate-400';

  const items = [
    { label: 'Rule', value: stoppingText(run) },
    { label: 'Result', value: stopReasonLabel(run.summary?.stopReason, run.method) },
    { label: 'Metric', value: formatValue(run.summary?.error ?? run.summary?.bound ?? run.summary?.residual, 12) },
    { label: 'Interpretation', value: interpretationText(run) },
  ];

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-950/80 p-4 shadow-sm shadow-slate-950/20">
      <div className="flex items-start gap-3">
        <Icon aria-hidden="true" className={`mt-0.5 size-5 shrink-0 ${iconClass}`} />
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Categorical stopping check
          </h2>
          <p className="mt-1 text-sm text-slate-300">
            {nextActionText(run)}
          </p>
        </div>
      </div>

      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.label} className="rounded-md border border-slate-800 bg-slate-900/50 px-4 py-3">
            <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              {item.label}
            </dt>
            <dd className="mt-1 text-sm leading-6 text-slate-200">{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
