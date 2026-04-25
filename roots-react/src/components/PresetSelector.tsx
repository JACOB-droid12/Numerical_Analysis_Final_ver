import { LibraryBig } from 'lucide-react';

import type { RootPreset } from '../types/roots';

interface PresetSelectorProps {
  presets: RootPreset[];
  selectedPresetId: string;
  warning: string | null;
  onSelect: (presetId: string) => void;
}

export function PresetSelector({
  presets,
  selectedPresetId,
  warning,
  onSelect,
}: PresetSelectorProps) {
  const selected = presets.find((preset) => preset.id === selectedPresetId) ?? null;
  const groups = Array.from(new Set(presets.map((preset) => preset.group)));

  return (
    <section className="preset-panel" aria-label="Professor and quiz presets">
      <div className="preset-panel-head">
        <div>
          <p className="section-kicker">Professor / Quiz preset</p>
          <p className="preset-description">
            {selected?.description ?? 'Load a classroom setup, then adjust any field before running.'}
          </p>
        </div>
        <LibraryBig aria-hidden="true" />
      </div>
      <select
        className="field-control"
        value={selectedPresetId}
        onChange={(event) => onSelect(event.target.value)}
        aria-label="Select professor or quiz preset"
      >
        <option value="">Custom input</option>
        {groups.map((group) => (
          <optgroup key={group} label={group}>
            {presets
              .filter((preset) => preset.group === group)
              .map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.label}
                </option>
              ))}
          </optgroup>
        ))}
      </select>
      {warning ? (
        <p className="preset-warning" role="alert">
          {warning}
        </p>
      ) : selected ? (
        <p className="preset-status" role="status">
          Preset loaded for {selected.method}.
        </p>
      ) : null}
    </section>
  );
}
