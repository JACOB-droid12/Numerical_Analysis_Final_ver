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

function parseAns(ans) {
    if (ans === null) return "null";
    if (ans.num !== undefined && ans.den !== undefined) {
        // Evaluate the rational to float for readable accuracy comparison
        return Number(ans.num) / Number(ans.den);
    }
    return Number(ans);
}

function runAccuracyTest(name, getTrueRoot, setup, expectedTolerance) {
  console.log(`\n================================`);
  console.log(`ACCURACY TEST: ${name}`);
  console.log(`f(x) = ${setup.expression}, Interval: [${setup.interval.a}, ${setup.interval.b}]`);

  let res;
  try {
    const start = Date.now();
    res = RootEngine.runBisection(setup);
    const time = Date.now() - start;
    
    let approxNum = parseAns(res.summary.approximation);
    const trueRoot = getTrueRoot();
    
    // Check if the answer deviates from the true mathematical truth more than the acceptable float bounds
    const error = Math.abs(approxNum - trueRoot);
    const bound = parseAns(res.rows[res.rows.length-1].bound) || parseAns(res.rows[res.rows.length-1].width)/2;
    
    console.log(`Result Reason: ${res.summary.stopReason}`);
    console.log(`Your Calculator's Output : ${approxNum}`);
    console.log(`True Mathematical Root   : ${trueRoot}`);
    console.log(`Absolute Error           : ${error.toExponential(4)}`);
    console.log(`Interval Final Width/2   : ${bound.toExponential(4)}`);
    
    if (error <= expectedTolerance) {
        console.log(`✅ PASSED: Answer is mathematically accurate within requested threshold (${expectedTolerance})! No false results given.`);
    } else {
        console.log(`❌ FAILED: Answer deviated too far! Your calculator generated an inaccurate result.`);
    }

  } catch (err) {
    console.log(`CRASH: ${err.message}`);
  }
}

console.log("Starting Unforgiving Mathematical Accuracy Verification...");

// Test 1: The Golden Ratio to Max Float Precision
// The true root is approx 1.618033988749895
runAccuracyTest(
  "Max IEEE-754 Depth (Golden Ratio)", 
  () => (1 + Math.sqrt(5))/2,
  {
    method: "bisection",
    expression: "x^2 - x - 1",
    interval: { a: 1, b: 2 },
    machine: { k: 53, mode: "round" },
    decisionBasis: "machine",
    stopping: { kind: "iterations", value: 53 }
  },
  2e-15 // Can't expect much closer than machine epsilon
);

// Test 2: The Stiff Skewed Function
// This verifies that wildly asymmetric function values don't pull the halving point off-center.
runAccuracyTest(
  "Wildly Asymmetric Evaluation (Stiff e^100x)", 
  () => Math.log(2)/100,
  {
    method: "bisection",
    expression: "e^(100x) - 2",
    interval: { a: 0, b: 1 },
    machine: { k: 53, mode: "round" },
    decisionBasis: "exact",
    stopping: { kind: "iterations", value: 60 } // Should be very tight
  },
  1e-18 // 2^-60 is about 8.6e-19
);

// Test 3: Fractional / Rational Representation Test
// Root is strictly 1/3.
runAccuracyTest(
  "Binary-unfriendly Rational convergence (1/3)", 
  () => 1/3,
  {
    method: "bisection",
    expression: "3x - 1",
    interval: { a: 0, b: 1 },
    machine: { k: 53, mode: "round" },
    decisionBasis: "exact",
    stopping: { kind: "iterations", value: 50 } // 2^-50 ~ 8.8e-16
  },
  1e-15
);

// Test 4: Flat Underflow Protection
// Root is at x=1. The function underflows heavily to 0 around x=1.
runAccuracyTest(
  "Flat Underflow Protection ((x-1)^3)", 
  () => 1.0,
  {
    method: "bisection",
    expression: "(x-1)^3",
    interval: { a: -5, b: 5 },
    machine: { k: 53, mode: "round" },
    decisionBasis: "exact", // Exact mode should NOT be fooled by rounding underflow
    stopping: { kind: "iterations", value: 54 } 
  },
  1e-15
);

// Test 5: Low-Precision Veracity Check
// If a user selects 3 sig fig Chopping, the calculator MUST mathematically mimic the flaw.
// We must test if its inaccurate answer accurately reflects the machine simulation constraint!
// A student computing f(x)=x - 1.455 on [1, 2] with k=3 chop by hand achieves EXACTLY 1.45 as the interval bound bracket eventually.
runAccuracyTest(
  "Student Simulation Accuracy (Chopping Rule Integrity)", 
  () => 1.45, // TRUE root for the K=3 CHOPPING system. Not the real world root (1.455)!
  {
    method: "bisection",
    expression: "x - 1.455",
    interval: { a: 1, b: 2 },
    machine: { k: 3, mode: "chop" },
    decisionBasis: "machine",
    stopping: { kind: "iterations", value: 10 } 
  },
  0.01 // It will lock into 1.45 and not go further
);
