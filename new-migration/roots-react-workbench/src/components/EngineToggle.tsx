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
    ? 'Modern beta uses the new TypeScript + math.js engine. It is available for testing and comparison.'
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
              aria-label={option.label}
              aria-pressed={engineMode === option.value}
              className={engineMode === option.value ? 'active' : ''}
              onClick={() => onChange(option.value)}
            >
              {option.value === 'modern' ? 'Modern' : option.label}
              {option.value === 'modern' ? <span className="beta-badge">beta</span> : null}
            </button>
          ))}
        </div>
      </div>
      <p className="engine-toggle-help">{description}</p>
      {engineMode === 'modern' ? (
        <p className="engine-beta-notice" role="status">
          Modern beta is active.
        </p>
      ) : null}
    </div>
  );
}
