import { Play } from 'lucide-react';

import { FixedPointRankingPanel } from './FixedPointRankingPanel';
import { MethodForm } from './MethodForm';
import { PresetSelector } from './PresetSelector';
import { RunControls } from './RunControls';
import type {
  FixedPointRankingResult,
  MethodConfig,
  MethodFormState,
  RootMethod,
  RootPreset,
  WorkbenchStatus,
} from '../types/roots';

interface InputComposerProps {
  activeConfig: MethodConfig;
  activeForm: MethodFormState;
  activePreset: RootPreset | null;
  presetWarningFieldIds: string[];
  rankingResult: FixedPointRankingResult | null;
  selectedPresetId: string;
  status: WorkbenchStatus;
  onChange: (method: RootMethod, fieldId: string, value: string) => void;
  onRun: () => void;
  onRunRanking: () => void;
  onSelectPreset: (presetId: string) => void;
}

export function InputComposer({
  activeConfig,
  activeForm,
  activePreset,
  presetWarningFieldIds,
  rankingResult,
  selectedPresetId,
  status,
  onChange,
  onRun,
  onRunRanking,
  onSelectPreset,
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
        {status.kind === 'idle' || status.kind === 'ready' ? (
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/10 px-3 py-1.5 text-xs font-medium text-emerald-100">
            <Play aria-hidden="true" className="size-3.5" />
            Ready to run
          </div>
        ) : null}
      </div>
      <div className="space-y-5">
        <PresetSelector
          activePreset={activePreset}
          selectedPresetId={selectedPresetId}
          status={status}
          warningFieldIds={presetWarningFieldIds}
          onSelectPreset={onSelectPreset}
        />
        <MethodForm config={activeConfig} formState={activeForm} onChange={onChange} />
        <FixedPointRankingPanel
          currentX0={activeForm['root-fpi-x0'] ?? activePreset?.ranking?.p0 ?? ''}
          preset={activePreset}
          result={rankingResult}
          status={status}
          onRun={onRunRanking}
        />
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
