import type { RootEngineMode } from '../lib/rootEngineSelector';

interface EngineToggleProps {
  engineMode: RootEngineMode;
  onChange: (mode: RootEngineMode) => void;
}

const OPTIONS: Array<{ value: RootEngineMode; label: string }> = [
  { value: 'modern', label: 'Modern engine' },
  { value: 'legacy', label: 'Legacy compatibility fallback' },
];

export function EngineToggle({ engineMode, onChange }: EngineToggleProps) {
  const description = engineMode === 'modern'
    ? 'Modern engine is the default. Legacy compatibility fallback is retained for strict legacy machine-arithmetic behavior and compatibility checks.'
    : 'Legacy compatibility fallback is retained for strict stepwise machine-arithmetic behavior and compatibility checks.';

  return (
    <div className="engine-toggle-shell">
      <div className="engine-toggle" aria-label="Root engine selector">
        <span>Engine mode:</span>
        <div className="engine-toggle-options" role="group" aria-label="Choose root engine">
          {OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              aria-label={option.label}
              aria-pressed={engineMode === option.value}
              className={engineMode === option.value ? 'active' : ''}
              onClick={() => onChange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <p className="engine-toggle-help">{description}</p>
      {engineMode === 'modern' ? (
        <p className="engine-beta-notice" role="status">
          Modern engine is active.
        </p>
      ) : null}
    </div>
  );
}
