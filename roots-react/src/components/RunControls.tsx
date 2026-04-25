import { Play } from 'lucide-react';

import { Button } from './ui/Button';
import type { WorkbenchStatus } from '../types/roots';

interface RunControlsProps {
  disabled: boolean;
  runLabel: string;
  status: WorkbenchStatus;
  onRun: () => void;
}

export function RunControls({ disabled, runLabel, status, onRun }: RunControlsProps) {
  const isError = status.kind === 'error';
  const isLoading = status.kind === 'loading';
  const isDisabled = disabled || isLoading;

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <Button
        disabled={isDisabled}
        onClick={() => {
          if (isDisabled) {
            return;
          }

          onRun();
        }}
      >
        <Play aria-hidden="true" className="size-4" />
        {runLabel}
      </Button>
      <p
        className={[
          'text-sm',
          isError ? 'text-rose-300' : 'text-slate-400',
        ].join(' ')}
        role={isError ? 'alert' : 'status'}
      >
        {status.message}
      </p>
    </div>
  );
}
