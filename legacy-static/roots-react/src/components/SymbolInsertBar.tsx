interface SymbolInsertBarProps {
  onInsert: (symbol: string) => void;
}

const SYMBOLS = ['π', 'e', 'sin', 'cos', 'tan', 'ln', '√', '^', '(', ')', '⌫'] as const;
const SYMBOL_LABELS: Record<(typeof SYMBOLS)[number], string> = {
  'π': 'Insert pi constant',
  e: 'Insert e constant',
  sin: 'Insert sine function',
  cos: 'Insert cosine function',
  tan: 'Insert tangent function',
  ln: 'Insert natural logarithm',
  '√': 'Insert square root',
  '^': 'Insert exponent',
  '(': 'Insert left parenthesis',
  ')': 'Insert right parenthesis',
  '⌫': 'Backspace',
};

const INSERT_VALUE: Record<(typeof SYMBOLS)[number], string> = {
  'π': 'pi',
  e: 'e',
  sin: 'sin(',
  cos: 'cos(',
  tan: 'tan(',
  ln: 'log(',
  '√': 'sqrt(',
  '^': '^',
  '(': '(',
  ')': ')',
  '⌫': '',
};

export function SymbolInsertBar({ onInsert }: SymbolInsertBarProps) {
  return (
    <div className="symbol-bar">
      {SYMBOLS.map((symbol) => (
        <button
          key={symbol}
          type="button"
          onClick={() => onInsert(INSERT_VALUE[symbol])}
          title={SYMBOL_LABELS[symbol]}
          aria-label={SYMBOL_LABELS[symbol]}
          className="symbol-chip"
        >
          {symbol}
        </button>
      ))}
    </div>
  );
}
