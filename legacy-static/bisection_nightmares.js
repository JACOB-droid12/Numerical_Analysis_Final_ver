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

function normalizeResult(res) {
    if (!res) return "CRASH";
    return {
        stopReason: res.summary.stopReason,
        stopDetail: res.summary.stopDetail || "",
        approximation: parseAns(res.summary.approximation),
        warnings: res.warnings && res.warnings.length > 0 ? res.warnings.map(w => w.code).join(", ") : "None"
    };
}

function runTest(id, setup) {
  console.log(`\n================================`);
  console.log(`TEST ${id}: f(x)=${setup.expression}, [${setup.interval.a}, ${setup.interval.b}], k=${setup.machine.k} ${setup.machine.mode}`);
  console.log(`Stopping: ${setup.stopping.kind} = ${setup.stopping.value} ${setup.stopping.toleranceType || ''}`);

  try {
    const res = RootEngine.runBisection(setup);
    const out = normalizeResult(res);
    console.log(`Reason: ${out.stopReason}${out.stopDetail ? " (" + out.stopDetail + ")" : ""}`);
    console.log(`Approximation: ${out.approximation}`);
    if (out.warnings !== "None") console.log(`Warnings: ${out.warnings}`);
  } catch (err) {
    console.log(`EXCEPTION THROWN: ${err.message}`);
  }
}

console.log("Starting Bisection Nightmares...");

function makeSetup(expr, a, b, k, mode, stopKind, stopVal, tolType = "absolute", decBasis = "exact") {
    return {
        method: "bisection",
        expression: expr,
        interval: { a, b },
        machine: { k, mode },
        decisionBasis: decBasis,
        stopping: { kind: stopKind, value: stopVal, toleranceType: tolType },
        angleMode: "rad" // default for trig
    };
}

// 4.1 to 4.30
runTest("4.1", makeSetup("x^2 - 4", 0, 3, 6, "round", "epsilon", 0.0001));
runTest("4.2", makeSetup("x^2 - 4", 0, 2, 6, "round", "epsilon", 0.0001));
runTest("4.3", makeSetup("x^2 - 4", -2, 0, 6, "round", "epsilon", 0.0001));
runTest("4.4", makeSetup("x^2 - 4", 3, 5, 6, "round", "epsilon", 0.0001));
runTest("4.5", makeSetup("x^2 - 4", 5, 3, 6, "round", "epsilon", 0.0001));
runTest("4.6", makeSetup("x^2 - 4", 2, 2, 6, "round", "epsilon", 0.0001));
runTest("4.7", makeSetup("x^3 - x", -0.5, 0.5, 6, "round", "epsilon", 0.0001));
runTest("4.8", makeSetup("x^3 - x", -2, 2, 6, "round", "epsilon", 0.0001));
runTest("4.9", makeSetup("sin(x)", 3, 4, 6, "round", "epsilon", 1e-8));
runTest("4.10", makeSetup("sin(x)", 0, 6.3, 6, "round", "epsilon", 0.0001));
runTest("4.11", makeSetup("1/x", -1, 1, 6, "round", "epsilon", 0.0001));
runTest("4.12", makeSetup("tan(x)", 1, 2, 6, "round", "epsilon", 0.0001));
runTest("4.13", makeSetup("x^2", -1, 1, 6, "round", "epsilon", 0.0001));
runTest("4.14", makeSetup("x^2 - x", 0, 1, 6, "round", "epsilon", 0.0001));
runTest("4.15", makeSetup("x^2 - 2", 1, 2, 3, "chop", "iterations", 5));
runTest("4.16", makeSetup("x^2 - 2", 1, 2, 3, "chop", "epsilon", 1e-12));
runTest("4.17", makeSetup("x^2 - 2", 0, 1e10, 6, "round", "epsilon", 0.0001));
runTest("4.18", makeSetup("x^2 - 2", 1.414, 1.415, 6, "round", "epsilon", 0.0001));
runTest("4.19", makeSetup("x - 1/3", 0, 1, 4, "chop", "epsilon", 0.0001));
runTest("4.20", makeSetup("x^10 - 1", 0.9, 1.1, 6, "round", "epsilon", 1e-8));
runTest("4.21", makeSetup("e^x - 2", 0, 1, 6, "round", "epsilon", 0.0001));
runTest("4.22", makeSetup("x^2 - 2", 1, 2, 6, "round", "epsilon", 0));
runTest("4.23", makeSetup("x^2 - 2", 1, 2, 6, "round", "epsilon", -0.001));
runTest("4.24", makeSetup("x^2 - 2", 1, 2, 6, "round", "iterations", 0));
runTest("4.25", makeSetup("x^2 - 2", 1, 2, 6, "round", "iterations", 1000));
runTest("4.26", makeSetup("x^2 - 2", 1, 2, 6, "round", "epsilon", 0.0001, "relative"));
runTest("4.27", makeSetup("x^2 - 2", -2, -1, 6, "round", "epsilon", 0.0001, "relative"));
runTest("4.28", makeSetup("x^2 - 2", 0, 2, 6, "round", "epsilon", 0.0001, "relative"));
runTest("4.29", makeSetup("x", -1, 1, 6, "round", "epsilon", 0.0001));

console.log(`\n================================`);
console.log(`TEST 4.30: Compare machine vs exact decision basis`);
const resExact = RootEngine.runBisection(makeSetup("x^2 - 2", 1, 2, 6, "round", "iterations", 10, "absolute", "exact"));
const resMach = RootEngine.runBisection(makeSetup("x^2 - 2", 1, 2, 6, "round", "iterations", 10, "absolute", "machine"));
console.log(`Exact Approx: ${parseAns(resExact.summary.approximation)}`);
console.log(`Machine Approx: ${parseAns(resMach.summary.approximation)}`);

