import { useEffect, useMemo, useRef, useState } from 'react';

import { solutionSteps as buildSolutionSteps, solutionText } from '../lib/resultFormatters';
import type { RootRunResult } from '../types/roots';

interface SolutionStepsProps {
  run: RootRunResult;
}

type CopyStatus = 'idle' | 'success' | 'error';

function formulaForRun(run: RootRunResult) {
  if (run.method === 'bisection') {
    return { label: 'Bisection midpoint formula:', formula: 'p_n = (a_n + b_n) / 2' };
  }
  if (run.method === 'falsePosition') {
    return { label: 'False position formula:', formula: 'p_n = b_n - f(b_n) (b_n - a_n) / (f(b_n) - f(a_n))' };
  }
  if (run.method === 'secant') {
    return { label: 'Secant iteration formula:', formula: 'x_(n+1) = x_n - f(x_n) (x_n - x_(n-1)) / (f(x_n) - f(x_(n-1)))' };
  }
  if (run.method === 'fixedPoint') {
    return { label: 'Fixed-point iteration formula:', formula: 'p_(n+1) = g(p_n)' };
  }
  return { label: 'Newton-Raphson iteration formula:', formula: "x_(n+1) = x_n - f(x_n) / f'(x_n)" };
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
  const formula = useMemo(() => formulaForRun(run), [run]);
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
    <section className="solution-panel">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="section-kicker">
            Solution steps (Derivation)
          </h2>
          <p className="mt-3 text-sm text-[var(--ink)]">{formula.label}</p>
          <p className="formula-line">{formula.formula}</p>
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
    </section>
  );
}
