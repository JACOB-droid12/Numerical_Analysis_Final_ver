import type { MethodConfig, RootMethod } from '../types/roots';

interface MethodPickerProps {
  activeMethod: RootMethod;
  methods: MethodConfig[];
  onSelect: (method: RootMethod) => void;
}

export function MethodPicker({ activeMethod, methods, onSelect }: MethodPickerProps) {
  return (
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
      {methods.map((method) => {
        const isActive = method.method === activeMethod;

        return (
          <button
            key={method.method}
            type="button"
            onClick={() => onSelect(method.method)}
            aria-pressed={isActive}
            className={[
              'group rounded-xl border px-3 py-3 text-left transition focus:outline-none focus:ring-2 focus:ring-sky-300',
              isActive
                ? 'border-sky-300/70 bg-sky-300 text-slate-950 shadow-lg shadow-sky-950/30'
                : 'border-white/10 bg-white/[0.04] text-slate-200 hover:border-sky-300/40 hover:bg-white/[0.08]',
            ].join(' ')}
          >
            <span className="block text-sm font-semibold">{method.shortLabel}</span>
            <span
              className={[
                'mt-1 block text-xs',
                isActive ? 'text-slate-800' : 'text-slate-400 group-hover:text-slate-300',
              ].join(' ')}
            >
              {method.group}
            </span>
          </button>
        );
      })}
    </div>
  );
}
