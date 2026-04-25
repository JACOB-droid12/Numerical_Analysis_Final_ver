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
const C = context.CalcEngine;

function serialize(obj) {
    if (typeof obj === 'object') {
        if (obj === null) return 'null';
        if (obj.kind === 'calc') return `${obj.re}`;
        return JSON.stringify(obj, (k, v) => typeof v === 'bigint' ? v.toString() + 'n' : v);
    }
    return String(obj);
}

function runAccuracyTest(num, method, options, expectedRoot) {
    console.log(`\nACCURACY TEST ${num}: ${method.toUpperCase()}`);
    console.log(`Expected Root: ${expectedRoot}`);
    try {
        let result;
        if (method === "newton") result = R.runNewtonRaphson(options);
        else if (method === "secant") result = R.runSecant(options);
        else if (method === "falsePosition") result = R.runFalsePosition(options);
        else if (method === "fixedPoint") result = R.runFixedPoint(options);

        let approxObj = result.summary.approximation;
        let approxFloat = (approxObj && approxObj.num !== undefined) ? Number(approxObj.num)/Number(approxObj.den)*approxObj.sign : Number(approxObj);
        let approxStr = serialize(approxObj);
        let claim = result.summary.stopReason;

        console.log(`> Stop Reason: ${claim}`);
        console.log(`> Appx Answer: ${approxStr}`);

        if (claim === "tolerance-reached" || claim === "exact-zero" || claim === "machine-zero") {
            let drift = Math.abs(approxFloat - expectedRoot);
            console.log(`> Drift from truth: ${drift}`);
            if (drift > 1) { // 1.0 margin of error is massive. If it's larger, it's blatantly WRONG.
                 console.log(`> 🚩 FLAG: SILENTLY WRONG ANSWER DETECTED! Claimed convergence but drifted by ${drift}!`);
            } else if (drift > 0.01) {
                 console.log(`> ⚠ FLAG: Highly inaccurate result reported as converged! Drift: ${drift}`);
            } else {
                 console.log(`> PASS: Result is accurate.`);
            }
        } else {
            console.log(`> SAFELY STOPPED (Unconverged): ${claim}`);
        }

    } catch(e) {
        console.log(`> EXCEPTION (Safe): ${e.message}`);
    }
}

// 1. Newton Flat Valley false convergence
// f(x) = x^20. Root = 0.
// If x is near 0.8, x^20 is small, derivative is small. Step might be tiny.
runAccuracyTest(1, "newton", {
    expression: "(x-1)^20", dfExpression: "20*(x-1)^19", x0: "1.5",
    machine: {k:12, mode:"round"}, stopping: {kind:"epsilon", value:"1e-6"}
}, 1.0);

// 2. Fixed point deceptive convergence
// g(x) = x + 1e-8. No fixed point.
// Step error |g(x) - x| = 1e-8. If epsilon is 1e-7, it will instantly stop and claim x0 is the root!
runAccuracyTest(2, "fixedPoint", {
    gExpression: "x + 1e-8", x0: "5",
    machine: {k:12, mode:"round"}, stopping: {kind:"epsilon", value:"1e-7"}
}, Infinity); // Should not converge!

// 3. Secant near-flat curve false stop
// f(x) = (x/1000)^3. Root is 0.
runAccuracyTest(3, "secant", {
    expression: "(x/1000)^3", x0: "500", x1: "400",
    machine: {k:12, mode:"round"}, stopping: {kind:"epsilon", value:"0.0001"}
}, 0.0);

// 4. False Position on aggressive curve. It might stop because interval width drops below epsilon, but is the root right?
// f(x) = x^10 - 1. Root is 1.0.
runAccuracyTest(4, "falsePosition", {
    expression: "x^10 - 1", interval: {a:"0", b:"1.5"}, decisionBasis: "machine",
    machine: {k:12, mode:"round"}, stopping: {kind:"epsilon", value:"1e-5"}
}, 1.0);

// 5. Newton step vanishing due to cancellation
// f(x) = x^2 - 1e-20. Root = 1e-10.
runAccuracyTest(5, "newton", {
    expression: "x^2 - 1e-20", dfExpression: "2x", x0: "1",
    machine: {k:12, mode:"round"}, stopping: {kind:"epsilon", value:"1e-5"}
}, 1e-10);

// 6. Fixed Point pseudo-convergence
// g(x) = x + 0.99*epsilon.
runAccuracyTest(6, "fixedPoint", {
    gExpression: "x + 0.00000099", x0: "100",
    machine: {k:12, mode:"round"}, stopping: {kind:"epsilon", value:"0.000001"}
}, Infinity); // Should not converge, but will it claim tolerance-reached?

// 7. False position stopping tolerance on a discontinuity
// f(x) = sign(x - 5) essentially. Discontinuity at 5. 1/(x-5)
runAccuracyTest(7, "falsePosition", {
    expression: "1/(x-5)", interval: {a:"4", b:"6"}, decisionBasis: "machine",
    machine: {k:12, mode:"round"}, stopping: {kind:"epsilon", value:"1e-5"}
}, Infinity); // False position should NOT find a 'root' here. It should throw or stall.
