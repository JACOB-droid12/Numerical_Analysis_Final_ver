import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';

import { describe, expect, it } from 'vitest';

import { runFalsePosition, type FalsePositionResult } from './falsePosition';
import { createPrecisionPolicy } from './precisionPolicy';

type LegacyWindow = {
  MathEngine: Record<string, any>;
  CalcEngine: Record<string, any>;
  ExpressionEngine: Record<string, any>;
  RootEngine: Record<string, any>;
};

function loadEditableLegacyEngines(): LegacyWindow {
  const legacyWindow = {} as LegacyWindow;
  const context = vm.createContext({
    window: legacyWindow,
    console,
  });

  for (const file of [
    'math-engine.js',
    'calc-engine.js',
    'expression-engine.js',
    'root-engine.js',
  ]) {
    const source = readFileSync(resolve(process.cwd(), file), 'utf8');
    vm.runInContext(source, context, { filename: file });
  }

  return legacyWindow;
}

const legacy = loadEditableLegacyEngines();
const { CalcEngine: C, RootEngine: R } = legacy;
const machine = { k: 16, mode: 'round' };
const plasticRoot = 1.324717957244746;

function expectSuccessful(result: FalsePositionResult) {
  expect(result.ok).toBe(true);
  if (!result.ok) {
    throw new Error(result.message);
  }

  return result;
}

function legacyApproximationNumber(result: { summary?: { approximation?: unknown } }): number {
  return C.requireRealNumber(result.summary?.approximation, 'legacy approximation');
}

describe('math.js-backed isolated false position', () => {
  it('solves x^3 - x - 1 on [1, 2]', () => {
    const result = expectSuccessful(runFalsePosition({
      expression: 'x^3 - x - 1',
      lower: 1,
      upper: 2,
      tolerance: 1e-10,
    }));

    expect(result.root).toBeCloseTo(plasticRoot, 7);
    expect(result.stopReason).toMatch(/function-tolerance-satisfied|tolerance-satisfied|stagnation-detected/);
    expect(result.approximations.length).toBeGreaterThan(0);
  });

  it('solves x^2 - 4 on [0, 3]', () => {
    const result = expectSuccessful(runFalsePosition({
      expression: 'x^2 - 4',
      lower: 0,
      upper: 3,
      tolerance: 1e-10,
      maxIterations: 80,
    }));

    expect(result.root).toBeCloseTo(2, 7);
    expect(result.stopReason).toMatch(/function-tolerance-satisfied|tolerance-satisfied|stagnation-detected/);
  });

  it('returns an exact endpoint root without iterating', () => {
    const result = expectSuccessful(runFalsePosition({
      expression: 'x - 1',
      lower: 1,
      upper: 3,
    }));

    expect(result.root).toBe(1);
    expect(result.iterations).toBe(0);
    expect(result.approximations).toHaveLength(0);
    expect(result.stopReason).toBe('exact-root');
  });

  it('rejects invalid starting brackets', () => {
    const result = runFalsePosition({
      expression: 'x^2 + 1',
      lower: -1,
      upper: 1,
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected invalid bracket to fail.');
    }
    expect(result.reason).toBe('invalid-starting-interval');
  });

  it('rejects zero or near-zero false-position denominators', () => {
    const result = runFalsePosition({
      expression: '1e-13 * x',
      lower: -1,
      upper: 1,
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected near-zero denominator to fail.');
    }
    expect(result.reason).toBe('zero-denominator');
  });

  it('rejects non-finite evaluations encountered during iteration', () => {
    const result = runFalsePosition({
      expression: '1 / (x - 1)',
      lower: 0,
      upper: 2,
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected division by zero path to fail.');
    }
    expect(result.reason).toBe('non-finite-evaluation');
  });

  it('rejects complex evaluations in legacy-compatible real mode', () => {
    const result = runFalsePosition({
      expression: 'sqrt(x)',
      lower: -1,
      upper: 1,
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected complex evaluation to fail.');
    }
    expect(result.reason).toBe('complex-evaluation');
  });

  it('reports max-iteration stop when the iteration cap is reached', () => {
    const result = expectSuccessful(runFalsePosition({
      expression: 'x^3 - x - 1',
      lower: 1,
      upper: 2,
      tolerance: 1e-16,
      maxIterations: 3,
    }));

    expect(result.stopReason).toBe('max-iterations');
    expect(result.iterations).toBe(3);
    expect(result.approximations).toHaveLength(3);
  });

  it('keeps standard precision false-position behavior unchanged', () => {
    const defaultResult = expectSuccessful(runFalsePosition({
      expression: 'x^2 - 4',
      lower: 0,
      upper: 3,
      tolerance: 1e-16,
      maxIterations: 5,
    }));

    const standardResult = expectSuccessful(runFalsePosition({
      expression: 'x^2 - 4',
      lower: 0,
      upper: 3,
      tolerance: 1e-16,
      maxIterations: 5,
      precisionPolicy: createPrecisionPolicy({ mode: 'standard', digits: 5, rule: 'round' }),
    }));

    expect(standardResult.root).toBe(defaultResult.root);
    expect(standardResult.approximations).toEqual(defaultResult.approximations);
  });

  it('keeps display-only precision false-position internals unchanged', () => {
    const defaultResult = expectSuccessful(runFalsePosition({
      expression: 'x^2 - 4',
      lower: 0,
      upper: 3,
      tolerance: 1e-16,
      maxIterations: 5,
    }));

    const displayOnlyResult = expectSuccessful(runFalsePosition({
      expression: 'x^2 - 4',
      lower: 0,
      upper: 3,
      tolerance: 1e-16,
      maxIterations: 5,
      precisionPolicy: createPrecisionPolicy({ mode: 'display-only', digits: 5, rule: 'chop' }),
    }));

    expect(displayOnlyResult.root).toBe(defaultResult.root);
    expect(displayOnlyResult.approximations).toEqual(defaultResult.approximations);
  });

  it('uses calculation-level rounding for false-position operation boundaries', () => {
    const result = expectSuccessful(runFalsePosition({
      expression: 'x^2 - 4',
      lower: 0,
      upper: 3,
      tolerance: 1e-16,
      maxIterations: 5,
      precisionPolicy: createPrecisionPolicy({ mode: 'calculation-level', digits: 5, rule: 'round' }),
    }));

    expect(result.stopReason).toBe('max-iterations');
    expect(result.root).toBeCloseTo(1.9987, 12);
    expect(result.approximations.map((row) => row.point)).toEqual([
      1.3333,
      1.8461,
      1.9682,
      1.9936,
      1.9987,
    ]);
    expect(result.approximations.map((row) => row.fPoint)).toEqual([
      -2.2223,
      -0.59191,
      -0.12619,
      -0.025559,
      -0.0051983,
    ]);
  });

  it('uses calculation-level chopping for false-position operation boundaries', () => {
    const result = expectSuccessful(runFalsePosition({
      expression: 'x^2 - 4',
      lower: 0,
      upper: 3,
      tolerance: 1e-16,
      maxIterations: 5,
      precisionPolicy: createPrecisionPolicy({ mode: 'calculation-level', digits: 5, rule: 'chop' }),
    }));

    expect(result.stopReason).toBe('max-iterations');
    // Legacy stepwise expression chopping gives 1.9987 for this case; Modern currently
    // applies calculation precision at method boundaries after whole-expression evaluation.
    expect(result.root).not.toBeCloseTo(1.9987, 12);
    expect(result.root).toBeCloseTo(1.9988, 12);
    expect(result.approximations.map((row) => row.point)).toEqual([
      1.3334,
      1.8462,
      1.9683,
      1.9937,
      1.9988,
    ]);
    expect(result.approximations.map((row) => row.fPoint)).toEqual([
      -2.222,
      -0.59154,
      -0.12579,
      -0.02516,
      -0.0047985,
    ]);
  });

  it('uses precision-applied values for calculation-level sign decisions', () => {
    const result = expectSuccessful(runFalsePosition({
      expression: 'x - 1.234575',
      lower: 1.2345,
      upper: 1.2346,
      tolerance: 1e-16,
      maxIterations: 2,
      precisionPolicy: createPrecisionPolicy({ mode: 'calculation-level', digits: 5, rule: 'round' }),
    }));

    expect(result.approximations).toHaveLength(2);
    expect(result.approximations[0]).toMatchObject({
      lower: 1.2345,
      upper: 1.2346,
      point: 1.2346,
    });
    expect(result.approximations[0].fPoint).toBeGreaterThan(0);
    expect(result.approximations[0].decisionBasis).toBe('machine');
    expect(result.approximations[0].decision).toBe('left');
    expect(result.approximations[0].machineSigns).toMatchObject({ a: -1, c: 1 });
    expect(result.approximations[1]).toMatchObject({
      lower: 1.2345,
      upper: 1.2346,
    });
  });

  it('can use exact signs for false-position decisions while retaining machine rows', () => {
    const result = expectSuccessful(runFalsePosition({
      expression: 'x - 1.234575',
      lower: 1.2345,
      upper: 1.2346,
      tolerance: 1e-16,
      maxIterations: 2,
      decisionBasis: 'exact',
      precisionPolicy: createPrecisionPolicy({ mode: 'calculation-level', digits: 5, rule: 'round' }),
    }));

    expect(result.approximations[0]).toMatchObject({
      lower: 1.2345,
      upper: 1.2346,
      point: 1.2346,
      decisionBasis: 'exact',
      decision: 'right',
      exactSigns: { a: -1, c: 0 },
      machineSigns: { a: -1, c: 1 },
    });
    expect(result.approximations[0].note).toMatch(/disagree/i);
    expect(result.stopReason).toBe('stagnation-detected');
    expect(result.approximations).toHaveLength(1);
  });

  it('keeps invalid bracket behavior safe with calculation-level precision', () => {
    const result = runFalsePosition({
      expression: 'x^2 + 1',
      lower: -1,
      upper: 1,
      maxIterations: 10,
      precisionPolicy: createPrecisionPolicy({ mode: 'calculation-level', digits: 5, rule: 'round' }),
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected invalid bracket to fail.');
    }
    expect(result.reason).toBe('invalid-starting-interval');
  });

  it('supports degree-mode expressions through the evaluator wrapper', () => {
    const result = expectSuccessful(runFalsePosition({
      expression: 'cos(x)',
      lower: 0,
      upper: 180,
      tolerance: 1e-10,
      angleMode: 'deg',
    }));

    expect(result.root).toBeCloseTo(90, 12);
    expect(result.stopReason).toBe('exact-root');
  });

  it('returns normalized invalid-expression failures', () => {
    const result = runFalsePosition({
      expression: 'x + * 1',
      lower: 0,
      upper: 1,
    });

    expect(result.ok).toBe(false);
    if (result.ok) {
      throw new Error('Expected invalid expression to fail.');
    }
    expect(result.reason).toBe('invalid-expression');
  });
});

describe('isolated false position comparison with legacy RootEngine', () => {
  it('matches legacy on a simple normal convergence case', () => {
    const legacyResult = R.runFalsePosition({
      expression: 'x - 2',
      interval: { a: '0', b: '3' },
      machine,
      stopping: { kind: 'iterations', value: '10' },
      decisionBasis: 'machine',
      signDisplay: 'both',
      angleMode: 'rad',
    });

    const isolatedResult = expectSuccessful(runFalsePosition({
      expression: 'x - 2',
      lower: 0,
      upper: 3,
      maxIterations: 10,
      angleMode: 'rad',
    }));

    expect(legacyResult.summary.stopReason).toMatch(/exact-zero|machine-zero/);
    expect(isolatedResult.stopReason).toBe('exact-root');
    expect(isolatedResult.root).toBeCloseTo(legacyApproximationNumber(legacyResult), 12);
  });

  it('matches legacy invalid-bracket failure at the high level', () => {
    const legacyResult = R.runFalsePosition({
      expression: 'x^2 + 1',
      interval: { a: '-1', b: '1' },
      machine,
      stopping: { kind: 'iterations', value: '10' },
      decisionBasis: 'machine',
      signDisplay: 'both',
      angleMode: 'rad',
    });

    const isolatedResult = runFalsePosition({
      expression: 'x^2 + 1',
      lower: -1,
      upper: 1,
      maxIterations: 10,
      angleMode: 'rad',
    });

    expect(legacyResult.summary.stopReason).toBe('invalid-starting-interval');
    expect(isolatedResult.ok).toBe(false);
    if (isolatedResult.ok) {
      throw new Error('Expected isolated invalid bracket to fail.');
    }
    expect(isolatedResult.reason).toBe('invalid-starting-interval');
  });

  it('documents retained-endpoint stagnation differences on x^3 - x - 1', () => {
    const legacyResult = R.runFalsePosition({
      expression: 'x^3 - x - 1',
      interval: { a: '1', b: '2' },
      machine,
      stopping: { kind: 'iterations', value: '40' },
      decisionBasis: 'machine',
      signDisplay: 'both',
      angleMode: 'rad',
    });

    const isolatedResult = expectSuccessful(runFalsePosition({
      expression: 'x^3 - x - 1',
      lower: 1,
      upper: 2,
      maxIterations: 40,
      angleMode: 'rad',
    }));

    expect(legacyResult.summary.stopReason).toBe('retained-endpoint-stagnation');
    // The isolated method has a simpler stagnation threshold and also accepts
    // tolerance/function tolerance, so only high-level usability is compared.
    expect(isolatedResult.stopReason).toMatch(/function-tolerance-satisfied|tolerance-satisfied|stagnation-detected/);
    expect(isolatedResult.root).toBeCloseTo(legacyApproximationNumber(legacyResult), 6);
  });
});
