import {
  all,
  create,
  type EvalFunction,
  type MathJsInstance,
  type MathScope,
} from 'mathjs';

export type AngleMode = 'rad' | 'deg';
export type EvaluationMode = 'calculator' | 'legacy-compatible';

export interface EvaluateOptions {
  angleMode?: AngleMode;
  mode?: EvaluationMode;
  allowComplex?: boolean;
  allowNonFinite?: boolean;
}

export type EvaluationScope = Record<string, unknown>;

export interface NormalizedMathError {
  code: 'invalid-expression' | 'evaluation-error';
  message: string;
  cause: unknown;
}

export type MathEvaluationResult<T = unknown> =
  | {
      ok: true;
      expression: string;
      value: T;
    }
  | {
      ok: false;
      expression: string;
      error: NormalizedMathError;
    };

export interface CompiledExpression {
  expression: string;
  evaluate: (
    scope?: EvaluationScope,
    options?: EvaluateOptions,
  ) => MathEvaluationResult;
}

export type CompileExpressionResult =
  | {
      ok: true;
      expression: string;
      compiled: CompiledExpression;
    }
  | {
      ok: false;
      expression: string;
      error: NormalizedMathError;
    };

const math = create(all, {}) as MathJsInstance;

interface ResolvedEvaluateOptions {
  angleMode: AngleMode;
  mode: EvaluationMode;
  allowComplex: boolean;
  allowNonFinite: boolean;
}

function resolveOptions(options: EvaluateOptions = {}): ResolvedEvaluateOptions {
  const mode = options.mode ?? 'calculator';

  return {
    angleMode: options.angleMode ?? 'rad',
    mode,
    allowComplex: options.allowComplex ?? mode === 'calculator',
    allowNonFinite: options.allowNonFinite ?? mode === 'calculator',
  };
}

function toRadians(value: unknown): unknown {
  return math.multiply(value as never, Math.PI / 180);
}

function createFunctionScope(options: ResolvedEvaluateOptions): EvaluationScope {
  const useDegrees = options.angleMode === 'deg';
  const log = options.mode === 'legacy-compatible'
    ? (value: unknown) => math.log(value as never)
    : (value: unknown) => math.log(value as never, 10);

  return {
    ln: (value: unknown) => math.log(value as never),
    log,
    sin: (value: unknown) => math.sin((useDegrees ? toRadians(value) : value) as never),
    cos: (value: unknown) => math.cos((useDegrees ? toRadians(value) : value) as never),
    tan: (value: unknown) => math.tan((useDegrees ? toRadians(value) : value) as never),
  };
}

function createScope(scope: EvaluationScope = {}, options: EvaluateOptions = {}): MathScope {
  const resolved = resolveOptions(options);

  return {
    ...scope,
    ...createFunctionScope(resolved),
  } as MathScope;
}

function isComplexValue(value: unknown): value is { re: number; im: number } {
  return Boolean(
    value &&
      typeof value === 'object' &&
      typeof (value as { re?: unknown }).re === 'number' &&
      typeof (value as { im?: unknown }).im === 'number',
  );
}

function containsNonFiniteValue(value: unknown): boolean {
  if (typeof value === 'number') {
    return !Number.isFinite(value);
  }

  if (isComplexValue(value)) {
    return !Number.isFinite(value.re) || !Number.isFinite(value.im);
  }

  return false;
}

function validateResultValue(value: unknown, options: ResolvedEvaluateOptions): NormalizedMathError | null {
  if (!options.allowNonFinite && containsNonFiniteValue(value)) {
    return normalizeMathError(new Error('Expression evaluated to a non-finite value.'));
  }

  if (!options.allowComplex && isComplexValue(value)) {
    return normalizeMathError(new Error('Expression evaluated to a complex value.'));
  }

  return null;
}

export function normalizeMathError(error: unknown): NormalizedMathError {
  const message = error instanceof Error ? error.message : String(error);
  const lowerMessage = message.toLowerCase();
  const code = lowerMessage.includes('syntax') ||
    lowerMessage.includes('unexpected') ||
    lowerMessage.includes('value expected') ||
    lowerMessage.includes('parenthesis')
    ? 'invalid-expression'
    : 'evaluation-error';

  return {
    code,
    message: message || 'The expression could not be evaluated.',
    cause: error,
  };
}

export function compileExpression(expression: string): CompileExpressionResult {
  try {
    const code = math.compile(expression);
    const compiled: CompiledExpression = {
      expression,
      evaluate(scope?: EvaluationScope, options?: EvaluateOptions) {
        return evaluateCompiledExpression(expression, code, scope, options);
      },
    };

    return {
      ok: true,
      expression,
      compiled,
    };
  } catch (error) {
    return {
      ok: false,
      expression,
      error: normalizeMathError(error),
    };
  }
}

function evaluateCompiledExpression(
  expression: string,
  code: EvalFunction,
  scope?: EvaluationScope,
  options?: EvaluateOptions,
): MathEvaluationResult {
  try {
    const resolved = resolveOptions(options);
    const value = code.evaluate(createScope(scope, resolved));
    const validationError = validateResultValue(value, resolved);

    if (validationError) {
      return {
        ok: false,
        expression,
        error: validationError,
      };
    }

    return {
      ok: true,
      expression,
      value,
    };
  } catch (error) {
    return {
      ok: false,
      expression,
      error: normalizeMathError(error),
    };
  }
}

export function evaluateExpression(
  expression: string,
  scope?: EvaluationScope,
  options?: EvaluateOptions,
): MathEvaluationResult {
  const compiled = compileExpression(expression);
  if (!compiled.ok) {
    return compiled;
  }

  return compiled.compiled.evaluate(scope, options);
}
