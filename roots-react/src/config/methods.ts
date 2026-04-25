import type { MethodConfig, MethodFormState, RootMethod } from '../types/roots';

const machineFields = (prefix: string) => [
  {
    id: `${prefix}-k`,
    label: 'k digits',
    kind: 'number' as const,
    defaultValue: '8',
  },
  {
    id: `${prefix}-mode`,
    label: 'Rule',
    kind: 'select' as const,
    defaultValue: 'round',
    options: [
      { value: 'chop', label: 'Chopping' },
      { value: 'round', label: 'Rounding' },
    ],
  },
  {
    id: `${prefix}-stop-kind`,
    label: 'Stop by',
    kind: 'select' as const,
    defaultValue: 'iterations',
    options: [
      { value: 'iterations', label: 'Iterations (n)' },
      { value: 'epsilon', label: 'Tolerance (epsilon)' },
    ],
  },
  {
    id: `${prefix}-stop-value`,
    label: 'Iterations (n) / epsilon',
    kind: 'text' as const,
    defaultValue: '5',
  },
];

export const isEpsilon = (prefix: string) => (formState: MethodFormState) =>
  formState[`${prefix}-stop-kind`] === 'epsilon';

export const METHOD_CONFIGS: MethodConfig[] = [
  {
    method: 'bisection',
    label: 'Bisection',
    shortLabel: 'Bisection',
    group: 'bracket',
    summary: 'Use an interval where f(a) and f(b) have opposite signs.',
    details: 'Best when the prompt gives a bracket or asks for interval shrinking.',
    expressionLabel: 'f(x)',
    expressionFieldId: 'root-bis-expression',
    runLabel: 'Run bisection',
    tableHeaders: ['n', 'a_n', 'b_n', 'p_n', 'f(p_n)', 'Signs', 'Kept interval', 'Bound', 'Error', 'Note'],
    fields: [
      { id: 'root-bis-expression', label: 'f(x)', kind: 'text', defaultValue: 'x^2 - 2', placeholder: 'x^3 - x - 1' },
      { id: 'root-bis-a', label: 'a', kind: 'text', defaultValue: '1' },
      { id: 'root-bis-b', label: 'b', kind: 'text', defaultValue: '2' },
      ...machineFields('root-bis'),
      {
        id: 'root-bis-tolerance-type',
        label: 'Tolerance',
        kind: 'select',
        defaultValue: 'absolute',
        when: isEpsilon('root-bis'),
        options: [
          { value: 'absolute', label: 'Absolute tolerance' },
          { value: 'relative', label: 'Relative tolerance' },
        ],
      },
      {
        id: 'root-bis-sign-display',
        label: 'Signs shown',
        kind: 'select',
        defaultValue: 'both',
        advanced: true,
        options: [
          { value: 'both', label: 'Exact and machine signs' },
          { value: 'machine', label: 'Machine signs only' },
          { value: 'exact', label: 'Exact signs only' },
        ],
      },
      {
        id: 'root-bis-decision-basis',
        label: 'Decision basis',
        kind: 'select',
        defaultValue: 'machine',
        advanced: true,
        options: [
          { value: 'machine', label: 'Machine signs decide' },
          { value: 'exact', label: 'Exact signs decide' },
        ],
      },
    ],
  },
  {
    method: 'newton',
    label: 'Newton-Raphson',
    shortLabel: 'Newton',
    group: 'open',
    summary: 'Use f(x), f′(x), and one starting point.',
    details: 'Fast near a simple root when the derivative is reliable.',
    expressionLabel: 'f(x)',
    expressionFieldId: 'root-newton-expression',
    runLabel: 'Run Newton-Raphson',
    tableHeaders: ['n', 'x_n', 'f(x_n)', "f'(x_n)", "Correction f/f'", 'x_(n+1)', 'Error', 'Note'],
    fields: [
      { id: 'root-newton-expression', label: 'f(x)', kind: 'text', defaultValue: 'x^2 - 2', placeholder: 'x^3 - x - 1' },
      { id: 'root-newton-df', label: "f'(x)", kind: 'text', defaultValue: '2x', placeholder: '3x^2 - 1' },
      { id: 'root-newton-x0', label: 'x0', kind: 'text', defaultValue: '1' },
      ...machineFields('root-newton'),
    ],
  },
  {
    method: 'secant',
    label: 'Secant',
    shortLabel: 'Secant',
    group: 'open',
    summary: 'Use f(x) and two starting points.',
    details: 'Useful when a derivative is not provided.',
    expressionLabel: 'f(x)',
    expressionFieldId: 'root-secant-expression',
    runLabel: 'Run secant',
    tableHeaders: ['n', 'x_(n-1)', 'x_n', 'f(x_(n-1))', 'f(x_n)', 'x_(n+1)', 'Error', 'Note'],
    fields: [
      { id: 'root-secant-expression', label: 'f(x)', kind: 'text', defaultValue: 'x^2 - 2', placeholder: 'x^3 - x - 1' },
      { id: 'root-secant-x0', label: 'x0', kind: 'text', defaultValue: '1' },
      { id: 'root-secant-x1', label: 'x1', kind: 'text', defaultValue: '2' },
      ...machineFields('root-secant'),
    ],
  },
  {
    method: 'falsePosition',
    label: 'False Position',
    shortLabel: 'False Position',
    group: 'bracket',
    summary: 'Use a bracket with linear interpolation.',
    details: 'Keeps bracket logic while choosing a regula falsi point.',
    expressionLabel: 'f(x)',
    expressionFieldId: 'root-fp-expression',
    runLabel: 'Run false position',
    tableHeaders: ['n', 'a_n', 'b_n', 'p_n', 'f(p_n)', 'Signs', 'Retained interval', 'Error', 'Note'],
    fields: [
      { id: 'root-fp-expression', label: 'f(x)', kind: 'text', defaultValue: 'x^2 - 2', placeholder: 'x^3 - x - 1' },
      { id: 'root-fp-a', label: 'a', kind: 'text', defaultValue: '1' },
      { id: 'root-fp-b', label: 'b', kind: 'text', defaultValue: '2' },
      ...machineFields('root-fp'),
      {
        id: 'root-fp-sign-display',
        label: 'Signs shown',
        kind: 'select',
        defaultValue: 'both',
        advanced: true,
        options: [
          { value: 'both', label: 'Exact and machine signs' },
          { value: 'machine', label: 'Machine signs only' },
          { value: 'exact', label: 'Exact signs only' },
        ],
      },
      {
        id: 'root-fp-decision-basis',
        label: 'Decision basis',
        kind: 'select',
        defaultValue: 'machine',
        advanced: true,
        options: [
          { value: 'machine', label: 'Machine signs decide' },
          { value: 'exact', label: 'Exact signs decide' },
        ],
      },
    ],
  },
  {
    method: 'fixedPoint',
    label: 'Fixed Point',
    shortLabel: 'Fixed Point',
    group: 'fixed-point',
    summary: 'Enter g(x), then iterate x next = g(x).',
    details: 'Works when the iteration settles near a fixed point.',
    expressionLabel: 'g(x)',
    expressionFieldId: 'root-fpi-expression',
    runLabel: 'Run fixed-point iteration',
    tableHeaders: ['n', 'p_n', 'g(p_n)', '|p_n - p_(n-1)|', 'Note'],
    fields: [
      { id: 'root-fpi-expression', label: 'g(x)', kind: 'text', defaultValue: 'cos(x)', placeholder: 'cos(x)' },
      { id: 'root-fpi-x0', label: 'x0', kind: 'text', defaultValue: '1' },
      ...machineFields('root-fpi'),
    ],
  },
];

export const METHOD_CONFIG_BY_ID: Record<RootMethod, MethodConfig> = Object.fromEntries(
  METHOD_CONFIGS.map((config) => [config.method, config]),
) as Record<RootMethod, MethodConfig>;

export const METHOD_BY_NAME = new Map<RootMethod, MethodConfig>(
  METHOD_CONFIGS.map((config) => [config.method, config]),
);

export function createDefaultFormState(): Record<RootMethod, MethodFormState> {
  const keepDefaultValue = (fieldId: string) =>
    fieldId.endsWith('-k') ||
    fieldId.endsWith('-mode') ||
    fieldId.endsWith('-stop-kind') ||
    fieldId.endsWith('-stop-value') ||
    fieldId.endsWith('-tolerance-type') ||
    fieldId.endsWith('-sign-display') ||
    fieldId.endsWith('-decision-basis');

  return METHOD_CONFIGS.reduce(
    (acc, config) => {
      acc[config.method] = Object.fromEntries(
        config.fields.map((field) => [field.id, keepDefaultValue(field.id) ? field.defaultValue : '']),
      );
      return acc;
    },
    {} as Record<RootMethod, MethodFormState>,
  );
}
