import type { RootPreset } from '../types/roots';

const POPULATION_F = '1000000*e^x + (435000/x)*(e^x - 1) - 1564000';
const POPULATION_DF = '1000000*e^x + 435000*(x*e^x - (e^x - 1))/x^2';
const POPULATION_G = 'log((1564000*x + 435000)/(1000000*x + 435000))';

export const ROOT_PRESETS: RootPreset[] = [
  {
    id: 'population-bisection',
    group: 'Population birth-rate model',
    label: 'Population: Bisection on [0.1, 0.15]',
    method: 'bisection',
    warnIfZero: ['root-bis-a', 'root-bis-b'],
    fields: {
      'root-bis-expression': POPULATION_F,
      'root-bis-a': '0.1',
      'root-bis-b': '0.15',
      'root-bis-k': '12',
      'root-bis-mode': 'round',
      'root-bis-stop-kind': 'iterations',
      'root-bis-stop-value': '10',
      'root-bis-tolerance-type': 'absolute',
      'root-bis-decision-basis': 'machine',
      'root-bis-sign-display': 'both',
    },
  },
  {
    id: 'population-falseposition',
    group: 'Population birth-rate model',
    label: 'Population: False Position on [0.1, 0.15]',
    method: 'falsePosition',
    warnIfZero: ['root-fp-a', 'root-fp-b'],
    fields: {
      'root-fp-expression': POPULATION_F,
      'root-fp-a': '0.1',
      'root-fp-b': '0.15',
      'root-fp-k': '12',
      'root-fp-mode': 'round',
      'root-fp-stop-kind': 'iterations',
      'root-fp-stop-value': '8',
      'root-fp-decision-basis': 'machine',
      'root-fp-sign-display': 'both',
    },
  },
  {
    id: 'population-newton',
    group: 'Population birth-rate model',
    label: 'Population: Newton from x0 = 0.12',
    method: 'newton',
    warnIfZero: ['root-newton-x0'],
    fields: {
      'root-newton-expression': POPULATION_F,
      'root-newton-df': POPULATION_DF,
      'root-newton-x0': '0.12',
      'root-newton-k': '12',
      'root-newton-mode': 'round',
      'root-newton-stop-kind': 'iterations',
      'root-newton-stop-value': '6',
    },
  },
  {
    id: 'population-secant',
    group: 'Population birth-rate model',
    label: 'Population: Secant from 0.1, 0.15',
    method: 'secant',
    warnIfZero: ['root-secant-x0', 'root-secant-x1'],
    fields: {
      'root-secant-expression': POPULATION_F,
      'root-secant-x0': '0.1',
      'root-secant-x1': '0.15',
      'root-secant-k': '12',
      'root-secant-mode': 'round',
      'root-secant-stop-kind': 'iterations',
      'root-secant-stop-value': '6',
    },
  },
  {
    id: 'population-fixedpoint',
    group: 'Population birth-rate model',
    label: 'Population: Fixed Point g(x) from x0 = 0.1',
    method: 'fixedPoint',
    fields: {
      'root-fpi-expression': POPULATION_G,
      'root-fpi-x0': '0.1',
      'root-fpi-k': '12',
      'root-fpi-mode': 'round',
      'root-fpi-stop-kind': 'epsilon',
      'root-fpi-stop-value': '0.0001',
    },
  },
  {
    id: 'quiz-bisection-cubic',
    group: 'Quiz problems',
    label: 'Quiz Bisection: x^3 - 7x^2 + 14x + 6',
    method: 'bisection',
    fields: {
      'root-bis-expression': 'x^3 - 7*x^2 + 14*x + 6',
      'root-bis-a': '-1',
      'root-bis-b': '0',
      'root-bis-k': '12',
      'root-bis-mode': 'round',
      'root-bis-stop-kind': 'epsilon',
      'root-bis-stop-value': '0.01',
      'root-bis-tolerance-type': 'absolute',
      'root-bis-decision-basis': 'machine',
      'root-bis-sign-display': 'both',
    },
  },
  {
    id: 'quiz-newton-a',
    group: 'Quiz Newton problems',
    label: 'Quiz Newton: x^3 - 2x^2 - 5',
    method: 'newton',
    fields: {
      'root-newton-expression': 'x^3 - 2*x^2 - 5',
      'root-newton-df': '3*x^2 - 4*x',
      'root-newton-x0': '2.5',
      'root-newton-k': '12',
      'root-newton-mode': 'round',
      'root-newton-stop-kind': 'epsilon',
      'root-newton-stop-value': '0.0001',
    },
  },
  {
    id: 'quiz-newton-b',
    group: 'Quiz Newton problems',
    label: 'Quiz Newton: x^3 + 3x^2 - 1',
    method: 'newton',
    fields: {
      'root-newton-expression': 'x^3 + 3*x^2 - 1',
      'root-newton-df': '3*x^2 + 6*x',
      'root-newton-x0': '-2.5',
      'root-newton-k': '12',
      'root-newton-mode': 'round',
      'root-newton-stop-kind': 'epsilon',
      'root-newton-stop-value': '0.0001',
    },
  },
  {
    id: 'quiz-newton-c',
    group: 'Quiz Newton problems',
    label: 'Quiz Newton: x - cos(x)',
    method: 'newton',
    fields: {
      'root-newton-expression': 'x - cos(x)',
      'root-newton-df': '1 + sin(x)',
      'root-newton-x0': '0.7853981633974483',
      'root-newton-k': '12',
      'root-newton-mode': 'round',
      'root-newton-stop-kind': 'epsilon',
      'root-newton-stop-value': '0.0001',
    },
  },
  {
    id: 'quiz-newton-d',
    group: 'Quiz Newton problems',
    label: 'Quiz Newton: x - 0.8 - 0.2 sin(x)',
    method: 'newton',
    fields: {
      'root-newton-expression': 'x - 0.8 - 0.2*sin(x)',
      'root-newton-df': '1 - 0.2*cos(x)',
      'root-newton-x0': '0.7853981633974483',
      'root-newton-k': '12',
      'root-newton-mode': 'round',
      'root-newton-stop-kind': 'epsilon',
      'root-newton-stop-value': '0.0001',
    },
  },
  {
    id: 'quiz-fixedpoint-ranking',
    group: 'Fixed-point ranking',
    label: 'Fixed-point ranking: 21^(1/3), p0 = 1',
    method: 'fixedPoint',
    fields: {
      'root-fpi-expression': '(20*x + 21/(x^2)) / 21',
      'root-fpi-x0': '1',
      'root-fpi-k': '12',
      'root-fpi-mode': 'round',
      'root-fpi-stop-kind': 'epsilon',
      'root-fpi-stop-value': '0.0001',
    },
    ranking: {
      target: '21^(1/3)',
      targetValue: Math.cbrt(21),
      p0: '1',
      candidates: [
        { id: 'a', label: 'g_a(x) = (20x + 21/x^2)/21', gExpression: '(20*x + 21/(x^2)) / 21' },
        { id: 'b', label: 'g_b(x) = x - (x^3 - 21)/(3x^2)', gExpression: 'x - (x^3 - 21)/(3*x^2)' },
        { id: 'c', label: 'g_c(x) = x - (x^4 - 21x)/(x^2 - 21)', gExpression: 'x - (x^4 - 21*x)/(x^2 - 21)' },
        { id: 'd', label: 'g_d(x) = sqrt(21/x)', gExpression: 'sqrt(21/x)' },
      ],
    },
  },
];

export function presetGroups() {
  return ROOT_PRESETS.reduce<Array<{ group: string; presets: RootPreset[] }>>((groups, preset) => {
    const existing = groups.find((entry) => entry.group === preset.group);
    if (existing) {
      existing.presets.push(preset);
    } else {
      groups.push({ group: preset.group, presets: [preset] });
    }
    return groups;
  }, []);
}

export function findPreset(id: string): RootPreset | null {
  return ROOT_PRESETS.find((preset) => preset.id === id) ?? null;
}

export function zeroUnsafeFieldIds(preset: RootPreset | null, fields: Record<string, string>) {
  return (preset?.warnIfZero ?? []).filter((fieldId) => {
    const value = fields[fieldId];
    if (value == null || value.trim() === '') return false;
    const numeric = Number(value);
    return Number.isFinite(numeric) && numeric === 0;
  });
}
