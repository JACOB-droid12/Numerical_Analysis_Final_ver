import type { MethodConfig, RootMethod } from '../types/roots';

interface MethodPickerProps {
  activeMethod: RootMethod;
  methods: MethodConfig[];
  onSelect: (method: RootMethod) => void;
}

export function MethodPicker({ activeMethod, methods, onSelect }: MethodPickerProps) {
  const glyphs: Record<RootMethod, string> = {
    bisection: 'Bis',
    newton: 'New',
    secant: 'Sec',
    falsePosition: 'FP',
    fixedPoint: 'Fix',
  };

  return (
    <div className="method-list" role="radiogroup" aria-label="Root method">
      {methods.map((method) => {
        const isActive = method.method === activeMethod;

        return (
          <button
            key={method.method}
            type="button"
            role="radio"
            onClick={() => onSelect(method.method)}
            aria-checked={isActive}
            className="method-tab"
          >
            <span className="method-glyph" aria-hidden="true">{glyphs[method.method]}</span>
            <span>
              <span className="method-name">{method.label}</span>
              <span className="method-group">{method.group}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
