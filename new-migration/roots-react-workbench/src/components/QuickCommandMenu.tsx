import { ArrowRight, X } from 'lucide-react';

import type { MethodPreset } from '../config/methods';
import { METHOD_CONFIG_BY_ID } from '../config/methods';

interface QuickCommandMenuProps {
  presets: MethodPreset[];
  onApply: (preset: MethodPreset) => void;
  onClose: () => void;
}

export function QuickCommandMenu({ presets, onApply, onClose }: QuickCommandMenuProps) {
  return (
    <section className="utility-popover preset-popover" aria-label="Quick command presets">
      <header className="utility-popover-head">
        <div>
          <p className="section-kicker">Quick Command</p>
          <h2>Load a preset</h2>
        </div>
        <button type="button" className="popover-close-button" onClick={onClose} aria-label="Close presets">
          <X aria-hidden="true" />
        </button>
      </header>

      <div className="preset-list">
        {presets.map((preset) => {
          const method = METHOD_CONFIG_BY_ID[preset.method];

          return (
            <button
              key={preset.id}
              type="button"
              className="preset-option"
              onClick={() => {
                onApply(preset);
                onClose();
              }}
            >
              <span>
                <strong>{preset.label}</strong>
                <small>{method.shortLabel} - {preset.description}</small>
              </span>
              <ArrowRight aria-hidden="true" />
            </button>
          );
        })}
      </div>
    </section>
  );
}
