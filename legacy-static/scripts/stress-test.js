"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = __dirname ? path.resolve(__dirname, "..") : process.cwd();
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

const { M, C, E, R } = loadEngines();


// Shortcut to run all combos once per case just for "revealer tests"
function runBugRevealer(method, options) {
    try {
        let result;
        if (method === "newton") result = R.runNewtonRaphson(options);
        else if (method === "secant") result = R.runSecant(options);
        else if (method === "falsePosition") result = R.runFalsePosition(options);
        else if (method === "fixedPoint") result = R.runFixedPoint(options);

        console.log(`Stop Reason: ${result.summary.stopReason}`);
        if(result.summary.error !== undefined) console.log(`Last error: ${result.summary.error}`);
        // print last row
        if(result.rows && result.rows.length > 0) {
            console.log(`Iterations: ${result.rows.length}`);
            const last = result.rows[result.rows.length-1];
            if(last.xn !== undefined) console.log(`Last xn: ${last.xn}`);
            if(last.c !== undefined) console.log(`Last c: ${last.c}`);
        }
    } catch(e) {
        console.log(`Exception: ${e.message}`);
    }
}

console.log("=== BUG REVEALER SHORTLIST ===");

console.log("\n1) Newton: x^3, 3x^2, x0=0");
runBugRevealer("newton", {
    expression: "x^3", dfExpression: "3x^2", x0: "0",
    machine: {k:6, mode:"round"}, stopping: {kind:"iterations", value:10}, angleMode:"rad"
});

console.log("\n2) Newton: x^3 - 2x + 2, 3x^2 - 2, x0=0");
runBugRevealer("newton", {
    expression: "x^3 - 2x + 2", dfExpression: "3x^2 - 2", x0: "0",
    machine: {k:6, mode:"round"}, stopping: {kind:"iterations", value:20}, angleMode:"rad"
});

console.log("\n3) Secant: (x-1)^2, x0=0, x1=2");
runBugRevealer("secant", {
    expression: "(x-1)^2", x0: "0", x1: "2",
    machine: {k:6, mode:"round"}, stopping: {kind:"iterations", value:10}, angleMode:"rad"
});

console.log("\n4) False Position: 1/(x-1), a=0, b=2");
runBugRevealer("falsePosition", {
    expression: "1/(x-1)", interval: {a:"0", b:"2"}, decisionBasis: "exact",
    machine: {k:6, mode:"round"}, stopping: {kind:"iterations", value:10}, angleMode:"rad"
});

console.log("\n5) False Position: x^10 - 1, a=0, b=1.5");
runBugRevealer("falsePosition", {
    expression: "x^10 - 1", interval: {a:"0", b:"1.5"}, decisionBasis: "exact",
    machine: {k:6, mode:"round"}, stopping: {kind:"iterations", value:20}, angleMode:"rad"
});

console.log("\n6) Fixed Point: g(x)=1-x, x0=0.2");
runBugRevealer("fixedPoint", {
    gExpression: "1-x", x0: "0.2",
    machine: {k:6, mode:"round"}, stopping: {kind:"iterations", value:20}, angleMode:"rad"
});

console.log("\n=== ADDITIONAL TORTURE TESTS ===");

console.log("\nNewton: Near-zero derivative x0=0.8165");
runBugRevealer("newton", {
    expression: "x^3 - 2x + 2", dfExpression: "3x^2 - 2", x0: "0.8165",
    machine: {k:6, mode:"round"}, stopping: {kind:"iterations", value:10}, angleMode:"rad"
});

console.log("\nNewton: Multiple root (x-1)^4, x0=2");
runBugRevealer("newton", {
    expression: "(x-1)^4", dfExpression: "4*(x-1)^3", x0: "2",
    machine: {k:6, mode:"round"}, stopping: {kind:"iterations", value:20}, angleMode:"rad"
});

console.log("\nNewton: Fractional power x^(1/3), x0=0.1");
runBugRevealer("newton", {
    expression: "x^(1/3)", dfExpression: "(1/3)*x^(-2/3)", x0: "0.1",
    machine: {k:6, mode:"round"}, stopping: {kind:"iterations", value:10}, angleMode:"rad"
});

console.log("\nSecant: Same starting points x0=1, x1=1");
runBugRevealer("secant", {
    expression: "x^2 - 2", x0: "1", x1: "1",
    machine: {k:6, mode:"round"}, stopping: {kind:"iterations", value:10}, angleMode:"rad"
});

console.log("\nSecant: Tiny numbers x^7, x0=-0.001, x1=0.001");
runBugRevealer("secant", {
    expression: "x^7", x0: "-0.001", x1: "0.001",
    machine: {k:6, mode:"round"}, stopping: {kind:"iterations", value:10}, angleMode:"rad"
});

console.log("\nSecant: No real root x^2 + 1, x0=-1, x1=1");
runBugRevealer("secant", {
    expression: "x^2 + 1", x0: "-1", x1: "1",
    machine: {k:6, mode:"round"}, stopping: {kind:"iterations", value:10}, angleMode:"rad"
});

console.log("\nFalse Position: Endpoint root (x-2)*(x+1), a=2, b=5");
runBugRevealer("falsePosition", {
    expression: "(x-2)*(x+1)", interval: {a:"2", b:"5"}, decisionBasis:"exact",
    machine: {k:6, mode:"round"}, stopping: {kind:"iterations", value:10}, angleMode:"rad"
});

console.log("\nFalse Position: Trig asymptote tan(x), a=1.4, b=1.6 rad");
runBugRevealer("falsePosition", {
    expression: "tan(x)", interval: {a:"1.4", b:"1.6"}, decisionBasis:"exact",
    machine: {k:6, mode:"round"}, stopping: {kind:"iterations", value:10}, angleMode:"rad"
});

console.log("\nFalse Position: Trig asymptote tan(x), a=80, b=100 deg");
runBugRevealer("falsePosition", {
    expression: "tan(x)", interval: {a:"80", b:"100"}, decisionBasis:"exact",
    machine: {k:6, mode:"round"}, stopping: {kind:"iterations", value:10}, angleMode:"deg"
});

console.log("\nFixed Point: Divergence g(x)=x^2+1, x0=2");
runBugRevealer("fixedPoint", {
    gExpression: "x^2+1", x0: "2",
    machine: {k:6, mode:"round"}, stopping: {kind:"iterations", value:10}, angleMode:"rad"
});

console.log("\nFixed Point: Super slow convergence 1 + 0.999(x-1), x0=0");
runBugRevealer("fixedPoint", {
    gExpression: "1 + 0.999*(x-1)", x0: "0",
    machine: {k:6, mode:"round"}, stopping: {kind:"epsilon", value:"1e-6"}, angleMode:"rad"
});
