import type { MethodConfig, MethodFormState, RootMethod } from '../types/roots';

export interface MethodHelpTopic {
  method: RootMethod;
  inputExpectations: string[];
  stoppingNotes: string[];
}

export interface MethodPreset {
  id: string;
  method: RootMethod;
  label: string;
  description: string;
  values: MethodFormState;
}

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
    tableHeaders: ['i', 'a', 'b', 'c', 'f(a)', 'f(b)', 'f(c)', 'Signs', 'Decision', 'Width', 'Bound', 'Error', 'Note'],
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
    tableHeaders: ['i', 'xn', 'f(xn)', "f'(xn)", 'x next', 'Error', 'Note'],
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
    tableHeaders: ['i', 'x prev', 'xn', 'f(x prev)', 'f(xn)', 'x next', 'Error', 'Note'],
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
    tableHeaders: ['i', 'a', 'b', 'c', 'f(a)', 'f(b)', 'f(c)', 'Signs', 'Decision', 'Width', 'Target epsilon', 'Error', 'Note'],
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
    tableHeaders: ['i', 'xn', 'g(xn)', 'Error', 'Note'],
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
  return METHOD_CONFIGS.reduce(
    (acc, config) => {
      acc[config.method] = Object.fromEntries(
        config.fields.map((field) => [field.id, field.defaultValue]),
      );
      return acc;
    },
    {} as Record<RootMethod, MethodFormState>,
  );
}

export const EXPRESSION_SYNTAX_NOTES = [
  'Use x as the variable, ^ for powers, parentheses for grouping, and decimal constants such as 0.5.',
  'Supported functions include sin, cos, tan, exp, log, sqrt, and abs. Trig inputs follow the Rad/Deg toggle.',
  'Implicit multiplication is accepted in common forms such as 2x; use * when an expression could be ambiguous.',
];

export const METHOD_HELP_TOPICS: Record<RootMethod, MethodHelpTopic> = {
  bisection: {
    method: 'bisection',
    inputExpectations: [
      'Enter f(x) plus endpoints a and b.',
      'The interval must bracket a root: f(a) and f(b) should have opposite signs.',
    ],
    stoppingNotes: [
      'Iteration mode runs exactly n planned interval cuts unless the root is hit first.',
      'Epsilon mode stops when the selected absolute or relative interval rule is satisfied.',
    ],
  },
  newton: {
    method: 'newton',
    inputExpectations: [
      'Enter f(x), its derivative f\'(x), and one starting value x0.',
      'Choose x0 near the expected root and avoid points where f\'(x) is zero.',
    ],
    stoppingNotes: [
      'Iteration mode applies n Newton updates.',
      'Epsilon mode stops when the step error meets the tolerance.',
    ],
  },
  secant: {
    method: 'secant',
    inputExpectations: [
      'Enter f(x) and two distinct starting values x0 and x1.',
      'The method estimates slope from the two latest points, so no derivative is required.',
    ],
    stoppingNotes: [
      'Iteration mode applies n secant updates.',
      'Epsilon mode stops when the change between successive approximations is small enough.',
    ],
  },
  falsePosition: {
    method: 'falsePosition',
    inputExpectations: [
      'Enter f(x) plus a bracketing interval a to b.',
      'Like bisection, the endpoint signs should differ before the first step.',
    ],
    stoppingNotes: [
      'Iteration mode runs n regula falsi interpolation steps.',
      'Epsilon mode stops when the configured target error is met or the bracket confirms the root.',
    ],
  },
  fixedPoint: {
    method: 'fixedPoint',
    inputExpectations: [
      'Enter g(x), not f(x), and one starting value x0.',
      'The iteration uses x next = g(x); choose a form that settles near the fixed point.',
    ],
    stoppingNotes: [
      'Iteration mode applies n fixed-point substitutions.',
      'Epsilon mode stops when consecutive x values are within tolerance.',
    ],
  },
};

export const METHOD_PRESETS: MethodPreset[] = [
  {
    id: 'bisection-sqrt-two',
    method: 'bisection',
    label: 'Bisection: sqrt(2)',
    description: 'Bracket x^2 - 2 on [1, 2].',
    values: {
      'root-bis-expression': 'x^2 - 2',
      'root-bis-a': '1',
      'root-bis-b': '2',
      'root-bis-stop-kind': 'iterations',
      'root-bis-stop-value': '6',
    },
  },
  {
    id: 'newton-sqrt-two',
    method: 'newton',
    label: 'Newton: sqrt(2)',
    description: 'Use f(x) = x^2 - 2 with derivative 2x.',
    values: {
      'root-newton-expression': 'x^2 - 2',
      'root-newton-df': '2x',
      'root-newton-x0': '1',
      'root-newton-stop-kind': 'iterations',
      'root-newton-stop-value': '5',
    },
  },
  {
    id: 'secant-cubic',
    method: 'secant',
    label: 'Secant: cubic root',
    description: 'Solve x^3 - x - 1 from two starting points.',
    values: {
      'root-secant-expression': 'x^3 - x - 1',
      'root-secant-x0': '1',
      'root-secant-x1': '2',
      'root-secant-stop-kind': 'iterations',
      'root-secant-stop-value': '6',
    },
  },
  {
    id: 'false-position-cubic',
    method: 'falsePosition',
    label: 'False Position: cubic',
    description: 'Bracket x^3 - x - 1 on [1, 2].',
    values: {
      'root-fp-expression': 'x^3 - x - 1',
      'root-fp-a': '1',
      'root-fp-b': '2',
      'root-fp-stop-kind': 'iterations',
      'root-fp-stop-value': '6',
    },
  },
  {
    id: 'fixed-point-cosine',
    method: 'fixedPoint',
    label: 'Fixed Point: cos(x)',
    description: 'Iterate x = cos(x) from x0 = 1.',
    values: {
      'root-fpi-expression': 'cos(x)',
      'root-fpi-x0': '1',
      'root-fpi-stop-kind': 'iterations',
      'root-fpi-stop-value': '8',
    },
  },
];
