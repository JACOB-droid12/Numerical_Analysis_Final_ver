const fs = require('fs');
const vm = require('vm');

const mathEngineCode = fs.readFileSync('math-engine.js', 'utf8');
const calcEngineCode = fs.readFileSync('calc-engine.js', 'utf8');
const expressionEngineCode = fs.readFileSync('expression-engine.js', 'utf8');
const rootEngineCode = fs.readFileSync('root-engine.js', 'utf8');

const sandbox = { window: {} };
vm.createContext(sandbox);
sandbox.BigInt = BigInt;
vm.runInContext("var window = this;", sandbox);
try {
  vm.runInContext(mathEngineCode, sandbox);
  vm.runInContext(calcEngineCode, sandbox);
  vm.runInContext(expressionEngineCode, sandbox);
  vm.runInContext(rootEngineCode, sandbox);
} catch (e) {
  console.error("Error loading engines:", e);
  process.exit(1);
}

const RootEngine = sandbox.window.RootEngine;

function runTest(category, setup) {
  console.log(`\n================================`);
  console.log(`TEST: ${category.name}`);
  console.log(`f(x) = ${setup.expression}, Interval: [${setup.interval.a}, ${setup.interval.b}]`);
  console.log(`Method: ${setup.method}, k=${setup.machine.k}, mode=${setup.machine.mode}, stopping=${setup.stopping.kind} (${setup.stopping.value})`);

  let res;
  try {
    if (setup.method === "falsePosition") {
      res = RootEngine.runFalsePosition(setup);
    } else {
      res = RootEngine.runBisection(setup);
    }
  } catch (err) {
    console.log(`EXCEPTION THROWN: ${err.message}`);
    return;
  }

  console.log(`Result: ${res.summary.stopReason} (${res.summary.stopDetail || ""})`);
  console.log(`Approximation:`, res.summary.approximation);
  if (category.name === "Category 1: Divide by Zero Tolerance") {
      console.log(`Final interval a: ${res.rows[res.rows.length-1].a.num}/${res.rows[res.rows.length-1].a.den}`);
      console.log(`Final interval b: ${res.rows[res.rows.length-1].b.num}/${res.rows[res.rows.length-1].b.den}`);
      console.log(`Width: ${res.rows[res.rows.length-1].width}`);
      console.log(`Bound: ${res.rows[res.rows.length-1].bound}`);
  }
  if (res.warnings && res.warnings.length > 0) {
      console.log(`Warnings:`, res.warnings);
  }
}

console.log("Starting Category Tests...");

// Category 1: Divide by Zero Tolerance Killer
runTest({ name: "Category 1: Divide by Zero Tolerance" }, {
  method: "bisection",
  expression: "x^3",
  interval: { a: -1, b: 2 },
  machine: { k: 8, mode: "round" },
  stopping: { kind: "epsilon", value: 0.00001, toleranceType: "relative" },
});

// Category 2: Fake Root
runTest({ name: "Category 2: Fake Root (1/x)" }, {
  method: "bisection",
  expression: "1/x",
  interval: { a: -1, b: 1 },
  machine: { k: 6, mode: "round" },
  stopping: { kind: "iterations", value: 100 },
});

runTest({ name: "Category 2: Fake Root (tan x)" }, {
  method: "bisection",
  expression: "tan(x)",
  interval: { a: 1.5, b: 1.6 },
  machine: { k: 6, mode: "round" },
  stopping: { kind: "iterations", value: 100 },
});

// Category 3: Catastrophic Cancellation
runTest({ name: "Category 3: Catastrophic Cancellation" }, {
  method: "bisection",
  expression: "x^3 - 3*x^2 + 3*x - 1",
  interval: { a: 0.99, b: 1.01 },
  machine: { k: 3, mode: "chop" },
  decisionBasis: "machine",
  stopping: { kind: "epsilon", value: 0.001, toleranceType: "absolute" },
});

// Category 4: The Out-of-Bounds Domain Trap
runTest({ name: "Category 4: Out-of-Bounds Domain Trap" }, {
  method: "bisection",
  expression: "ln(x) + sqrt(x)",
  interval: { a: -5, b: 5 },
  machine: { k: 5, mode: "round" },
  stopping: { kind: "iterations", value: 20 },
});

// Category 5: Monkey on a Keyboard Parser
runTest({ name: "Category 5: Monkey Parser Test" }, {
  method: "bisection",
  expression: "xsin(X) - 2x^(3-1) + (-x) * .5",
  interval: { a: 1, b: 2 },
  machine: { k: 6, mode: "round" },
  stopping: { kind: "iterations", value: 5 },
});

// Category 6: Infinite Loop / Stagnation Test (False Position)
runTest({ name: "Category 6: Infinite Loop (False Position)" }, {
  method: "falsePosition",
  expression: "x^10 - 1",
  interval: { a: 0, b: 1.5 },
  machine: { k: 6, mode: "round" },
  decisionBasis: "machine",
  stopping: { kind: "epsilon", value: 1e-7 },
  angleMode: "rad"
});

// Category 7: The Endpoint IS the Root
runTest({ name: "Category 7: The Endpoint IS the Root" }, {
  method: "bisection",
  expression: "x^2 - 4",
  interval: { a: 2, b: 5 },
  machine: { k: 4, mode: "round" },
  stopping: { kind: "iterations", value: 10 },
});

// Category 8: Rounding vs. Chopping Divergence
runTest({ name: "Category 8: Chopping" }, {
  method: "bisection",
  expression: "x - 1.455",
  interval: { a: 1, b: 2 },
  decisionBasis: "machine",
  machine: { k: 3, mode: "chop" },
  stopping: { kind: "iterations", value: 5 },
});

runTest({ name: "Category 8: Rounding" }, {
  method: "bisection",
  expression: "x - 1.455",
  interval: { a: 1, b: 2 },
  decisionBasis: "machine",
  machine: { k: 3, mode: "round" },
  stopping: { kind: "iterations", value: 5 },
});
