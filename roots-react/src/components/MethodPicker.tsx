import type { MethodConfig, RootMethod } from '../types/roots';

interface MethodPickerProps {
  activeMethod: RootMethod;
  methods: MethodConfig[];
  onSelect: (method: RootMethod) => void;
}

export function MethodPicker({ activeMethod, methods, onSelect }: MethodPickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {methods.map((method) => {
        const isActive = method.method === activeMethod;

        return (
          <button
            key={method.method}
            type="button"
            onClick={() => onSelect(method.method)}
            aria-pressed={isActive}
            className={[
              'rounded-md border px-3 py-2 text-left text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-sky-400',
              isActive
                ? 'border-sky-500 bg-sky-500/15 text-sky-200'
                : 'border-slate-700 bg-slate-900 text-slate-200 hover:border-slate-500 hover:bg-slate-800',
            ].join(' ')}
          >
            <span className="block">{method.shortLabel}</span>
            <span className="block text-xs font-normal text-slate-400">{method.group}</span>
          </button>
        );
      })}
    </div>
  );
}
