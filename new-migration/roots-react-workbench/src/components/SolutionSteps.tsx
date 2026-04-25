import { useEffect, useMemo, useRef, useState } from 'react';

import { solutionSteps as buildSolutionSteps, solutionText } from '../lib/resultFormatters';
import type { RootRunResult } from '../types/roots';

interface SolutionStepsProps {
  run: RootRunResult;
}

type CopyStatus = 'idle' | 'success' | 'error';

function methodFormula(run: RootRunResult): string {
  if (run.method === 'bisection') return 'c = (a + b) / 2';
  if (run.method === 'falsePosition') return 'c = (a f(b) - b f(a)) / (f(b) - f(a))';
  if (run.method === 'secant') return 'x next = x - f(x)(x - x prev) / (f(x) - f(x prev))';
  if (run.method === 'fixedPoint') return 'x next = g(x)';
  return "x next = x - f(x) / f'(x)";
}

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
    <section className="solution-panel notebook-paper">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="section-kicker">
            Solution steps (Derivation)
          </h2>
          <p className="mt-3 text-sm text-[var(--ink)]">Iteration rule:</p>
          <p className="mt-2 font-serif text-lg italic">{methodFormula(run)}</p>
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
          className="sr-only"
        >
          {copyStatus === 'success'
            ? 'Copied'
            : copyStatus === 'error'
              ? 'Copy failed'
              : 'Copy solution'}
        </button>
      </div>

      <ol className="solution-list">
        {steps.map((step, index) => (
          <li
            key={`${index}-${step}`}
          >
            <span className="step-number">
              {index + 1}
            </span>
            <span>{step}</span>
          </li>
        ))}
      </ol>
      <p className="mt-5 text-right text-sm text-[var(--ink)]">View full derivation →</p>
    </section>
  );
}
