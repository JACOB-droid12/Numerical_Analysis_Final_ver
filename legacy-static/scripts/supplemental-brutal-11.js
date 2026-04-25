"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = __dirname ? path.resolve(__dirname, "..") : process.cwd();
const ENGINE_FILES = ["math-engine.js", "calc-engine.js", "expression-engine.js", "root-engine.js"];

const context = { console };
context.globalThis = context;
context.window = context;
vm.createContext(context);
for (const file of ENGINE_FILES) {
  const source = fs.readFileSync(path.join(ROOT, file), "utf8");
  vm.runInContext(source, context, { filename: file });
}

const R = context.RootEngine;

function runTest(id, name, method, options, expected) {
  let result;
  let err;
  try {
    if (method === "newton") result = R.runNewtonRaphson(options);
    else if (method === "secant") result = R.runSecant(options);
    else if (method === "falsePosition") result = R.runFalsePosition(options);
    else if (method === "fixedPoint") result = R.runFixedPoint(options);
    else if (method === "bisection") result = R.runBisection(options);
  } catch (error) {
    err = error.message;
  }

  console.log(`\nTEST S${id}: ${name}`);
  console.log(`Expected: ${expected}`);
  if (err) {
    console.log(`> Result: ❌ EXCEPTION: ${err}`);
  } else {
    console.log(`> Result: ${result.summary.intervalStatus || "N/A"} / ${result.summary.stopReason}`);
  }
}

runTest(1, "Newton with tiny derivative denominator", "newton", {
  expression: "x - 1",
  dfExpression: "1e-315",
  x0: "0",
  machine: { k: 12, mode: "round" },
  stopping: { kind: "iterations", value: 3 }
}, "Should not hang or crash the harness.");

runTest(2, "Bisection on huge interval", "bisection", {
  expression: "x",
  interval: { a: "-1e308", b: "1e308" },
  decisionBasis: "exact",
  machine: { k: 12, mode: "round" },
  stopping: { kind: "iterations", value: 10 }
}, "Should tolerate the giant bracket.");

runTest(3, "False position with catastrophic cancellation expression", "falsePosition", {
  expression: "x + 1e16 - 1e16",
  interval: { a: "-1", b: "1" },
  decisionBasis: "machine",
  machine: { k: 5, mode: "chop" },
  stopping: { kind: "iterations", value: 10 }
}, "Cancellation stress.");

runTest(4, "Newton with hyper-deep expression tree", "newton", {
  expression: "x" + "+(x".repeat(1000) + ")".repeat(1000),
  dfExpression: "1001",
  x0: "1",
  machine: { k: 12, mode: "round" },
  stopping: { kind: "iterations", value: 2 }
}, "Parser depth stress.");

runTest(5, "Newton with derivative below EPS but nonzero", "newton", {
  expression: "x",
  dfExpression: "1e-18",
  x0: "1",
  machine: { k: 15, mode: "round" },
  stopping: { kind: "iterations", value: 2 }
}, "Guardrail around near-zero derivatives.");

runTest(6, "Secant with NaN input literal", "secant", {
  expression: "x",
  x0: "0/0",
  x1: "1",
  machine: { k: 12, mode: "round" },
  stopping: { kind: "iterations", value: 1 }
}, "Bad starting-value input handling.");

runTest(7, "Fixed point with explosive x^10 growth", "fixedPoint", {
  gExpression: "x^10",
  x0: "10",
  machine: { k: 12, mode: "round" },
  stopping: { kind: "iterations", value: 50 }
}, "Should diverge or stop safely.");

runTest(8, "Newton repeated-decimal edge", "newton", {
  expression: "x - 0.3333333333333333333333333333333",
  dfExpression: "1",
  x0: "0",
  machine: { k: 12, mode: "round" },
  stopping: { kind: "iterations", value: 2 }
}, "Repeated decimal parsing stress.");

runTest(9, "Fixed point deceptive epsilon stop", "fixedPoint", {
  gExpression: "x + 1e-8",
  x0: "5",
  machine: { k: 12, mode: "round" },
  stopping: { kind: "epsilon", value: "1e-7" }
}, "Should reveal pseudo-convergence risk.");

runTest(10, "Newton tiny-root false convergence check", "newton", {
  expression: "x^2 - 1e-20",
  dfExpression: "2x",
  x0: "1",
  machine: { k: 12, mode: "round" },
  stopping: { kind: "epsilon", value: "1e-5" }
}, "Tiny-root accuracy stress.");

runTest(11, "False position discontinuity masquerading as root", "falsePosition", {
  expression: "1/(x-5)",
  interval: { a: "4", b: "6" },
  decisionBasis: "machine",
  machine: { k: 12, mode: "round" },
  stopping: { kind: "epsilon", value: "1e-5" }
}, "Should not silently accept a pole as a root.");
