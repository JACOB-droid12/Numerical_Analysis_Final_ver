import { Calculator, Play, RotateCcw } from 'lucide-react';

import { Button } from './ui/Button';
import type { WorkbenchStatus } from '../types/roots';

interface RunControlsProps {
  disabled: boolean;
  rankingAvailable?: boolean;
  runLabel: string;
  status: WorkbenchStatus;
  onRun: () => void;
  onReset: () => void;
  onRunRanking?: () => void;
}

export function RunControls({
  disabled,
  rankingAvailable = false,
  runLabel,
  status,
  onRun,
  onReset,
  onRunRanking,
}: RunControlsProps) {
  const isError = status.kind === 'error';
  const isLoading = status.kind === 'loading';
  const isDisabled = disabled || isLoading;

  return (
    <div className="run-row">
      <Button
        className="run-primary"
        disabled={isDisabled}
        onClick={() => {
          if (isDisabled) {
            return;
          }

          onRun();
        }}
      >
        <Calculator aria-hidden="true" className="size-5" />
        <Play aria-hidden="true" className="size-4" />
        {runLabel.replace('Run Newton-Raphson', 'Run method').replace('Run ', 'Run ')}
      </Button>
      <Button variant="secondary" className="min-h-12 px-5" onClick={onReset}>
        <RotateCcw aria-hidden="true" className="size-4" />
        Reset
      </Button>
      {rankingAvailable ? (
        <Button
          variant="secondary"
          className="run-ranking"
          disabled={isDisabled}
          onClick={() => {
            if (!isDisabled) onRunRanking?.();
          }}
        >
          Run fixed-point ranking
        </Button>
      ) : null}
      <p
        className={[
          'status-text',
          isError ? 'text-[var(--red)]' : 'muted-copy',
        ].join(' ')}
        role={isError ? 'alert' : 'status'}
      >
        {status.message}
      </p>
    </div>
  );
}
