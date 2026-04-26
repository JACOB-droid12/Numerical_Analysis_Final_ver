import type { MethodConfig, RootMethod } from '../types/roots';

interface MethodPickerProps {
  activeMethod: RootMethod;
  methods: MethodConfig[];
  onSelect: (method: RootMethod) => void;
}

export function MethodPicker({ activeMethod, methods, onSelect }: MethodPickerProps) {
  const glyphs: Record<RootMethod, string> = {
    bisection: '↔',
    newton: 'ƒ′',
    secant: '∕∕',
    falsePosition: '×',
    fixedPoint: '○↻',
  };

  return (
    <div className="method-list">
      {methods.map((method) => {
        const isActive = method.method === activeMethod;

        return (
          <button
            key={method.method}
            type="button"
            onClick={() => onSelect(method.method)}
            aria-pressed={isActive}
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
