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
  const source = fs.readFileSync(path.join(ROOT, file), "utf8");
  vm.runInContext(source, context, { filename: file });
}

const M = context.MathEngine;
const C = context.CalcEngine;
const E = context.ExpressionEngine;
const R = context.RootEngine;
const P = context.PolyEngine;
const I = context.IEEE754;

function parseValue(input) {
  return M.parseRational(String(input));
}

function stringifyValue(value) {
  if (value == null) return "null";
  if (typeof value === "number") {
    if (Object.is(value, -0)) return "-0";
    if (Number.isNaN(value)) return "NaN";
    return String(value);
  }
  if (value.kind === "rational") return M.rationalToDecimalString(value, 20);
  if (value.kind === "calc") return value.im ? `${value.re} + ${value.im}i` : String(value.re);
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

function evalResidual(expression, x, machine, angleMode) {
  const ast = E.parseExpression(expression, { allowVariable: true });
  const exact = E.evaluateValue(ast, { x, angleMode: angleMode || "rad" });
  return C.machineApproxValue(exact, machine.k, machine.mode).approx;
}

console.log("\n============================================\nCATEGORY 11: TRIGONOMETRIC & TRANSCENDENTAL GAUNTLET\n============================================");

runTest("11.1", "sin(0) rad", () => C.sinValue(parseValue("0"), "rad").re, "0 exactly");
runTest("11.2", "sin(pi) rad", () => C.sinValue(parseValue(String(Math.PI)), "rad").re, "Machine sine of pi.");
runTest("11.3", "cos(0) rad", () => C.cosValue(parseValue("0"), "rad").re, "1 exactly");
runTest("11.4", "cos(pi) rad", () => C.cosValue(parseValue(String(Math.PI)), "rad").re, "-1 exactly");
runTest("11.5", "tan(pi/2) rad", () => C.tanValue(parseValue(String(Math.PI / 2)), "rad").re, "Should be undefined or throw.");
runTest("11.6", "sin(90) deg", () => C.sinValue(parseValue("90"), "deg").re, "1");
runTest("11.7", "sin(90) rad", () => C.sinValue(parseValue("90"), "rad").re, "sin(90 radians)");
runTest("11.8", "cos(360) deg", () => C.cosValue(parseValue("360"), "deg").re, "1");
runTest("11.9", "tan(45) deg", () => C.tanValue(parseValue("45"), "deg").re, "1");
runTest("11.10", "sin(1e10) rad", () => C.sinValue(parseValue("10000000000"), "rad").re, "Argument-reduction stress.");
runTest("11.11", "ln(0)", () => C.lnValue(parseValue("0")).re, "Should throw > 0");
runTest("11.12", "ln(-1)", () => C.lnValue(parseValue("-1")).re, "Should throw > 0");
runTest("11.13", "ln(1)", () => C.lnValue(parseValue("1")).re, "0 exactly");
runTest("11.14", "exp(0)", () => C.expValue(parseValue("0")).re, "1 exactly");
runTest("11.15", "exp(710)", () => C.expValue(parseValue("710")).re, "Infinity");
runTest("11.16", "exp(-750)", () => C.expValue(parseValue("-750")).re, "0");
runTest("11.17", "exp(ln(1))", () => C.expValue(C.lnValue(parseValue("1"))).re, "1");
runTest("11.18", "sin(x)^2 + cos(x)^2 at x=1.23456", () => {
  const x = parseValue("1.23456");
  const s = C.sinValue(x, "rad");
  const c = C.cosValue(x, "rad");
  return C.add(C.mul(s, s), C.mul(c, c)).re;
}, "Should be very close to 1.");
runTest("11.19", "sqrt(-1)", () => stringifyValue(C.sqrtValue(parseValue("-1"))), "0 + 1i");
runTest("11.20", "sqrt(0)", () => C.sqrtValue(parseValue("0")).re, "0");
runTest("11.21", "ln(exp(100))", () => C.lnValue(C.expValue(parseValue("100"))).re, "100");
runTest("11.22", "tan(89.9999999) deg", () => C.tanValue(parseValue("89.9999999"), "deg").re, "Very large number");

console.log("\n============================================\nCATEGORY 12: CROSS-MODULE MASTER INTEGRATION\n============================================");

runTest("12.1", "Bisection on polynomial + PolyEngine check", () => {
  const res = R.runBisection({
    expression: "x^3 - 6*x^2 + 11*x - 6",
    interval: { a: "0.5", b: "1.5" },
    decisionBasis: "machine",
    machine: { k: 4, mode: "chop" },
    stopping: { kind: "epsilon", value: "0.001" }
  });
  const poly = P.parsePolynomial("x^3 - 6*x^2 + 11*x - 6");
  const cmp = P.evaluateComparison(poly, res.summary.approximation, { k: 4, mode: "chop" }, { expression: "x^3 - 6*x^2 + 11*x - 6" });
  return `root=${stringifyValue(res.summary.approximation)} | horner=${stringifyValue(cmp.horner.step.approx)} | direct=${stringifyValue(cmp.direct.step.approx)}`;
}, "Residual near zero around the bisection root.");

runTest("12.2", "Newton on sin(x)-0.5 with residual", () => {
  const machine = { k: 6, mode: "round" };
  const res = R.runNewtonRaphson({
    expression: "sin(x) - 0.5",
    dfExpression: "cos(x)",
    x0: "0.5",
    angleMode: "rad",
    machine,
    stopping: { kind: "epsilon", value: "1e-8" }
  });
  const residual = evalResidual("sin(x) - 0.5", res.summary.approximation, machine, "rad");
  return `root=${stringifyValue(res.summary.approximation)} | residual=${stringifyValue(residual)}`;
}, "Root near pi/6 with small residual.");

runTest("12.3", "Machine arithmetic -> root finding -> re-approximation", () => {
  const res = R.runBisection({
    expression: "x^2 - 2",
    interval: { a: "1", b: "2" },
    decisionBasis: "machine",
    machine: { k: 3, mode: "chop" },
    stopping: { kind: "epsilon", value: "0.001" }
  });
  return stringifyValue(M.machineApprox(res.summary.approximation, 3, "chop").approx);
}, "Result should survive re-approximation.");

runTest("12.4", "Expression parsing -> evaluation -> comparison", () => {
  const ast = E.parseExpression("x^2 - 1", { allowVariable: true });
  const comparison = E.evaluateComparison(ast, { k: 4, mode: "chop" }, { x: parseValue("1.0001"), angleMode: "rad" }, { expression: "x^2 - 1" });
  return `step=${stringifyValue(comparison.step.approx)} | final=${stringifyValue(comparison.final.approx)}`;
}, "Stepwise and final approximations may differ.");

runTest("12.5", "Polynomial -> IEEE-754", () => {
  const zeroBits = I.decimalToIEEE(0).final64Bit;
  const nearBits = I.decimalToIEEE(-0.01).final64Bit;
  return `zero=${zeroBits} | near=${nearBits}`;
}, "Should show the exact zero encoding and a near-zero negative encoding.");

runTest("12.6", "Fixed point -> exact arithmetic path", () => {
  const res = R.runFixedPoint({
    gExpression: "(x + 2/x) / 2",
    x0: "1/1",
    machine: { k: 8, mode: "round" },
    stopping: { kind: "epsilon", value: "1e-10" }
  });
  return `stop=${res.summary.stopReason} | root=${stringifyValue(res.summary.approximation)}`;
}, "Should converge toward sqrt(2).");

runTest("12.7", "Angle mode propagation in bisection", () => {
  const machine = { k: 5, mode: "round" };
  const rad = R.runBisection({
    expression: "sin(x) - 0.5",
    interval: { a: "0", b: "2" },
    angleMode: "rad",
    decisionBasis: "machine",
    machine,
    stopping: { kind: "epsilon", value: "0.001" }
  });
  const deg = R.runBisection({
    expression: "sin(x) - 0.5",
    interval: { a: "0", b: "2" },
    angleMode: "deg",
    decisionBasis: "machine",
    machine,
    stopping: { kind: "epsilon", value: "0.001" }
  });
  return `rad=${stringifyValue(rad.summary.approximation)} | degStatus=${deg.summary.intervalStatus}/${deg.summary.stopReason}`;
}, "Radians: bisection should emit its designed stop reason for the relative-tolerance-invalid or bracket presentation; degrees: invalid-bracket.");

runTest("12.8", "Compare all five methods on x^3 - 2", () => {
  const machine = { k: 6, mode: "round" };
  const b = R.runBisection({ expression: "x^3 - 2", interval: { a: "1", b: "2" }, decisionBasis: "machine", machine, stopping: { kind: "epsilon", value: "0.0001" } });
  const n = R.runNewtonRaphson({ expression: "x^3 - 2", dfExpression: "3*x^2", x0: "1", machine, stopping: { kind: "epsilon", value: "0.0001" } });
  const s = R.runSecant({ expression: "x^3 - 2", x0: "1", x1: "2", machine, stopping: { kind: "epsilon", value: "0.0001" } });
  const f = R.runFalsePosition({ expression: "x^3 - 2", interval: { a: "1", b: "2" }, decisionBasis: "machine", machine, stopping: { kind: "epsilon", value: "0.0001" } });
  const p = R.runFixedPoint({ gExpression: "(2/(x^2) + 2*x)/3", x0: "1", machine, stopping: { kind: "epsilon", value: "0.0001" } });
  return `b=${stringifyValue(b.summary.approximation)} | n=${stringifyValue(n.summary.approximation)} | s=${stringifyValue(s.summary.approximation)} | f=${stringifyValue(f.summary.approximation)} | p=${stringifyValue(p.summary.approximation)}`;
}, "All methods should approach cube-root(2).");

runTest("12.9", "Huge rational in root finding", () => {
  const res = R.runBisection({
    expression: "x - 1/99999999999999999",
    interval: { a: "0", b: "1" },
    decisionBasis: "machine",
    machine: { k: 6, mode: "round" },
    stopping: { kind: "epsilon", value: "1e-18" }
  });
  return stringifyValue(res.summary.approximation);
}, "Large-denominator bracket touching zero is expected to produce a structured bisection stop (e.g. relative-tolerance bound unreachable), not a thrown exception.");

runTest("12.10", "Sign disagreement cascade exact vs machine", () => {
  const machineOpts = {
    expression: "x^3 - 0.001*x",
    interval: { a: "-0.1", b: "0.1" },
    machine: { k: 3, mode: "chop" },
    stopping: { kind: "iterations", value: 10 }
  };
  const exact = R.runBisection(Object.assign({ decisionBasis: "exact" }, machineOpts));
  const approx = R.runBisection(Object.assign({ decisionBasis: "machine" }, machineOpts));
  return `exact=${stringifyValue(exact.summary.approximation)} | machine=${stringifyValue(approx.summary.approximation)}`;
}, "Compare exact and machine decision bases.");

runTest("12.11", "Relative tolerance + near-zero bracket", () => {
  return R.runBisection({
    expression: "x^3",
    interval: { a: "-1", b: "1" },
    decisionBasis: "machine",
    machine: { k: 6, mode: "round" },
    stopping: { kind: "epsilon", value: "0.01", toleranceType: "relative" }
  }).summary.stopReason;
}, "Should not divide by zero while the bracket contains 0.");

runTest("12.12", "Polynomial Horner vs Direct with chop k=3", () => {
  const poly = P.parsePolynomial("x^5 - 5*x^4 + 10*x^3 - 10*x^2 + 5*x - 1");
  const cmp = P.evaluateComparison(poly, parseValue("0.9999"), { k: 3, mode: "chop" }, { expression: "x^5 - 5*x^4 + 10*x^3 - 10*x^2 + 5*x - 1" });
  return `horner=${stringifyValue(cmp.horner.step.approx)} | direct=${stringifyValue(cmp.direct.step.approx)} | exact=${stringifyValue(cmp.exact)}`;
}, "Horner should generally be more stable than direct evaluation here.");

runTest("12.13", "Secant + tiny machine k", () => {
  const res = R.runSecant({
    expression: "x^2 - 2",
    x0: "1",
    x1: "2",
    machine: { k: 2, mode: "chop" },
    stopping: { kind: "epsilon", value: "0.01" }
  });
  return `stop=${res.summary.stopReason} | root=${stringifyValue(res.summary.approximation)}`;
}, "At k=2 chop, Secant cannot resolve finer than ~0.1; any result within that precision is acceptable convergence.");

runTest("12.14", "Newton with wrong angle mode", () => {
  const res = R.runNewtonRaphson({
    expression: "sin(x)",
    dfExpression: "cos(x)",
    x0: "3",
    angleMode: "deg",
    machine: { k: 6, mode: "round" },
    stopping: { kind: "epsilon", value: "1e-8" }
  });
  return stringifyValue(res.summary.approximation);
}, "Should converge to a degree-based root, not a radian one.");

runTest("12.15", "Bisection 1000 iterations on x over [-1,1]", () => {
  const res = R.runBisection({
    expression: "x",
    interval: { a: "-1", b: "1" },
    decisionBasis: "machine",
    machine: { k: 6, mode: "round" },
    stopping: { kind: "iterations", value: 1000 }
  });
  return `${res.summary.stopReason} | rows=${res.rows.length}`;
}, "Should complete without hanging.");
