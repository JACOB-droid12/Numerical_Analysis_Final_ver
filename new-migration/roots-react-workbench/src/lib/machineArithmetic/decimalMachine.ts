import Decimal from 'decimal.js';

export type DecimalInput = Decimal.Value;

export type NormalizedDecimal = {
  sign: -1 | 0 | 1;
  mantissa: string;
  exponent: number;
  normalizedText: string;
};

function finiteDecimal(value: DecimalInput, label = 'value'): Decimal {
  const decimal = new Decimal(value);
  if (!decimal.isFinite()) {
    throw new RangeError(`${label} must be finite.`);
  }
  return decimal;
}

function validDigitCount(k: number): number {
  if (!Number.isInteger(k) || k < 1) {
    throw new RangeError('k must be a positive integer.');
  }
  return k;
}

function decimalSign(value: Decimal): -1 | 0 | 1 {
  if (value.isZero()) return 0;
  return value.isNegative() ? -1 : 1;
}

function classroomString(value: Decimal): string {
  return value.toFixed();
}

export function normalizeDecimal(value: DecimalInput): NormalizedDecimal {
  const decimal = finiteDecimal(value);
  const sign = decimalSign(decimal);

  if (sign === 0) {
    return {
      sign,
      mantissa: '0',
      exponent: 0,
      normalizedText: '0',
    };
  }

  const exponential = decimal.abs().toExponential();
  const [coefficientText, exponentText = '0'] = exponential.split('e');
  const exponent = Number(exponentText) + 1;
  const mantissa = new Decimal(coefficientText).div(10).toString();
  const signedMantissa = sign < 0 ? `-${mantissa}` : mantissa;

  return {
    sign,
    mantissa,
    exponent,
    normalizedText: `${signedMantissa} × 10^${exponent}`,
  };
}

export function chopToSignificantDigits(value: DecimalInput, k: number): string {
  const digits = validDigitCount(k);
  return classroomString(finiteDecimal(value).toSignificantDigits(digits, Decimal.ROUND_DOWN));
}

export function roundToSignificantDigits(value: DecimalInput, k: number): string {
  const digits = validDigitCount(k);
  return classroomString(finiteDecimal(value).toSignificantDigits(digits, Decimal.ROUND_HALF_UP));
}

export function choppingRelativeErrorBound(k: number): string {
  const digits = validDigitCount(k);
  return classroomString(new Decimal(10).pow(-digits + 1));
}

export function roundingRelativeErrorBound(k: number): string {
  const digits = validDigitCount(k);
  return classroomString(new Decimal(0.5).times(new Decimal(10).pow(-digits + 1)));
}
