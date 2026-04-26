import { runBisection, type BisectionInput, type BisectionResult } from './bisection';
import { runFalsePosition, type FalsePositionInput, type FalsePositionResult } from './falsePosition';
import { runFixedPoint, type FixedPointInput, type FixedPointResult } from './fixedPoint';
import { runNewtonRaphson, type NewtonRaphsonInput, type NewtonRaphsonResult } from './newtonRaphson';
import { runSecant, type SecantInput, type SecantResult } from './secant';

export type ModernRootMethod =
  | 'bisection'
  | 'false-position'
  | 'secant'
  | 'fixed-point'
  | 'newton-raphson';

export type ModernRootEngineInput =
  | ({ method: 'bisection' } & BisectionInput)
  | ({ method: 'false-position' } & FalsePositionInput)
  | ({ method: 'secant' } & SecantInput)
  | ({ method: 'fixed-point' } & FixedPointInput)
  | ({ method: 'newton-raphson' } & NewtonRaphsonInput);

type ModernMethodResult =
  | BisectionResult
  | FalsePositionResult
  | SecantResult
  | FixedPointResult
  | NewtonRaphsonResult;

export type ModernRootEngineResult =
  | {
      ok: true;
      method: ModernRootMethod;
      root: number;
      iterations: number;
      stopReason: string;
      details: ModernMethodResult;
    }
  | {
      ok: false;
      method: ModernRootMethod | 'unknown';
      reason: string;
      message: string;
      details?: ModernMethodResult;
    };

function normalizeResult(
  method: ModernRootMethod,
  details: ModernMethodResult,
): ModernRootEngineResult {
  if (details.ok) {
    return {
      ok: true,
      method,
      root: details.root,
      iterations: details.iterations,
      stopReason: details.stopReason,
      details,
    };
  }

  return {
    ok: false,
    method,
    reason: details.reason,
    message: details.message,
    details,
  };
}

export function runModernRootMethod(input: ModernRootEngineInput): ModernRootEngineResult {
  switch (input.method) {
    case 'bisection':
      return normalizeResult(input.method, runBisection(input));
    case 'false-position':
      return normalizeResult(input.method, runFalsePosition(input));
    case 'secant':
      return normalizeResult(input.method, runSecant(input));
    case 'fixed-point':
      return normalizeResult(input.method, runFixedPoint(input));
    case 'newton-raphson':
      return normalizeResult(input.method, runNewtonRaphson(input));
    default:
      return {
        ok: false,
        method: 'unknown',
        reason: 'invalid-method',
        message: 'Unknown modern root method.',
      };
  }
}
