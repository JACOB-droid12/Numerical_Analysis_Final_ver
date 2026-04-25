import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Copy, X } from 'lucide-react';

import { Button } from './ui/Button';
import {
  answerText,
  finalAnswerParagraph,
  formatValue,
  methodLabel,
} from '../lib/resultFormatters';
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
  const [showParagraph, setShowParagraph] = useState(false);
  const timerRef = useRef<number | null>(null);

  const copyPayload = useMemo(() => answerText(run), [run]);
  const paragraph = useMemo(() => finalAnswerParagraph(run), [run]);

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
    <section className="rounded-xl border border-sky-300/20 bg-slate-950/80 p-4 shadow-[0_24px_80px_rgba(14,165,233,0.14)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Answer
          </p>
          <h2 className="text-lg font-semibold text-slate-100">{methodLabel(run.method)}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={!paragraph}
            onClick={() => setShowParagraph((current) => !current)}
          >
            <Copy aria-hidden="true" className="size-4" />
            Format paragraph
          </Button>
          <Button
            variant="secondary"
            size="sm"
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
          >
            {copyStatus === 'success' ? (
              <Check aria-hidden="true" className="size-4" />
            ) : copyStatus === 'error' ? (
              <X aria-hidden="true" className="size-4" />
            ) : (
              <Copy aria-hidden="true" className="size-4" />
            )}
            {copyStatus === 'success'
              ? 'Copied'
              : copyStatus === 'error'
                ? 'Copy failed'
                : 'Copy answer'}
          </Button>
        </div>
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
        <p className="mt-2 break-words text-4xl font-semibold tracking-normal text-sky-200 sm:text-5xl">{approximation}</p>
      </div>

      {summary?.stopDetail ? (
        <p className="mt-3 text-xs leading-5 text-slate-500">{summary.stopDetail}</p>
      ) : null}

      {showParagraph && paragraph ? (
        <div className="mt-4 rounded-md border border-slate-800 bg-slate-900/70 px-4 py-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Final answer paragraph
          </p>
          <p className="mt-2 text-sm leading-6 text-slate-200">{paragraph}</p>
        </div>
      ) : null}
    </section>
  );
}
