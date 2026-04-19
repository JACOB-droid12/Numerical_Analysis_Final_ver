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

function serialize(obj) {
    if (typeof obj === 'object') {
        if (obj === null) return 'null';
        if (obj.kind === 'rational') {
            return `${obj.sign < 0 ? '-' : ''}${obj.num}/${obj.den}`;
        }
        if (obj.kind === 'calc') {
             return `${obj.re}`;
        }
        return JSON.stringify(obj, (key, value) => typeof value === 'bigint' ? value.toString() + 'n' : value);
    }
    return String(obj);
}

function runTest(num, title, method, options) {
    console.log(`\nTEST ${num} - ${title}`);
    try {
        let result;
        if (method === "newton") result = R.runNewtonRaphson(options);
        else if (method === "secant") result = R.runSecant(options);
        else if (method === "falsePosition") result = R.runFalsePosition(options);
        else if (method === "fixedPoint") result = R.runFixedPoint(options);
        else if (method === "bisection") result = R.runBisection(options);
        
        console.log(`Status: ${result.summary.intervalStatus || "N/A"} | Stop: ${result.summary.stopReason}`);
        if(result.summary.error !== undefined && result.summary.error !== null) {
            console.log(`Last error: ${result.summary.error}`);
        }
        if(result.rows && result.rows.length !== undefined) {
            console.log(`Iterations: ${result.rows.length}`);
            if(result.rows.length > 0) {
                const last = result.rows[result.rows.length-1];
                if(last.xn !== undefined) console.log(`Last xn: ${serialize(last.xn)}`);
                if(last.c !== undefined) console.log(`Last c: ${serialize(last.c)}`);
            }
        }
    } catch(e) {
        console.log(`EXCEPTION THROWN: ${e.message}`);
    }
}

// 🔴 Newton-Raphson
runTest(1, "Starting exactly where f'(x)=0", "newton", {expression:"x^3 - 3x + 2", dfExpression:"3x^2 - 3", x0:"1", machine:{k:12,mode:"round"}, stopping:{kind:"iterations", value:20}});
runTest(2, "Derivative hits zero later", "newton", {expression:"x^3 - 3x + 2", dfExpression:"3x^2 - 3", x0:"0", machine:{k:12,mode:"round"}, stopping:{kind:"iterations", value:20}});
runTest(3, "Explicit zero derivative field", "newton", {expression:"x - 5", dfExpression:"0", x0:"3", machine:{k:12,mode:"round"}, stopping:{kind:"iterations", value:20}});
runTest(4, "No real roots", "newton", {expression:"x^2 + 1", dfExpression:"2x", x0:"1", machine:{k:12,mode:"round"}, stopping:{kind:"iterations", value:20}});
runTest(5, "Far from any root", "newton", {expression:"x^3 - x - 1", dfExpression:"3x^2 - 1", x0:"1000000", machine:{k:6,mode:"round"}, stopping:{kind:"iterations", value:4}});
runTest(6, "Root Exactly at Starting Point", "newton", {expression:"x - 5", dfExpression:"1", x0:"5", machine:{k:12,mode:"round"}, stopping:{kind:"iterations", value:20}});
runTest(7, "Double root", "newton", {expression:"(x - 1)^2", dfExpression:"2*(x - 1)", x0:"2", machine:{k:12,mode:"round"}, stopping:{kind:"iterations", value:20}});
runTest(8, "sin(x) where f'(x) approx 0 (Rad)", "newton", {expression:"sin(x)", dfExpression:"cos(x)", x0:"1.5707963", machine:{k:12,mode:"round"}, stopping:{kind:"iterations", value:20}, angleMode:"rad"});
runTest(9, "sin(x) from 10 deg", "newton", {expression:"sin(x)", dfExpression:"cos(x)", x0:"10", machine:{k:12,mode:"round"}, stopping:{kind:"iterations", value:20}, angleMode:"deg"});
runTest(10, "tan(x) near singularity", "newton", {expression:"tan(x)", dfExpression:"1/cos(x)^2", x0:"1.5", machine:{k:12,mode:"round"}, stopping:{kind:"iterations", value:20}, angleMode:"rad"});
runTest(11, "Wrong derivative", "newton", {expression:"x^2 - 4", dfExpression:"x", x0:"3", machine:{k:12,mode:"round"}, stopping:{kind:"iterations", value:20}, angleMode:"rad"});
runTest(12, "k=0 sig digits", "newton", {expression:"x^3 - x - 1", dfExpression:"3x^2 - 1", x0:"1.5", machine:{k:0,mode:"round"}, stopping:{kind:"iterations", value:20}});
runTest(13, "k=15 near precision", "newton", {expression:"x^3 - x - 1", dfExpression:"3x^2 - 1", x0:"1.5", machine:{k:15,mode:"round"}, stopping:{kind:"epsilon", value:"1e-15"}});
runTest(14, "n=0 iterations", "newton", {expression:"x^3 - x - 1", dfExpression:"3x^2 - 1", x0:"1.5", machine:{k:12,mode:"round"}, stopping:{kind:"iterations", value:0}});
runTest(15, "n=1 iterations", "newton", {expression:"x^3 - x - 1", dfExpression:"3x^2 - 1", x0:"1.5", machine:{k:12,mode:"round"}, stopping:{kind:"iterations", value:1}});
runTest(16, "n=10000 large iterations", "newton", {expression:"x^3 - x - 1", dfExpression:"3x^2 - 1", x0:"1.5", machine:{k:12,mode:"round"}, stopping:{kind:"iterations", value:10000}});
runTest(17, "Implicit multiplication", "newton", {expression:"2x^2 - 8", dfExpression:"4x", x0:"3", machine:{k:12,mode:"round"}, stopping:{kind:"iterations", value:20}});
runTest(18, "Division starting at singularity", "newton", {expression:"1/x - 2", dfExpression:"-1/x^2", x0:"0", machine:{k:12,mode:"round"}, stopping:{kind:"iterations", value:20}});
runTest(19, "Empty derivative", "newton", {expression:"x^2 - 4", dfExpression:"", x0:"3", machine:{k:12,mode:"round"}, stopping:{kind:"iterations", value:20}});
runTest(20, "Broken expression", "newton", {expression:"x^2 +", dfExpression:"2x", x0:"3", machine:{k:12,mode:"round"}, stopping:{kind:"iterations", value:20}});

// 🟠 Secant
runTest(21, "Symmetric points", "secant", {expression:"x^2 - 4", x0:"2", x1:"-2", machine:{k:12,mode:"round"}, stopping:{kind:"iterations", value:20}});
runTest(22, "Same function value Diff Points", "secant", {expression:"sin(x)", x0:"0", x1:"3.141592653589", machine:{k:12,mode:"round"}, stopping:{kind:"iterations", value:20}, angleMode:"rad"});
runTest(23, "Near-zero denominator", "secant", {expression:"x^10 - 1", x0:"0.999", x1:"1.001", machine:{k:12,mode:"round"}, stopping:{kind:"iterations", value:20}});
runTest(24, "Identical starting points", "secant", {expression:"x^2 - 2", x0:"1", x1:"1", machine:{k:12,mode:"round"}, stopping:{kind:"iterations", value:20}});
runTest(25, "One starting point already root", "secant", {expression:"x^3 - x - 1", x0:"1.3247179572447", x1:"2", machine:{k:12,mode:"round"}, stopping:{kind:"iterations", value:20}});
runTest(26, "Diverging secant", "secant", {expression:"x^(1/3)", x0:"-1", x1:"1", machine:{k:12,mode:"round"}, stopping:{kind:"iterations", value:20}});
runTest(27, "Large distance", "secant", {expression:"x^2 - 2", x0:"-1e8", x1:"1e8", machine:{k:12,mode:"round"}, stopping:{kind:"iterations", value:20}});

// 🟡 False Position
runTest(28, "No root in interval", "falsePosition", {expression:"x^2 + 1", interval:{a:"-2", b:"2"}, decisionBasis:"exact", machine:{k:12,mode:"round"}, stopping:{kind:"iterations", value:20}});
runTest(29, "Root exists but not in [a,b]", "falsePosition", {expression:"x^2 - 9", interval:{a:"4", b:"6"}, decisionBasis:"exact", machine:{k:12,mode:"round"}, stopping:{kind:"iterations", value:20}});
runTest(30, "a = b", "falsePosition", {expression:"x^2 - 4", interval:{a:"2", b:"2"}, decisionBasis:"exact", machine:{k:12,mode:"round"}, stopping:{kind:"iterations", value:20}});
runTest(31, "Reversed Endpoints", "falsePosition", {expression:"x^3 - x - 1", interval:{a:"2", b:"1"}, decisionBasis:"exact", machine:{k:12,mode:"round"}, stopping:{kind:"iterations", value:20}});
runTest(32, "Discontinuity Masquerades", "falsePosition", {expression:"1/x", interval:{a:"-1", b:"1"}, decisionBasis:"exact", machine:{k:12,mode:"round"}, stopping:{kind:"iterations", value:20}});
runTest(33, "Stagnation Classic", "falsePosition", {expression:"x^10 - 1", interval:{a:"0", b:"1.5"}, decisionBasis:"exact", machine:{k:12,mode:"round"}, stopping:{kind:"iterations", value:50}});
runTest(34, "Root Exactly at Endpoint", "falsePosition", {expression:"x^2 - 4", interval:{a:"-2", b:"0"}, decisionBasis:"exact", machine:{k:12,mode:"round"}, stopping:{kind:"iterations", value:20}});

// 🟢 Fixed Point
runTest(35, "Divergence > 1", "fixedPoint", {gExpression:"2x - 1", x0:"0.5", machine:{k:12,mode:"round"}, stopping:{kind:"iterations", value:10}});
runTest(36, "Oscillating divergence", "fixedPoint", {gExpression:"-2x + 3", x0:"2", machine:{k:12,mode:"round"}, stopping:{kind:"iterations", value:10}});
runTest(37, "No Fixed Point", "fixedPoint", {gExpression:"x + 1", x0:"0", machine:{k:12,mode:"round"}, stopping:{kind:"iterations", value:10}});
runTest(38, "g(x)=x everywhere", "fixedPoint", {gExpression:"x", x0:"7", machine:{k:12,mode:"round"}, stopping:{kind:"iterations", value:5}});
runTest(39, "Singularity zero eval", "fixedPoint", {gExpression:"1/x", x0:"0", machine:{k:12,mode:"round"}, stopping:{kind:"iterations", value:10}});
runTest(40, "Singularity periodic", "fixedPoint", {gExpression:"1/x", x0:"0.1", machine:{k:12,mode:"round"}, stopping:{kind:"iterations", value:10}});
runTest(41, "NaN test", "fixedPoint", {gExpression:"(x - 5)^(1/2)", x0:"2", machine:{k:12,mode:"round"}, stopping:{kind:"iterations", value:10}});

// ⚪ Universal
runTest(42, "Angle mode consistency (Rad)", "newton", {expression:"sin(x) - 0.5", dfExpression:"cos(x)", x0:"1", machine:{k:12,mode:"round"}, stopping:{kind:"iterations", value:10}, angleMode:"rad"});
runTest(42.1, "Angle mode consistency (Deg)", "newton", {expression:"sin(x) - 0.5", dfExpression:"cos(x)", x0:"1", machine:{k:12,mode:"round"}, stopping:{kind:"iterations", value:10}, angleMode:"deg"});
runTest(43, "Tol = 0", "newton", {expression:"x^2 - 2", dfExpression:"2x", x0:"1", machine:{k:12,mode:"round"}, stopping:{kind:"epsilon", value:"0"}});
runTest(44, "Tol = -1e-5", "newton", {expression:"x^2 - 2", dfExpression:"2x", x0:"1", machine:{k:12,mode:"round"}, stopping:{kind:"epsilon", value:"-1e-5"}});
runTest(45, "Tol larger than error", "newton", {expression:"x^2 - 100", dfExpression:"2x", x0:"1", machine:{k:12,mode:"round"}, stopping:{kind:"epsilon", value:"1000"}});
runTest(46, "Rounding", "newton", {expression:"x - 1.23456789", dfExpression:"1", x0:"0", machine:{k:4,mode:"round"}, stopping:{kind:"iterations", value:2}});
runTest(46.1, "Chopping", "newton", {expression:"x - 1.23456789", dfExpression:"1", x0:"0", machine:{k:4,mode:"chop"}, stopping:{kind:"iterations", value:2}});
runTest(47, "Very large", "newton", {expression:"x - 1e15", dfExpression:"1", x0:"0", machine:{k:10,mode:"round"}, stopping:{kind:"iterations", value:4}});
runTest(48, "Very small", "newton", {expression:"x - 1e-15", dfExpression:"1", x0:"0", machine:{k:6,mode:"round"}, stopping:{kind:"iterations", value:4}});
runTest(49, "Constant", "newton", {expression:"5", dfExpression:"0", x0:"1", machine:{k:12,mode:"round"}, stopping:{kind:"iterations", value:4}});
runTest(50, "Linear Exact One-Step", "newton", {expression:"3x - 7", dfExpression:"3", x0:"0", machine:{k:12,mode:"round"}, stopping:{kind:"iterations", value:5}});
runTest(51, "Flat near root", "newton", {expression:"x^20 - 1", dfExpression:"20*x^19", x0:"0.5", machine:{k:12,mode:"round"}, stopping:{kind:"epsilon", value:"1e-6"}});
runTest(52, "Euler parsing (e^x)", "newton", {expression:"e^x - 2", dfExpression:"e^x", x0:"1", machine:{k:12,mode:"round"}, stopping:{kind:"iterations", value:10}});
runTest(53, "ln at negative", "newton", {expression:"ln(x) - 1", dfExpression:"1/x", x0:"-1", machine:{k:12,mode:"round"}, stopping:{kind:"iterations", value:10}});
runTest(54, "ln at zero", "newton", {expression:"ln(x)", dfExpression:"1/x", x0:"0", machine:{k:12,mode:"round"}, stopping:{kind:"iterations", value:10}});
