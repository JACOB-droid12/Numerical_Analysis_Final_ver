import type { AngleMode } from '../types/roots';

interface AngleToggleProps {
  angleMode: AngleMode;
  onToggle: () => void;
}

export function AngleToggle({ angleMode, onToggle }: AngleToggleProps) {
  const isDegrees = angleMode === 'deg';
  const label = isDegrees ? 'DEG' : 'RAD';

  return (
    <button
      type="button"
      onClick={onToggle}
      className="angle-toggle"
      aria-label={`Toggle angle mode. Current mode is ${isDegrees ? 'degrees' : 'radians'}.`}
      aria-pressed={isDegrees}
    >
      <span>Angle</span>
      <span className="numeric-value font-semibold">{label}</span>
    </button>
  );
}
