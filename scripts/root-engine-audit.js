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

function realOrMessage(C, value, label) {
  try {
    return C.requireRealNumber(value, label);
  } catch (error) {
    return error.message;
  }
}

function run() {
  const { M, C, E, R } = loadEngines();
  const report = makeReporter();

  {
    const run = R.runBisection({
      expression: "x^2 - 2",
      interval: { a: "1", b: "2" },
      machine: { k: 6, mode: "round" },
      stopping: { kind: "iterations", value: 4 },
      decisionBasis: "exact",
      signDisplay: "both",
      angleMode: "rad"
    });

    const approx = C.formatReal(C.requireRealNumber(run.summary.approximation, "Approximation"), 8);
    report.check("Iteration mode returns four rows", "Bisection loop", "4", String(run.rows.length), run.rows.length === 4);
    report.check("Latest midpoint after four iterations", "Bisection loop", "1.4375", approx, approx === "1.4375");
  }

  {
    const run = R.runBisection({
      expression: "x^2 - 2",
      interval: { a: "1", b: "2" },
      machine: { k: 6, mode: "round" },
      stopping: { kind: "epsilon", value: "0.125", toleranceType: "absolute" },
      decisionBasis: "exact",
      signDisplay: "exact",
      angleMode: "rad"
    });

    report.check("Tolerance mode computes required iterations", "Stopping formulas", "3", String(run.stopping.iterationsRequired), run.stopping.iterationsRequired === 3);
  }

  {
    const run = R.runBisection({
      expression: "x^2 - 2",
      interval: { a: "1", b: "2" },
      machine: { k: 6, mode: "round" },
      stopping: { kind: "iterations", value: 4 },
      decisionBasis: "machine",
      signDisplay: "machine",
      angleMode: "rad"
    });

    report.check("Iteration mode computes epsilon bound", "Stopping formulas", "0.0625", C.formatReal(run.stopping.epsilonBound, 8), C.formatReal(run.stopping.epsilonBound, 8) === "0.0625");
  }

  {
    const required = R.iterationsFromTolerance(
      M.makeRational(1, 1n, 1n),
      M.makeRational(1, 2n, 1n),
      M.makeRational(1, 1n, 1000n)
    );
    report.check(
      "Lecture bisection bound computes ten iterations for [1,2] and 10^-3",
      "Stopping formulas",
      "10",
      String(required),
      required === 10,
      "This matches the professor's inequality 2^-N < 10^-3 for a unit-width bracket."
    );
  }

  {
    const epsilon = R.toleranceFromIterations(
      M.makeRational(1, 1n, 1n),
      M.makeRational(1, 2n, 1n),
      10
    );
    report.check(
      "Lecture bisection bound returns width / 2^n for ten iterations",
      "Stopping formulas",
      "0.0009765625",
      C.formatReal(epsilon, 10),
      C.formatReal(epsilon, 10) === "0.0009765625",
      "For [1,2], the guaranteed absolute bound after 10 iterations is 1 / 2^10."
    );
  }

  {
    const run = R.runBisection({
      expression: "x - 2",
      interval: { a: "2", b: "5" },
      machine: { k: 6, mode: "chop" },
      stopping: { kind: "iterations", value: 5 },
      decisionBasis: "machine",
      signDisplay: "machine",
      angleMode: "rad"
    });

    report.check("Endpoint root exits immediately", "Edge cases", "root-at-a", run.summary.intervalStatus, run.summary.intervalStatus === "root-at-a");
    report.check("Endpoint root has no iteration rows", "Edge cases", "0", String(run.rows.length), run.rows.length === 0);
  }

  {
    const run = R.runBisection({
      expression: "x^2 + 1",
      interval: { a: "0", b: "1" },
      machine: { k: 6, mode: "round" },
      stopping: { kind: "iterations", value: 3 },
      decisionBasis: "exact",
      signDisplay: "both",
      angleMode: "rad"
    });

    report.check("Invalid bracket is reported", "Edge cases", "invalid-bracket", run.summary.intervalStatus, run.summary.intervalStatus === "invalid-bracket");
    report.check("Invalid bracket has no approximation", "Edge cases", "null", String(run.summary.approximation), run.summary.approximation === null);
  }

  {
    const run = R.runBisection({
      expression: "((10000 + x) - 10000)",
      interval: { a: "-2", b: "2" },
      machine: { k: 1, mode: "chop" },
      stopping: { kind: "iterations", value: 1 },
      decisionBasis: "exact",
      signDisplay: "both",
      angleMode: "rad"
    });

    report.check("Initial sign disagreement is flagged", "Sign analysis", "true", String(run.initial.hasDisagreement), run.initial.hasDisagreement === true);
    report.check(
      "Endpoint sign disagreement names b",
      "Sign analysis",
      "Exact and machine signs differ at b.",
      run.initial.note,
      run.initial.note === "Exact and machine signs differ at b."
    );
    report.check(
      "Row sign disagreement names b",
      "Sign analysis",
      "Exact and machine signs differ at b.",
      run.rows[0].note,
      run.rows[0].note === "Exact and machine signs differ at b."
    );
  }

  {
    let run = null;
    let thrown = "";
    try {
      run = R.runFixedPoint({
        gExpression: "cos(x)",
        x0: "1",
        machine: { k: 12, mode: "round" },
        stopping: { kind: "iterations", value: 1 },
        angleMode: "rad"
      });
    } catch (err) {
      thrown = err.message;
    }

    const firstIterate = run && run.rows[0]
      ? C.formatReal(C.requireRealNumber(run.rows[0].gxn, "g(x0)"), 12)
      : thrown;
    report.check(
      "Fixed-point cos(x) example is supported",
      "New methods",
      "0.540302305868",
      firstIterate,
      firstIterate === "0.540302305868",
      "This verifies the visible Fixed Point placeholder uses a function the engine can evaluate."
    );
  }

  {
    const run = R.runNewtonRaphson({
      expression: "x^2 - 2",
      dfExpression: "2x",
      x0: "1",
      machine: { k: 12, mode: "round" },
      stopping: { kind: "iterations", value: 4 },
      angleMode: "rad"
    });
    const approx = C.formatReal(C.requireRealNumber(run.summary.approximation, "Newton approximation"), 12);
    report.check(
      "Newton-Raphson fourth iterate for sqrt(2)",
      "New methods",
      "1.41421356237",
      approx,
      approx === "1.41421356237",
      "Independent sequence: 1.5, 1.41666666667, 1.41421568627, 1.41421356237."
    );
  }

  {
    const run = captureRun(() => R.runNewtonRaphson({
      expression: "exp(x) - 1",
      dfExpression: "exp(x)",
      x0: "-50",
      machine: { k: 12, mode: "round" },
      stopping: { kind: "iterations", value: 12 },
      angleMode: "rad"
    }));

    report.check(
      "Newton tiny-derivative case returns a guarded stop",
      "Correctness guardrails",
      "derivative-zero without crashing",
      run.error ? run.error.message : run.run.summary.stopReason,
      !run.error && run.run.summary.stopReason === "derivative-zero",
      "A machine-zero derivative should stop the iteration before any Newton division is attempted."
    );
  }

  {
    const run = R.runSecant({
      expression: "x^2 - 2",
      x0: "1",
      x1: "2",
      machine: { k: 12, mode: "round" },
      stopping: { kind: "iterations", value: 4 },
      angleMode: "rad"
    });
    const approx = C.formatReal(C.requireRealNumber(run.summary.approximation, "Secant approximation"), 12);
    report.check(
      "Secant fourth iterate for sqrt(2)",
      "New methods",
      "1.41421143847",
      approx,
      approx === "1.41421143847",
      "Independent sequence: 1.33333333333, 1.4, 1.41463414634, 1.41421143847."
    );
  }

  {
    const run = R.runFalsePosition({
      expression: "x^2 - 2",
      interval: { a: "1", b: "2" },
      machine: { k: 12, mode: "round" },
      stopping: { kind: "iterations", value: 4 },
      decisionBasis: "exact",
      signDisplay: "both",
      angleMode: "rad"
    });
    const approx = C.formatReal(C.requireRealNumber(run.summary.approximation, "False position approximation"), 12);
    report.check(
      "False Position fourth iterate for sqrt(2)",
      "New methods",
      "1.41379310345",
      approx,
      approx === "1.41379310345",
      "Independent regula falsi sequence: 1.33333333333, 1.4, 1.41176470588, 1.41379310345."
    );
  }

  {
    const run = R.runFixedPoint({
      gExpression: "x + 1",
      x0: "0",
      machine: { k: 12, mode: "round" },
      stopping: { kind: "epsilon", value: "0.1" },
      angleMode: "rad"
    });

    report.check(
      "Open epsilon mode does not claim convergence after max iterations",
      "Stopping formulas",
      "iteration-cap",
      run.summary.stopReason,
      run.summary.stopReason === "iteration-cap",
      "The last error is 1, so epsilon = 0.1 was not reached."
    );
  }

  {
    const run = R.runFalsePosition({
      expression: "x^10 - 1",
      interval: { a: "0", b: "2" },
      machine: { k: 12, mode: "round" },
      stopping: { kind: "epsilon", value: "0.000001" },
      decisionBasis: "exact",
      signDisplay: "both",
      angleMode: "rad"
    });
    const last = run.rows[run.rows.length - 1];
    report.check(
      "False Position epsilon mode waits for actual iterate error",
      "Stopping formulas",
      "retained-endpoint-stagnation with final error above epsilon",
      run.summary.stopReason + " with final error " + C.formatReal(last.error, 8),
      run.summary.stopReason === "retained-endpoint-stagnation" && last.error > 0.000001,
      "False Position must not claim tolerance success just because the iteration limit was reached; it should stop via the stagnation guard when the iterate error is still above epsilon."
    );
  }

  {
    const run = R.runBisection({
      expression: "x - 1.4",
      interval: { a: "1.11", b: "1.99" },
      machine: { k: 2, mode: "chop" },
      stopping: { kind: "iterations", value: 2 },
      decisionBasis: "machine",
      signDisplay: "both",
      angleMode: "rad"
    });

    const firstA = C.formatReal(C.requireRealNumber(run.rows[0].a, "Bisection row a"), 8);
    const firstB = C.formatReal(C.requireRealNumber(run.rows[0].b, "Bisection row b"), 8);
    const firstWidth = C.formatReal(run.rows[0].width, 8);
    const firstBound = C.formatReal(run.rows[0].bound, 8);
    const secondBound = C.formatReal(run.rows[1].bound, 8);
    report.check(
      "Machine-decision bisection first row uses stored left endpoint",
      "Correctness contract",
      "1.1",
      firstA,
      firstA === "1.1",
      "Stored endpoints are 1.1 and 1.9, so the first row should expose the machine-stored interval."
    );
    report.check(
      "Machine-decision bisection first row uses stored right endpoint",
      "Correctness contract",
      "1.9",
      firstB,
      firstB === "1.9",
      "Stored endpoints are 1.1 and 1.9, so the first row should expose the machine-stored interval."
    );
    report.check(
      "Machine-decision bisection first row uses stored width",
      "Correctness contract",
      "0.8",
      firstWidth,
      firstWidth === "0.8",
      "The stored interval width is 0.8, which drives the expected bound checks."
    );
    report.check(
      "Machine-decision bisection first bound follows stored interval",
      "Correctness contract",
      "0.4",
      firstBound,
      firstBound === "0.4",
      "Stored endpoints are 1.1 and 1.9, so the initial machine interval width is 0.8."
    );
    report.check(
      "Machine-decision bisection second bound follows stored interval",
      "Correctness contract",
      "0.2",
      secondBound,
      secondBound === "0.2",
      "The second bisection guarantee should be 0.8 / 2^2."
    );
  }

  {
    const run = R.runFalsePosition({
      expression: "x^2 - 2",
      interval: { a: "1", b: "2" },
      machine: { k: 12, mode: "round" },
      stopping: { kind: "iterations", value: 1 },
      decisionBasis: "exact",
      signDisplay: "both",
      angleMode: "rad"
    });

    const c = run.rows[0].c;
    const rationalText = C.isRationalValue(c) ? `${c.sign < 0 ? "-" : ""}${c.num}/${c.den}` : "not-rational";
    const isFourThirds = C.isRationalValue(c) && c.sign === 1 && c.num * 3n === 4n * c.den;
    report.check(
      "False Position first interpolation point remains exact-compatible",
      "Correctness contract",
      "rational equal to 4/3",
      rationalText,
      isFourThirds,
      "For x^2 - 2 on [1, 2], c = 2 - 2(1)/(2 - (-1)) = 4/3."
    );
  }

  {
    const run = R.runNewtonRaphson({
      expression: "sin(x)",
      dfExpression: "cos(x)",
      x0: "1e-20",
      machine: { k: 12, mode: "round" },
      stopping: { kind: "iterations", value: 4 },
      angleMode: "rad"
    });

    report.check(
      "Newton accepts machine-zero only when the step is stable",
      "Correctness contract",
      "machine-zero with tiny final step",
      run.summary.stopReason + " with error " + C.formatReal(run.summary.error, 12),
      run.summary.stopReason === "machine-zero" && run.summary.error < C.EPS,
      "The residual is tiny and the Newton step is also tiny, so machine-zero is a safe numerical stop."
    );
  }

  {
    const run = R.runSecant({
      expression: "x^2 + 0.000000000000001",
      x0: "-1",
      x1: "0",
      machine: { k: 12, mode: "round" },
      stopping: { kind: "iterations", value: 4 },
      angleMode: "rad"
    });

    report.check(
      "Secant near-zero threshold does not claim exact zero",
      "Correctness contract",
      "machine-zero",
      run.summary.stopReason,
      run.summary.stopReason === "machine-zero",
      "The current positive reference residual is tiny and nonzero."
    );
  }

  {
    const run = R.runFixedPoint({
      gExpression: "x + 1",
      x0: "0",
      machine: { k: 12, mode: "round" },
      stopping: { kind: "epsilon", value: "0.1" },
      angleMode: "rad"
    });

    report.check(
      "Fixed Point epsilon mode reports safety cap exhaustion",
      "Correctness contract",
      "iteration-cap",
      run.summary.stopReason,
      run.summary.stopReason === "iteration-cap",
      "The last step remains 1, so epsilon = 0.1 is never reached before the cap."
    );
    report.check(
      "Fixed Point exposes epsilon-mode max iterations",
      "Correctness contract",
      "100",
      String(run.stopping.maxIterations),
      run.stopping.maxIterations === 100
    );
    report.check(
      "Fixed Point marks cap as reached",
      "Correctness contract",
      "true",
      String(run.stopping.capReached),
      run.stopping.capReached === true
    );
  }

  {
    const run = R.runNewtonRaphson({
      expression: "(x - 1)^20",
      dfExpression: "20*(x - 1)^19",
      x0: "1.5",
      machine: { k: 12, mode: "round" },
      stopping: { kind: "epsilon", value: "1e-6" },
      angleMode: "rad"
    });
    const approx = C.requireRealNumber(run.summary.approximation, "Newton flat-valley approximation");

    report.check(
      "Newton rejects flat-valley machine-zero false success",
      "Correctness guardrails",
      "iteration-cap, not machine-zero",
      run.summary.stopReason + " at " + C.formatReal(approx, 12),
      run.summary.stopReason === "iteration-cap" && Math.abs(approx - 1) > 0.001,
      "The residual can become tiny while the Newton step is still too large to verify the root."
    );
  }

  {
    const run = R.runNewtonRaphson({
      expression: "(x - 1)^2",
      dfExpression: "2*(x - 1)",
      x0: "1",
      machine: { k: 12, mode: "round" },
      stopping: { kind: "epsilon", value: "1e-6" },
      angleMode: "rad"
    });

    report.check(
      "Newton exact root wins before zero derivative",
      "Correctness guardrails",
      "exact-zero in 1 row",
      run.summary.stopReason + " in " + run.rows.length + " row(s)",
      run.summary.stopReason === "exact-zero" && run.rows.length === 1,
      "If f(x0) is exactly zero, Newton should not report derivative-zero first."
    );
  }

  {
    const run = R.runFixedPoint({
      gExpression: "x",
      x0: "7",
      machine: { k: 12, mode: "round" },
      stopping: { kind: "epsilon", value: "1e-7" },
      angleMode: "rad"
    });

    report.check(
      "Fixed Point exact fixed value stops as exact-zero",
      "Correctness guardrails",
      "exact-zero in 1 row",
      run.summary.stopReason + " in " + run.rows.length + " row(s)",
      run.summary.stopReason === "exact-zero" && run.rows.length === 1,
      "g(x) = x is an exact fixed-point hit, not merely a tolerance accident."
    );
  }

  {
    const run = R.runFixedPoint({
      gExpression: "x + 1e-8",
      x0: "0",
      machine: { k: 12, mode: "round" },
      stopping: { kind: "epsilon", value: "1e-7" },
      angleMode: "rad"
    });
    const firstError = run.rows[0] ? run.rows[0].error : null;
    const acceptedFirstTinyStep = run.summary.stopReason === "tolerance-reached"
      && run.rows.length === 1
      && typeof firstError === "number"
      && firstError > 0
      && firstError < 1e-7;

    report.check(
      "Fixed Point rejects constant tiny-step pseudo-convergence",
      "Correctness guardrails",
      "not first-step tolerance-reached on a tiny nonzero step",
      run.summary.stopReason + " after " + run.rows.length + " row(s)",
      !acceptedFirstTinyStep,
      "A constant nonzero step below epsilon is drift, not convergence."
    );
  }

  {
    const run = R.runNewtonRaphson({
      expression: "x^2 - 2",
      dfExpression: "2x",
      x0: "1",
      machine: { k: 12, mode: "round" },
      stopping: { kind: "iterations", value: 4 },
      angleMode: "rad"
    });

    report.check(
      "Newton summary exposes machine residual",
      "Correctness contract",
      "machine",
      run.summary.residualBasis,
      run.summary.residualBasis === "machine"
    );
    report.check(
      "Newton summary exposes final step error",
      "Correctness contract",
      "positive number",
      String(run.summary.error),
      typeof run.summary.error === "number" && run.summary.error > 0
    );
  }

  {
    const run = R.runBisection({
      expression: "x^3 + 4*x^2 - 10",
      interval: { a: "1", b: "2" },
      machine: { k: 12, mode: "round" },
      stopping: { kind: "epsilon", value: "0.0001", toleranceType: "relative" },
      decisionBasis: "exact",
      signDisplay: "both",
      angleMode: "rad"
    });

    report.check(
      "Lecture-style relative tolerance uses 13 bisection rows",
      "Bisection stress",
      "13",
      String(run.rows.length),
      run.rows.length === 13,
      "The professor example stops after 13 iterations under the relative bound."
    );
    report.check(
      "Relative tolerance metadata is exposed for reporting",
      "Bisection stress",
      "relative",
      run.stopping.toleranceType,
      run.stopping.toleranceType === "relative"
    );
  }

  {
    const run = R.runBisection({
      expression: "x^3 + 4*x^2 - 10",
      interval: { a: "1", b: "2" },
      machine: { k: 12, mode: "round" },
      stopping: { kind: "epsilon", value: "0.0001", toleranceType: "absolute" },
      decisionBasis: "exact",
      signDisplay: "both",
      angleMode: "rad"
    });

    report.check(
      "Absolute tolerance keeps the 14-iteration interpretation",
      "Bisection stress",
      "14",
      String(run.rows.length),
      run.rows.length === 14
    );
    report.check(
      "Bisection stopping metadata reports tolerance type",
      "Bisection stress",
      "absolute",
      run.stopping.toleranceType,
      run.stopping.toleranceType === "absolute"
    );
  }

  const stressCases = [
    {
      name: "Tiny constant is not endpoint root",
      run: () => R.runBisection({ expression: "x^3 - 10^(-18)", interval: { a: "0", b: "10^(-4)" }, machine: { k: 16, mode: "round" }, stopping: { kind: "epsilon", value: "10^(-8)", toleranceType: "absolute" }, decisionBasis: "exact", signDisplay: "both", angleMode: "rad" }),
      check: (result) => {
        const summary = result && result.run && result.run.summary ? result.run.summary : null;
        return Boolean(summary) && summary.intervalStatus !== "root-at-a";
      },
      expected: "not root-at-a",
      actual: (result) => {
        const summary = result && result.run && result.run.summary ? result.run.summary : null;
        if (!summary) {
          return "missing summary";
        }
        return summary.intervalStatus;
      }
    },
    {
      name: "Tiny exponential target converges near true root",
      run: () => R.runBisection({ expression: "e^(-1000x) - 10^(-12)", interval: { a: "0", b: "0.1" }, machine: { k: 16, mode: "round" }, stopping: { kind: "epsilon", value: "10^(-6)", toleranceType: "absolute" }, decisionBasis: "machine", signDisplay: "both", angleMode: "rad" }),
      check: (result) => {
        const summary = result && result.run && result.run.summary ? result.run.summary : null;
        if (!summary) {
          return false;
        }
        const approx = realOrMessage(C, summary.approximation, "Approximation");
        return typeof approx === "number" && Math.abs(approx - 0.02763102111592855) <= 0.000001;
      },
      expected: "0.02763102111592855 +/- 0.000001",
      actual: (result) => {
        const summary = result && result.run && result.run.summary ? result.run.summary : null;
        if (!summary) {
          return "missing summary";
        }
        return String(realOrMessage(C, summary.approximation, "Approximation"));
      }
    },
    {
      name: "Epsilon metadata separates actual and planned iterations",
      run: () => R.runBisection({ expression: "x^3 - 8", interval: { a: "0", b: "4" }, machine: { k: 12, mode: "round" }, stopping: { kind: "epsilon", value: "0.001", toleranceType: "absolute" }, decisionBasis: "exact", signDisplay: "both", angleMode: "rad" }),
      check: (result) => {
        const stopping = result && result.run && result.run.stopping ? result.run.stopping : null;
        return Boolean(stopping) && stopping.actualIterations === 1 && stopping.plannedIterations === 12;
      },
      expected: "actual 1, planned 12",
      actual: (result) => {
        const stopping = result && result.run && result.run.stopping ? result.run.stopping : null;
        if (!stopping) {
          return "missing stopping metadata";
        }
        return "actual " + stopping.actualIterations + ", planned " + stopping.plannedIterations;
      }
    },
    {
      name: "Positive subnormal epsilon is not rejected as zero",
      run: () => R.runBisection({ expression: "x", interval: { a: "-10^(-300)", b: "10^(-300)" }, machine: { k: 16, mode: "round" }, stopping: { kind: "epsilon", value: "10^(-320)", toleranceType: "absolute" }, decisionBasis: "exact", signDisplay: "both", angleMode: "rad" }),
      check: (result) => {
        const summary = result && result.run && result.run.summary ? result.run.summary : null;
        return Boolean(summary) && summary.intervalStatus === "root-at-midpoint";
      },
      expected: "root-at-midpoint",
      actual: (result) => {
        const summary = result && result.run && result.run.summary ? result.run.summary : null;
        if (!summary) {
          return "missing summary";
        }
        return summary.intervalStatus;
      }
    },
    {
      name: "Relative epsilon still reports an exact midpoint root",
      run: () => R.runBisection({ expression: "x", interval: { a: "-1", b: "1" }, machine: { k: 12, mode: "round" }, stopping: { kind: "epsilon", value: "0.1", toleranceType: "relative" }, decisionBasis: "exact", signDisplay: "both", angleMode: "rad" }),
      check: (result) => {
        const summary = result && result.run && result.run.summary ? result.run.summary : null;
        return Boolean(summary) && summary.intervalStatus === "root-at-midpoint";
      },
      expected: "root-at-midpoint",
      actual: (result) => {
        const summary = result && result.run && result.run.summary ? result.run.summary : null;
        if (!summary) {
          return "missing summary";
        }
        return summary.intervalStatus;
      }
    },
    {
      name: "Singular midpoint returns continuity result",
      run: () => R.runBisection({ expression: "1/x", interval: { a: "-1", b: "1" }, machine: { k: 12, mode: "round" }, stopping: { kind: "iterations", value: "4" }, decisionBasis: "exact", signDisplay: "both", angleMode: "rad" }),
      check: (result) => {
        const summary = result && result.run && result.run.summary ? result.run.summary : null;
        return Boolean(summary) && summary.intervalStatus === "invalid-continuity" && summary.stopReason === "discontinuity-detected";
      },
      expected: "invalid-continuity / discontinuity-detected",
      actual: (result) => {
        const summary = result && result.run && result.run.summary ? result.run.summary : null;
        if (!summary) {
          return "missing summary";
        }
        return summary.intervalStatus + " / " + summary.stopReason;
      }
    }
  ];

  for (const test of stressCases) {
    const result = captureRun(test.run);
    report.check(test.name, "Bisection stress", test.expected, test.actual(result), test.check(result));
  }

  report.finish();
}

run();
