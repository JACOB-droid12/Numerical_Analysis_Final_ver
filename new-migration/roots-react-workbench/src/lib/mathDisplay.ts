import katex from 'katex';

function escapeLatex(value: string): string {
  return value.replace(/([#$%&_{}])/g, '\\$1');
}

function normalizeExpression(expression: string): string {
  return expression
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/\bsqrt\s*\(/gi, '\\sqrt{')
    .replace(/\bln\s*\(/gi, '\\ln(')
    .replace(/\bsin\s*\(/gi, '\\sin(')
    .replace(/\bcos\s*\(/gi, '\\cos(')
    .replace(/\btan\s*\(/gi, '\\tan(')
    .replace(/\bpi\b/gi, '\\pi')
    .replace(/\be\b/g, 'e')
    .replace(/\*/g, '\\cdot ')
    .replace(/\^(\d+|\w)/g, '^{$1}')
    .replace(/sqrt\{([^)]*)\)/gi, '\\sqrt{$1}');
}

export function expressionToLatex(label: string, expression: string): string {
  const normalizedLabel = label === 'g(x)' ? 'x_{n+1}' : label;
  const left = normalizedLabel
    .replace('f(x)', 'f(x)')
    .replace('g(x)', 'g(x)')
    .replace('x next', 'x_{n+1}');
  const right = expression.trim() ? normalizeExpression(expression) : '\\square';

  return `${left} = ${right}`;
}

export function renderLatex(latex: string): string {
  return katex.renderToString(latex, {
    displayMode: true,
    output: 'html',
    strict: false,
    throwOnError: false,
    trust: false,
  });
}

export function safeLatexFallback(label: string, expression: string): string {
  return escapeLatex(`${label} = ${expression || '-'}`);
}
