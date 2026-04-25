"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const ENGINE_FILES = [
  "math-engine.js",
  "calc-engine.js",
  "expression-engine.js",
  "root-engine.js"
];

function loadEngines() {
  const context = { console };
  context.globalThis = context;
  context.window = context;
  vm.createContext(context);

  for (const file of ENGINE_FILES) {
    const source = fs.readFileSync(path.join(ROOT, file), "utf8");
    vm.runInContext(source, context, { filename: file });
  }

  return {
    M: context.MathEngine,
    C: context.CalcEngine,
    E: context.ExpressionEngine,
    R: context.RootEngine
  };
}

const { R } = loadEngines();

let failures = 0;

function runTest(id, name, fn) {
  console.log(`TEST ${id}: ${name}`);
  try {
    fn();
    console.log(`> PASS`);
  } catch (error) {
    failures += 1;
    console.log(`> FAIL`);
    console.log(error && error.stack ? error.stack : String(error));
  }
}

runTest("V1", "RootEngine exposes all root solvers", () => {
  assert.strictEqual(typeof R.runBisection, "function");
  assert.strictEqual(typeof R.runNewtonRaphson, "function");
  assert.strictEqual(typeof R.runSecant, "function");
  assert.strictEqual(typeof R.runFalsePosition, "function");
  assert.strictEqual(typeof R.runFixedPoint, "function");
});

runTest("V2", "Newton smoke test keeps a structured summary on 1/x", () => {
  const result = R.runNewtonRaphson({
    expression: "1/x",
    dfExpression: "-1/x^2",
    x0: "1",
    machine: { k: 6, mode: "round" },
    stopping: { kind: "iterations", value: 3 }
  });

  assert.ok(result && typeof result === "object");
  assert.ok(result.summary && typeof result.summary === "object");
  assert.strictEqual(typeof result.summary.stopReason, "string");
  assert.ok(result.summary.stopReason.length > 0);
});

runTest("V3", "Bisection rejects epsilon 0", () => {
  const result = R.runBisection({
    expression: "x^2 - 2",
    interval: { a: "1", b: "2" },
    machine: { k: 6, mode: "round" },
    stopping: { kind: "epsilon", value: "0" }
  });

  assert.strictEqual(result.summary.stopReason, "invalid-input");
});

runTest("V4", "Bisection rejects epsilon -1", () => {
  const result = R.runBisection({
    expression: "x^2 - 2",
    interval: { a: "1", b: "2" },
    machine: { k: 6, mode: "round" },
    stopping: { kind: "epsilon", value: "-1" }
  });

  assert.strictEqual(result.summary.stopReason, "invalid-input");
});

runTest("V5", "Bisection rejects zero iterations", () => {
  const result = R.runBisection({
    expression: "x^2 - 2",
    interval: { a: "1", b: "2" },
    machine: { k: 6, mode: "round" },
    stopping: { kind: "iterations", value: 0 }
  });

  assert.strictEqual(result.summary.stopReason, "invalid-input");

  assert.ok(result.stopping && typeof result.stopping === "object");
  assert.strictEqual(result.stopping.kind, "iterations");
  assert.strictEqual(result.stopping.input, 0);
  assert.strictEqual(result.stopping.iterationsRequired, 0);
  assert.strictEqual(result.stopping.epsilonBound, null);
  assert.strictEqual(result.stopping.maxIterations, 0);
  assert.strictEqual(result.stopping.capReached, false);
  assert.strictEqual(result.canonical, "");
  assert.strictEqual(result.summary.stopDetail, "Enter a whole number of iterations, 1 or greater.");
});

runTest("V6", "Newton rejects epsilon 0 and NaN starting points", () => {
  const epsilonResult = R.runNewtonRaphson({
    expression: "x^2 - 2",
    dfExpression: "2*x",
    x0: "1",
    machine: { k: 6, mode: "round" },
    stopping: { kind: "epsilon", value: "0" }
  });

  const nanResult = R.runNewtonRaphson({
    expression: "x^2 - 2",
    dfExpression: "2*x",
    x0: "NaN",
    machine: { k: 6, mode: "round" },
    stopping: { kind: "iterations", value: 5 }
  });

  assert.strictEqual(epsilonResult.summary.stopReason, "invalid-input");
  assert.strictEqual(nanResult.summary.stopReason, "invalid-input");
});

runTest("V8", "Newton reports structured stops for singularity and divergence", () => {
  const singularResult = R.runNewtonRaphson({
    expression: "1/(x - 1)",
    dfExpression: "-1/(x - 1)^2",
    x0: "1",
    machine: { k: 6, mode: "round" },
    stopping: { kind: "iterations", value: 5 }
  });

  const divergenceResult = R.runNewtonRaphson({
    expression: "sin(x)",
    dfExpression: "cos(x)",
    x0: "1.5708",
    angleMode: "rad",
    machine: { k: 6, mode: "round" },
    stopping: { kind: "iterations", value: 5 }
  });

  assert.ok(singularResult && singularResult.summary && typeof singularResult.summary.stopReason === "string");
  assert.ok(["singularity-encountered", "non-finite-evaluation"].includes(singularResult.summary.stopReason));
  assert.ok(["diverged-step", "iteration-limit", "non-finite-evaluation"].includes(divergenceResult.summary.stopReason));
});

runTest("V10", "Newton does not call a huge residual step converged", () => {
  const result = R.runNewtonRaphson({
    expression: "x^2 + 100",
    dfExpression: "2*x",
    x0: "1e-9",
    machine: { k: 6, mode: "round" },
    stopping: { kind: "epsilon", value: "1" }
  });

  assert.notStrictEqual(result.summary.stopReason, "tolerance-reached");
});

runTest("V11", "Secant rejects NaN starting points", () => {
  const result = R.runSecant({
    expression: "x^2 - 2",
    x0: "NaN",
    x1: "1",
    machine: { k: 6, mode: "round" },
    stopping: { kind: "iterations", value: 5 }
  });

  assert.strictEqual(result.summary.stopReason, "invalid-input");
});

runTest("V12", "Secant returns a structured stop on tan(x) - 1000", () => {
  const result = R.runSecant({
    expression: "tan(x) - 1000",
    x0: "1.5",
    x1: "1.57",
    angleMode: "rad",
    machine: { k: 6, mode: "round" },
    stopping: { kind: "iterations", value: 10 }
  });

  assert.ok(result && result.summary && typeof result.summary.stopReason === "string");
  assert.ok(["stagnation", "tolerance-reached", "iteration-limit", "exact-zero", "machine-zero"].includes(result.summary.stopReason));
  assert.ok(Array.isArray(result.rows));
  assert.ok(result.rows.length > 0);
  assert.notStrictEqual(result.summary.approximation, null);
});

runTest("V13", "False position rejects epsilon -1", () => {
  const result = R.runFalsePosition({
    expression: "x^2 - 2",
    interval: { a: "1", b: "2" },
    machine: { k: 6, mode: "round" },
    stopping: { kind: "epsilon", value: "-1" }
  });

  assert.strictEqual(result.summary.stopReason, "invalid-input");
});

runTest("V14", "False position returns a structured result on 1/(x - 1.5)", () => {
  const result = R.runFalsePosition({
    expression: "1/(x - 1.5)",
    interval: { a: "1", b: "2" },
    machine: { k: 6, mode: "round" },
    stopping: { kind: "iterations", value: 10 }
  });

  assert.ok(result && result.summary && typeof result.summary.stopReason === "string");
  assert.ok(["singularity-encountered", "non-finite-evaluation"].includes(result.summary.stopReason));
  assert.strictEqual(result.rows.length, 0);
  assert.strictEqual(result.summary.stopDetail.length > 0, true);
});

runTest("V15", "False position handles x^10 - 1 stagnation on [0, 1.3]", () => {
  const result = R.runFalsePosition({
    expression: "x^10 - 1",
    interval: { a: "0", b: "1.3" },
    machine: { k: 6, mode: "round" },
    stopping: { kind: "epsilon", value: "1e-10" }
  });

  assert.ok(["retained-endpoint-stagnation", "tolerance-reached"].includes(result.summary.stopReason));
  if (result.summary.stopReason === "retained-endpoint-stagnation") {
    assert.strictEqual(result.rows.length, 20);
  } else {
    assert.ok(result.rows.length < 20);
  }
});

runTest("V16", "False position rejects missing interval objects", () => {
  const result = R.runFalsePosition({
    expression: "x^2 - 2",
    machine: { k: 6, mode: "round" },
    stopping: { kind: "iterations", value: 10 }
  });

  assert.strictEqual(result.summary.stopReason, "invalid-input");
  assert.strictEqual(result.summary.approximation, null);
});

runTest("V17", "Secant invalid input does not reuse x1 as the approximation", () => {
  const result = R.runSecant({
    expression: "1/(x - 1)",
    x0: "1",
    x1: "2",
    machine: { k: 6, mode: "round" },
    stopping: { kind: "iterations", value: 5 }
  });

  assert.strictEqual(result.summary.stopReason, "singularity-encountered");
  assert.strictEqual(result.summary.approximation, null);
  assert.strictEqual(result.rows.length, 0);
});

runTest("V18", "Fixed Point rejects zero iterations", () => {
  const result = R.runFixedPoint({
    gExpression: "1/(x - 1)",
    x0: "1",
    machine: { k: 6, mode: "round" },
    stopping: { kind: "iterations", value: 0 }
  });

  assert.strictEqual(result.summary.stopReason, "invalid-input");
});

runTest("V19", "Fixed Point reports a structured non-finite evaluation on exp(x) at x0 = 710", () => {
  const result = R.runFixedPoint({
    gExpression: "exp(x)",
    x0: "710",
    machine: { k: 6, mode: "round" },
    stopping: { kind: "iterations", value: 5 }
  });
  const residualResult = R.runFixedPoint({
    gExpression: "1/(x - 1)",
    x0: "2",
    machine: { k: 6, mode: "round" },
    stopping: { kind: "iterations", value: 1 }
  });

  assert.strictEqual(result.summary.stopReason, "non-finite-evaluation");
  assert.strictEqual(result.rows.length, 1);
  assert.strictEqual(result.rows[0].gxn, null);
  assert.strictEqual(result.summary.approximation, null);
  assert.strictEqual(residualResult.summary.stopReason, "iteration-limit");
  assert.strictEqual(residualResult.summary.residual, null);
  assert.strictEqual(residualResult.summary.residualBasis, "unavailable");
  assert.strictEqual(residualResult.rows.length, 1);
});

runTest("V20", "Fixed Point detects the g(x) = 1 - x cycle", () => {
  const cycleResult = R.runFixedPoint({
    gExpression: "1 - x",
    x0: "0.3",
    machine: { k: 6, mode: "round" },
    stopping: { kind: "iterations", value: 20 }
  });

  const stagnationResult = R.runFixedPoint({
    gExpression: "1 - 1e-20*x",
    x0: "1",
    machine: { k: 6, mode: "round" },
    stopping: { kind: "epsilon", value: "1e-6" }
  });
  const alternatingResult = R.runFixedPoint({
    gExpression: "1 - 0.99*x",
    x0: "0",
    machine: { k: 6, mode: "round" },
    stopping: { kind: "epsilon", value: "1e-2" }
  });
  const freezeResult = R.runFixedPoint({
    gExpression: "x + 1e-12",
    x0: "1",
    machine: { k: 6, mode: "round" },
    stopping: { kind: "epsilon", value: "1e-6" }
  });
  const lowPrecisionChopResult = R.runFixedPoint({
    gExpression: "1 + 1/x",
    x0: "1",
    machine: { k: 3, mode: "chop" },
    stopping: { kind: "iterations", value: 10 }
  });

  assert.strictEqual(cycleResult.summary.stopReason, "cycle-detected");
  assert.strictEqual(cycleResult.summary.cyclePeriod, 2);
  assert.notStrictEqual(stagnationResult.summary.stopReason, "cycle-detected");
  assert.strictEqual(stagnationResult.summary.cyclePeriod, undefined);
  assert.notStrictEqual(alternatingResult.summary.stopReason, "cycle-detected");
  assert.strictEqual(alternatingResult.summary.cyclePeriod, undefined);
  assert.notStrictEqual(freezeResult.summary.stopReason, "cycle-detected");
  assert.notStrictEqual(freezeResult.summary.stopReason, "iteration-cap");
  assert.notStrictEqual(lowPrecisionChopResult.summary.stopReason, "cycle-detected");
  assert.strictEqual(lowPrecisionChopResult.summary.stopReason, "iteration-limit");
  assert.strictEqual(lowPrecisionChopResult.summary.cyclePeriod, undefined);
});

console.log(`Summary: ${18 - failures}/${18} passed`);
if (failures > 0) {
  process.exitCode = 1;
}
