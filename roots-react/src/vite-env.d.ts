/// <reference types="vite/client" />

import type {
  BisectionOptions,
  FalsePositionOptions,
  FixedPointOptions,
  NewtonOptions,
  RootRunResult,
  SecantOptions,
} from './types/roots';

declare global {
  interface Window {
    MathEngine?: unknown;
    CalcEngine?: unknown;
    ExpressionEngine?: unknown;
    RootEngine?: {
      runBisection(options: BisectionOptions): RootRunResult;
      runNewtonRaphson(options: NewtonOptions): RootRunResult;
      runSecant(options: SecantOptions): RootRunResult;
      runFalsePosition(options: FalsePositionOptions): RootRunResult;
      runFixedPoint(options: FixedPointOptions): RootRunResult;
    };
  }
}

export {};
