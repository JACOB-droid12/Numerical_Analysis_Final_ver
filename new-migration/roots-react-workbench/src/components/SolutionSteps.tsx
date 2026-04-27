import { useMemo } from 'react';

import { useCopyFeedback } from '../hooks/useCopyFeedback';
import { methodFormulaDisplay, solutionSteps as buildSolutionSteps, solutionText } from '../lib/resultFormatters';
import type { RootRunResult } from '../types/roots';
import { PanelActionButton } from './ui/PanelActionButton';

interface SolutionStepsProps {
  run: RootRunResult;
}

export function SolutionSteps({ run }: SolutionStepsProps) {
  const { copyStatus, copyText } = useCopyFeedback();
  const steps = useMemo(() => buildSolutionSteps(run), [run]);
  const formulaDisplay = useMemo(() => methodFormulaDisplay(run.method), [run.method]);
  const copyPayload = useMemo(() => solutionText(run), [run]);
  const copyDisabled = !copyPayload;

  return (
    <section className="solution-panel">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="section-kicker">
            Solution steps (Derivation)
          </h2>
          <p className="formula-caption">{formulaDisplay.caption}</p>
          <p className="formula-display">{formulaDisplay.formula}</p>
        </div>
        <PanelActionButton
          display="compact"
          disabled={copyDisabled}
          onClick={async () => {
            if (copyDisabled) {
              return;
            }

            await copyText(copyPayload);
          }}
          aria-live="polite"
          aria-label={
            copyStatus === 'success'
              ? 'Solution steps copied'
              : copyStatus === 'error'
                ? 'Copy solution steps failed'
                : 'Copy solution steps'
          }
        >
          {copyStatus === 'success'
            ? 'Copied'
            : copyStatus === 'error'
              ? 'Failed'
              : 'Copy steps'}
        </PanelActionButton>
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
