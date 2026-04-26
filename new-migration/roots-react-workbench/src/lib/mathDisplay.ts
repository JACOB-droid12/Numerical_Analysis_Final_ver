import katex from 'katex';
import { parse } from 'mathjs';

function escapeLatex(value: string): string {
  return value.replace(/([#$%&_{}])/g, '\\$1');
}

function normalizeForMathJs(expression: string): string {
  return expression
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/(\d|\))(?=\s*(sin|cos|tan|ln|sqrt)\s*\()/gi, '$1*')
    .replace(/(\d|\))(?=\s*[a-zA-Z])/g, '$1*')
    .replace(/\)(?=\s*\()/g, ')*');
}

function expressionBodyToLatex(expression: string): string {
  const normalized = normalizeForMathJs(expression);
  if (!normalized) return '\\square';

  try {
    return parse(normalized).toTex({
      parenthesis: 'keep',
      implicit: 'hide',
    });
  } catch {
    return `\\mathtt{${escapeLatex(normalized)}}`;
  }
}

export function expressionToLatex(label: string, expression: string): string {
  const left = label === 'x next' ? 'x_{n+1}' : label;
  const right = expressionBodyToLatex(expression);

  return `\\textstyle ${left} = ${right}`;
}

export function renderLatex(latex: string): string {
  return katex.renderToString(latex, {
    displayMode: false,
    output: 'html',
    strict: false,
    throwOnError: false,
    trust: false,
  });
}

export function safeLatexFallback(label: string, expression: string): string {
  return escapeLatex(`${label} = ${expression || '-'}`);
}
