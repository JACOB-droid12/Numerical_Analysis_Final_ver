import { Play } from 'lucide-react';

import { MethodForm } from './MethodForm';
import { RunControls } from './RunControls';
import type { MethodConfig, MethodFormState, RootMethod, WorkbenchStatus } from '../types/roots';

interface InputComposerProps {
  activeConfig: MethodConfig;
  activeForm: MethodFormState;
  status: WorkbenchStatus;
  onChange: (method: RootMethod, fieldId: string, value: string) => void;
  onRun: () => void;
}

export function InputComposer({
  activeConfig,
  activeForm,
  status,
  onChange,
  onRun,
}: InputComposerProps) {
  return (
    <section className="rounded-2xl border border-white/10 bg-slate-950/70 p-4 shadow-xl shadow-black/20 backdrop-blur sm:p-5">
      <div className="mb-5 flex flex-col gap-2 border-b border-white/10 pb-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-200">
            Input composer
          </p>
          <h2 className="mt-1 text-xl font-semibold text-white">{activeConfig.runLabel}</h2>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-100">
          <Play aria-hidden="true" className="size-3.5" />
          Ready to run
        </div>
      </div>
      <div className="space-y-5">
        <MethodForm config={activeConfig} formState={activeForm} onChange={onChange} />
        <RunControls
          disabled={status.kind === 'loading'}
          runLabel={activeConfig.runLabel}
          status={status}
          onRun={onRun}
        />
      </div>
    </section>
  );
}
