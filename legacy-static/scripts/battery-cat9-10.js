"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = __dirname ? path.resolve(__dirname, "..") : process.cwd();
const ENGINE_FILES = ["math-engine.js", "calc-engine.js", "expression-engine.js", "poly-engine.js", "ieee754.js"];

const context = { console };
context.globalThis = context;
context.window = context;
vm.createContext(context);
for (const file of ENGINE_FILES) {
  const source = fs.readFileSync(path.join(ROOT, file), "utf8");
  vm.runInContext(source, context, { filename: file });
}

const M = context.MathEngine;
const P = context.PolyEngine;
const I = context.IEEE754;

function stringifyValue(value) {
  if (value == null) return "null";
  if (typeof value === "number") {
    if (Object.is(value, -0)) return "-0";
    if (Number.isNaN(value)) return "NaN";
    return String(value);
  }
  if (value.kind === "rational") {
    return M.rationalToDecimalString(value, 20);
  }
  if (value.kind === "calc") {
    return `${value.re}${value.im ? ` + ${value.im}i` : ""}`;
  }
  if (typeof value === "object") {
    return JSON.stringify(value, (key, inner) => typeof inner === "bigint" ? inner.toString() + "n" : inner);
  }
  return String(value);
}

function runTest(id, name, logic, expected) {
  let result;
  let err;
  try {
    result = logic();
  } catch (error) {
    err = error.message;
  }
  console.log(`\nTEST ${id}: ${name}`);
  console.log(`Expected: ${expected}`);
  if (err) {
    console.log(`> Result: ❌ EXCEPTION: ${err}`);
  } else {
    console.log(`> Result: ${result}`);
  }
}

function runPolyEval(id, expression, x, k, mode, note) {
  runTest(id, `${expression} at x=${x} | k=${k} | ${mode}`, () => {
    const poly = P.parsePolynomial(expression);
    const comparison = P.evaluateComparison(poly, M.parseRational(String(x)), { k, mode }, { expression });
    return `exact=${stringifyValue(comparison.exact)} | horner=${stringifyValue(comparison.horner.step.approx)} | direct=${stringifyValue(comparison.direct.step.approx)} | final=${stringifyValue(comparison.final.approx)}`;
  }, note);
}

function runIEEEEncode(id, input, note) {
  runTest(id, `Decimal -> IEEE (${input})`, () => {
    const encoded = I.decimalToIEEE(input);
    return encoded.final64Bit;
  }, note);
}

function runIEEEDecode(id, bits, note) {
  runTest(id, `IEEE -> Decimal (${bits})`, () => {
    const decoded = I.ieeeToDecimal(bits);
    return `${decoded.specialType || "finite"} | ${stringifyValue(decoded.finalValue)}`;
  }, note);
}

console.log("\n============================================\nCATEGORY 9: POLYNOMIAL ENGINE WARFARE\n============================================");

runPolyEval("9.1", "x^2 - 2", "1.414", 4, "chop", "Simple evaluation. Both methods should agree.");
runPolyEval("9.2", "x^3 - 6*x^2 + 11*x - 6", "1", 4, "chop", "Exact root at x=1.");
runPolyEval("9.3", "x^3 - 6*x^2 + 11*x - 6", "1.0001", 4, "chop", "Near-root cancellation test.");
runPolyEval("9.4", "x^10", "2", 3, "chop", "2^10 = 1024.");
runPolyEval("9.5", "x^10 - 1", "1.0001", 4, "chop", "Near-root of high-degree polynomial.");
runPolyEval("9.6", "x^4 - 4*x^3 + 6*x^2 - 4*x + 1", "1.0001", 4, "chop", "(x-1)^4 near the root.");
runPolyEval("9.7", "1000000*x^2 - 1000001*x + 1", "0.000001", 4, "chop", "Huge coefficients + small x.");
runPolyEval("9.8", "x^120", "1.001", 4, "chop", "Maximum degree supported.");
runTest("9.9", "x^121 at 2", () => P.parsePolynomial("x^121"), "Should throw because degree exceeds 120.");
runTest("9.10", "x/x at 5", () => P.parsePolynomial("x/x"), "Should throw because division by x is unsupported.");
runPolyEval("9.11", "0", "999", 4, "chop", "Zero polynomial.");
runPolyEval("9.12", "42", "999", 4, "chop", "Constant polynomial.");
runPolyEval("9.13", "x", "0", 4, "chop", "Linear polynomial at zero.");
runPolyEval("9.14", "x^2 + x + 1", "0", 4, "chop", "Should evaluate to 1.");
runPolyEval("9.15", "x^10 + x^9 + x^8 + x^7 + x^6 + x^5 + x^4 + x^3 + x^2 + x + 1", "0.9999", 3, "chop", "Geometric series near x=1.");
runPolyEval("9.16", "x^2 - 2*x + 1", "0.99999", 4, "chop", "(x-1)^2 near root.");
runPolyEval("9.17", "x^3 + 0*x^2 + 0*x + 0", "2", 4, "chop", "Polynomial with zero coefficients.");
runPolyEval("9.18", "-x^3 + x", "0.5", 4, "chop", "Negative leading coefficient.");
runPolyEval("9.19", "(x+1)^10", "0.001", 4, "chop", "Expanded binomial form.");
runPolyEval("9.20", "x^2", "1/3", 4, "chop", "Rational input for x.");

console.log("\n============================================\nCATEGORY 10: IEEE-754 BIT LEVEL\n============================================");

runIEEEEncode("10.1", 0, "All zeros.");
runIEEEEncode("10.2", -0, "Sign bit 1, rest zeros.");
runIEEEEncode("10.3", 1, "Known bit pattern for +1.");
runIEEEEncode("10.4", -1, "Known bit pattern for -1.");
runIEEEEncode("10.5", 0.1, "Should match the standard 0.1 pattern.");
runIEEEEncode("10.6", Infinity, "Positive infinity bits.");
runIEEEEncode("10.7", -Infinity, "Negative infinity bits.");
runIEEEEncode("10.8", NaN, "NaN should have all-ones exponent and non-zero mantissa.");
runIEEEEncode("10.9", 2.2250738585072014e-308, "Smallest normal double.");
runIEEEEncode("10.10", 5e-324, "Smallest subnormal double.");
runIEEEEncode("10.11", 1.7976931348623157e+308, "Largest finite double.");
runIEEEEncode("10.12", 1.7976931348623158e+308, "Should overflow to infinity.");
runIEEEDecode("10.13", "0011111111110000000000000000000000000000000000000000000000000000", "Should decode to 1.0.");
runIEEEDecode("10.14", "0000000000000000000000000000000000000000000000000000000000000000", "Should decode to 0.");
runIEEEDecode("10.15", "0100000000001001001000011111101101010100010001000010110100011000", "Should decode near pi.");
runIEEEDecode("10.16", "0".repeat(63), "Wrong length should throw.");
runIEEEDecode("10.17", "0".repeat(65), "Wrong length should throw.");
runIEEEDecode("10.18", "abc", "Non-binary input should throw.");
runIEEEEncode("10.19", 2.220446049250313e-16, "Machine epsilon.");
runTest("10.20", "Round-trip 42.5", () => {
  const encoded = I.decimalToIEEE(42.5);
  const decoded = I.ieeeToDecimal(encoded.final64Bit);
  return decoded.finalValue;
}, "Should return 42.5 exactly.");
runTest("10.21", "Round-trip 0.1", () => {
  const encoded = I.decimalToIEEE(0.1);
  const decoded = I.ieeeToDecimal(encoded.final64Bit);
  return decoded.finalValue;
}, "Should return the stored binary64 value for 0.1.");
runTest("10.22", "Round-trip -17.75", () => {
  const encoded = I.decimalToIEEE(-17.75);
  const decoded = I.ieeeToDecimal(encoded.final64Bit);
  return decoded.finalValue;
}, "Should return -17.75 exactly.");
