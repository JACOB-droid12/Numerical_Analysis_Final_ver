import type { RootEngineMode } from '../lib/rootEngineSelector';

interface EngineToggleProps {
  engineMode: RootEngineMode;
  onChange: (mode: RootEngineMode) => void;
}

const OPTIONS: Array<{ value: RootEngineMode; label: string }> = [
  { value: 'legacy', label: 'Legacy' },
  { value: 'modern', label: 'Modern beta' },
];

export function EngineToggle({ engineMode, onChange }: EngineToggleProps) {
  const description = engineMode === 'modern'
    ? 'Modern beta uses the new TypeScript + math.js engine. It is available for testing and comparison. Results may differ slightly in stop reasons, iteration details, and formatting.'
    : 'Legacy is the default engine used by the current app.';

  return (
    <div className="engine-toggle-shell">
      <div className="engine-toggle" aria-label="Root engine selector">
        <span>Engine:</span>
        <div className="engine-toggle-options" role="group" aria-label="Choose root engine">
          {OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
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
          Modern beta is active. This engine is being tested against the legacy engine and high-precision golden cases.
        </p>
      ) : null}
    </div>
  );
}
