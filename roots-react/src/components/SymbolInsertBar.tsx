interface SymbolInsertBarProps {
  onInsert: (symbol: string) => void;
}

const SYMBOLS = ['x', 'pi', 'sqrt(', 'sin(', 'cos(', 'tan(', 'log(', 'e', 'e^('] as const;
const SYMBOL_LABELS: Record<(typeof SYMBOLS)[number], string> = {
  x: 'Insert x',
  pi: 'Insert pi constant',
  'sqrt(': 'Insert square root',
  'sin(': 'Insert sine function',
  'cos(': 'Insert cosine function',
  'tan(': 'Insert tangent function',
  'log(': 'Insert logarithm function',
  e: 'Insert e constant',
  'e^(': 'Insert exponential form',
};

export function SymbolInsertBar({ onInsert }: SymbolInsertBarProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {SYMBOLS.map((symbol) => (
        <button
          key={symbol}
          type="button"
          onClick={() => onInsert(symbol)}
          title={SYMBOL_LABELS[symbol]}
          aria-label={SYMBOL_LABELS[symbol]}
          className="rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 font-mono text-sm text-slate-200 transition hover:border-slate-500 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-400"
        >
          {symbol}
        </button>
      ))}
    </div>
  );
}
