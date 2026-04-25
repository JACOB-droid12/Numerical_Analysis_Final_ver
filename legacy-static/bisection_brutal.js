const fs = require('fs');
const vm = require('vm');

const mathEngineCode = fs.readFileSync('math-engine.js', 'utf8');
const calcEngineCode = fs.readFileSync('calc-engine.js', 'utf8');
const expressionEngineCode = fs.readFileSync('expression-engine.js', 'utf8');
const rootEngineCode = fs.readFileSync('root-engine.js', 'utf8');

const sandbox = { window: {} };
sandbox.BigInt = BigInt;
vm.createContext(sandbox);
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
  if (setup.interval) {
     console.log(`Interval: [${setup.interval.a}, ${setup.interval.b}]`);
  }

  let res;
  try {
    const start = Date.now();
    res = RootEngine.runBisection(setup);
    const time = Date.now() - start;
    
    console.log(`Execution Time: ${time}ms`);
    console.log(`Result: ${res.summary.stopReason} (${res.summary.stopDetail || ""})`);
    if (res.rows) console.log(`Completed Iterations: ${res.rows.length}`);
  } catch (err) {
    console.log(`CRASH Bisection Failed Exception! ${err.message}`);
  }
}

console.log("Starting Bisection Specific Brutality Tests...");

// 1. BigInt Power Explosion
runTest({ name: "Bisection BigInt Exhaustion Test (x^50 in completely Exact mode)" }, {
  method: "bisection",
  expression: "x^50 - 0.5",
  interval: { a: 0, b: 1 },
  machine: { k: 53, mode: "round" },
  decisionBasis: "exact",
  stopping: { kind: "iterations", value: 150 } // By iteration 150, denominator is 2^150. Raising to 50th power means calculating with a 7500-bit integer.
});

// 2. NaN Endpoint Poisoning
runTest({ name: "Bisection NaN Input Poison" }, {
  method: "bisection",
  expression: "x^2 - 1",
  interval: { a: "NaN", b: 1 },
  machine: { k: 53, mode: "round" },
  decisionBasis: "machine",
  stopping: { kind: "iterations", value: 5 }
});

// 3. 0/0 Expression Trap
runTest({ name: "Bisection 0/0 Zero Divide Limit Trick" }, {
  method: "bisection",
  expression: "(x^2 - 1)/(x - 1)", // At x=1, it evaluates to 0/0 (NaN)
  interval: { a: -2, b: 1 },
  machine: { k: 53, mode: "round" },
  decisionBasis: "exact",
  stopping: { kind: "iterations", value: 20 }
});

// 4. Overlap Absolute Precision Collapse
runTest({ name: "Bisection Machine Floating Point Collapse" }, {
  method: "bisection",
  expression: "x^3 - 2",
  interval: { a: 1.2599210498948732, b: 1.2599210498948733 }, // Already ultra micro
  machine: { k: 53, mode: "chop" },
  decisionBasis: "machine",
  stopping: { kind: "epsilon", value: 1e-100, toleranceType: "relative" }
});

// 5. Extremely Malformed Expression (Syntax Bomb)
runTest({ name: "Bisection Parser Complete Garble" }, {
  method: "bisection",
  expression: "x^(x+(2*)", 
  interval: { a: 0, b: 1 },
  machine: { k: 53, mode: "round" },
  decisionBasis: "machine",
  stopping: { kind: "iterations", value: 10 }
});
