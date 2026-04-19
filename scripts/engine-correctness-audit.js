"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = __dirname ? path.resolve(__dirname, "..") : process.cwd();
const ENGINE_FILES = [
  "math-engine.js",
  "calc-engine.js",
  "expression-engine.js",
  "poly-engine.js"
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
    P: context.PolyEngine
  };
}

function makeReporter() {
  const results = [];
  return {
    check(name, category, expected, actual, passed, note) {
      results.push({ name, category, expected, actual, passed, note: note || "" });
    },
    finish() {
      const failures = results.filter((result) => !result.passed);
      for (const result of results) {
        console.log(`[${result.passed ? "PASS" : "FAIL"}] ${result.category} :: ${result.name}`);
        console.log(`  Expected: ${result.expected}`);
        console.log(`  Actual:   ${result.actual}`);
        if (result.note) {
          console.log(`  Note:     ${result.note}`);
        }
        console.log("");
      }
      console.log(`Summary: ${results.length - failures.length}/${results.length} passed`);
      if (failures.length) {
        process.exitCode = 1;
      }
    }
  };
}

function captureRun(fn) {
  try {
    return { run: fn(), error: null };
  } catch (error) {
    return { run: null, error };
  }
}

function rationalDecimal(M, value, digits = 20) {
  return M.rationalToDecimalString(value, digits);
}

function rationalFraction(M, value) {
  return M.rationalToFractionString(value);
}

function normalizedSignature(normalized) {
  return `digits ${normalized.digits.join("")} exp ${normalized.exponentN}`;
}

function run() {
  const { M, C, E, P } = loadEngines();
  const report = makeReporter();

  {
    const a = M.parseRational("2.1892");
    const b = M.parseRational("3.7008");
    const exact = M.mul(a, b);
    const chop = M.machineApprox(exact, 8, "chop");
    const round = M.machineApprox(exact, 8, "round");

    report.check(
      "Canonical multiplication exact",
      "Machine approximation",
      "8.10179136",
      rationalDecimal(M, exact),
      rationalDecimal(M, exact) === "8.10179136",
      "Independent oracle from the course reference."
    );
    report.check(
      "Canonical multiplication chop",
      "Machine approximation",
      "8.1017913",
      rationalDecimal(M, chop.approx),
      rationalDecimal(M, chop.approx) === "8.1017913"
    );
    report.check(
      "Canonical multiplication round",
      "Machine approximation",
      "8.1017914",
      rationalDecimal(M, round.approx),
      rationalDecimal(M, round.approx) === "8.1017914"
    );
  }

  {
    const comparison = E.evaluateComparison(
      E.parseExpression("2.1892*3.7008", { allowVariable: false }),
      { k: 8, mode: "chop" },
      { angleMode: "deg" },
      { expression: "2.1892*3.7008" }
    );

    report.check(
      "Expression comparison package keeps raw expression",
      "Engine result packages",
      "2.1892*3.7008",
      comparison.expression,
      comparison.expression === "2.1892*3.7008"
    );
    report.check(
      "Expression comparison package stepwise result",
      "Engine result packages",
      "8.1017913",
      rationalDecimal(M, comparison.step.approx),
      rationalDecimal(M, comparison.step.approx) === "8.1017913"
    );
    report.check(
      "Expression comparison package final result",
      "Engine result packages",
      "8.1017913",
      rationalDecimal(M, comparison.final.approx),
      rationalDecimal(M, comparison.final.approx) === "8.1017913"
    );
  }

  {
    const comparison = E.evaluateComparison(
      E.parseExpression("sin(x) - x/2", { allowVariable: true }),
      { k: 6, mode: "round" },
      { x: M.parseRational("1"), angleMode: "rad" },
      { expression: "sin(x) - x/2" }
    );

    report.check(
      "sin(x) - x/2 real part at x=1",
      "Transcendental expression support",
      "0.341471",
      comparison.step.approx.re.toFixed(6),
      Math.abs(comparison.step.approx.re - 0.341471) < 1e-12,
      "This should evaluate in radians for the root-finding examples."
    );
  }

  {
    const comparison = E.evaluateComparison(
      E.parseExpression("e^(-x) - x", { allowVariable: true }),
      { k: 6, mode: "round" },
      { x: M.parseRational("1"), angleMode: "rad" },
      { expression: "e^(-x) - x" }
    );

    report.check(
      "e^(-x) - x real part at x=1",
      "Transcendental expression support",
      "-0.632120",
      comparison.step.approx.re.toFixed(6),
      Math.abs(comparison.step.approx.re + 0.632120) < 1e-12,
      "This should preserve the approved exponential example for bisection."
    );
  }

  {
    const y = M.parseRational("9.9996");
    const chop = M.machineApprox(y, 4, "chop");
    const round = M.machineApprox(y, 4, "round");

    report.check(
      "Rounding carry keeps chop at 9.999",
      "Machine approximation",
      "9.999",
      rationalDecimal(M, chop.approx),
      rationalDecimal(M, chop.approx) === "9.999"
    );
    report.check(
      "Rounding carry rolls over to 10",
      "Machine approximation",
      "10",
      rationalDecimal(M, round.approx),
      rationalDecimal(M, round.approx) === "10"
    );
    report.check(
      "Rounding carry updates normalized exponent",
      "Machine approximation",
      "digits 1000 exp 2",
      normalizedSignature(round.normalized),
      round.normalized.digits.join("") === "1000" && round.normalized.exponentN === 2,
      "The mantissa rollover should renormalize 10 as 0.1000 x 10^2."
    );
  }

  {
    const third = M.parseRational("1/3");
    const chop = M.machineApprox(third, 6, "chop");
    const round = M.machineApprox(third, 6, "round");

    report.check(
      "Repeating decimal 1/3 chop",
      "Repeating decimals",
      "0.333333",
      rationalDecimal(M, chop.approx),
      rationalDecimal(M, chop.approx) === "0.333333"
    );
    report.check(
      "Repeating decimal 1/3 round",
      "Repeating decimals",
      "0.333333",
      rationalDecimal(M, round.approx),
      rationalDecimal(M, round.approx) === "0.333333",
      "The seventh digit is 3, so rounding matches chopping here."
    );
    report.check(
      "Repeating decimal 1/3 normalized form",
      "Repeating decimals",
      "digits 333333 exp 0",
      normalizedSignature(chop.normalized),
      chop.normalized.digits.join("") === "333333" && chop.normalized.exponentN === 0
    );
  }

  {
    const negative = M.parseRational("-8.10179136");
    const chop = M.machineApprox(negative, 8, "chop");
    const round = M.machineApprox(negative, 8, "round");

    report.check(
      "Negative-value chop keeps sign",
      "Negative-value paths",
      "-8.1017913",
      rationalDecimal(M, chop.approx),
      rationalDecimal(M, chop.approx) === "-8.1017913"
    );
    report.check(
      "Negative-value round keeps sign",
      "Negative-value paths",
      "-8.1017914",
      rationalDecimal(M, round.approx),
      rationalDecimal(M, round.approx) === "-8.1017914"
    );
    report.check(
      "Negative-value normalized digits",
      "Negative-value paths",
      "digits 81017914 exp 1",
      normalizedSignature(round.normalized),
      round.normalized.digits.join("") === "81017914" && round.normalized.exponentN === 1,
      "Sign should remain separate from the stored mantissa digits."
    );
  }

  {
    const tiny = M.parseRational("0.00099996");
    const chop = M.machineApprox(tiny, 4, "chop");
    const round = M.machineApprox(tiny, 4, "round");

    report.check(
      "Exponent-shift chop keeps 0.0009999",
      "Exponent-shift interactions",
      "0.0009999",
      rationalDecimal(M, chop.approx),
      rationalDecimal(M, chop.approx) === "0.0009999"
    );
    report.check(
      "Exponent-shift round rolls to 0.001",
      "Exponent-shift interactions",
      "0.001",
      rationalDecimal(M, round.approx),
      rationalDecimal(M, round.approx) === "0.001"
    );
    report.check(
      "Exponent-shift normalized rollover",
      "Exponent-shift interactions",
      "digits 1000 exp -2",
      normalizedSignature(round.normalized),
      round.normalized.digits.join("") === "1000" && round.normalized.exponentN === -2,
      "This is the small-magnitude counterpart to the 9.9996 rollover case."
    );
  }

  {
    const hostileExponent = captureRun(() => M.parseRational("1e5001"));
    const extremeHostileExponent = captureRun(() => M.parseRational("1e10000000"));
    const overlongInput = "1" + "0".repeat(4096);
    const hostileLength = captureRun(() => M.parseRational(overlongInput));
    const hostileK = captureRun(() => M.machineApprox(M.parseRational("1.23"), 1001, "round"));
    const hostilePow = captureRun(() => M.pow10(5001));
    const boundaryScientific = captureRun(() => M.parseRational("1e308"));

    const hostileExponentActual = hostileExponent.error ? hostileExponent.error.message : rationalFraction(M, hostileExponent.run);
    const extremeHostileExponentActual = extremeHostileExponent.error
      ? extremeHostileExponent.error.message
      : rationalFraction(M, extremeHostileExponent.run);
    const hostileLengthActual = hostileLength.error ? hostileLength.error.message : rationalFraction(M, hostileLength.run);
    const hostileKActual = hostileK.error ? hostileK.error.message : rationalDecimal(M, hostileK.run.approx);
    const hostilePowActual = hostilePow.error ? hostilePow.error.message : hostilePow.run.toString();
    const boundaryActual = boundaryScientific.error ? boundaryScientific.error.message : normalizedSignature(M.extractNormalizedDigits(boundaryScientific.run, 4));

    report.check(
      "Scientific exponent cap rejects hostile magnitudes",
      "Numeric input guardrails",
      "Exponent magnitude cannot exceed 5000.",
      hostileExponentActual,
      hostileExponent.error && hostileExponentActual === "Exponent magnitude cannot exceed 5000."
    );
    report.check(
      "Scientific exponent cap rejects very large hostile magnitudes",
      "Numeric input guardrails",
      "Exponent magnitude cannot exceed 5000.",
      extremeHostileExponentActual,
      extremeHostileExponent.error && extremeHostileExponentActual === "Exponent magnitude cannot exceed 5000."
    );
    report.check(
      "Raw numeric input length cap rejects overlong strings",
      "Numeric input guardrails",
      "Numeric input cannot exceed 4096 characters.",
      hostileLengthActual,
      hostileLength.error && hostileLengthActual === "Numeric input cannot exceed 4096 characters."
    );
    report.check(
      "k cap rejects hostile precision requests",
      "Numeric input guardrails",
      "k must be an integer between 1 and 1000.",
      hostileKActual,
      hostileK.error && hostileKActual === "k must be an integer between 1 and 1000."
    );
    report.check(
      "pow10 cap blocks unbounded cache growth",
      "Numeric input guardrails",
      "Power exponent cannot exceed 5000.",
      hostilePowActual,
      hostilePow.error && hostilePowActual === "Power exponent cannot exceed 5000."
    );
    report.check(
      "Boundary scientific notation remains valid",
      "Numeric input guardrails",
      "digits 1000 exp 309",
      boundaryActual,
      !boundaryScientific.error && boundaryActual === "digits 1000 exp 309"
    );
  }

  {
    const parityCases = [
      { label: "1/3 chop", value: M.parseRational("1/3"), k: 6, mode: "chop" },
      { label: "negative canonical round", value: M.parseRational("-8.10179136"), k: 8, mode: "round" },
      { label: "small rollover round", value: M.parseRational("0.00099996"), k: 4, mode: "round" }
    ];

    for (const parityCase of parityCases) {
      const scalar = M.machineApprox(parityCase.value, parityCase.k, parityCase.mode);
      const calc = C.machineApproxValue(parityCase.value, parityCase.k, parityCase.mode);
      report.check(
        `Scalar vs calc decimal parity (${parityCase.label})`,
        "Scalar vs calc parity",
        rationalDecimal(M, scalar.approx),
        rationalDecimal(M, calc.approx),
        rationalDecimal(M, scalar.approx) === rationalDecimal(M, calc.approx)
      );
      report.check(
        `Scalar vs calc normalized parity (${parityCase.label})`,
        "Scalar vs calc parity",
        normalizedSignature(scalar.normalized),
        normalizedSignature(calc.normalized),
        normalizedSignature(scalar.normalized) === normalizedSignature(calc.normalized)
      );
    }
  }

  {
    const ast = E.parseExpression("1000001-1000000", { allowVariable: false });
    const stepwise = E.evaluateStepwise(ast, { k: 6, mode: "chop" }, { angleMode: "deg" });
    const exact = E.evaluateExact(ast, { angleMode: "deg" });
    const finalOnly = C.machineApproxValue(exact, 6, "chop");

    report.check(
      "Cancellation exact result",
      "Expression stepwise",
      "1",
      rationalDecimal(M, exact),
      rationalDecimal(M, exact) === "1"
    );
    report.check(
      "Cancellation stepwise stored result",
      "Expression stepwise",
      "0",
      rationalDecimal(M, stepwise.approx),
      rationalDecimal(M, stepwise.approx) === "0",
      "This is the classic fl(fl(x) - fl(y)) cancellation case."
    );
    report.check(
      "Cancellation final-only result",
      "Expression stepwise",
      "1",
      rationalDecimal(M, finalOnly.approx),
      rationalDecimal(M, finalOnly.approx) === "1"
    );
  }

  {
    const exactAst = E.parseExpression("2+3/4", { allowVariable: false });
    const calcAst = E.parseExpression("sqrt(2)", { allowVariable: false });
    const exactCompatible = E.isExactCompatible(exactAst, { angleMode: "deg" });
    const calcCompatible = E.isExactCompatible(calcAst, { angleMode: "deg" });
    const exactValue = E.evaluateExact(exactAst, { angleMode: "deg" });

    report.check(
      "Exact arithmetic stays exact-compatible",
      "Exact-path vs calc-path",
      "true",
      String(exactCompatible),
      exactCompatible === true
    );
    report.check(
      "Exact arithmetic exact result",
      "Exact-path vs calc-path",
      "11/4",
      rationalFraction(M, exactValue),
      rationalFraction(M, exactValue) === "11/4"
    );
    report.check(
      "sqrt(2) forces calculator-path behavior",
      "Exact-path vs calc-path",
      "false",
      String(calcCompatible),
      calcCompatible === false
    );
  }

  {
    const comparison = P.evaluateComparison(
      P.parsePolynomial("2x - x^3/3 + x^5/60"),
      M.parseRational("3.14159/3"),
      { k: 8, mode: "chop" },
      { expression: "2x - x^3/3 + x^5/60" }
    );

    report.check(
      "Polynomial comparison package keeps raw expression",
      "Engine result packages",
      "2x - x^3/3 + x^5/60",
      comparison.expression,
      comparison.expression === "2x - x^3/3 + x^5/60"
    );
    report.check(
      "Polynomial comparison package canonical form",
      "Engine result packages",
      "1/60x^5 - 1/3x^3 + 2x",
      comparison.canonical,
      comparison.canonical === "1/60x^5 - 1/3x^3 + 2x"
    );
    report.check(
      "Polynomial comparison package final result",
      "Engine result packages",
      "1.7325896",
      rationalDecimal(M, comparison.final.approx),
      rationalDecimal(M, comparison.final.approx) === "1.7325896"
    );
  }

  {
    const poly = P.parsePolynomial("2x - x^3/3 + x^5/60");
    const x = M.parseRational("3.14159/3");
    const finalChop = P.evaluateApproxFinal(poly, x, { k: 8, mode: "chop" });
    const finalRound = P.evaluateApproxFinal(poly, x, { k: 8, mode: "round" });
    const horner = P.evaluateApprox(poly, x, { k: 8, mode: "chop" }, "horner");
    const direct = P.evaluateApprox(poly, x, { k: 8, mode: "chop" }, "direct");

    report.check(
      "Taylor-style polynomial final-only chop",
      "Polynomial consistency",
      "1.7325896",
      rationalDecimal(M, finalChop.approx),
      rationalDecimal(M, finalChop.approx) === "1.7325896",
      "Independent oracle from the course reference."
    );
    report.check(
      "Taylor-style polynomial final-only round",
      "Polynomial consistency",
      "1.7325897",
      rationalDecimal(M, finalRound.approx),
      rationalDecimal(M, finalRound.approx) === "1.7325897"
    );
    report.check(
      "Polynomial methods return finite stored values",
      "Polynomial consistency",
      "non-empty Horner and Direct approximations",
      `Horner ${rationalDecimal(M, horner.approx)} | Direct ${rationalDecimal(M, direct.approx)}`,
      Boolean(
        horner &&
        Object.prototype.hasOwnProperty.call(horner, "approx") &&
        direct &&
        Object.prototype.hasOwnProperty.call(direct, "approx")
      ),
      "First harness pass records both stepwise methods before tighter semantic checks."
    );
  }

  {
    const poly = P.parsePolynomial("(x-2)^13");
    const x = M.parseRational("2.0001");
    const exact = P.evaluateExact(poly, x);
    const finalOnly = P.evaluateApproxFinal(poly, x, { k: 6, mode: "chop" });
    const horner = P.evaluateApprox(poly, x, { k: 6, mode: "chop" }, "horner");
    const direct = P.evaluateApprox(poly, x, { k: 6, mode: "chop" }, "direct");

    report.check(
      "Near-root exact value remains tiny",
      "Polynomial sensitivity",
      "0.10000000 * 10^-51",
      M.toScientificString(exact, 8),
      M.toScientificString(exact, 8) === "0.10000000 * 10^-51"
    );
    report.check(
      "Near-root final-only value remains tiny",
      "Polynomial sensitivity",
      "0.100000 * 10^-51",
      finalOnly.scientific,
      finalOnly.scientific === "0.100000 * 10^-51"
    );
    report.check(
      "Near-root stepwise methods diverge dramatically",
      "Polynomial sensitivity",
      "Horner and Direct magnitudes both exceed 1 while final-only stays tiny",
      `Horner ${rationalDecimal(M, horner.approx)} | Direct ${rationalDecimal(M, direct.approx)} | Final ${finalOnly.scientific}`,
      C.magnitude(horner.approx) > 1 && C.magnitude(direct.approx) > 1 && C.magnitude(finalOnly.approx) < 1e-40,
      "This is the key sensitivity stress case for the current engine."
    );
  }

  {
    const poly = P.parsePolynomial("(x-1)^5");
    const x = M.parseRational("1.0001");
    const exact = P.evaluateExact(poly, x);
    const finalOnly = P.evaluateApproxFinal(poly, x, { k: 6, mode: "chop" });
    const horner = P.evaluateApprox(poly, x, { k: 6, mode: "chop" }, "horner");
    const direct = P.evaluateApprox(poly, x, { k: 6, mode: "chop" }, "direct");

    report.check(
      "Cancellation-heavy exact value",
      "Polynomial sensitivity",
      "0.10000000 * 10^-19",
      M.toScientificString(exact, 8),
      M.toScientificString(exact, 8) === "0.10000000 * 10^-19"
    );
    report.check(
      "Cancellation-heavy final-only value",
      "Polynomial sensitivity",
      "0.100000 * 10^-19",
      finalOnly.scientific,
      finalOnly.scientific === "0.100000 * 10^-19"
    );
    report.check(
      "Cancellation-heavy stepwise methods collapse to zero",
      "Polynomial sensitivity",
      "Horner 0 and Direct 0",
      `Horner ${rationalDecimal(M, horner.approx)} | Direct ${rationalDecimal(M, direct.approx)}`,
      rationalDecimal(M, horner.approx) === "0" && rationalDecimal(M, direct.approx) === "0",
      "This records the current loss-of-significance behavior under low precision."
    );
  }

  {
    const result = captureRun(() => C.requireRealNumber(E.evaluateValue(E.parseExpression("tan(pi / 4)", { allowVariable: false }), { angleMode: "rad" }), "tan(pi / 4)"));
    const actual = result.run !== null ? C.formatReal(result.run, 12) : (result.error && result.error.message ? result.error.message : "unknown error");
    report.check("tan() evaluates in shared engine", "Expression engine", "1", actual, result.run !== null && Math.abs(result.run - 1) < 1e-12);
  }

  {
    const result = captureRun(() => C.requireRealNumber(E.evaluateValue(E.parseExpression("ln(e)", { allowVariable: false }), { angleMode: "rad" }), "ln(e)"));
    const actual = result.run !== null ? C.formatReal(result.run, 12) : (result.error && result.error.message ? result.error.message : "unknown error");
    report.check("ln() evaluates in shared engine", "Expression engine", "1", actual, result.run !== null && Math.abs(result.run - 1) < 1e-12);
  }

  {
    const result = captureRun(() => {
      const ast = E.parseExpression("x^3 - 10^(-18)", { allowVariable: true });
      const value = E.evaluateValue(ast, { x: M.ZERO, angleMode: "rad" });
      const compatible = E.isExactCompatible(ast, { x: M.ZERO, angleMode: "rad" });
      return {
        compatible,
        value
      };
    });
    const actual = result.run !== null
      ? (() => {
          try {
            return String(result.run.compatible) + " / " + rationalFraction(M, result.run.value);
          } catch (error) {
            return error.message;
          }
        })()
      : (result.error && result.error.message ? result.error.message : "unknown error");
    report.check(
      "Negative integer powers stay exact when supported",
      "Expression engine",
      "exact-compatible nonzero rational",
      actual,
      result.run !== null && result.run.compatible && C.isRationalValue(result.run.value) && !M.isZero(result.run.value)
    );
  }

  report.finish();
}

run();
