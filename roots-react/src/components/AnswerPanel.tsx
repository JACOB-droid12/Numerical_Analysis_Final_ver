import { useEffect, useMemo, useRef, useState } from 'react';

import { answerText, formatValue, methodLabel } from '../lib/resultFormatters';
import type { RootRunResult, RunFreshness } from '../types/roots';

interface AnswerPanelProps {
  run: RootRunResult | null;
  freshness?: RunFreshness;
  staleReason?: string | null;
}

type CopyStatus = 'idle' | 'success' | 'error';

async function copyText(text: string): Promise<boolean> {
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      return false;
    }
  }

  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', 'true');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  try {
    textarea.select();
    return document.execCommand('copy');
  } catch {
    return false;
  } finally {
    document.body.removeChild(textarea);
  }
}

function freshnessLabel(freshness: RunFreshness): string {
  return freshness === 'stale' ? 'Outdated result' : 'Current result';
}

function freshnessNote(freshness: RunFreshness, staleReason: string | null): string {
  if (freshness === 'stale') {
    return staleReason ?? 'This result is outdated because the inputs changed after it was computed.';
  }
  return 'Copy the answer now or inspect the confidence and evidence below.';
}

export function AnswerPanel({ run, freshness = 'current', staleReason = null }: AnswerPanelProps) {
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle');
  const timerRef = useRef<number | null>(null);

  const copyPayload = useMemo(() => answerText(run), [run]);

  useEffect(
    () => () => {
      if (timerRef.current != null) {
        window.clearTimeout(timerRef.current);
      }
    },
    [],
  );

  const clearCopyTimer = () => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  if (!run) {
    return null;
  }

  const summary = run.summary;
  const approximation = formatValue(summary?.approximation, 18);
  const copyDisabled = !copyPayload;

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-950/80 p-4 shadow-sm shadow-slate-950/20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Answer
          </p>
          <h2 className="text-lg font-semibold text-slate-100">{methodLabel(run.method)}</h2>
        </div>
        <button
          type="button"
          disabled={copyDisabled}
          onClick={async () => {
            if (copyDisabled) {
              return;
            }

            clearCopyTimer();
            setCopyStatus('idle');

            const copied = await copyText(copyPayload);
            if (!copied) {
              setCopyStatus('error');
              return;
            }

            setCopyStatus('success');
            timerRef.current = window.setTimeout(() => {
              setCopyStatus('idle');
              timerRef.current = null;
            }, 1200);
          }}
          aria-live="polite"
          aria-label={
            copyStatus === 'success'
              ? 'Answer copied'
              : copyStatus === 'error'
                ? 'Copy answer failed'
                : 'Copy answer'
          }
          className="inline-flex items-center justify-center rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-800 disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-500"
        >
          {copyStatus === 'success'
            ? 'Copied'
            : copyStatus === 'error'
              ? 'Copy failed'
              : 'Copy answer'}
        </button>
      </div>

      <div className="mt-4 flex flex-col gap-2 rounded-md border border-slate-800 bg-slate-900/50 px-4 py-3">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${
              freshness === 'stale'
                ? 'border-amber-900/60 bg-amber-950/40 text-amber-200'
                : 'border-emerald-900/60 bg-emerald-950/40 text-emerald-200'
            }`}
          >
            {freshnessLabel(freshness)}
          </span>
          <p className="text-sm text-slate-200">{freshnessNote(freshness, staleReason)}</p>
        </div>
      </div>

      <div className="mt-4 rounded-md border border-slate-800 bg-slate-900/70 px-4 py-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Approximate root
        </p>
        <p className="mt-2 break-words text-3xl font-semibold text-sky-300">{approximation}</p>
      </div>

      {summary?.stopDetail ? (
        <p className="mt-3 text-xs leading-5 text-slate-500">{summary.stopDetail}</p>
      ) : null}
    </section>
  );
}
