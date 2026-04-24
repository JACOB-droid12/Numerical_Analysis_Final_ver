import { useEffect, useMemo, useRef, useState } from 'react';

import { solutionSteps as buildSolutionSteps, solutionText } from '../lib/resultFormatters';
import type { RootRunResult } from '../types/roots';

interface SolutionStepsProps {
  run: RootRunResult;
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

export function SolutionSteps({ run }: SolutionStepsProps) {
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle');
  const timerRef = useRef<number | null>(null);
  const steps = useMemo(() => buildSolutionSteps(run), [run]);
  const copyPayload = useMemo(() => solutionText(run), [run]);
  const copyDisabled = !copyPayload;

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

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-950/80 p-4 shadow-sm shadow-slate-950/20">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-400">
            Solution steps
          </h2>
          <p className="mt-1 text-sm text-slate-500">{steps.length} step{steps.length === 1 ? '' : 's'}</p>
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
              ? 'Solution copied'
              : copyStatus === 'error'
                ? 'Copy solution failed'
                : 'Copy solution'
          }
          className="inline-flex items-center justify-center rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-200 transition hover:border-slate-500 hover:bg-slate-800 disabled:cursor-not-allowed disabled:border-slate-800 disabled:text-slate-500"
        >
          {copyStatus === 'success'
            ? 'Copied'
            : copyStatus === 'error'
              ? 'Copy failed'
              : 'Copy solution'}
        </button>
      </div>

      <ol className="mt-4 space-y-2">
        {steps.map((step, index) => (
          <li
            key={`${index}-${step}`}
            className="rounded-md border border-slate-800 bg-slate-900/50 px-4 py-3 text-sm leading-6 text-slate-200"
          >
            <span className="mr-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {index + 1}
            </span>
            {step}
          </li>
        ))}
      </ol>
    </section>
  );
}
