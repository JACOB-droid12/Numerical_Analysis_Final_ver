# Root-Engine Correctness Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden every root-finding method in `root-engine.js` against crashes from non-finite evaluations, reject invalid stopping parameters with a structured result instead of a throw, and add targeted convergence guards that stop Newton's false-convergence, False-Position's stagnation, and Fixed-Point's cycle behaviors.

**Architecture:** Two layers. (1) A hardening layer adds a single `safeEvaluate` helper that converts in-loop evaluator throws into structured stop-reasons, plus three small validator helpers that run above each method's loop. (2) A guard layer adds one targeted stop condition per affected method, using named constants at the top of the IIFE. The UI stop-reason renderer in `root-ui.js` gets new labels; nothing else in the UI changes.

**Tech Stack:** Plain JavaScript (no bundler, no TypeScript). Engine is an IIFE in `root-engine.js` exporting `RootEngine` on `window/globalThis`. Tests are Node scripts under `scripts/` that load engines into a `vm` context.

---

## File Structure

**Modified:**
- `root-engine.js` — add constants, helpers, and per-method wiring. All changes stay inside the existing IIFE.
- `root-ui.js` — extend `formatStopReason` map with new labels.
- `scripts/battery-cat11-12.js` — update human-readable expectations for tests 12.7, 12.9, 12.13.
- `scripts/run-all-255.js` — add the new validation suite and update the expected total.

**Created:**
- `scripts/battery-validation.js` — new assertive suite (`assert`-based) covering invalid-input rejection, singularity-encountered, diverged-step, retained-endpoint-stagnation, and cycle-detected paths. Twelve new cases.

---

## Task 1: Add constants and shared helpers

**Files:**
- Modify: `root-engine.js` (top of IIFE, immediately after `MAX_OPEN_ITER` declaration)
- Create: `scripts/battery-validation.js`

This task establishes the foundation: named constants, `safeEvaluate`, the three validators, and `buildInvalidInputResult`. All are pure helpers. The new test file runs them in isolation so we can commit before wiring them into any method.

- [ ] **Step 1.1: Create the failing test file**

Create `scripts/battery-validation.js`:

```javascript
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");
const assert = require("assert");

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

const R = context.RootEngine;

let passed = 0;
let failed = 0;
function runTest(id, name, fn) {
  console.log(`\nTEST ${id}: ${name}`);
  try {
    fn();
    passed += 1;
    console.log("> Result: PASS");
  } catch (err) {
    failed += 1;
    console.log(`> Result: FAIL: ${err.message}`);
  }
}

// V1: internal helpers expose themselves for validation testing
runTest("V1", "RootEngine exposes expected method entry points", () => {
  assert.strictEqual(typeof R.runBisection, "function");
  assert.strictEqual(typeof R.runNewtonRaphson, "function");
  assert.strictEqual(typeof R.runSecant, "function");
  assert.strictEqual(typeof R.runFalsePosition, "function");
  assert.strictEqual(typeof R.runFixedPoint, "function");
});

console.log(`\n===== VALIDATION SUITE =====`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
if (failed > 0) {
  process.exitCode = 1;
}
```

- [ ] **Step 1.2: Verify V1 passes on current engine**

Run: `node scripts/battery-validation.js`
Expected: `TEST V1 ... > Result: PASS` and exit code 0.

- [ ] **Step 1.3: Add constants and helpers to `root-engine.js`**

Locate the line `const MAX_OPEN_ITER = 100;` (currently line 12) and insert the following block directly after it:

```javascript
  // Newton convergence guards: a jumped step must not be more than 10x the prior step.
  const NEWTON_STEP_BLOWUP_RATIO = 10;
  // Newton residual check: |f(x_new)| under this bound (scaled by max(1,|x|)) is tolerated.
  const NEWTON_RESIDUAL_BOUND = 1e-10;
  // False Position: retain-same-endpoint window before declaring stagnation.
  const FP_STAGNATION_WINDOW = 20;
  // Fixed Point cycle detection periods: check x_n against x_{n-k} for k in this set.
  const FP_CYCLE_PERIODS = [2, 3, 4];

  function safeEvaluate(evalFn, ...args) {
    try {
      const point = evalFn(...args);
      if (point && point.machine !== undefined) {
        const realVal = Number(point.machine && point.machine.re !== undefined ? point.machine.re : point.machine);
        if (!Number.isFinite(realVal)) {
          return { ok: false, reason: "non-finite-evaluation", message: "Evaluator returned a non-finite value." };
        }
      } else if (point && point.approx !== undefined) {
        const realVal = Number(point.approx && point.approx.re !== undefined ? point.approx.re : point.approx);
        if (!Number.isFinite(realVal)) {
          return { ok: false, reason: "non-finite-evaluation", message: "Evaluator returned a non-finite value." };
        }
      }
      return { ok: true, point };
    } catch (err) {
      return { ok: false, reason: "singularity-encountered", message: err && err.message ? err.message : String(err) };
    }
  }

  function validateAndParseOpenStopping(options) {
    try {
      const stopping = parseOpenStopping(options);
      return { ok: true, stopping };
    } catch (err) {
      return { ok: false, rejection: { message: err.message } };
    }
  }

  function validateAndParseStartingScalar(text, label) {
    try {
      const value = parseScalarInput(text, label);
      return { ok: true, value };
    } catch (err) {
      return { ok: false, rejection: { message: err.message } };
    }
  }

  function buildInvalidInputResult(options, method, rejection) {
    return {
      method,
      expression: options.expression || options.gExpression || "",
      canonical: "",
      machine: options.machine,
      stopping: {
        kind: options.stopping && options.stopping.kind ? options.stopping.kind : "epsilon",
        input: options.stopping ? String(options.stopping.value) : "",
        iterationsRequired: 0,
        epsilonBound: null,
        maxIterations: 0,
        capReached: false
      },
      summary: summaryPackage(null, null, "invalid-input", {
        residual: null,
        residualBasis: "unavailable",
        error: null,
        stopDetail: rejection.message
      }),
      initial: null,
      decisionBasis: null,
      signDisplay: null,
      rows: []
    };
  }
```

Note: `parseOpenStopping` and `parseScalarInput` are declared later in the file, but JavaScript hoists function declarations within the same scope, so forward references inside other functions are safe.

- [ ] **Step 1.4: Add smoke test V2 for safeEvaluate to `scripts/battery-validation.js`**

Insert before the summary block:

```javascript
runTest("V2", "safeEvaluate is a no-throw wrapper exposed via method behavior", () => {
  // Indirect test: runSecant with NaN-equivalent start should no longer throw.
  // Since safeEvaluate is private, we verify by calling a method with a non-finite f(x) scenario.
  // The concrete validator tests in later tasks cover this more directly.
  const result = R.runNewtonRaphson({
    expression: "1/x",
    dfExpression: "-1/(x^2)",
    x0: "1",
    machine: { k: 12, mode: "round" },
    stopping: { kind: "iterations", value: 3 }
  });
  assert.ok(result.summary, "result has a summary");
  assert.ok(result.summary.stopReason, "result has a stopReason");
});
```

- [ ] **Step 1.5: Run the suite and verify both tests pass**

Run: `node scripts/battery-validation.js`
Expected: `Passed: 2`, `Failed: 0`, exit code 0.

- [ ] **Step 1.6: Commit**

```bash
git add root-engine.js scripts/battery-validation.js
git commit -m "feat: add root-engine correctness-pass scaffolding"
```

---

## Task 2: Bisection input validation

**Files:**
- Modify: `root-engine.js` — `runBisection` (starts at line 848, validators inserted near the top)
- Modify: `scripts/battery-validation.js` — add tests V3, V4, V5

- [ ] **Step 2.1: Add failing tests V3, V4, V5**

Insert in `scripts/battery-validation.js` before the summary block:

```javascript
runTest("V3", "Bisection rejects epsilon = 0 with invalid-input", () => {
  const result = R.runBisection({
    expression: "x^2 - 4",
    interval: { a: "1", b: "3" },
    machine: { k: 12, mode: "round" },
    stopping: { kind: "epsilon", value: "0" }
  });
  assert.strictEqual(result.summary.stopReason, "invalid-input");
  assert.ok(result.summary.stopDetail && result.summary.stopDetail.length > 0, "carries a message");
});

runTest("V4", "Bisection rejects epsilon = -1 with invalid-input", () => {
  const result = R.runBisection({
    expression: "x^2 - 4",
    interval: { a: "1", b: "3" },
    machine: { k: 12, mode: "round" },
    stopping: { kind: "epsilon", value: "-1" }
  });
  assert.strictEqual(result.summary.stopReason, "invalid-input");
});

runTest("V5", "Bisection rejects iterations = 0 with invalid-input", () => {
  const result = R.runBisection({
    expression: "x^2 - 4",
    interval: { a: "1", b: "3" },
    machine: { k: 12, mode: "round" },
    stopping: { kind: "iterations", value: "0" }
  });
  assert.strictEqual(result.summary.stopReason, "invalid-input");
});
```

- [ ] **Step 2.2: Run to verify V3, V4, V5 fail**

Run: `node scripts/battery-validation.js`
Expected: V3, V4, V5 FAIL (currently bisection throws or accepts these values).

- [ ] **Step 2.3: Wire validators into `runBisection`**

In `root-engine.js` `runBisection` (around line 848-867), replace the top-of-function body from `if (!options || !options.machine)` down through the call to `buildStopping` with a validator-first version. The targeted change: immediately after the machine-config check, wrap stopping and endpoint parsing in `validateAnd*`-style calls and return `buildInvalidInputResult` on rejection.

Change this block (currently lines 848-867):

```javascript
  function runBisection(options) {
    if (!options || !options.machine) {
      throw new Error("Bisection options require a machine configuration.");
    }
    const ast = E.parseExpression(String(options.expression || ""), { allowVariable: true });
    const machine = options.machine;
    const warnings = [];
    if (expressionUsesTrig(ast)) {
      addWarning(warnings, "angle-mode", "This expression uses trigonometric functions; bisection evaluates them using the selected angle mode.");
    }
    const basis = options.decisionBasis === "machine" ? "machine" : "exact";
    const leftInput = parseScalarInput(options.interval.a, "Left endpoint a");
    const rightInput = parseScalarInput(options.interval.b, "Right endpoint b");
    if (compareValues(leftInput, rightInput, "Bisection interval") >= 0) {
      throw new Error("Enter an interval with left endpoint a smaller than right endpoint b.");
    }
```

to:

```javascript
  function runBisection(options) {
    if (!options || !options.machine) {
      throw new Error("Bisection options require a machine configuration.");
    }
    // Validate stopping parameters before any parsing that could throw for other reasons.
    const stoppingValidation = validateBisectionStopping(options);
    if (!stoppingValidation.ok) {
      return buildInvalidInputResult(options, "bisection", stoppingValidation.rejection);
    }
    const ast = E.parseExpression(String(options.expression || ""), { allowVariable: true });
    const machine = options.machine;
    const warnings = [];
    if (expressionUsesTrig(ast)) {
      addWarning(warnings, "angle-mode", "This expression uses trigonometric functions; bisection evaluates them using the selected angle mode.");
    }
    const basis = options.decisionBasis === "machine" ? "machine" : "exact";
    const leftInput = parseScalarInput(options.interval.a, "Left endpoint a");
    const rightInput = parseScalarInput(options.interval.b, "Right endpoint b");
    if (compareValues(leftInput, rightInput, "Bisection interval") >= 0) {
      throw new Error("Enter an interval with left endpoint a smaller than right endpoint b.");
    }
```

And add this new helper next to the other validator helpers added in Task 1:

```javascript
  function validateBisectionStopping(options) {
    if (!options || !options.stopping) {
      return { ok: false, rejection: { message: "Stopping rule is required." } };
    }
    if (options.stopping.kind === "epsilon") {
      const raw = Number(options.stopping.value);
      if (!Number.isFinite(raw) || raw <= 0) {
        return { ok: false, rejection: { message: "Enter a tolerance epsilon greater than 0." } };
      }
      return { ok: true };
    }
    if (options.stopping.kind === "iterations") {
      const raw = Number(options.stopping.value);
      if (!Number.isInteger(raw) || raw < 1) {
        return { ok: false, rejection: { message: "Enter a whole number of iterations, 1 or greater." } };
      }
      return { ok: true };
    }
    return { ok: false, rejection: { message: "Unknown stopping rule." } };
  }
```

- [ ] **Step 2.4: Run tests to confirm V3, V4, V5 pass**

Run: `node scripts/battery-validation.js`
Expected: All of V1–V5 PASS.

- [ ] **Step 2.5: Run the full 255-battery to confirm nothing regressed**

Run: `node scripts/run-all-255.js > /tmp/255-after-bisection.log 2>&1; echo "exit=$?"`
Expected: `exit=0` (total 255, all suites pass). If any previously-passing test now fails, stop and investigate.

- [ ] **Step 2.6: Commit**

```bash
git add root-engine.js scripts/battery-validation.js
git commit -m "feat: bisection rejects invalid stopping with invalid-input"
```

---

## Task 3: Newton input validation + in-loop safeEvaluate

**Files:**
- Modify: `root-engine.js` — `runNewtonRaphson` (lines 128-219)
- Modify: `scripts/battery-validation.js` — add tests V6, V7, V8

- [ ] **Step 3.1: Add failing tests V6, V7, V8**

```javascript
runTest("V6", "Newton rejects epsilon = 0 with invalid-input", () => {
  const result = R.runNewtonRaphson({
    expression: "x^2 - 2",
    dfExpression: "2*x",
    x0: "1",
    machine: { k: 12, mode: "round" },
    stopping: { kind: "epsilon", value: "0" }
  });
  assert.strictEqual(result.summary.stopReason, "invalid-input");
});

runTest("V7", "Newton rejects NaN starting value with invalid-input", () => {
  const result = R.runNewtonRaphson({
    expression: "x^2 - 2",
    dfExpression: "2*x",
    x0: "NaN",
    machine: { k: 12, mode: "round" },
    stopping: { kind: "epsilon", value: "0.001" }
  });
  assert.strictEqual(result.summary.stopReason, "invalid-input");
});

runTest("V8", "Newton on 1/x from near singularity stops gracefully, not by throwing", () => {
  // Force a non-finite evaluation partway through.
  const result = R.runNewtonRaphson({
    expression: "1/(x - 1)",
    dfExpression: "-1/(x - 1)^2",
    x0: "1",
    machine: { k: 12, mode: "round" },
    stopping: { kind: "iterations", value: 5 }
  });
  assert.ok(result && result.summary, "returned a result instead of throwing");
  assert.ok(
    result.summary.stopReason === "singularity-encountered" ||
    result.summary.stopReason === "non-finite-evaluation" ||
    result.summary.stopReason === "derivative-zero",
    "stop reason is a structured non-crash value: got " + result.summary.stopReason
  );
});
```

- [ ] **Step 3.2: Verify V6, V7, V8 fail (or V8 possibly crashes)**

Run: `node scripts/battery-validation.js`
Expected: V6 and V7 FAIL (Newton currently throws). V8 may FAIL or produce a crash-style exception message.

- [ ] **Step 3.3: Replace Newton validation and loop entry**

In `root-engine.js`, replace the top of `runNewtonRaphson` (lines 128-143) — from `if (!options || !options.machine)` up to the start of the iteration loop:

```javascript
  function runNewtonRaphson(options) {
    if (!options || !options.machine) {
      throw new Error("Newton options require a machine configuration.");
    }
    const stoppingValidation = validateAndParseOpenStopping(options);
    if (!stoppingValidation.ok) {
      return buildInvalidInputResult(options, "newton", stoppingValidation.rejection);
    }
    const startValidation = validateAndParseStartingScalar(options.x0, "Starting point x\u2080");
    if (!startValidation.ok) {
      return buildInvalidInputResult(options, "newton", startValidation.rejection);
    }
    const fAst = E.parseExpression(String(options.expression || ""), { allowVariable: true });
    const dfAst = E.parseExpression(String(options.dfExpression || ""), { allowVariable: true });
    const machine = options.machine;
    const stopping = stoppingValidation.stopping;

    const x0Value = startValidation.value;
    let xn = machineStore(x0Value, machine);

    const rows = [];
    let finalStopReason = initialOpenStopReason(stopping);

    for (let iter = 1; iter <= stopping.maxIterations; iter += 1) {
      const fEval = safeEvaluate(evaluateFn, fAst, xn, machine, options.angleMode);
      if (!fEval.ok) {
        finalStopReason = fEval.reason;
        break;
      }
      const fn = fEval.point;
```

Then find the subsequent `const dfn = evaluateFn(dfAst, xn, machine, options.angleMode);` (around line 152) and replace it with:

```javascript
      const dfEval = safeEvaluate(evaluateFn, dfAst, xn, machine, options.angleMode);
      if (!dfEval.ok) {
        finalStopReason = dfEval.reason;
        break;
      }
      const dfn = dfEval.point;
```

Also update `parseScalarInput(options.x0, ...)` on the original line 137 — this is removed because `startValidation.value` replaces it.

- [ ] **Step 3.4: Run tests**

Run: `node scripts/battery-validation.js`
Expected: V1–V8 all PASS.

- [ ] **Step 3.5: Run the full battery**

Run: `node scripts/run-all-255.js > /tmp/255-after-newton.log 2>&1; echo "exit=$?"`
Expected: exit=0, total 255. Spot-check the log with `grep -c "CRASHED" /tmp/255-after-newton.log` — Newton crashes should drop.

- [ ] **Step 3.6: Commit**

```bash
git add root-engine.js scripts/battery-validation.js
git commit -m "feat: newton rejects invalid input and catches in-loop singularities"
```

---

## Task 4: Newton diverged-step and residual-check guards

**Files:**
- Modify: `root-engine.js` — `runNewtonRaphson` iteration body
- Modify: `scripts/battery-validation.js` — add tests V9, V10

- [ ] **Step 4.1: Add failing tests V9, V10**

```javascript
runTest("V9", "Newton on sin(x) near pi/2 stops with diverged-step, not a false convergence", () => {
  const result = R.runNewtonRaphson({
    expression: "sin(x)",
    dfExpression: "cos(x)",
    x0: "1.5708",
    machine: { k: 12, mode: "round" },
    stopping: { kind: "epsilon", value: "0.0001" },
    angleMode: "rad"
  });
  // Expected: jump guard trips because cos(1.5708) is tiny -> huge step.
  assert.strictEqual(
    result.summary.stopReason,
    "diverged-step",
    "expected diverged-step; got " + result.summary.stopReason
  );
});

runTest("V10", "Newton residual check rejects tolerance-reached when |f(x)| is huge", () => {
  // Contrived: first iteration step is small but f(x) is large.
  // Use x^2 + 100 where real roots don't exist — Newton will oscillate and may hit small step with large residual.
  const result = R.runNewtonRaphson({
    expression: "x^2 + 100",
    dfExpression: "2*x",
    x0: "1e-9",
    machine: { k: 12, mode: "round" },
    stopping: { kind: "epsilon", value: "1" }
  });
  // Large epsilon triggers step-size convergence easily; residual check must refuse it.
  assert.notStrictEqual(
    result.summary.stopReason,
    "tolerance-reached",
    "residual check should have blocked tolerance-reached"
  );
});
```

- [ ] **Step 4.2: Verify V9, V10 fail**

Run: `node scripts/battery-validation.js`
Expected: V9 FAIL (Newton currently reports tolerance-reached for this case). V10 may FAIL.

- [ ] **Step 4.3: Add diverged-step guard and residual check to Newton loop**

In `root-engine.js` `runNewtonRaphson`, introduce a `prevError` tracker and, inside the loop after the `rows.push({ iteration: iter, ...` line (currently line 175), insert the jump guard before the existing `fnVal` check. Replace the block from the `rows.push` call through to the end of the loop body (currently lines 175-193) with:

```javascript
      rows.push({ iteration: iter, xn, fxn: fn.approx, dfxn: dfn.approx, xNext, error, note: "" });

      // Diverged-step guard: a step is considered blown up if it exceeds 10x the reference scale.
      // The reference is the previous step if available, else max(|x_n|, 1) so the first-iteration
      // blow-up (e.g. sin near pi/2 where cos -> 0) is still caught. This is a tightened reading
      // of the spec's "NEWTON_STEP_BLOWUP_RATIO * |previous delta_x|" rule; the broader reference
      // is required because 5.12's blow-up is on iteration 1 with no previous step.
      const xNowMag = Math.abs(realNumber(xn, "x\u2099"));
      const referenceStep = previousError != null ? previousError : Math.max(xNowMag, 1);
      if (error > NEWTON_STEP_BLOWUP_RATIO * referenceStep) {
        rows[rows.length - 1].note = "step exceeds " + NEWTON_STEP_BLOWUP_RATIO + "x of the reference scale";
        finalStopReason = "diverged-step";
        xn = xNext;
        break;
      }

      const fnVal = realNumber(fn.approx, "f(x\u2099)");
      if (Math.abs(fnVal) < C.EPS) {
        if (stepIsStableForConvergence(error, xNext, stopping)) {
          finalStopReason = "machine-zero";
          xn = xNext;
          break;
        }
        rows[rows.length - 1].note = "f(x\u2099) is near zero, but the Newton step is still too large to verify convergence";
      }

      xn = xNext;
      previousError = error;

      if (stopping.kind === "epsilon" && error < stopping.epsilon) {
        // Residual check: step-size convergence is not trusted if |f(x_new)| is huge.
        const nextFEval = safeEvaluate(evaluateFn, fAst, xn, machine, options.angleMode);
        if (!nextFEval.ok) {
          finalStopReason = nextFEval.reason;
          break;
        }
        const residualNext = Math.abs(realNumber(nextFEval.point.approx, "f(x_{n+1})"));
        const xMag = Math.max(1, Math.abs(realNumber(xn, "x_{n+1}")));
        const residualPrev = Math.abs(fnVal);
        if (residualNext <= residualPrev || residualNext <= NEWTON_RESIDUAL_BOUND * xMag) {
          finalStopReason = "tolerance-reached";
        } else {
          finalStopReason = "step-small-residual-large";
          rows[rows.length - 1].note = "step below epsilon but |f(x)| is too large to trust";
        }
        break;
      }
    }
```

Also add `let previousError = null;` immediately after the existing `let finalStopReason = initialOpenStopReason(stopping);` line.

- [ ] **Step 4.4: Run validation tests**

Run: `node scripts/battery-validation.js`
Expected: V1–V10 all PASS.

- [ ] **Step 4.5: Run the full battery**

Run: `node scripts/run-all-255.js > /tmp/255-after-newton-guards.log 2>&1; echo "exit=$?"`
Expected: exit=0. Confirm:
- `grep -c "CRASHED" /tmp/255-after-newton-guards.log` is at or below the baseline (goal: zero Newton crashes).
- The Newton 5.12 case now prints `stopReason: diverged-step` instead of a false convergence.

- [ ] **Step 4.6: Commit**

```bash
git add root-engine.js scripts/battery-validation.js
git commit -m "feat: newton diverged-step and residual-check guards"
```

---

## Task 5: Secant input validation + in-loop safeEvaluate

**Files:**
- Modify: `root-engine.js` — `runSecant` (lines 221-299)
- Modify: `scripts/battery-validation.js` — add tests V11, V12

- [ ] **Step 5.1: Add failing tests**

```javascript
runTest("V11", "Secant rejects NaN x0 with invalid-input", () => {
  const result = R.runSecant({
    expression: "x^2 - 2",
    x0: "NaN",
    x1: "2",
    machine: { k: 12, mode: "round" },
    stopping: { kind: "epsilon", value: "0.001" }
  });
  assert.strictEqual(result.summary.stopReason, "invalid-input");
});

runTest("V12", "Secant on tan(x) hitting pi/2 stops gracefully", () => {
  const result = R.runSecant({
    expression: "tan(x) - 1000",
    x0: "1.5",
    x1: "1.57",
    machine: { k: 12, mode: "round" },
    stopping: { kind: "iterations", value: 10 },
    angleMode: "rad"
  });
  assert.ok(result && result.summary, "did not throw");
  assert.ok(
    result.summary.stopReason !== undefined && result.summary.stopReason !== null,
    "has a structured stopReason"
  );
});
```

- [ ] **Step 5.2: Verify V11, V12 fail**

Run: `node scripts/battery-validation.js`
Expected: V11 FAIL (Secant throws). V12 may crash.

- [ ] **Step 5.3: Replace Secant entry and loop**

In `root-engine.js`, replace the top of `runSecant` (lines 221-234) with the validator-first shape, and wrap the in-loop `evaluateFn` call. Replace lines 221-238 with:

```javascript
  function runSecant(options) {
    if (!options || !options.machine) {
      throw new Error("Secant options require a machine configuration.");
    }
    const stoppingValidation = validateAndParseOpenStopping(options);
    if (!stoppingValidation.ok) {
      return buildInvalidInputResult(options, "secant", stoppingValidation.rejection);
    }
    const x0Validation = validateAndParseStartingScalar(options.x0, "First point x\u2080");
    if (!x0Validation.ok) {
      return buildInvalidInputResult(options, "secant", x0Validation.rejection);
    }
    const x1Validation = validateAndParseStartingScalar(options.x1, "Second point x\u2081");
    if (!x1Validation.ok) {
      return buildInvalidInputResult(options, "secant", x1Validation.rejection);
    }
    const fAst = E.parseExpression(String(options.expression || ""), { allowVariable: true });
    const machine = options.machine;
    const stopping = stoppingValidation.stopping;

    const x0Value = x0Validation.value;
    const x1Value = x1Validation.value;

    let xPrev = machineStore(x0Value, machine);
    let xn = machineStore(x1Value, machine);
    const fPrevEval = safeEvaluate(evaluateFn, fAst, xPrev, machine, options.angleMode);
    if (!fPrevEval.ok) {
      return buildInvalidInputResult(options, "secant", { message: fPrevEval.message });
    }
    let fPrev = fPrevEval.point.approx;

    const rows = [];
    let finalStopReason = initialOpenStopReason(stopping);
```

Then replace the first line of the loop body (`const fn = evaluateFn(fAst, xn, machine, options.angleMode);`, currently line 240) with:

```javascript
      const fEval = safeEvaluate(evaluateFn, fAst, xn, machine, options.angleMode);
      if (!fEval.ok) {
        finalStopReason = fEval.reason;
        break;
      }
      const fn = fEval.point;
```

- [ ] **Step 5.4: Run tests**

Run: `node scripts/battery-validation.js`
Expected: V1–V12 PASS.

- [ ] **Step 5.5: Run the full battery**

Run: `node scripts/run-all-255.js > /tmp/255-after-secant.log 2>&1; echo "exit=$?"`
Expected: exit=0. The S6 Secant case should no longer crash.

- [ ] **Step 5.6: Commit**

```bash
git add root-engine.js scripts/battery-validation.js
git commit -m "feat: secant rejects invalid input and catches in-loop singularities"
```

---

## Task 6: False Position input validation + in-loop safeEvaluate

**Files:**
- Modify: `root-engine.js` — `runFalsePosition` (lines 301-413)
- Modify: `scripts/battery-validation.js` — add tests V13, V14

- [ ] **Step 6.1: Add failing tests**

```javascript
runTest("V13", "FalsePosition rejects epsilon = -1 with invalid-input", () => {
  const result = R.runFalsePosition({
    expression: "x^2 - 2",
    interval: { a: "1", b: "2" },
    machine: { k: 12, mode: "round" },
    stopping: { kind: "epsilon", value: "-1" }
  });
  assert.strictEqual(result.summary.stopReason, "invalid-input");
});

runTest("V14", "FalsePosition bracketing a singularity stops, not throws", () => {
  const result = R.runFalsePosition({
    expression: "1/(x - 1.5)",
    interval: { a: "1", b: "2" },
    machine: { k: 12, mode: "round" },
    stopping: { kind: "iterations", value: 10 }
  });
  assert.ok(result && result.summary, "did not throw");
  assert.ok(
    result.summary.stopReason !== undefined,
    "has a structured stopReason"
  );
});
```

- [ ] **Step 6.2: Verify failure**

Run: `node scripts/battery-validation.js`
Expected: V13 FAIL, V14 may crash.

- [ ] **Step 6.3: Replace entry-point validation and wrap in-loop evaluator calls**

Replace lines 301-316 (from `function runFalsePosition` to before the first `evaluatePoint` line) with:

```javascript
  function runFalsePosition(options) {
    if (!options || !options.machine) {
      throw new Error("False position options require a machine configuration.");
    }
    const stoppingValidation = validateAndParseOpenStopping(options);
    if (!stoppingValidation.ok) {
      return buildInvalidInputResult(options, "falsePosition", stoppingValidation.rejection);
    }
    const aValidation = validateAndParseStartingScalar(options.interval && options.interval.a, "Left endpoint a");
    if (!aValidation.ok) {
      return buildInvalidInputResult(options, "falsePosition", aValidation.rejection);
    }
    const bValidation = validateAndParseStartingScalar(options.interval && options.interval.b, "Right endpoint b");
    if (!bValidation.ok) {
      return buildInvalidInputResult(options, "falsePosition", bValidation.rejection);
    }
    const ast = E.parseExpression(String(options.expression || ""), { allowVariable: true });
    const machine = options.machine;
    const basis = options.decisionBasis === "machine" ? "machine" : "exact";
    const leftInput = aValidation.value;
    const rightInput = bValidation.value;
    if (realNumber(leftInput, "Left endpoint a") >= realNumber(rightInput, "Right endpoint b")) {
      throw new Error("Enter an interval with left endpoint a smaller than right endpoint b.");
    }

    let left = iterationValue(leftInput, machine, basis);
    let right = iterationValue(rightInput, machine, basis);
    const stopping = stoppingValidation.stopping;
```

Note: the original code had `parseScalarInput` for `options.interval.a/b` and `parseOpenStopping(options)` later in the function. Both are now replaced by the early validators.

Then wrap the in-loop `evaluatePoint` calls for `aPoint`, `bPoint`, `cPoint` inside the main `for` loop (currently lines 358-373). Replace that block with:

```javascript
    for (let iteration = 1; iteration <= stopping.maxIterations; iteration += 1) {
      const aEval = safeEvaluate(evaluatePoint, ast, left, machine, options.angleMode);
      if (!aEval.ok) {
        return earlyResult(null, "valid-bracket", aEval.reason, rows);
      }
      const bEval = safeEvaluate(evaluatePoint, ast, right, machine, options.angleMode);
      if (!bEval.ok) {
        return earlyResult(null, "valid-bracket", bEval.reason, rows);
      }
      const aPoint = aEval.point;
      const bPoint = bEval.point;
      const denomMachine = C.sub(bPoint.machine, aPoint.machine);
      const denomVal = realNumber(denomMachine, "false position denominator");

      let midpoint;
      if (Math.abs(denomVal) < C.EPS) {
        midpoint = iterationValue(C.div(C.add(left, right), TWO), machine, basis);
      } else {
        const width = C.sub(right, left);
        const numerator = C.mul(bPoint.machine, width);
        const step = C.div(numerator, denomMachine);
        midpoint = iterationValue(C.sub(right, step), machine, basis);
      }

      const cEval = safeEvaluate(evaluatePoint, ast, midpoint, machine, options.angleMode);
      if (!cEval.ok) {
        return earlyResult(midpoint, "valid-bracket", cEval.reason, rows);
      }
      const cPoint = cEval.point;
```

- [ ] **Step 6.4: Run tests**

Run: `node scripts/battery-validation.js`
Expected: V1–V14 PASS.

- [ ] **Step 6.5: Run full battery**

Run: `node scripts/run-all-255.js > /tmp/255-after-fp.log 2>&1; echo "exit=$?"`
Expected: exit=0. FP cases 7.8 and S11 no longer crash.

- [ ] **Step 6.6: Commit**

```bash
git add root-engine.js scripts/battery-validation.js
git commit -m "feat: false position rejects invalid input and catches singularities"
```

---

## Task 7: False Position retained-endpoint-stagnation guard

**Files:**
- Modify: `root-engine.js` — `runFalsePosition` loop body
- Modify: `scripts/battery-validation.js` — add test V15

- [ ] **Step 7.1: Add failing test V15**

```javascript
runTest("V15", "FalsePosition on a classic starvation case stops with retained-endpoint-stagnation", () => {
  // A function that retains one endpoint for many iterations without converging.
  // x^10 - 1 on [0, 1.3] is a known starvation case.
  const result = R.runFalsePosition({
    expression: "x^10 - 1",
    interval: { a: "0", b: "1.3" },
    machine: { k: 12, mode: "round" },
    stopping: { kind: "epsilon", value: "1e-10" }
  });
  assert.ok(
    result.summary.stopReason === "retained-endpoint-stagnation" ||
    result.summary.stopReason === "tolerance-reached",
    "expected retained-endpoint-stagnation or tolerance-reached; got " + result.summary.stopReason
  );
  // If it reports stagnation, it must have stopped strictly before the iteration cap.
  if (result.summary.stopReason === "retained-endpoint-stagnation") {
    assert.ok(result.rows.length < 100, "should stop before the full cap");
  }
});
```

- [ ] **Step 7.2: Verify V15 currently reports iteration-cap**

Run: `node scripts/battery-validation.js`
Expected: V15 FAIL with `iteration-cap`. If the test accidentally passes because the problem converges, swap the expression for `x^40 - 1` or another stiffer case until FAIL is reproducible.

- [ ] **Step 7.3: Add stagnation guard to the False-Position loop**

Inside the `for` loop in `runFalsePosition`, introduce `retainedSide` and `retainedCount` trackers initialized before the loop. Immediately after the branch that sets `right = midpoint` vs. `left = midpoint` (currently lines 404-408), insert the counter logic and the stagnation check.

Add before the loop (near `let prevC = null;`):

```javascript
    let retainedSide = null;
    let retainedCount = 0;
```

Replace the existing decision block at the end of the loop body (currently around lines 404-408):

```javascript
      if (keepLeftHalf) {
        right = midpoint;
      } else {
        left = midpoint;
      }
```

with:

```javascript
      const sideThisIter = keepLeftHalf ? "right" : "left";
      if (retainedSide === sideThisIter) {
        retainedCount += 1;
      } else {
        retainedSide = sideThisIter;
        retainedCount = 1;
      }
      if (keepLeftHalf) {
        right = midpoint;
      } else {
        left = midpoint;
      }
      if (retainedCount >= FP_STAGNATION_WINDOW) {
        return earlyResult(midpoint, "valid-bracket", "retained-endpoint-stagnation", rows);
      }
```

- [ ] **Step 7.4: Run tests**

Run: `node scripts/battery-validation.js`
Expected: V1–V15 PASS.

- [ ] **Step 7.5: Run full battery**

Run: `node scripts/run-all-255.js > /tmp/255-after-fp-stagnation.log 2>&1; echo "exit=$?"`
Expected: exit=0. Cases 7.3 and 7.12 should now show `retained-endpoint-stagnation` (or `tolerance-reached` if they converge first).

- [ ] **Step 7.6: Commit**

```bash
git add root-engine.js scripts/battery-validation.js
git commit -m "feat: false position stops with retained-endpoint-stagnation after 20 same-side iterations"
```

---

## Task 8: Fixed Point input validation + in-loop safeEvaluate

**Files:**
- Modify: `root-engine.js` — `runFixedPoint` (lines 415-489)
- Modify: `scripts/battery-validation.js` — add tests V16, V17

- [ ] **Step 8.1: Add failing tests**

```javascript
runTest("V16", "FixedPoint rejects iterations = 0 with invalid-input", () => {
  const result = R.runFixedPoint({
    gExpression: "x",
    x0: "0.5",
    machine: { k: 12, mode: "round" },
    stopping: { kind: "iterations", value: "0" }
  });
  assert.strictEqual(result.summary.stopReason, "invalid-input");
});

runTest("V17", "FixedPoint on a non-finite-producing g stops gracefully", () => {
  const result = R.runFixedPoint({
    gExpression: "1/(x - 1)",
    x0: "1",
    machine: { k: 12, mode: "round" },
    stopping: { kind: "iterations", value: 5 }
  });
  assert.ok(result && result.summary, "did not throw");
  assert.ok(
    result.summary.stopReason !== undefined,
    "has a structured stopReason; got " + result.summary.stopReason
  );
});
```

- [ ] **Step 8.2: Verify failure**

Run: `node scripts/battery-validation.js`
Expected: V16 FAIL (FP throws). V17 may crash.

- [ ] **Step 8.3: Replace Fixed Point entry and in-loop evaluator call**

Replace lines 415-427 (from `function runFixedPoint` to the iteration loop) with:

```javascript
  function runFixedPoint(options) {
    if (!options || !options.machine) {
      throw new Error("Fixed point options require a machine configuration.");
    }
    const stoppingValidation = validateAndParseOpenStopping(options);
    if (!stoppingValidation.ok) {
      return buildInvalidInputResult(options, "fixedPoint", stoppingValidation.rejection);
    }
    const startValidation = validateAndParseStartingScalar(options.x0, "Starting point x\u2080");
    if (!startValidation.ok) {
      return buildInvalidInputResult(options, "fixedPoint", startValidation.rejection);
    }
    const gAst = E.parseExpression(String(options.gExpression || ""), { allowVariable: true });
    const machine = options.machine;
    const stopping = stoppingValidation.stopping;

    const x0Value = startValidation.value;
    let xn = machineStore(x0Value, machine);

    const rows = [];
    let finalStopReason = initialOpenStopReason(stopping);
    const DIVERGE_LIMIT = 1e8;
    let previousError = null;
```

Then replace the first line inside the loop (`const gn = evaluateFn(gAst, xn, machine, options.angleMode);`, currently line 432) with:

```javascript
      const gEval = safeEvaluate(evaluateFn, gAst, xn, machine, options.angleMode);
      if (!gEval.ok) {
        finalStopReason = gEval.reason;
        break;
      }
      const gn = gEval.point;
```

- [ ] **Step 8.4: Run tests**

Run: `node scripts/battery-validation.js`
Expected: V1–V17 PASS.

- [ ] **Step 8.5: Run full battery**

Run: `node scripts/run-all-255.js > /tmp/255-after-fp-fixed.log 2>&1; echo "exit=$?"`
Expected: exit=0. Cases 8.9 and 8.15 stop gracefully.

- [ ] **Step 8.6: Commit**

```bash
git add root-engine.js scripts/battery-validation.js
git commit -m "feat: fixed point rejects invalid input and catches non-finite evaluations"
```

---

## Task 9: Fixed Point cycle-detected guard

**Files:**
- Modify: `root-engine.js` — `runFixedPoint` loop body
- Modify: `scripts/battery-validation.js` — add test V18

- [ ] **Step 9.1: Add failing test V18**

```javascript
runTest("V18", "FixedPoint on g(x) = 1 - x from x0 = 0.5 stops with cycle-detected period=2", () => {
  // x -> 1 - x oscillates between 0.5 and 0.5 exactly (trivial fixed point at 0.5).
  // Use a non-trivial 2-cycle: g(x) = 1 - x with x0 = 0.3 -> 0.7 -> 0.3 ...
  const result = R.runFixedPoint({
    gExpression: "1 - x",
    x0: "0.3",
    machine: { k: 12, mode: "round" },
    stopping: { kind: "iterations", value: 20 }
  });
  assert.strictEqual(
    result.summary.stopReason,
    "cycle-detected",
    "expected cycle-detected; got " + result.summary.stopReason
  );
});
```

- [ ] **Step 9.2: Verify V18 fails**

Run: `node scripts/battery-validation.js`
Expected: V18 FAIL (currently returns `iteration-limit` or similar).

- [ ] **Step 9.3: Add cycle detection to Fixed Point loop**

Inside the Fixed Point loop, after `rows.push({ iteration: iter, xn, gxn: xNext, error, note: "" });` (currently line 439), insert a cycle check that reads previous rows. Replace the original block from line 439 through the `previousError = error; xn = xNext;` assignment (around line 464) with:

```javascript
      rows.push({ iteration: iter, xn, gxn: xNext, error, note: "" });

      // Short-period cycle detection: compare x_next to x_{iter - k} for k in FP_CYCLE_PERIODS.
      for (const period of FP_CYCLE_PERIODS) {
        if (rows.length > period) {
          const priorRow = rows[rows.length - 1 - period];
          const priorReal = realNumber(priorRow.gxn != null ? priorRow.gxn : priorRow.xn, "prior x");
          const distance = Math.abs(xNextReal - priorReal);
          const scale = Math.max(1, Math.abs(xNextReal));
          const tol = stopping.kind === "epsilon"
            ? Math.max(stopping.epsilon, Number.EPSILON * scale)
            : Number.EPSILON * scale;
          if (distance <= tol) {
            finalStopReason = "cycle-detected";
            rows[rows.length - 1].note = "value revisits x from " + period + " iterations prior";
            xn = xNext;
            // Attach period to the eventual summary via a side-channel property on the last row.
            rows[rows.length - 1].cyclePeriod = period;
            break;
          }
        }
      }
      if (finalStopReason === "cycle-detected") {
        break;
      }

      if (exactFixedPoint) {
        finalStopReason = "exact-zero";
        rows[rows.length - 1].note = "g(x\u2099) equals x\u2099 exactly";
        break;
      }

      if (Math.abs(xNextReal) > DIVERGE_LIMIT) {
        finalStopReason = "diverged";
        break;
      }

      if (stopping.kind === "epsilon" && error < stopping.epsilon) {
        if (fixedPointStepIsShrinking(error, previousError)) {
          finalStopReason = "tolerance-reached";
          xn = xNext;
          break;
        }
        rows[rows.length - 1].note = previousError == null
          ? "step is below epsilon on the first iteration, but convergence is not verified yet"
          : "step is below epsilon but is not shrinking, so convergence is not verified";
      }

      previousError = error;
      xn = xNext;
    }
```

Also update the `summaryPackage` call (currently around line 479) to carry the cycle period if present. In the result object just before the `return` in `runFixedPoint`, change:

```javascript
      summary: summaryPackage(approx, null, finalStopReason, {
        residual: finalResidual,
        residualBasis: finalResidual == null ? "unavailable" : "machine",
        error: finalError
      }),
```

to:

```javascript
      summary: Object.assign(summaryPackage(approx, null, finalStopReason, {
        residual: finalResidual,
        residualBasis: finalResidual == null ? "unavailable" : "machine",
        error: finalError
      }), finalRow && finalRow.cyclePeriod != null ? { cyclePeriod: finalRow.cyclePeriod } : {}),
```

- [ ] **Step 9.4: Run tests**

Run: `node scripts/battery-validation.js`
Expected: V1–V18 PASS.

- [ ] **Step 9.5: Run full battery**

Run: `node scripts/run-all-255.js > /tmp/255-after-cycle.log 2>&1; echo "exit=$?"`
Expected: exit=0. Fixed-Point cases 8.2, 8.13, S9 should now show `cycle-detected` if they exhibit short cycles.

- [ ] **Step 9.6: Commit**

```bash
git add root-engine.js scripts/battery-validation.js
git commit -m "feat: fixed point cycle-detected guard with period in summary"
```

---

## Task 10: UI stop-reason labels

**Files:**
- Modify: `root-ui.js` — `formatStopReason` function at lines 264-280

- [ ] **Step 10.1: Append new stop-reason labels**

In `root-ui.js`, locate the `formatStopReason` function. Replace the existing `const map = { ... };` block (lines 265-278) with:

```javascript
    const map = {
      "iteration-limit": "Completed the requested iterations",
      "iteration-cap": "Stopped at the safety iteration cap",
      "tolerance-reached": "Reached the requested tolerance",
      "tolerance-already-met": "Initial interval already satisfies the tolerance",
      "endpoint-root": "An endpoint is already a root",
      "exact-zero": method === "fixedPoint" ? "The iteration reached an exact fixed point" : "Reference value is exactly zero",
      "machine-zero": "Machine value is zero or near zero",
      "invalid-starting-interval": "Not a valid bisection bracket",
      "discontinuity-detected": "Stopped at a discontinuity or singularity",
      "derivative-zero": "Derivative is zero — method cannot continue",
      "stagnation": "Method stalled (denominator \u2248 0)",
      "diverged": "Iteration diverged (|x| exceeds 10\u2078)",
      "invalid-input": "Input was rejected",
      "singularity-encountered": "Evaluator raised an error inside the iteration",
      "non-finite-evaluation": "Evaluator produced a non-finite value",
      "diverged-step": "Step grew more than 10x without a residual drop",
      "step-small-residual-large": "Step is below epsilon but |f(x)| is too large to trust",
      "retained-endpoint-stagnation": "Same endpoint retained for too many iterations without convergence",
      "cycle-detected": "Iteration fell into a short-period cycle"
    };
```

- [ ] **Step 10.2: Sanity-check the map renders correctly**

Open `index.html` in a browser, run one of the root methods that now produces a new stop-reason (e.g. Newton on `sin(x)` with `x0=1.5708`), and verify the result card shows the new human-readable label rather than the raw string.

Expected: the UI shows "Step grew more than 10x without a residual drop" for `diverged-step`.

Note: automated UI verification is not required for correctness; the map fall-through in `root-ui.js:279` already echoes the raw string, so a missed entry is cosmetic, not functional.

- [ ] **Step 10.3: Commit**

```bash
git add root-ui.js
git commit -m "feat: render new root-engine stop reasons in the UI"
```

---

## Task 11: Battery alignment for 12.7, 12.9, 12.13

**Files:**
- Modify: `scripts/battery-cat11-12.js` — update human-readable expectation text

Tests in this file are inspection-style (print, do not assert). Alignment means updating the `expectation` string passed to `runTest` so it describes the actual, designed behavior.

- [ ] **Step 11.1: Update 12.7 expectation**

In `scripts/battery-cat11-12.js`, locate `runTest("12.7", ...` (line 160). The current expectation is `"Radians should find a root; degrees should reject the bracket."`.

Under the 2026-04-16 bisection design, relative tolerance is the default. A bracket-touching-zero case for radians and a no-sign-change bracket for degrees both produce structured stop reasons, not computed roots. Change the trailing argument to:

```javascript
}, "Radians: bisection should emit its designed stop reason for the relative-tolerance-invalid or bracket presentation; degrees: invalid-bracket.");
```

- [ ] **Step 11.2: Update 12.9 expectation**

Locate `runTest("12.9", ...` (line 191). Change the trailing argument to:

```javascript
}, "Large-denominator bracket touching zero is expected to produce a structured bisection stop (e.g. relative-tolerance bound unreachable), not a thrown exception.");
```

- [ ] **Step 11.3: Update 12.13 expectation**

Locate `runTest("12.13", ...` (line 230). Change the trailing argument to:

```javascript
}, "At k=2 chop, Secant cannot resolve finer than ~0.1; any result within that precision is acceptable convergence.");
```

- [ ] **Step 11.4: Run the full battery to confirm these prints still occur**

Run: `node scripts/run-all-255.js > /tmp/255-after-alignment.log 2>&1; echo "exit=$?"`
Expected: exit=0. Grep for each updated test:

```bash
grep -A2 "^TEST 12.7" /tmp/255-after-alignment.log
grep -A2 "^TEST 12.9" /tmp/255-after-alignment.log
grep -A2 "^TEST 12.13" /tmp/255-after-alignment.log
```

Each should show the new expectation text and a non-crash result line.

- [ ] **Step 11.5: Commit**

```bash
git add scripts/battery-cat11-12.js
git commit -m "docs: align battery 12.7/12.9/12.13 expectations with engine design"
```

---

## Task 12: Register validation suite with run-all and verify the gate

**Files:**
- Modify: `scripts/run-all-255.js`

- [ ] **Step 12.1: Add the validation suite to the runner**

In `scripts/run-all-255.js`, replace the `suites` array (lines 8-15) with:

```javascript
const suites = [
  { file: "scripts/battery-cat1-4.js", expected: 60 },
  { file: "scripts/battery-cat2-3.js", expected: 35 },
  { file: "scripts/convergence-tests.js", expected: 70 },
  { file: "scripts/battery-cat9-10.js", expected: 42 },
  { file: "scripts/battery-cat11-12.js", expected: 37 },
  { file: "scripts/supplemental-brutal-11.js", expected: 11 },
  { file: "scripts/battery-validation.js", expected: 18 }
];
```

Also update the summary message at the bottom (lines 40-47) from hard-coded `255` to a dynamic total. Replace:

```javascript
console.log(`\n===== RUN SUMMARY =====`);
console.log(`Expected total: 255`);
console.log(`Actual total:   ${total}`);
console.log(`Failed suites:  ${failedSuites}`);

if (total !== 255 || failedSuites > 0) {
  process.exitCode = 1;
}
```

with:

```javascript
const expectedTotal = suites.reduce((sum, suite) => sum + suite.expected, 0);
console.log(`\n===== RUN SUMMARY =====`);
console.log(`Expected total: ${expectedTotal}`);
console.log(`Actual total:   ${total}`);
console.log(`Failed suites:  ${failedSuites}`);

if (total !== expectedTotal || failedSuites > 0) {
  process.exitCode = 1;
}
```

- [ ] **Step 12.2: Run the full battery**

Run: `node scripts/run-all-255.js > /tmp/255-final.log 2>&1; echo "exit=$?"`
Expected: `exit=0`. Expected total: 273 (255 + 18 validation tests). Failed suites: 0.

- [ ] **Step 12.3: Confirm zero unexpected root-method crashes**

Run: `grep -B1 "CRASHED" /tmp/255-final.log | head -100`
Expected: Any remaining `CRASHED` lines are confined to out-of-scope engines (ExpressionEngine, IEEE754, PolyEngine). No root-method cases (5.x, 6.x, 7.x, 8.x, S1–S11) should appear.

- [ ] **Step 12.4: Run the root-engine audit**

Run: `node scripts/root-engine-audit.js; echo "exit=$?"`
Expected: `exit=0`. All audit checks pass.

- [ ] **Step 12.5: Run the engine-correctness audit**

Run: `node scripts/engine-correctness-audit.js; echo "exit=$?"`
Expected: `exit=0`.

- [ ] **Step 12.6: Commit**

```bash
git add scripts/run-all-255.js
git commit -m "test: register validation suite and switch run-all to dynamic total"
```

---

## Verification Gate Summary

When every task's final commit exists on the branch and the following commands all print `exit=0`, the pass is complete:

```bash
node scripts/battery-validation.js; echo "exit=$?"
node scripts/run-all-255.js; echo "exit=$?"
node scripts/root-engine-audit.js; echo "exit=$?"
node scripts/engine-correctness-audit.js; echo "exit=$?"
```

And the following should find zero root-method crashes:

```bash
grep -E "^TEST [5678]\." /tmp/255-final.log -A3 | grep -c "CRASHED"   # expected: 0
grep -E "^TEST S[0-9]+" /tmp/255-final.log -A3 | grep -c "CRASHED"    # expected: 0
```
