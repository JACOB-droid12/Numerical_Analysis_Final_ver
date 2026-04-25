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

function runArithmeticTest(id, name, mathLogic, expectedHint) {
    let result, err;
    try {
        result = mathLogic();
    } catch(e) {
        err = e.message;
    }
    console.log(`\nTEST ${id}: ${name}`);
    console.log(`Expected: ${expectedHint}`);
    if (err) {
        console.log(`> Result: ❌ EXCEPTION / ERROR: ${err}`);
    } else {
        console.log(`> Result: ${result}`);
    }
}

function parseValue(input) {
    return M.parseRational(String(input));
}

// ============================================
// CATEGORY 2: ARITHMETIC PRECISION
// ============================================
console.log("============================================\nCATEGORY 2: ARITHMETIC PRECISION\n============================================");

// 2.1 (1 + 1e-15) - 1 with k=4 chop
runArithmeticTest("2.1", "(1 + 1e-15) - 1 with k=4 chop", () => {
    let val1 = C.machineApproxValue(parseValue("1"), 4, "chop").approx;
    let val2 = C.machineApproxValue(parseValue("1e-15"), 4, "chop").approx;
    let sum = C.add(val1, val2);
    let finalSum = C.machineApproxValue(sum, 4, "chop").approx;
    let res = C.sub(finalSum, val1);
    let finalRes = C.machineApproxValue(res, 4, "chop").approx;
    return C.toNumber(finalRes);
}, "1e-15 (Testing if machine arithmetic loses the 1e-15)");

// 2.2 (10000001 - 10000000)
runArithmeticTest("2.2", "(10000001 - 10000000)", () => {
    return C.toNumber(C.sub(M.parseRational("10000001"), M.parseRational("10000000")));
}, "1 (Exact subtraction)");

// 2.3 sqrt(10001) - sqrt(10000)
runArithmeticTest("2.3", "sqrt(10001) - sqrt(10000)", () => {
    let s1 = C.sqrtValue(parseValue("10001"));
    let s2 = C.sqrtValue(parseValue("10000"));
    return C.sub(s1, s2).re;
}, "≈ 0.00499988...");

// 2.4 (1/3) * 3 - 1
runArithmeticTest("2.4", "(1/3) * 3 - 1", () => {
    let r1 = M.parseRational("1/3");
    let r2 = M.parseRational("3");
    let prod = M.mul(r1, r2);
    return C.toNumber(M.sub(prod, M.ONE));
}, "0 exactly");

// 2.5 (1/7 + 1/7 + 1/7 + 1/7 + 1/7 + 1/7 + 1/7) - 1
runArithmeticTest("2.5", "7 * (1/7) - 1", () => {
    let r = M.parseRational("1/7");
    let sum = M.ZERO;
    for(let i=0; i<7; i++) sum = M.add(sum, r);
    return C.toNumber(M.sub(sum, M.ONE));
}, "0 exactly");

// 2.6 (x^2 - 1) at x = 1.00000001
runArithmeticTest("2.6", "(x^2 - 1) at x = 1.00000001", () => {
    let x = M.parseRational("1.00000001");
    let sq = M.mul(x, x);
    return C.toNumber(M.sub(sq, M.ONE));
}, "≈ 2e-8");

// 2.7 x^10 - 1 at x = 1.0000001
runArithmeticTest("2.7", "x^10 - 1 at x = 1.0000001", () => {
    let x = M.parseRational("1.0000001");
    let sq = M.powRational(x, 10);
    return C.toNumber(M.sub(sq, M.ONE));
}, "≈ 1e-6");

// 2.8 1/3 - 0.333333333333333
runArithmeticTest("2.8", "1/3 - 0.333333333333333", () => {
    let a = M.parseRational("1/3");
    let b = M.parseRational("0.333333333333333");
    return C.toNumber(M.sub(a, b));
}, "≈ 3.33e-16");

// 2.9 (2^53 + 1) - 2^53
runArithmeticTest("2.9", "(2^53 + 1) - 2^53", () => {
    let a = M.add(M.powRational(M.parseRational("2"), 53), M.ONE);
    let b = M.powRational(M.parseRational("2"), 53);
    return C.toNumber(M.sub(a, b));
}, "1");

runArithmeticTest("2.10", "(1e15 + 1) - 1e15", () => {
    let a = M.add(parseValue("1e15"), M.ONE);
    return C.toNumber(M.sub(a, parseValue("1e15")));
}, "1");

runArithmeticTest("2.11", "x^2 - 2 at x = 99999999999/70710678118", () => {
    let x = parseValue("99999999999/70710678118");
    return C.toNumber(M.sub(M.mul(x, x), parseValue("2")));
}, "Near 0");

runArithmeticTest("2.12", "(x - 1)^6 at x = 1.0001", () => {
    let dx = M.sub(parseValue("1.0001"), M.ONE);
    return C.toNumber(M.powRational(dx, 6));
}, "1e-24");

runArithmeticTest("2.13", "exp(ln(x)) at x = 12345.6789", () => {
    return C.expValue(C.lnValue(parseValue("12345.6789"))).re;
}, "12345.6789");

// 2.14 sin(π)
runArithmeticTest("2.14", "sin(π)", () => {
    return C.sinValue(parseValue(String(Math.PI)), "rad").re;
}, "0 exactly (or machine value?)");

// 2.15 cos(π/2)
runArithmeticTest("2.15", "cos(π/2)", () => {
    return C.cosValue(parseValue(String(Math.PI / 2)), "rad").re;
}, "0 exactly (or machine value?)");


// ============================================
// CATEGORY 3: MACHINE ARITHMETIC
// ============================================
console.log("\n============================================\nCATEGORY 3: MACHINE ARITHMETIC\n============================================");

function runMachineTest(id, val, k, mode, exp) {
    let result, err;
    try {
        let v = M.parseRational(val);
        result = M.rationalToDecimalString(M.machineApprox(v, k, mode).approx, 20);
    } catch(e) {
        err = e.message;
    }
    console.log(`\nTEST ${id}: ${val} | k=${k} | ${mode}`);
    console.log(`Expected: ${exp}`);
    if (err) {
        console.log(`> Result: ❌ EXCEPTION: ${err}`);
    } else {
        console.log(`> Result: ${result}`);
    }
}

function runMachinePairTest(id, val, k, expected) {
    let chopResult, roundResult, err;
    try {
        let v = M.parseRational(val);
        chopResult = M.rationalToDecimalString(M.machineApprox(v, k, "chop").approx, 20);
        roundResult = M.rationalToDecimalString(M.machineApprox(v, k, "round").approx, 20);
    } catch(e) {
        err = e.message;
    }
    console.log(`\nTEST ${id}: ${val} | k=${k} | chop vs round`);
    console.log(`Expected: ${expected}`);
    if (err) {
        console.log(`> Result: ❌ EXCEPTION: ${err}`);
    } else {
        console.log(`> Result: chop=${chopResult} | round=${roundResult}`);
    }
}

// 3.1 & 3.2
runMachineTest("3.1", "1/3", 4, "chop", "0.3333");
runMachineTest("3.2", "1/3", 4, "round", "0.3333");

// 3.3 & 3.4
runMachineTest("3.3", "2/3", 4, "chop", "0.6666");
runMachineTest("3.4", "2/3", 4, "round", "0.6667");

// Cascades
runMachineTest("3.5", "0.99995", 4, "round", "1.000");
runMachineTest("3.6", "0.99994", 4, "round", "0.9999");
runMachineTest("3.7", "9999.5", 4, "round", "10000");
runMachineTest("3.8", "0.00099995", 4, "round", "0.001000");

// Min precision
runMachineTest("3.9", "1/6", 1, "chop", "0.1");
runMachineTest("3.10", "1/6", 1, "round", "0.2");

runMachineTest("3.11", "0", 4, "chop", "0");
runMachineTest("3.12", "0", 4, "round", "0");

// Negatives
runMachineTest("3.13", "-1/3", 4, "chop", "-0.3333");
runMachineTest("3.14", "-2/3", 4, "round", "-0.6667");

// Subnormals & Extremes
runMachineTest("3.15", "1e-100", 3, "chop", "0.100 × 10^-99");
runMachineTest("3.16", "9.999e99", 3, "round", "0.100 × 10^101");

runMachineTest("3.17", "1e308", 4, "chop", "Near max double range");
runMachineTest("3.18", "5e-324", 4, "chop", "Subnormal territory");

// Edge case comparisons
runMachinePairTest("3.19", "1/7", 7, "chop: 0.1428571, round: 0.1428571");
runMachinePairTest("3.20", "1/7", 6, "chop: 0.142857, round: 0.142857");
