import Decimal from 'decimal.js';

import type { DecimalInput } from './decimalMachine';

function finiteDecimal(value: DecimalInput, label = 'value'): Decimal {
  const decimal = new Decimal(value);
  if (!decimal.isFinite()) {
    throw new RangeError(`${label} must be finite.`);
  }
  return decimal;
}

function validDigitCount(t: number): number {
  if (!Number.isInteger(t) || t < 0) {
    throw new RangeError('t must be a nonnegative integer.');
  }
  return t;
}

function classroomString(value: Decimal): string {
  return value.toFixed();
}

export function absoluteError(trueValue: DecimalInput, approximation: DecimalInput): string {
  const trueDecimal = finiteDecimal(trueValue, 'trueValue');
  const approximationDecimal = finiteDecimal(approximation, 'approximation');
  return classroomString(trueDecimal.minus(approximationDecimal).abs());
}

export function relativeError(trueValue: DecimalInput, approximation: DecimalInput): string {
  const trueDecimal = finiteDecimal(trueValue, 'trueValue');
  const approximationDecimal = finiteDecimal(approximation, 'approximation');
  const absolute = trueDecimal.minus(approximationDecimal).abs();

  if (trueDecimal.isZero()) {
    if (absolute.isZero()) {
      return '0';
    }
    throw new RangeError('Relative error is undefined when trueValue is zero.');
  }

  return classroomString(absolute.div(trueDecimal.abs()));
}

export function significantDigits(trueValue: DecimalInput, approximation: DecimalInput): number {
  const relative = new Decimal(relativeError(trueValue, approximation));
  if (relative.isZero()) {
    return Number.POSITIVE_INFINITY;
  }

  let digits = 0;
  while (relative.lte(new Decimal(5).times(new Decimal(10).pow(-(digits + 1))))) {
    digits += 1;
  }

  return digits;
}

export function maximumAbsoluteError(trueValue: DecimalInput, t: number): string {
  const digits = validDigitCount(t);
  const trueDecimal = finiteDecimal(trueValue, 'trueValue');
  return classroomString(new Decimal(5).times(new Decimal(10).pow(-digits)).times(trueDecimal.abs()));
}
