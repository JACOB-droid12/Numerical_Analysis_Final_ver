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
        return Number(ans.num) / Number(ans.den);
    }
    return Number(ans);
}

function runSigFigTest(name, setup, expectedRootExact, expectedRootMachine) {
  console.log(`\n================================`);
  console.log(`SIGFIG TEST: ${name}`);
  console.log(`Method: ${setup.method}, f(x) = ${setup.expression || setup.gExpression}`);
  console.log(`Machine: k=${setup.machine.k}, mode=${setup.machine.mode}`);

  let exactRes;
  let machineRes;

  try {
    // Run exact simulation first to see the true mathematical path if machine precision was infinite
    const exactSetup = JSON.parse(JSON.stringify(setup));
    // High precision exact simulation
    exactSetup.machine = { k: 50, mode: "round" };
    if (exactSetup.decisionBasis) exactSetup.decisionBasis = "exact";

    let methodName = setup.method === "newton" ? "NewtonRaphson" : setup.method.charAt(0).toUpperCase() + setup.method.slice(1);
    exactRes = RootEngine[`run${methodName}`](exactSetup);
  } catch(e) {
    console.error("Exact run failed:", e);
  }

  try {
    // Run machine mode
    let methodNameMachine = setup.method === "newton" ? "NewtonRaphson" : setup.method.charAt(0).toUpperCase() + setup.method.slice(1);
    machineRes = RootEngine[`run${methodNameMachine}`](setup);
  } catch(e) {
    console.error("Machine run failed:", e);
  }

  const exactApprox = exactRes ? parseAns(exactRes.summary.approximation) : null;
  const machineApprox = machineRes ? parseAns(machineRes.summary.approximation) : null;

  console.log(`[Exact Math Approx]   : ${exactApprox} `);
  console.log(`[k=${setup.machine.k} ${setup.machine.mode} Approx] : ${machineApprox}`);

  let passed = true;
  if (expectedRootExact !== undefined && Math.abs(exactApprox - expectedRootExact) > 1e-4) {
      console.log(`❌ EXACT math failed expected tolerance.`);
      passed = false;
  }
  if (expectedRootMachine !== undefined && machineApprox !== expectedRootMachine) {
      console.log(`❌ MACHINE math failed expected value. Expected: ${expectedRootMachine}, Got: ${machineApprox}`);
      passed = false;
  } else if (expectedRootMachine !== undefined) {
      console.log(`✅ MACHINE math strictly matched expected constraint value.`);
  }

  // Print progression for debugging
  console.log("\nProgression (Machine mode):");
  if (machineRes && machineRes.rows) {
      const len = machineRes.rows.length;
      for(let i=0; i<Math.min(len, 10); i++) {
         const row = machineRes.rows[i];
         const r = Object.keys(row).map(k => `${k}:${typeof row[k]==='object' ? (row[k]?parseAns(row[k]):'null') : row[k]}`).join(' | ');
         console.log(` Iter ${row.iteration}: ${r}`);
      }
      if (len > 10) console.log(` ... (${len-10} more rows)`);
  }

  console.log(`Result Reason: ${machineRes ? machineRes.summary.stopReason : 'Crash'}`);
  return passed;
}

let passes = 0;
let fails = 0;

function runAndTally(name, setup, expE, expM) {
    if (runSigFigTest(name, setup, expE, expM)) passes++;
    else fails++;
}

// 1. Newton's Method k=3 chop
// f(x) = x^2 - 2, f'(x) = 2x
// Root is sqrt(2) ≈ 1.414...
// With x0 = 1.00:
// x1 = x0 - (1.00-2)/2.00 = 1.50
// x2 = 1.50 - (2.25-2)/3.00 = 1.50 - 0.25/3.00 = 1.50 - 0.0833
// k=3 Chop:
// f(1.50) = 2.25 - 2 = 0.25
// df(1.50) = 3.00
// step = 0.25 / 3.00 = 0.0833333333... chopping at k=3 -> 0.0833
// x2 = 1.50 - 0.0833 = 1.41
// f(1.41) = 1.98 - 2.00 = -0.02
// df(1.41) = 2.82
// step = -0.02 / 2.82 = -0.00709
// x3 = 1.41 - (-0.00709) = 1.41 + 0.00709 = 1.41 (chop) or 1.42
runAndTally(
  "Newton sqrt(2) k=3 Chop",
  {
    method: "newton",
    expression: "x^2 - 2",
    dfExpression: "2x",
    x0: 1,
    machine: { k: 3, mode: "chop" },
    stopping: { kind: "iterations", value: 5 }
  }
);

runAndTally(
  "Newton sqrt(2) k=3 Round",
  {
    method: "newton",
    expression: "x^2 - 2",
    dfExpression: "2x",
    x0: 1,
    machine: { k: 3, mode: "round" },
    stopping: { kind: "iterations", value: 5 }
  }
);


// 2. Bisection k=2 round
// Root is 1.455.
// a=1.0, b=2.0 -> c=1.5
// f(1.5) = 1.5 - 1.455 = 0.045 -> k=2 round -> 0.045
runAndTally(
  "Bisection Linear k=2 Round",
  {
    method: "bisection",
    expression: "x - 1.455",
    interval: { a: 1, b: 2 },
    decisionBasis: "machine",
    machine: { k: 2, mode: "round" },
    stopping: { kind: "iterations", value: 8 }
  }
);

// 3. Secant Method
runAndTally(
  "Secant sqrt(2) k=4 Chop",
  {
    method: "secant",
    expression: "x^2 - 2",
    x0: 1,
    x1: 2,
    machine: { k: 4, mode: "chop" },
    stopping: { kind: "iterations", value: 5 }
  }
);


// 4. Fixed Point
runAndTally(
  "Fixed Point 1 + 1/x k=3 Round",
  {
    method: "fixedPoint",
    gExpression: "1 + 1/x",
    x0: 1,
    machine: { k: 3, mode: "round" },
    stopping: { kind: "iterations", value: 10 }
  }
);

runAndTally(
  "Fixed Point 1 + 1/x k=3 Chop",
  {
    method: "fixedPoint",
    gExpression: "1 + 1/x",
    x0: 1,
    machine: { k: 3, mode: "chop" },
    stopping: { kind: "iterations", value: 10 }
  }
);


console.log(`\nTests complete: ${passes} passed, ${fails} failed or not strictly checked.`);
