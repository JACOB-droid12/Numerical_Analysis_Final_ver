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
  const { C, E, R } = loadEngines();
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
      stopping: { kind: "epsilon", value: "0.125" },
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
      "iteration-cap with final error above epsilon",
      run.summary.stopReason + " with final error " + C.formatReal(last.error, 8),
      run.summary.stopReason === "iteration-cap" && last.error > 0.000001,
      "The bisection interval-halving count is not a valid False Position convergence guarantee."
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
      expression: "x^2 + 0.000000000000001",
      dfExpression: "2x",
      x0: "0.00000001",
      machine: { k: 12, mode: "round" },
      stopping: { kind: "iterations", value: 4 },
      angleMode: "rad"
    });

    report.check(
      "Newton near-zero threshold does not claim exact zero",
      "Correctness contract",
      "machine-zero",
      run.summary.stopReason,
      run.summary.stopReason === "machine-zero",
      "The current positive reference residual is tiny and nonzero, so the stop is a numerical threshold rather than an exact root."
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

  const stressCases = [
    {
      name: "Tiny constant is not endpoint root",
      run: () => R.runBisection({ expression: "x^3 - 10^(-18)", interval: { a: "0", b: "10^(-4)" }, machine: { k: 16, mode: "round" }, stopping: { kind: "epsilon", value: "10^(-8)" }, decisionBasis: "exact", signDisplay: "both", angleMode: "rad" }),
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
      run: () => R.runBisection({ expression: "e^(-1000x) - 10^(-12)", interval: { a: "0", b: "0.1" }, machine: { k: 16, mode: "round" }, stopping: { kind: "epsilon", value: "10^(-6)" }, decisionBasis: "machine", signDisplay: "both", angleMode: "rad" }),
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
      run: () => R.runBisection({ expression: "x^3 - 8", interval: { a: "0", b: "4" }, machine: { k: 12, mode: "round" }, stopping: { kind: "epsilon", value: "0.001" }, decisionBasis: "exact", signDisplay: "both", angleMode: "rad" }),
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
      run: () => R.runBisection({ expression: "x", interval: { a: "-10^(-300)", b: "10^(-300)" }, machine: { k: 16, mode: "round" }, stopping: { kind: "epsilon", value: "10^(-320)" }, decisionBasis: "exact", signDisplay: "both", angleMode: "rad" }),
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
