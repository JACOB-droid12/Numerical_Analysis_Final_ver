import { useEffect, useMemo, useRef, useState } from 'react';
import { Check, Copy, X } from 'lucide-react';

import { answerText, finalAnswerParagraph, formatValue, methodLabel } from '../lib/resultFormatters';
import type { RootRunResult, RunFreshness } from '../types/roots';

interface AnswerPanelProps {
  run: RootRunResult | null;
  freshness?: RunFreshness;
  staleReason?: string | null;
}

type CopyStatus = 'idle' | 'success' | 'error';

function numericApproximation(value: unknown): number | null {
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  if (!value || typeof value !== 'object') return null;
  const record = value as Record<string, unknown>;
  if ('approx' in record) return numericApproximation(record.approx);
  if ('machine' in record) return numericApproximation(record.machine);
  if ('value' in record) return numericApproximation(record.value);
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

function formatRootValue(value: unknown): string {
  const numeric = numericApproximation(value);
  if (numeric != null) {
    return numeric.toFixed(8).replace(/0+$/, '').replace(/\.$/, '');
  }
  return formatValue(value, 18);
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

function freshnessNote(freshness: RunFreshness, staleReason: string | null): string {
  if (freshness === 'stale') {
    return staleReason ?? 'This result is outdated because the inputs changed after it was computed.';
  }
  return 'Copy the answer now or inspect the confidence and evidence below.';
}

export function AnswerPanel({ run, freshness = 'current', staleReason = null }: AnswerPanelProps) {
  const [copyStatus, setCopyStatus] = useState<CopyStatus>('idle');
  const [showFinalParagraph, setShowFinalParagraph] = useState(false);
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
  const approximation = formatRootValue(summary?.approximation);
  const copyDisabled = !copyPayload;

  return (
    <section className="answer-panel">
      <header>
        <div>
          <p className="section-kicker">Root (Approximate)</p>
          <p className="answer-root numeric-value">{approximation}</p>
        </div>
        <button
          type="button"
          className="copy-icon-button"
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
        </button>
      </header>

      <div className="meta-row">
          <span
            className={`status-pill ${
              freshness === 'stale'
                ? 'border-[rgba(180,119,93,0.5)] bg-[rgba(180,119,93,0.12)] text-[var(--clay)]'
                : ''
            }`}
          >
            {freshness === 'stale' ? 'Outdated' : 'Current'}
          </span>
          <span>Updated: just now</span>
          <span>Method: {methodLabel(run.method)}</span>
      </div>
      {summary?.stopDetail ? (
        <p className="mt-3 text-xs leading-5 muted-copy">{freshnessNote(freshness, staleReason)} {summary.stopDetail}</p>
      ) : null}
      {paragraph ? (
        <div className="final-answer-block">
          <button
            type="button"
            className="copy-icon-button final-answer-button"
            onClick={() => setShowFinalParagraph((current) => !current)}
          >
            {showFinalParagraph ? 'Hide final answer' : 'Format final answer'}
          </button>
          {showFinalParagraph ? <p>{paragraph}</p> : null}
        </div>
      ) : null}
    </section>
  );
}
