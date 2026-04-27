import { chopToSignificantDigits, roundToSignificantDigits } from '../machineArithmetic/decimalMachine';

// standard: no machine simulation.
// display-only: visible formatting only.
// calculation-level: Modern method-boundary machine simulation; this is not full Legacy
// stepwise expression evaluation unless a method/evaluator explicitly implements that later.
export type PrecisionPolicyMode = 'standard' | 'display-only' | 'calculation-level';

export type PrecisionRule = 'round' | 'chop';

export type PrecisionPolicy = {
  mode: PrecisionPolicyMode;
  digits: number;
  rule: PrecisionRule;
};

type PrecisionPolicyOptions = Partial<PrecisionPolicy>;

function validateDigits(digits: number): number {
  if (!Number.isInteger(digits) || digits < 1) {
    throw new RangeError('digits must be a positive integer.');
  }
  return digits;
}

function applyRule(value: number, policy: PrecisionPolicy): string {
  return policy.rule === 'chop'
    ? chopToSignificantDigits(value, policy.digits)
    : roundToSignificantDigits(value, policy.digits);
}

export function createPrecisionPolicy(options: PrecisionPolicyOptions = {}): PrecisionPolicy {
  return {
    mode: options.mode ?? 'standard',
    digits: validateDigits(options.digits ?? 8),
    rule: options.rule ?? 'round',
  };
}

export function shouldApplyCalculationPrecision(policy: PrecisionPolicy): boolean {
  return policy.mode === 'calculation-level';
}

export function shouldApplyDisplayPrecision(policy: PrecisionPolicy): boolean {
  return policy.mode === 'display-only' || policy.mode === 'calculation-level';
}

export function applyDisplayPrecision(value: number, policy: PrecisionPolicy): number | string {
  if (!shouldApplyDisplayPrecision(policy)) {
    return value;
  }
  return applyRule(value, policy);
}

export function applyCalculationPrecision(value: number, policy: PrecisionPolicy): number {
  if (!shouldApplyCalculationPrecision(policy)) {
    return value;
  }
  return Number(applyRule(value, policy));
}
