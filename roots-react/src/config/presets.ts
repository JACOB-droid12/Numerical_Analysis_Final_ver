import type { MethodFormState, RootMethod, RootPreset } from '../types/roots';

export const POPULATION_F =
  '1000000*e^x + (435000/x)*(e^x - 1) - 1564000';
export const POPULATION_DF =
  '1000000*e^x + 435000*(x*e^x - (e^x - 1))/x^2';
export const POPULATION_G =
  'log((1564000*x + 435000)/(1000000*x + 435000))';

const commonMachine = (prefix: string, stopValue = '5'): MethodFormState => ({
  [`${prefix}-k`]: '8',
  [`${prefix}-mode`]: 'round',
  [`${prefix}-stop-kind`]: 'iterations',
  [`${prefix}-stop-value`]: stopValue,
});

const bracketOptions = (prefix: string): MethodFormState => ({
  [`${prefix}-sign-display`]: 'both',
  [`${prefix}-decision-basis`]: 'machine',
});

function preset(
  id: string,
  label: string,
  group: string,
  method: RootMethod,
  fields: MethodFormState,
  description: string,
  guardedFieldIds: string[] = [],
): RootPreset {
  return { id, label, group, method, fields, description, guardedFieldIds };
}

export const ROOT_PRESETS: RootPreset[] = [
  preset(
    'population-bisection',
    'Population model: bisection',
    'Population birth-rate model',
    'bisection',
    {
      'root-bis-expression': POPULATION_F,
      'root-bis-a': '0.1',
      'root-bis-b': '0.15',
      ...commonMachine('root-bis'),
      ...bracketOptions('root-bis'),
    },
    'Loads the singular birth-rate equation with a safe bracket near the sign change.',
    ['root-bis-a', 'root-bis-b'],
  ),
  preset(
    'population-false-position',
    'Population model: false position',
    'Population birth-rate model',
    'falsePosition',
    {
      'root-fp-expression': POPULATION_F,
      'root-fp-a': '0.1',
      'root-fp-b': '0.15',
      ...commonMachine('root-fp'),
      ...bracketOptions('root-fp'),
    },
    'Uses regula falsi on the same safe population bracket.',
    ['root-fp-a', 'root-fp-b'],
  ),
  preset(
    'population-newton',
    'Population model: Newton',
    'Population birth-rate model',
    'newton',
    {
      'root-newton-expression': POPULATION_F,
      'root-newton-df': POPULATION_DF,
      'root-newton-x0': '0.1',
      ...commonMachine('root-newton'),
    },
    'Loads f, f prime, and a nonzero start for the birth-rate model.',
    ['root-newton-x0'],
  ),
  preset(
    'population-secant',
    'Population model: secant',
    'Population birth-rate model',
    'secant',
    {
      'root-secant-expression': POPULATION_F,
      'root-secant-x0': '0.1',
      'root-secant-x1': '0.15',
      ...commonMachine('root-secant'),
    },
    'Uses two nonzero population starts for a derivative-free solve.',
    ['root-secant-x0', 'root-secant-x1'],
  ),
  preset(
    'population-fixed-point',
    'Population model: fixed point',
    'Population birth-rate model',
    'fixedPoint',
    {
      'root-fpi-expression': POPULATION_G,
      'root-fpi-x0': '0.1',
      ...commonMachine('root-fpi', '8'),
    },
    'Loads the derived fixed-point map for the population equation.',
    ['root-fpi-x0'],
  ),
  preset(
    'quiz-bisection-cubic',
    'Quiz bisection cubic',
    'Quiz presets',
    'bisection',
    {
      'root-bis-expression': 'x^3 - 7x^2 + 14x + 6',
      'root-bis-a': '-1',
      'root-bis-b': '0',
      ...commonMachine('root-bis'),
      'root-bis-stop-kind': 'epsilon',
      'root-bis-stop-value': '10^-2',
      'root-bis-tolerance-type': 'absolute',
      ...bracketOptions('root-bis'),
    },
    'Cubic quiz prompt with target accuracy 10^-2.',
  ),
  preset(
    'quiz-newton-a',
    'Quiz Newton A',
    'Quiz presets',
    'newton',
    {
      'root-newton-expression': 'x^3 - 2x^2 - 5',
      'root-newton-df': '3x^2 - 4x',
      'root-newton-x0': '2',
      ...commonMachine('root-newton'),
      'root-newton-stop-kind': 'epsilon',
      'root-newton-stop-value': '0.0001',
    },
    'Newton quiz A from interval guide [1, 4].',
  ),
  preset(
    'quiz-newton-b',
    'Quiz Newton B',
    'Quiz presets',
    'newton',
    {
      'root-newton-expression': 'x^3 + 3x^2 - 1',
      'root-newton-df': '3x^2 + 6x',
      'root-newton-x0': '-3',
      ...commonMachine('root-newton'),
      'root-newton-stop-kind': 'epsilon',
      'root-newton-stop-value': '0.0001',
    },
    'Newton quiz B from interval guide [-3, -2].',
  ),
  preset(
    'quiz-newton-c',
    'Quiz Newton C',
    'Quiz presets',
    'newton',
    {
      'root-newton-expression': 'x - cos(x)',
      'root-newton-df': '1 + sin(x)',
      'root-newton-x0': '0.5',
      ...commonMachine('root-newton'),
      'root-newton-stop-kind': 'epsilon',
      'root-newton-stop-value': '0.0001',
    },
    'Newton quiz C from interval guide [0, pi/2].',
  ),
  preset(
    'quiz-newton-d',
    'Quiz Newton D',
    'Quiz presets',
    'newton',
    {
      'root-newton-expression': 'x - 0.8 - 0.2sin(x)',
      'root-newton-df': '1 - 0.2cos(x)',
      'root-newton-x0': '1',
      ...commonMachine('root-newton'),
      'root-newton-stop-kind': 'epsilon',
      'root-newton-stop-value': '0.0001',
    },
    'Newton quiz D from interval guide [0, pi/2].',
  ),
  {
    ...preset(
      'fixed-point-ranking-21',
      'Fixed-point ranking: cube root of 21',
      'Quiz presets',
      'fixedPoint',
      {
        'root-fpi-expression': '(20*x + 21/x^2)/21',
        'root-fpi-x0': '1',
        ...commonMachine('root-fpi'),
        'root-fpi-stop-kind': 'epsilon',
        'root-fpi-stop-value': '0.0001',
      },
      'Compares four fixed-point maps for 21^(1/3) from p0 = 1.',
      ['root-fpi-x0'],
    ),
    ranking: {
      targetLabel: '21^(1/3)',
      targetValue: Math.cbrt(21),
      initialValue: '1',
      candidates: [
        { id: 'a', label: 'a', expression: '(20*x + 21/x^2)/21' },
        { id: 'b', label: 'b', expression: 'x - (x^3 - 21)/(3*x^2)' },
        { id: 'c', label: 'c', expression: 'x - (x^4 - 21*x)/(x^2 - 21)' },
        { id: 'd', label: 'd', expression: 'sqrt(21/x)' },
      ],
    },
  },
];

export const PRESET_BY_ID = new Map(ROOT_PRESETS.map((presetItem) => [presetItem.id, presetItem]));

function evaluateArithmeticScalar(input: string): number | null {
  const source = input.trim();
  if (!source || /[^0-9+\-*/().\seE]/.test(source)) return null;

  let index = 0;

  const skipWhitespace = () => {
    while (/\s/.test(source[index] ?? '')) index += 1;
  };

  const parseNumber = (): number | null => {
    skipWhitespace();
    const match = source.slice(index).match(/^(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/i);
    if (!match) return null;
    index += match[0].length;
    const value = Number(match[0]);
    return Number.isFinite(value) ? value : null;
  };

  const parseFactor = (): number | null => {
    skipWhitespace();
    const char = source[index];
    if (char === '+' || char === '-') {
      index += 1;
      const value = parseFactor();
      if (value == null) return null;
      return char === '-' ? -value : value;
    }
    if (char === '(') {
      index += 1;
      const value = parseExpression();
      skipWhitespace();
      if (source[index] !== ')') return null;
      index += 1;
      return value;
    }
    return parseNumber();
  };

  const parseTerm = (): number | null => {
    let value = parseFactor();
    if (value == null) return null;

    while (true) {
      skipWhitespace();
      const operator = source[index];
      if (operator !== '*' && operator !== '/') return value;
      index += 1;
      const right = parseFactor();
      if (right == null) return null;
      value = operator === '*' ? value * right : value / right;
      if (!Number.isFinite(value)) return null;
    }
  };

  function parseExpression(): number | null {
    let value = parseTerm();
    if (value == null) return null;

    while (true) {
      skipWhitespace();
      const operator = source[index];
      if (operator !== '+' && operator !== '-') return value;
      index += 1;
      const right = parseTerm();
      if (right == null) return null;
      value = operator === '+' ? value + right : value - right;
      if (!Number.isFinite(value)) return null;
    }
  }

  const value = parseExpression();
  skipWhitespace();
  return value != null && index === source.length ? value : null;
}

export function guardedZeroValue(value: string | undefined): boolean {
  if (value == null) return false;
  const normalized = value.trim().replace(/\s+/g, '');
  if (!normalized) return false;
  const numeric = Number(normalized);
  if (Number.isFinite(numeric)) return Object.is(numeric, -0) || numeric === 0;
  const arithmeticValue = evaluateArithmeticScalar(value);
  return arithmeticValue != null && (Object.is(arithmeticValue, -0) || arithmeticValue === 0);
}

export function populationZeroWarning(
  presetItem: RootPreset | null,
  formState: MethodFormState | null,
): string | null {
  if (!presetItem?.guardedFieldIds.length || !formState) return null;
  const unsafeFields = presetItem.guardedFieldIds.filter((fieldId) =>
    guardedZeroValue(formState[fieldId]),
  );
  if (!unsafeFields.length) return null;
  return 'Warning: the population equation divides by x, so 0 and -0 are unsafe starts or endpoints.';
}
