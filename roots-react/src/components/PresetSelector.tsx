import { AlertTriangle, BookOpen } from 'lucide-react';

import { presetGroups } from '../config/presets';
import type { RootPreset, WorkbenchStatus } from '../types/roots';

interface PresetSelectorProps {
  selectedPresetId: string;
  activePreset: RootPreset | null;
  warningFieldIds: string[];
  status: WorkbenchStatus;
  onSelectPreset: (presetId: string) => void;
}

export function PresetSelector({
  selectedPresetId,
  activePreset,
  warningFieldIds,
  status,
  onSelectPreset,
}: PresetSelectorProps) {
  const groups = presetGroups();
  const hasWarning = warningFieldIds.length > 0;

  return (
    <section className="rounded-xl border border-slate-800 bg-slate-900/50 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-sky-200">
            <BookOpen aria-hidden="true" className="size-4" />
            <h3 className="text-sm font-semibold uppercase tracking-wide">Professor presets</h3>
          </div>
          <p className="mt-1 text-sm text-slate-400">
            Load quiz and lecture cases directly into the method form.
          </p>
        </div>
        <label className="flex min-w-0 flex-1 flex-col gap-2 lg:max-w-[31rem]">
          <span className="text-sm font-medium text-slate-200">Preset catalog</span>
          <select
            value={selectedPresetId}
            onChange={(event) => onSelectPreset(event.target.value)}
            className="w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-slate-100 transition focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-400"
          >
            <option value="">Custom problem</option>
            {groups.map((group) => (
              <optgroup key={group.group} label={group.group}>
                {group.presets.map((preset) => (
                  <option key={preset.id} value={preset.id}>
                    {preset.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
      </div>

      {activePreset ? (
        <p className="mt-3 text-sm text-slate-300">
          Loaded: <span className="font-medium text-slate-100">{activePreset.label}</span>
        </p>
      ) : null}

      {hasWarning ? (
        <p
          className="mt-3 flex gap-2 rounded-md border border-amber-900/60 bg-amber-950/40 px-3 py-2 text-sm text-amber-100"
          role="alert"
        >
          <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          The population model contains division by x. Avoid x = 0 in{' '}
          {warningFieldIds.join(', ')} before running.
        </p>
      ) : null}

      {status.kind === 'ready' && activePreset ? (
        <p className="mt-2 text-xs text-slate-500">
          Preset values are editable; changing any field marks the last run as stale.
        </p>
      ) : null}
    </section>
  );
}
