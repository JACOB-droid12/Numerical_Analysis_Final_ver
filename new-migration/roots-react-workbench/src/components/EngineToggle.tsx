import type { RootEngineMode } from '../lib/rootEngineSelector';

interface EngineToggleProps {
  engineMode: RootEngineMode;
  onChange: (mode: RootEngineMode) => void;
}

const OPTIONS: Array<{ value: RootEngineMode; label: string }> = [
  { value: 'legacy', label: 'Stable' },
  { value: 'modern', label: 'Modern beta/testing' },
];

export function EngineToggle({ engineMode, onChange }: EngineToggleProps) {
  const description = engineMode === 'modern'
    ? 'Modern beta/testing uses the new TypeScript + math.js engine for experimental comparison.'
    : 'Stable is recommended for class use. Modern beta/testing is experimental and used for comparison.';

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
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <p className="engine-toggle-help">{description}</p>
      {engineMode === 'modern' ? (
        <p className="engine-beta-notice" role="status">
          Modern beta/testing is active.
        </p>
      ) : null}
    </div>
  );
}
