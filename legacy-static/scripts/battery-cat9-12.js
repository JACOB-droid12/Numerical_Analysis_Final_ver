"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = __dirname ? path.resolve(__dirname, "..") : process.cwd();
const ENGINE_FILES = ["math-engine.js", "calc-engine.js", "expression-engine.js", "root-engine.js", "poly-engine.js", "ieee754.js"];

const context = { console };
context.globalThis = context;
context.window = context;
vm.createContext(context);
for (const file of ENGINE_FILES) {
  try {
    const source = fs.readFileSync(path.join(ROOT, file), "utf8");
    vm.runInContext(source, context, { filename: file });
  } catch(e) {} // skip if missing
}

const M = context.MathEngine;
const C = context.CalcEngine;
const E = context.ExpressionEngine;
const P = context.PolyEngine;
const I = context.IEEE754;

function runTest(id, name, logic, expected) {
    let result, err;
    try {
        result = logic();
    } catch(e) {
        err = e.message;
    }
    console.log(`\nTEST ${id}: ${name}`);
    console.log(`Expected: ${expected}`);
    if (err) {
        console.log(`> Result: ❌ EXCEPTION: ${err}`);
    } else {
        console.log(`> Result: ${result}`);
    }
}

// ============================================
// CATEGORY 9: POLYNOMIAL ENGINE WARFARE
// ============================================
console.log("\n============================================\nCATEGORY 9: POLYNOMIAL HORNER VS DIRECT\n============================================");

if (P) {
    runTest("9.1", "Both methods x^2 - 2 at 1.414", () => {
        let poly = P.parsePolynomial("x^2 - 2");
        let x = M.parseRational("1.414");
        let resDirect = P.evaluatePolyDirect(poly, x);
        let resHorner = P.evaluatePolyHorner(poly, x);
        return `Direct: ${M.rationalToDecimalString(resDirect, 5)}, Horner: ${M.rationalToDecimalString(resHorner, 5)}`;
    }, "Agree exactly");

    runTest("9.8", "x^120 at 1.001", () => {
        let poly = P.parsePolynomial("x^120");
        return "Parsed successfully";
    }, "Maximum degree (120)");

    runTest("9.9", "x^121 at 2", () => {
        return P.parsePolynomial("x^121");
    }, "Exceeds MAX_POLY_DEGREE (Should throw)");

    runTest("9.10", "x/x at 5", () => {
        return P.parsePolynomial("x/x");
    }, "Should throw (cannot parse division by polynomial)");
} else {
    console.log("PolyEngine not loaded or not implemented yet.");
}


// ============================================
// CATEGORY 10: IEEE-754 BIT LEVEL
// ============================================
console.log("\n============================================\nCATEGORY 10: IEEE-754 BITS\n============================================");
if (I) {
    runTest("10.1", "0", () => I.decimalToIEEE(0), "0 00000000000 000...");
    runTest("10.2", "-0", () => I.decimalToIEEE(-0), "1 00000000000 000...");
    runTest("10.8", "NaN", () => I.decimalToIEEE(NaN), "Exponents all 1s");
    runTest("10.12", "1.7976931348623158e+308", () => I.decimalToIEEE(1.7976931348623158e+308), "Should be Infinity bits");
    runTest("10.16", "63 bits", () => I.ieeeToDecimal("0".repeat(63)), "Wrong length, should throw");
    runTest("10.18", "abc", () => I.ieeeToDecimal("abc"), "Non-binary, throw");
} else {
    console.log("IEEE754 not loaded or not implemented yet.");
}


// ============================================
// CATEGORY 11: TRIGONOMETRIC GAUNTLET
// ============================================
console.log("\n============================================\nCATEGORY 11: TRIGONOMETRY GAUNTLET\n============================================");

runTest("11.1", "sin(0) rad", () => C.sinValue("0", "rad").re, "0 exactly");
runTest("11.5", "tan(pi/2) rad", () => C.tanValue(Math.PI/2, "rad").re, "Undefined / Huge number");
runTest("11.11", "ln(0)", () => C.lnValue("0").re, "Should throw > 0");
runTest("11.12", "ln(-1)", () => C.lnValue("-1").re, "Should throw error");

