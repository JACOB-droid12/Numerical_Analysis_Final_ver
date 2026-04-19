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

const E = context.ExpressionEngine;
const R = context.RootEngine;

function runASTTest(id, expr, expectedHint) {
    let result, err;
    try {
        let ast = E.parseExpression(expr);
        result = E.formatExpression(ast);

        if (/throw/i.test(expectedHint)) {
            const env = { x: context.MathEngine.parseRational("1"), angleMode: "rad" };
            E.evaluateValue(ast, env);
        }
    } catch(e) {
        err = e.message;
    }
    console.log(`\nTEST 1.${id}: "${expr}"`);
    console.log(`Expected: ${expectedHint}`);
    if (err) {
        console.log(`> Result: ❌ EXCEPTION: ${err}`);
    } else {
        console.log(`> Result: ${result}`);
    }
}

// ============================================
// CATEGORY 1: EXPRESSION PARSING (SYNTAX TORTURE)
// ============================================
console.log("============================================\nCATEGORY 1: EXPRESSION PARSING\n============================================");

runASTTest("1", "", "Should throw 'Expression is empty'");
runASTTest("2", "   ", "Should throw 'Expression is empty'");
runASTTest("3", "+", "Should throw parse error");
runASTTest("4", "()", "Should throw parse error");
runASTTest("5", "((((((((x))))))))", "Should parse cleanly as `x`");
runASTTest("6", "2x", "Should parse as `2 * x` (implicit mult)");
runASTTest("7", "x2", "Should parse as `x * 2` (implicit mult reversed)");
runASTTest("8", "2(3+x)", "Should parse as `2 * (3 + x)`");
runASTTest("9", "(3+x)2", "Should parse as `(3 + x) * 2`");
runASTTest("10", "(3+x)(2-x)", "Should parse as `(3 + x) * (2 - x)`");
runASTTest("11", "sin(x)cos(x)", "Should parse as `sin(x) * cos(x)`");
runASTTest("12", "2sin(x)", "Should parse as `2 * sin(x)`");
runASTTest("13", "---x", "Should parse as `-(-(-x))`");
runASTTest("14", "x^-2", "Should parse as `x^(-2)`");
runASTTest("15", "x^^2", "Should throw parse error");
runASTTest("16", "2+*3", "Should throw parse error");
runASTTest("17", "sin(cos(tan(x)))", "Should parse and evaluate correctly");
runASTTest("18", "x^2^3", "Right associative: x^(2^3) = x^8");
runASTTest("19", "1/2/3", "Left associative: (1/2)/3");
runASTTest("20", "1-2-3", "Left associative: (1-2)-3");
runASTTest("21", "πx", "Should parse as `π * x`");
runASTTest("22", "ex", "Check if parsed as `e * x` or throws");
runASTTest("23", "sin()", "Should throw 'expects exactly one argument'");
runASTTest("24", "sin(x, 2)", "Should throw 'expects exactly one argument'");
runASTTest("25", "unknown(x)", "Should throw 'Unsupported function'");
runASTTest("26", "1e999", "Parse scientifically (infinity?)");
runASTTest("27", "1e-999", "Parse scientifically (zero?)");
runASTTest("28", ".5", "Should parse as 0.5");
runASTTest("29", "5.", "Should parse as 5");
runASTTest("30", ".", "Depends on implementation");

// ============================================
// CATEGORY 4: BISECTION BRACKETING NIGHTMARES
// ============================================
console.log("\n============================================\nCATEGORY 4: BISECTION BRACKETING NIGHTMARES\n============================================");

function serialize(obj) {
    if (typeof obj === 'object') {
        if (obj === null) return 'null';
        if (obj.kind === 'calc') return `${obj.re}`;
        return JSON.stringify(obj, (k, v) => typeof v === 'bigint' ? v.toString() + 'n' : v);
    }
    return String(obj);
}

function runBisectionTest(id, opt, expectedHint) {
    let result, err;
    try {
        result = R.runBisection(opt);
    } catch(e) {
        err = e.message;
    }
    console.log(`\nTEST 4.${id}: Bisection [${opt.interval.a}, ${opt.interval.b}] on ${opt.expression}`);
    console.log(`Expected: ${expectedHint}`);
    if (err) {
        console.log(`> Result: ❌ EXCEPTION / ERROR: ${err}`);
    } else {
        console.log(`> Stop: ${result.summary.intervalStatus || result.summary.stopReason}`);
        if(result.summary.error) console.log(`> Last Error: ${result.summary.error}`);
        if(result.summary.approximation !== null && result.summary.approximation !== undefined) {
             console.log(`> Approx Root: ${serialize(result.summary.approximation)}`);
        }
    }
}

runBisectionTest("1", {expression: "x^2 - 4", interval:{a:"0",b:"3"}, decisionBasis:"machine", machine:{k:6, mode:"round"}, stopping:{kind:"epsilon", value:"0.0001"}}, "Standard root = 2");
runBisectionTest("2", {expression: "x^2 - 4", interval:{a:"0",b:"2"}, decisionBasis:"machine", machine:{k:6, mode:"round"}, stopping:{kind:"epsilon", value:"0.0001"}}, "Root at b");
runBisectionTest("3", {expression: "x^2 - 4", interval:{a:"-2",b:"0"}, decisionBasis:"machine", machine:{k:6, mode:"round"}, stopping:{kind:"epsilon", value:"0.0001"}}, "Root at a");
runBisectionTest("4", {expression: "x^2 - 4", interval:{a:"3",b:"5"}, decisionBasis:"machine", machine:{k:6, mode:"round"}, stopping:{kind:"epsilon", value:"0.0001"}}, "Invalid bracket (same sign)");
runBisectionTest("5", {expression: "x^2 - 4", interval:{a:"5",b:"3"}, decisionBasis:"machine", machine:{k:6, mode:"round"}, stopping:{kind:"epsilon", value:"0.0001"}}, "Reversed interval (a > b)");
runBisectionTest("6", {expression: "x^2 - 4", interval:{a:"2",b:"2"}, decisionBasis:"machine", machine:{k:6, mode:"round"}, stopping:{kind:"epsilon", value:"0.0001"}}, "Zero-width interval");
runBisectionTest("7", {expression: "x^3 - x", interval:{a:"-0.5",b:"0.5"}, decisionBasis:"machine", machine:{k:6, mode:"round"}, stopping:{kind:"epsilon", value:"0.0001"}}, "Root at 0");
runBisectionTest("8", {expression: "x^3 - x", interval:{a:"-2",b:"2"}, decisionBasis:"machine", machine:{k:6, mode:"round"}, stopping:{kind:"epsilon", value:"0.0001"}}, "Three roots in interval");
runBisectionTest("9", {expression: "sin(x)", interval:{a:"3",b:"4"}, decisionBasis:"machine", machine:{k:6, mode:"round"}, stopping:{kind:"epsilon", value:"1e-8"}, angleMode:"rad"}, "Root at pi");
runBisectionTest("10", {expression: "sin(x)", interval:{a:"0",b:"6.3"}, decisionBasis:"machine", machine:{k:6, mode:"round"}, stopping:{kind:"epsilon", value:"0.0001"}, angleMode:"rad"}, "Two roots (Multiple root warning?)");
runBisectionTest("11", {expression: "1/x", interval:{a:"-1",b:"1"}, decisionBasis:"machine", machine:{k:6, mode:"round"}, stopping:{kind:"epsilon", value:"0.0001"}}, "Discontinuity at 0 (Deceived!)");
runBisectionTest("12", {expression: "tan(x)", interval:{a:"1",b:"2"}, decisionBasis:"machine", machine:{k:6, mode:"round"}, stopping:{kind:"epsilon", value:"0.0001"}, angleMode:"rad"}, "Discontinuity at pi/2 (False sign change)");
runBisectionTest("13", {expression: "x^2", interval:{a:"-1",b:"1"}, decisionBasis:"machine", machine:{k:6, mode:"round"}, stopping:{kind:"epsilon", value:"0.0001"}}, "Double root (Invalid bracket)");
runBisectionTest("14", {expression: "x^2 - x", interval:{a:"0",b:"1"}, decisionBasis:"machine", machine:{k:6, mode:"round"}, stopping:{kind:"epsilon", value:"0.0001"}}, "Roots at both endpoints");
runBisectionTest("15", {expression: "x^2 - 2", interval:{a:"1",b:"2"}, decisionBasis:"machine", machine:{k:3, mode:"chop"}, stopping:{kind:"iterations", value:5}}, "Very low precision iteration");
runBisectionTest("16", {expression: "x^2 - 2", interval:{a:"1",b:"2"}, decisionBasis:"machine", machine:{k:3, mode:"chop"}, stopping:{kind:"epsilon", value:"1e-12"}}, "e smaller than k=3 precision allows");
runBisectionTest("17", {expression: "x^2 - 2", interval:{a:"0",b:"1e10"}, decisionBasis:"machine", machine:{k:6, mode:"round"}, stopping:{kind:"epsilon", value:"0.0001"}}, "Enormous interval");
runBisectionTest("18", {expression: "x^2 - 2", interval:{a:"1.414",b:"1.415"}, decisionBasis:"machine", machine:{k:6, mode:"round"}, stopping:{kind:"epsilon", value:"0.0001"}}, "Micro interval");
runBisectionTest("19", {expression: "x - 1/3", interval:{a:"0",b:"1"}, decisionBasis:"exact", machine:{k:4, mode:"chop"}, stopping:{kind:"epsilon", value:"0.0001"}}, "Exact rational root");
runBisectionTest("20", {expression: "x^10 - 1", interval:{a:"0.9",b:"1.1"}, decisionBasis:"machine", machine:{k:6, mode:"round"}, stopping:{kind:"epsilon", value:"1e-8"}}, "Extremely flat high degree root");
runBisectionTest("21", {expression: "exp(x) - 2", interval:{a:"0",b:"1"}, decisionBasis:"machine", machine:{k:6, mode:"round"}, stopping:{kind:"epsilon", value:"0.0001"}}, "Transcendental root (ln 2)");
runBisectionTest("22", {expression: "x^2 - 2", interval:{a:"1",b:"2"}, decisionBasis:"machine", machine:{k:6, mode:"round"}, stopping:{kind:"epsilon", value:"0"}}, "Zero epsilon (Should throw)");
runBisectionTest("23", {expression: "x^2 - 2", interval:{a:"1",b:"2"}, decisionBasis:"machine", machine:{k:6, mode:"round"}, stopping:{kind:"epsilon", value:"-0.001"}}, "Negative epsilon (Should throw)");
runBisectionTest("24", {expression: "x^2 - 2", interval:{a:"1",b:"2"}, decisionBasis:"machine", machine:{k:6, mode:"round"}, stopping:{kind:"iterations", value:0}}, "Zero iterations");
runBisectionTest("25", {expression: "x^2 - 2", interval:{a:"1",b:"2"}, decisionBasis:"machine", machine:{k:6, mode:"round"}, stopping:{kind:"iterations", value:1000}}, "1000 iter performance");
runBisectionTest("26", {expression: "x^2 - 2", interval:{a:"1",b:"2"}, decisionBasis:"machine", machine:{k:6, mode:"round"}, stopping:{kind:"epsilon", value:"0.0001", type:"relative"}}, "Relative tolerance mode");
runBisectionTest("27", {expression: "x^2 - 2", interval:{a:"-2",b:"-1"}, decisionBasis:"machine", machine:{k:6, mode:"round"}, stopping:{kind:"epsilon", value:"0.0001", type:"relative"}}, "Negative bracket relative");
runBisectionTest("28", {expression: "x^2 - 2", interval:{a:"0",b:"2"}, decisionBasis:"machine", machine:{k:6, mode:"round"}, stopping:{kind:"epsilon", value:"0.0001", type:"relative"}}, "Zero bracket relative (Zero divide risk)");
runBisectionTest("29", {expression: "x", interval:{a:"-1",b:"1"}, decisionBasis:"machine", machine:{k:6, mode:"round"}, stopping:{kind:"epsilon", value:"0.0001"}}, "Trivial f(x) = x");
runBisectionTest("30", {expression: "x^2 - 2", interval:{a:"1",b:"2"}, decisionBasis:"exact", machine:{k:6, mode:"round"}, stopping:{kind:"iterations", value:10}}, "Exact decision basis iteration tests");
