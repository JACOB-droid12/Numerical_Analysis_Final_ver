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
  console.log(`f(x) = ${setup.expression || setup.gExpression}, Interval/Points: ${JSON.stringify(setup.interval || {x0: setup.x0, x1: setup.x1})}`);

  let res;
  try {
    const start = Date.now();
    if (setup.method === "falsePosition") res = RootEngine.runFalsePosition(setup);
    else if (setup.method === "secant") res = RootEngine.runSecant(setup);
    else if (setup.method === "newton") res = RootEngine.runNewtonRaphson(setup);
    else if (setup.method === "fixedPoint") res = RootEngine.runFixedPoint(setup);
    else res = RootEngine.runBisection(setup);
    const time = Date.now() - start;
    
    console.log(`Execution Time: ${time}ms`);
    console.log(`Result: ${res.summary.stopReason} (${res.summary.stopDetail || ""})`);
    if (res.rows) console.log(`Completed Iterations: ${res.rows.length}`);
  } catch (err) {
    console.log(`CRASH! Exception thrown: ${err.message}`);
  }
}

console.log("Starting Brutal RootEngine Annihilation Tests...");

// Brutality 1: UI Freeze via Unbounded Iterations
runTest({ name: "Brutality 1: UI Freeze / Memory Bomb (Bisection with 1,000,000 iterations)" }, {
  method: "bisection",
  expression: "x - 1.23456",
  interval: { a: -2, b: 2 },
  machine: { k: 53, mode: "round" },
  decisionBasis: "exact",
  stopping: { kind: "iterations", value: 1000000 } // 1 million!
});

// Brutality 2: Unbound Variables (Missing 'y')
runTest({ name: "Brutality 2: The Rogue Variable Bomb" }, {
  method: "bisection",
  expression: "x + y - 1",
  interval: { a: -2, b: 2 },
  machine: { k: 53, mode: "round" },
  stopping: { kind: "iterations", value: 5 }
});

// Brutality 3: Newton Nightmare (Starting out of domain)
runTest({ name: "Brutality 3: Newton's Ghost (ln(x) with negative start)" }, {
  method: "newton",
  expression: "ln(x)",
  dfExpression: "1/x",
  x0: -5,
  machine: { k: 53, mode: "round" },
  stopping: { kind: "iterations", value: 5 }
});

// Brutality 4: Secant over a Pole
runTest({ name: "Brutality 4: Secant Over The Abyss (1/x across 0)" }, {
  method: "secant",
  expression: "1/x",
  x0: -1,
  x1: 1,
  machine: { k: 53, mode: "round" },
  stopping: { kind: "iterations", value: 20 }
});

// Brutality 5: False Position Flatline (Step function sign switch)
runTest({ name: "Brutality 5: False Position Flatline (sgn(x - 1))" }, {
  method: "falsePosition",
  expression: "x / abs(x)", 
  interval: { a: -1, b: 1 },
  machine: { k: 53, mode: "round" },
  decisionBasis: "machine",
  stopping: { kind: "iterations", value: 10 }
});

// Brutality 6: Fixed Point Exponential Divergence Explosion
runTest({ name: "Brutality 6: Fixed Point Exponential Divergence" }, {
  method: "fixedPoint",
  gExpression: "e^x",
  x0: 100, // e^100, then e^(e^100) -> Infinity!
  machine: { k: 53, mode: "round" },
  stopping: { kind: "iterations", value: 5 }
});
