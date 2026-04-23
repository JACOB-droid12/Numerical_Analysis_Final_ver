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
      <button
        type="button"
        disabled={isDisabled}
        onClick={() => {
          if (isDisabled) {
            return;
          }

          onRun();
        }}
        className="inline-flex items-center justify-center rounded-md bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
      >
        {runLabel}
      </button>
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
