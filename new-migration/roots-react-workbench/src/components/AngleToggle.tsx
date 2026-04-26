import type { AngleMode } from '../types/roots';

interface AngleToggleProps {
  angleMode: AngleMode;
  onToggle: () => void;
}

export function AngleToggle({ angleMode, onToggle }: AngleToggleProps) {
  const isDegrees = angleMode === 'deg';

  return (
    <button
      type="button"
      onClick={onToggle}
      className="angle-toggle"
      aria-label={`Toggle angle mode. Current mode is ${isDegrees ? 'degrees' : 'radians'}.`}
      aria-pressed={isDegrees}
    >
      <span>Angle</span>
      <span className="angle-segments" aria-hidden="true">
        <span className={!isDegrees ? 'active' : ''}>Rad</span>
        <span className={isDegrees ? 'active' : ''}>Deg</span>
      </span>
    </button>
  );
}
