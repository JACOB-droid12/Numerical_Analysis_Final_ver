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

const context = { console };
context.globalThis = context;
context.window = context;
vm.createContext(context);
for (const file of ENGINE_FILES) {
  const source = fs.readFileSync(path.join(ROOT, file), "utf8");
  vm.runInContext(source, context, { filename: file });
}
const M = context.MathEngine;
const C = context.CalcEngine;
const E = context.ExpressionEngine;
const R = context.RootEngine;

function serialize(obj) {
    if (typeof obj === 'object') {
        if (obj === null) return 'null';
        if (obj.kind === 'rational') return `${obj.sign < 0 ? '-' : ''}${obj.num}/${obj.den}`;
        if (obj.kind === 'calc') return `${obj.re}`;
        return JSON.stringify(obj, (k, v) => typeof v === 'bigint' ? v.toString() + 'n' : v);
    }
    return String(obj);
}

function runBrutal(num, title, method, options) {
    console.log(`\nBRUTAL TEST ${num}: ${title}`);
    try {
        let result;
        if (method === "newton") result = R.runNewtonRaphson(options);
        else if (method === "secant") result = R.runSecant(options);
        else if (method === "falsePosition") result = R.runFalsePosition(options);
        else if (method === "fixedPoint") result = R.runFixedPoint(options);
        else if (method === "bisection") result = R.runBisection(options);

        console.log(`> Status: ${result.summary.intervalStatus || "N/A"}`);
        console.log(`> Stop: ${result.summary.stopReason}`);
        if(result.summary.error !== undefined && result.summary.error !== null) {
            console.log(`> Last error: ${result.summary.error}`);
        }
        if(result.rows) {
            console.log(`> Iterations: ${result.rows.length}`);
            if(result.rows.length > 0) {
                const last = result.rows[result.rows.length-1];
                if(last.xn !== undefined) console.log(`> Last xn: ${serialize(last.xn)}`);
                if(last.c !== undefined) console.log(`> Last c: ${serialize(last.c)}`);
            }
        }
    } catch(e) {
        console.log(`> 💥 CRASHED: ${e.stack ? e.stack.split('\n')[0] : e.message}`);
    }
}

// 1. Infinity Overflow in Value (exceeds 1.79e308)
runBrutal(1, "JS Infinity via massive division step", "newton", {
    expression: "x - 1", dfExpression: "1e-315", x0: "0",
    machine: {k: 12, mode: "round"}, stopping: {kind: "iterations", value: 3}
});

// 2. Absolute Width Overflow
runBrutal(2, "Bisection Interval Infinity", "bisection", {
    expression: "x", interval: {a: "-1e308", b: "1e308"},
    decisionBasis: "exact", machine: {k: 12, mode: "round"},
    stopping: {kind: "iterations", value: 10}
});

// 3. Massive K Precision Loop Denial-of-Service
// OOM CRASH PROVEN: This fatally crashes the V8 heap.
// runBrutal(3, "Memory/CPU Crash via 1,000,000 k-precision", "newton", {
//    expression: "x^2 - 2", dfExpression: "2x", x0: "1",
//    machine: {k: 1000000, mode: "round"}, stopping: {kind: "iterations", value: 2}
// });

// 4. Catastrophic Cancellation masking
runBrutal(4, "Destructive float cancellation evaluating array bounds", "falsePosition", {
    expression: "x + 1e16 - 1e16", interval: {a: "-1", b: "1"},
    decisionBasis: "machine", machine: {k: 5, mode: "chop"},
    stopping: {kind: "iterations", value: 10}
});

// 5. Very deep expression tree (Stack Overflow test)
const deepExpr = "x" + "+(x".repeat(1000) + ")".repeat(1000);
runBrutal(5, "Stack Overflow parsing hyper-deep AST", "newton", {
    expression: deepExpr, dfExpression: "1001", x0: "1",
    machine: {k: 12, mode: "round"}, stopping: {kind: "iterations", value: 2}
});

// 6. EPS Bypass Trap
runBrutal(6, "Valid derivative smaller than EPS threshold", "newton", {
    expression: "x", dfExpression: "1e-18", x0: "1",
    machine: {k: 15, mode: "round"}, stopping: {kind: "iterations", value: 2}
});

// 7. Nonsense NaN injection directly from parser
runBrutal(7, "Nonsense literal input generating explicit JS NaN", "secant", {
    expression: "x", x0: "0/0", x1: "1",
    machine: {k: 12, mode: "round"}, stopping: {kind: "iterations", value: 1}
});

// 8. Fixed point Infinite recursion / extreme growth
runBrutal(8, "Exponential growth blowing integer bounds", "fixedPoint", {
    gExpression: "x^10", x0: "10",
    machine: {k: 12, mode: "round"}, stopping: {kind: "iterations", value: 50}
});

// 9. Decimal base parsing bug
runBrutal(9, "Repeated decimals edge case", "newton", {
    expression: "x - 0.3333333333333333333333333333333", dfExpression: "1", x0: "0",
    machine: {k: 12, mode: "round"}, stopping: {kind: "iterations", value: 2}
});
