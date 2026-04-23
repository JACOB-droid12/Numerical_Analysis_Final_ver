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
      className="inline-flex items-center gap-2 rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-sm font-medium text-slate-100 transition hover:border-slate-500 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400"
      aria-label={`Toggle angle mode. Current mode is ${isDegrees ? 'degrees' : 'radians'}.`}
      aria-pressed={isDegrees}
    >
      <span className="text-[11px] uppercase tracking-wide text-slate-400">Angle</span>
      <span className="font-semibold tracking-wide">{label}</span>
    </button>
  );
}
