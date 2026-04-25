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

function runTestCase(num, method, options) {
    console.log(`\nTEST ${num}: ${method.toUpperCase()} | ${JSON.stringify(options.stopping)}`);
    try {
        let result;
        if (method === "newton") result = R.runNewtonRaphson(options);
        else if (method === "secant") result = R.runSecant(options);
        else if (method === "falsePosition") result = R.runFalsePosition(options);
        else if (method === "fixedPoint") result = R.runFixedPoint(options);

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
                if(last.gxn !== undefined) console.log(`> Last gxn: ${serialize(last.gxn)}`);
            }
        }
    } catch(e) {
        console.log(`> 💥 CRASHED: ${e.message}`);
    }
}

const N = "newton";
const S = "secant";
const FP = "falsePosition";
const P = "fixedPoint";

const tests = [
    // 5. Newton-Raphson
    [5.1, N, {expression: "x^2 - 4", dfExpression: "2*x", x0: "3", machine: {k:12, mode:"round"}, stopping: {kind:"epsilon", value:"0.0001"}}],
    [5.2, N, {expression: "x^2 - 4", dfExpression: "2*x", x0: "0", machine: {k:12, mode:"round"}, stopping: {kind:"epsilon", value:"0.0001"}}],
    [5.3, N, {expression: "x^3 - 2*x + 2", dfExpression: "3*x^2 - 2", x0: "0", machine: {k:12, mode:"round"}, stopping: {kind:"epsilon", value:"0.0001"}}],
    [5.4, N, {expression: "x^3 - 2*x + 2", dfExpression: "3*x^2 - 2", x0: "1", machine: {k:12, mode:"round"}, stopping: {kind:"epsilon", value:"0.0001"}}],
    [5.5, N, {expression: "x^2", dfExpression: "2*x", x0: "1", machine: {k:12, mode:"round"}, stopping: {kind:"epsilon", value:"0.0001"}}],
    [5.6, N, {expression: "x^3", dfExpression: "3*x^2", x0: "0.1", machine: {k:12, mode:"round"}, stopping: {kind:"epsilon", value:"0.0001"}}],
    [5.7, N, {expression: "x^2 - 4", dfExpression: "2*x + 1", x0: "3", machine: {k:12, mode:"round"}, stopping: {kind:"epsilon", value:"0.0001"}}],
    [5.8, N, {expression: "x^2 - 4", dfExpression: "0", x0: "3", machine: {k:12, mode:"round"}, stopping: {kind:"epsilon", value:"0.0001"}}],
    [5.9, N, {expression: "exp(x)", dfExpression: "exp(x)", x0: "-100", machine: {k:12, mode:"round"}, stopping: {kind:"epsilon", value:"0.0001"}}],
    [5.10, N, {expression: "x^2 + 1", dfExpression: "2*x", x0: "1", machine: {k:12, mode:"round"}, stopping: {kind:"epsilon", value:"0.0001"}}],
    [5.11, N, {expression: "sin(x)", dfExpression: "cos(x)", x0: "3", machine: {k:12, mode:"round"}, stopping: {kind:"epsilon", value:"1e-10"}, angleMode: "rad"}],
    [5.12, N, {expression: "sin(x)", dfExpression: "cos(x)", x0: "1.5708", machine: {k:12, mode:"round"}, stopping: {kind:"epsilon", value:"0.0001"}, angleMode: "rad"}],
    [5.13, N, {expression: "x^3 - x", dfExpression: "3*x^2 - 1", x0: "0.5", machine: {k:12, mode:"round"}, stopping: {kind:"epsilon", value:"0.0001"}}],
    [5.14, N, {expression: "x^3 - x", dfExpression: "3*x^2 - 1", x0: "1/sqrt(3)", machine: {k:12, mode:"round"}, stopping: {kind:"epsilon", value:"0.0001"}}],
    [5.15, N, {expression: "ln(x)", dfExpression: "1/x", x0: "0.5", machine: {k:12, mode:"round"}, stopping: {kind:"epsilon", value:"0.0001"}}],
    [5.16, N, {expression: "x^2 - 4", dfExpression: "2*x", x0: "1e10", machine: {k:12, mode:"round"}, stopping: {kind:"epsilon", value:"0.0001"}}],
    [5.17, N, {expression: "x^2 - 4", dfExpression: "2*x", x0: "2", machine: {k:12, mode:"round"}, stopping: {kind:"epsilon", value:"0.0001"}}],
    [5.18, N, {expression: "x^2 - 4", dfExpression: "2*x", x0: "3", machine: {k:12, mode:"round"}, stopping: {kind:"iterations", value:1}}],
    [5.19, N, {expression: "x^2 - 2", dfExpression: "2*x", x0: "1", machine: {k:12, mode:"round"}, stopping: {kind:"epsilon", value:"1e-12"}}],
    [5.20, N, {expression: "x^2 - 2", dfExpression: "2*x", x0: "1", machine: {k:3, mode:"chop"}, stopping: {kind:"epsilon", value:"0.0001"}}],

    // 6. Secant
    [6.1, S, {expression: "x^2 - 4", x0: "1", x1: "3", machine: {k:12, mode:"round"}, stopping: {kind:"epsilon", value:"0.0001"}}],
    [6.2, S, {expression: "x^2 - 4", x0: "1", x1: "1", machine: {k:12, mode:"round"}, stopping: {kind:"epsilon", value:"0.0001"}}],
    [6.3, S, {expression: "x^2 - 4", x0: "-3", x1: "3", machine: {k:12, mode:"round"}, stopping: {kind:"epsilon", value:"0.0001"}}],
    [6.4, S, {expression: "x^2", x0: "0.5", x1: "-0.5", machine: {k:12, mode:"round"}, stopping: {kind:"epsilon", value:"0.0001"}}],
    [6.5, S, {expression: "x^3 - x", x0: "0.5", x1: "0.6", machine: {k:12, mode:"round"}, stopping: {kind:"epsilon", value:"0.0001"}}],
    [6.6, S, {expression: "exp(x) - 1", x0: "-1", x1: "2", machine: {k:12, mode:"round"}, stopping: {kind:"epsilon", value:"0.0001"}}],
    [6.7, S, {expression: "sin(x)", x0: "3", x1: "3.5", machine: {k:12, mode:"round"}, stopping: {kind:"epsilon", value:"1e-10"}, angleMode: "rad"}],
    [6.8, S, {expression: "x^2 + 1", x0: "0", x1: "1", machine: {k:12, mode:"round"}, stopping: {kind:"epsilon", value:"0.0001"}}],
    [6.9, S, {expression: "1/x - 1", x0: "0.5", x1: "2", machine: {k:12, mode:"round"}, stopping: {kind:"epsilon", value:"0.0001"}}],
    [6.10, S, {expression: "x^10 - 1", x0: "0.5", x1: "1.5", machine: {k:12, mode:"round"}, stopping: {kind:"epsilon", value:"0.0001"}}],
    [6.11, S, {expression: "x^2 - 4", x0: "2", x1: "3", machine: {k:12, mode:"round"}, stopping: {kind:"epsilon", value:"0.0001"}}],
    [6.12, S, {expression: "x^2 - 4", x0: "1e8", x1: "100000001", machine: {k:12, mode:"round"}, stopping: {kind:"epsilon", value:"0.0001"}}],
    [6.13, S, {expression: "x - 1e-15", x0: "0", x1: "1", machine: {k:12, mode:"round"}, stopping: {kind:"epsilon", value:"1e-16"}}],
    [6.14, S, {expression: "x^2 - 4", x0: "1", x1: "3", machine: {k:2, mode:"chop"}, stopping: {kind:"epsilon", value:"0.0001"}}],
    [6.15, S, {expression: "x^2 - 4", x0: "1", x1: "3", machine: {k:12, mode:"round"}, stopping: {kind:"iterations", value:100}}],

    // 7. False Position
    [7.1, FP, {expression: "x^2 - 4", interval: {a:"0", b:"3"}, decisionBasis: "machine", machine: {k:12, mode:"round"}, stopping: {kind:"epsilon", value:"0.0001"}}],
    [7.2, FP, {expression: "x^5 - 1", interval: {a:"0", b:"2"}, decisionBasis: "machine", machine: {k:12, mode:"round"}, stopping: {kind:"epsilon", value:"0.0001"}}],
    [7.3, FP, {expression: "x^10 - 1", interval: {a:"0", b:"2"}, decisionBasis: "machine", machine: {k:12, mode:"round"}, stopping: {kind:"epsilon", value:"0.0001"}}],
    [7.4, FP, {expression: "exp(x) - 10", interval: {a:"0", b:"5"}, decisionBasis: "machine", machine: {k:12, mode:"round"}, stopping: {kind:"epsilon", value:"0.0001"}}],
    [7.5, FP, {expression: "tan(x) - 1", interval: {a:"0", b:"1"}, decisionBasis: "machine", machine: {k:12, mode:"round"}, stopping: {kind:"epsilon", value:"0.0001"}}],
    [7.6, FP, {expression: "x^2 - 4", interval: {a:"0", b:"2"}, decisionBasis: "machine", machine: {k:12, mode:"round"}, stopping: {kind:"epsilon", value:"0.0001"}}],
    [7.7, FP, {expression: "x^2 - 4", interval: {a:"3", b:"5"}, decisionBasis: "machine", machine: {k:12, mode:"round"}, stopping: {kind:"epsilon", value:"0.0001"}}],
    [7.8, FP, {expression: "1/x", interval: {a:"-1", b:"1"}, decisionBasis: "machine", machine: {k:12, mode:"round"}, stopping: {kind:"epsilon", value:"0.0001"}}],
    [7.9, FP, {expression: "x^2 - 4", interval: {a:"0", b:"3"}, decisionBasis: "machine", machine: {k:3, mode:"chop"}, stopping: {kind:"iterations", value:50}}],
    [7.10, FP, {expression: "x^3 - x", interval: {a:"-2", b:"2"}, decisionBasis: "machine", machine: {k:12, mode:"round"}, stopping: {kind:"epsilon", value:"0.0001"}}],
    [7.11, FP, {expression: "x^2 - 4", interval: {a:"0", b:"3"}, decisionBasis: "machine", machine: {k:12, mode:"round"}, stopping: {kind:"epsilon", value:"0.0001"}}],
    [7.12, FP, {expression: "x^3 - 0.001", interval: {a:"0", b:"1"}, decisionBasis: "machine", machine: {k:12, mode:"round"}, stopping: {kind:"epsilon", value:"1e-8"}}],
    [7.13, FP, {expression: "x - 1e-10", interval: {a:"0", b:"1"}, decisionBasis: "machine", machine: {k:12, mode:"round"}, stopping: {kind:"epsilon", value:"1e-12"}}],
    [7.14, FP, {expression: "x^2 - 4", interval: {a:"0", b:"1e8"}, decisionBasis: "machine", machine: {k:12, mode:"round"}, stopping: {kind:"epsilon", value:"0.0001"}}],
    [7.15, FP, {expression: "sin(x)", interval: {a:"3", b:"4"}, decisionBasis: "machine", machine: {k:12, mode:"round"}, stopping: {kind:"epsilon", value:"1e-10"}, angleMode: "rad"}],

    // 8. Fixed Point
    [8.1, P, {gExpression: "(x + 2/x) / 2", x0: "1", machine: {k:12, mode:"round"}, stopping: {kind:"epsilon", value:"0.0001"}}],
    [8.2, P, {gExpression: "2/x", x0: "1", machine: {k:12, mode:"round"}, stopping: {kind:"epsilon", value:"0.0001"}}],
    [8.3, P, {gExpression: "x^2", x0: "0.5", machine: {k:12, mode:"round"}, stopping: {kind:"epsilon", value:"0.0001"}}],
    [8.4, P, {gExpression: "x^2", x0: "2", machine: {k:12, mode:"round"}, stopping: {kind:"epsilon", value:"0.0001"}}],
    [8.5, P, {gExpression: "x^2", x0: "1", machine: {k:12, mode:"round"}, stopping: {kind:"epsilon", value:"0.0001"}}],
    [8.6, P, {gExpression: "2*x", x0: "0.5", machine: {k:12, mode:"round"}, stopping: {kind:"epsilon", value:"0.0001"}}],
    [8.7, P, {gExpression: "-x", x0: "1", machine: {k:12, mode:"round"}, stopping: {kind:"iterations", value:10}}],
    [8.8, P, {gExpression: "cos(x)", x0: "1", machine: {k:12, mode:"round"}, stopping: {kind:"epsilon", value:"1e-8"}}],
    [8.9, P, {gExpression: "exp(x)", x0: "0", machine: {k:12, mode:"round"}, stopping: {kind:"epsilon", value:"0.0001"}}],
    [8.10, P, {gExpression: "x + 1", x0: "0", machine: {k:12, mode:"round"}, stopping: {kind:"iterations", value:10}}],
    [8.11, P, {gExpression: "sqrt(x)", x0: "100", machine: {k:12, mode:"round"}, stopping: {kind:"epsilon", value:"0.0001"}}],
    [8.12, P, {gExpression: "x", x0: "5", machine: {k:12, mode:"round"}, stopping: {kind:"epsilon", value:"0.0001"}}],
    [8.13, P, {gExpression: "1/x", x0: "0.5", machine: {k:12, mode:"round"}, stopping: {kind:"epsilon", value:"0.0001"}}],
    [8.14, P, {gExpression: "x^2 - x + 1", x0: "0.5", machine: {k:12, mode:"round"}, stopping: {kind:"epsilon", value:"0.0001"}}],
    [8.15, P, {gExpression: "(x + 2/x) / 2", x0: "0", machine: {k:12, mode:"round"}, stopping: {kind:"epsilon", value:"0.0001"}}],
    [8.16, P, {gExpression: "sin(x) + x", x0: "0", machine: {k:12, mode:"round"}, stopping: {kind:"epsilon", value:"0.0001"}}],
    [8.17, P, {gExpression: "x^3", x0: "0.9", machine: {k:12, mode:"round"}, stopping: {kind:"epsilon", value:"0.0001"}}],
    [8.18, P, {gExpression: "(x + 3/x) / 2", x0: "1", machine: {k:3, mode:"chop"}, stopping: {kind:"epsilon", value:"1e-10"}}],
    [8.19, P, {gExpression: "x^2", x0: "1.0000001", machine: {k:12, mode:"round"}, stopping: {kind:"iterations", value:100}}],
    [8.20, P, {gExpression: "x - sin(x)", x0: "0.5", machine: {k:12, mode:"round"}, stopping: {kind:"epsilon", value:"0.0001"}}],
];

tests.forEach(t => runTestCase(t[0], t[1], t[2]));
