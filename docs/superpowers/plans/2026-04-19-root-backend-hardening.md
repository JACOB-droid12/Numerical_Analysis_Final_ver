# Root Backend Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden bracketed solvers, extreme numeric inputs, and the 255-case battery so asymptote traps and pathological inputs stop safely instead of crashing or faking success.

**Architecture:** Keep the existing solver entry points and result shapes, then add one small guardrail layer inside `root-engine.js` for continuity screening and non-finite metric handling. Put numeric-input caps at the parser boundary in `math-engine.js`, then convert the exploratory battery scripts to a shared assertive harness so local runs and CI trust exit codes instead of printed `TEST` labels.

**Tech Stack:** Vanilla JavaScript, Node.js scripts, GitHub Actions YAML

---

## File Structure

**Create:**
- `scripts/test-harness.js` — Shared Node assertion harness for the exploratory battery suites. Owns `assert`, case registration, logging, and exit-code handling.
- `.github/workflows/backend-battery.yml` — Minimal CI workflow that runs the backend verification path.

**Modify:**
- `root-engine.js` — Add shared continuity-screening and non-finite metric helpers, then wire them into Bisection, False Position, and Newton.
- `math-engine.js` — Add hard caps for raw numeric input length, exponent magnitude, `pow10(...)`, and machine precision `k`.
- `scripts/root-engine-audit.js` — Add targeted regression checks for bracket continuity traps and non-finite solver-stop behavior.
- `scripts/battery-validation.js` — Add assertive validation coverage for oversized numeric input and solver invalid-input/non-finite paths.
- `scripts/battery-cat1-4.js` — Convert parsing/bisection exploratory output to assertive checks while preserving human-readable case labels.
- `scripts/battery-cat2-3.js` — Convert arithmetic/machine-precision exploratory output to assertive checks.
- `scripts/convergence-tests.js` — Convert open-method convergence/brutal cases into assertive no-crash and stop-reason checks.
- `scripts/battery-cat9-10.js` — Convert polynomial/IEEE exploratory output to assertive checks.
- `scripts/battery-cat11-12.js` — Convert trig/integration exploratory output to assertive checks.
- `scripts/supplemental-brutal-11.js` — Convert supplemental brutal cases to assertive checks for the newly hardened solver behavior.
- `scripts/run-all-255.js` — Stop trusting printed `TEST` counts as the main success signal; fail from suite exit codes instead.

**Verify Only:**
- `scripts/engine-correctness-audit.js`

**Do not modify in this pass:**
- `expression-engine.js`
- `math-display.js`
- `app.js`
- `root-ui.js`
- `styles.css`

---

### Task 1: Add Failing Continuity Regressions For Bracketed Solvers

**Files:**
- Modify: `scripts/root-engine-audit.js`

- [ ] **Step 1: Add audit helpers for continuity-stop assertions**

Insert these helpers near the existing local helper functions in `scripts/root-engine-audit.js`, after `realOrMessage(...)` and before `run()`:

```js
function isContinuityStop(summary) {
  return Boolean(summary)
    && summary.intervalStatus === "invalid-continuity"
    && summary.stopReason === "discontinuity-detected";
}

function continuityDetail(summary) {
  return summary && summary.stopDetail ? String(summary.stopDetail) : "";
}
```

- [ ] **Step 2: Add a failing bisection asymptote regression**

Inside `run()`, add this block after the existing bisection edge-case checks and before the Newton section:

```js
  {
    const run = R.runBisection({
      expression: "tan(x)",
      interval: { a: "1", b: "2" },
      machine: { k: 6, mode: "round" },
      stopping: { kind: "epsilon", value: "0.0001", toleranceType: "absolute" },
      decisionBasis: "machine",
      signDisplay: "both",
      angleMode: "rad"
    });

    report.check(
      "Bisection rejects tan(x) asymptote interval",
      "Continuity guardrails",
      "invalid-continuity / discontinuity-detected",
      `${run.summary.intervalStatus} / ${run.summary.stopReason}`,
      isContinuityStop(run.summary),
      continuityDetail(run.summary)
    );
    report.check(
      "Bisection asymptote trap has no approximation",
      "Continuity guardrails",
      "null",
      String(run.summary.approximation),
      run.summary.approximation === null
    );
  }
```

- [ ] **Step 3: Run the audit and verify it fails for the new regression**

Run: `node scripts/root-engine-audit.js`

Expected: a `FAIL` line for `Bisection rejects tan(x) asymptote interval` because `runBisection(...)` still treats `tan(x)` on `[1, 2]` as a valid bracket.

- [ ] **Step 4: Add the shared continuity-screening helper in `root-engine.js`**

Insert these helpers near `continuityFailure(...)` and `sampleSignChanges(...)` in `root-engine.js`:

```js
  function continuityStopDetail(label, detail) {
    return label + ": " + detail;
  }

  function screenBracketContinuity(ast, left, right, machine, angleMode, basis) {
    const SAMPLE_COUNT = 17;
    let previousSign = null;
    let signFlips = 0;

    for (let index = 0; index < SAMPLE_COUNT; index += 1) {
      const numerator = C.add(
        C.mul(left, M.makeRational(1, BigInt(SAMPLE_COUNT - 1 - index), BigInt(SAMPLE_COUNT - 1))),
        C.mul(right, M.makeRational(1, BigInt(index), BigInt(SAMPLE_COUNT - 1)))
      );
      const sample = safeEvaluate(evaluatePoint, ast, numerator, machine, angleMode);
      if (!sample.ok) {
        return { ok: false, message: continuityStopDetail("Sample evaluation failed", sample.message) };
      }

      const point = sample.point;
      if (valueHasNonFinite(point.reference) || valueHasNonFinite(point.machine)) {
        return { ok: false, message: continuityStopDetail("Sample produced a non-finite value", String(index)) };
      }

      const sign = decisionSign(point, basis);
      if (sign !== 0) {
        if (previousSign != null && previousSign !== sign) {
          signFlips += 1;
        }
        previousSign = sign;
      }
    }

    if (signFlips > 1) {
      return { ok: false, message: "Sampled signs flipped more than once inside the interval, so the bracket may cross a discontinuity or asymptote." };
    }

    return { ok: true };
  }
```

- [ ] **Step 5: Wire the continuity screen into `runBisection(...)`**

Update `runBisection(...)` in `root-engine.js` in two places.

First, after the existing `leftSign * rightSign > 0` invalid-bracket return and before the multiple-root warning:

```js
    const initialContinuity = screenBracketContinuity(ast, left, right, machine, options.angleMode, basis);
    if (!initialContinuity.ok) {
      return bisectionResult(
        options,
        ast,
        machine,
        leftPoint,
        rightPoint,
        stopping,
        continuityFailure(initialContinuity.message),
        [],
        warnings
      );
    }
```

Second, inside the main loop after `const nextLeft = ...` / `const nextRight = ...` and before bound calculation:

```js
      const continuity = screenBracketContinuity(ast, nextLeft, nextRight, machine, options.angleMode, basis);
      if (!continuity.ok) {
        return bisectionResult(
          options,
          ast,
          machine,
          leftPoint,
          rightPoint,
          stopping,
          continuityFailure(continuity.message),
          rows,
          warnings
        );
      }
```

- [ ] **Step 6: Re-run the audit and verify the continuity regression passes**

Run: `node scripts/root-engine-audit.js`

Expected: `Summary: ... passed` with the new continuity guardrail checks passing and no new failures in the existing root audit.

- [ ] **Step 7: Commit the continuity-screening task**

```bash
git add scripts/root-engine-audit.js root-engine.js
git commit -m "fix: screen bracket continuity in bisection"
```

---

### Task 2: Convert Non-Finite Solver Breakdowns Into Structured Stops

**Files:**
- Modify: `root-engine.js`
- Modify: `scripts/root-engine-audit.js`
- Modify: `scripts/battery-validation.js`
- Modify: `scripts/supplemental-brutal-11.js`

- [ ] **Step 1: Add failing regressions for non-finite metric handling**

Append these checks in `scripts/root-engine-audit.js` after the new continuity blocks:

```js
  {
    const run = R.runFalsePosition({
      expression: "1/(x - 5)",
      interval: { a: "4", b: "6" },
      machine: { k: 12, mode: "round" },
      stopping: { kind: "epsilon", value: "0.0001" },
      decisionBasis: "machine",
      signDisplay: "both",
      angleMode: "rad"
    });

    report.check(
      "False Position rejects a pole masquerading as a root",
      "Continuity guardrails",
      "invalid-continuity / discontinuity-detected",
      `${run.summary.intervalStatus} / ${run.summary.stopReason}`,
      isContinuityStop(run.summary),
      continuityDetail(run.summary)
    );
    report.check(
      "False Position pole trap has no approximation",
      "Continuity guardrails",
      "null",
      String(run.summary.approximation),
      run.summary.approximation === null
    );
  }

  {
    const run = captureRun(() => R.runBisection({
      expression: "x",
      interval: { a: "-1e308", b: "1e308" },
      machine: { k: 12, mode: "round" },
      stopping: { kind: "iterations", value: 4 },
      decisionBasis: "exact",
      signDisplay: "both",
      angleMode: "rad"
    }));

    report.check(
      "Bisection huge interval returns a structured stop",
      "Non-finite guardrails",
      "no throw and non-finite-evaluation",
      run.error ? run.error.message : run.run.summary.stopReason,
      !run.error && run.run.summary.stopReason === "non-finite-evaluation"
    );
  }

  {
    const run = captureRun(() => R.runNewtonRaphson({
      expression: "x - 1",
      dfExpression: "1e-315",
      x0: "0",
      machine: { k: 12, mode: "round" },
      stopping: { kind: "iterations", value: 3 },
      angleMode: "rad"
    }));

    report.check(
      "Newton tiny derivative path returns a structured stop",
      "Non-finite guardrails",
      "no throw and non-finite-evaluation",
      run.error ? run.error.message : run.run.summary.stopReason,
      !run.error && run.run.summary.stopReason === "non-finite-evaluation"
    );
  }
```

Add these validation regressions to `scripts/battery-validation.js` near the other root-validation cases:

```js
runTest("V21", "Newton tiny derivative returns a structured non-finite stop", () => {
  const result = R.runNewtonRaphson({
    expression: "x - 1",
    dfExpression: "1e-315",
    x0: "0",
    machine: { k: 12, mode: "round" },
    stopping: { kind: "iterations", value: 3 }
  });

  assert.strictEqual(result.summary.stopReason, "non-finite-evaluation");
  assert.strictEqual(result.summary.approximation, null);
  assert.ok(result.summary.stopDetail.length > 0);
});
```

Add this brutal assertion to `scripts/supplemental-brutal-11.js` by changing the result section for S2:

```js
runTest(2, "Bisection on huge interval", "bisection", {
  expression: "x",
  interval: { a: "-1e308", b: "1e308" },
  decisionBasis: "exact",
  machine: { k: 12, mode: "round" },
  stopping: { kind: "iterations", value: 10 }
}, "Should return non-finite-evaluation instead of throwing.");
```

- [ ] **Step 2: Run the targeted scripts and verify they fail before the implementation**

Run:

```powershell
node scripts/root-engine-audit.js
node scripts/battery-validation.js
node scripts/supplemental-brutal-11.js
```

Expected:
- `root-engine-audit.js` fails on the new non-finite guardrail checks.
- `battery-validation.js` fails on `V21`.
- `supplemental-brutal-11.js` still prints the old exception or wrong stop reason for the huge-interval case.

- [ ] **Step 3: Add shared non-finite metric helpers in `root-engine.js`**

Insert these helpers near `safeEvaluate(...)` and `summaryPackage(...)`:

```js
  function safeFiniteMetric(label, metricFn) {
    try {
      const value = metricFn();
      if (!Number.isFinite(value)) {
        return { ok: false, reason: "non-finite-evaluation", message: label + " is not finite." };
      }
      return { ok: true, value };
    } catch (error) {
      return { ok: false, reason: "non-finite-evaluation", message: error.message };
    }
  }

  function nullApproximationStop(intervalStatus, stopReason, stopDetail, diagnostics) {
    return summaryPackage(null, intervalStatus || null, stopReason, Object.assign({
      stopDetail: stopDetail || "",
      residual: null,
      residualBasis: "unavailable",
      error: null,
      bound: null
    }, diagnostics || {}));
  }
```

- [ ] **Step 4: Wire the helper into Bisection, False Position, and Newton**

Make these replacements in `root-engine.js`.

In `runBisection(...)`, replace the raw midpoint error calculation:

```js
      const errorResult = prevC != null
        ? safeFiniteMetric("Bisection error", function() {
            return Math.abs(realNumber(C.sub(midpoint, prevC), "Bisection error"));
          })
        : { ok: true, value: null };
      if (!errorResult.ok) {
        return bisectionResult(
          options,
          ast,
          machine,
          leftPoint,
          rightPoint,
          stopping,
          nullApproximationStop("valid-bracket", errorResult.reason, errorResult.message, { error: null }),
          rows,
          warnings
        );
      }
      const error = errorResult.value;
```

In `runFalsePosition(...)`, replace both the denominator and width/error metrics:

First, add the same continuity screening at the top of `runFalsePosition(...)` after `leftSign * rightSign > 0`:

```js
    const initialContinuity = screenBracketContinuity(ast, left, right, machine, options.angleMode, basis);
    if (!initialContinuity.ok) {
      return earlyResultLikeFalsePosition(
        options,
        ast,
        machine,
        stopping,
        leftPoint,
        rightPoint,
        "discontinuity-detected",
        initialContinuity.message,
        []
      );
    }
```

Then re-screen the retained subinterval inside the loop after `const keepLeftHalf = ...` and before the row is pushed:

```js
      const nextLeft = keepLeftHalf ? left : midpoint;
      const nextRight = keepLeftHalf ? midpoint : right;
      const continuity = screenBracketContinuity(ast, nextLeft, nextRight, machine, options.angleMode, basis);
      if (!continuity.ok) {
        return earlyResult(null, "invalid-continuity", "discontinuity-detected", rows, continuity.message);
      }
```

After that, replace the denominator and width/error metrics:

```js
      const denomResult = safeFiniteMetric("false position denominator", function() {
        return realNumber(denomMachine, "false position denominator");
      });
      if (!denomResult.ok) {
        return earlyResult(null, "valid-bracket", denomResult.reason, rows, denomResult.message);
      }
      const denomVal = denomResult.value;
```

```js
      const errorResult = prevC != null
        ? safeFiniteMetric("FP error", function() {
            return finiteDistanceOrMachine(midpoint, prevC, machine, "FP error");
          })
        : { ok: true, value: null };
      if (!errorResult.ok) {
        return earlyResult(null, "valid-bracket", errorResult.reason, rows, errorResult.message);
      }
      const widthResult = safeFiniteMetric("Interval width", function() {
        return finiteDistanceOrMachine(right, left, machine, "Interval width");
      });
      if (!widthResult.ok) {
        return earlyResult(null, "valid-bracket", widthResult.reason, rows, widthResult.message);
      }
      const error = errorResult.value;
```

and store `width: widthResult.value`.

In `runNewtonRaphson(...)`, replace the raw Newton error calculation:

```js
      const errorResult = safeFiniteMetric("Newton error", function() {
        return Math.abs(realNumber(C.sub(xNext, xn), "Newton error"));
      });
      if (!errorResult.ok) {
        finalStopReason = errorResult.reason;
        rows.push({ iteration: iter, xn, fxn: fn.approx, dfxn: dfn.approx, xNext: null, error: null, note: errorResult.message });
        break;
      }
      const error = errorResult.value;
```

Then update the post-loop approximation selection for Newton so non-finite stops keep the approximation null:

```js
    const approx = finalStopReason === "non-finite-evaluation"
      ? null
      : (finalRow ? (finalRow.xNext != null ? finalRow.xNext : finalRow.xn) : x0Value);
```

- [ ] **Step 5: Re-run the targeted scripts and verify the structured stops**

Run:

```powershell
node scripts/root-engine-audit.js
node scripts/battery-validation.js
node scripts/supplemental-brutal-11.js
```

Expected:
- `root-engine-audit.js` passes the new false-position continuity checks.
- `root-engine-audit.js` passes the new huge-interval and tiny-derivative checks.
- `battery-validation.js` passes `V21`.
- `supplemental-brutal-11.js` prints `non-finite-evaluation` for the huge-interval case and exits cleanly.

- [ ] **Step 6: Commit the non-finite-stop task**

```bash
git add root-engine.js scripts/root-engine-audit.js scripts/battery-validation.js scripts/supplemental-brutal-11.js
git commit -m "fix: return structured stops for non-finite solver paths"
```

---

### Task 3: Add Numeric Input Caps In `math-engine.js`

**Files:**
- Modify: `math-engine.js`
- Modify: `scripts/battery-validation.js`

- [ ] **Step 1: Add failing validation coverage for oversized numeric input**

First, change the engine import near the top of `scripts/battery-validation.js` from:

```js
const { R } = loadEngines();
```

to:

```js
const { M, R } = loadEngines();
```

Then append these tests to `scripts/battery-validation.js` after `V21`:

```js
runTest("V22", "MathEngine rejects oversized scientific exponents", () => {
  assert.throws(
    () => M.parseRational("1e10000000"),
    /Exponent magnitude exceeds the supported limit/
  );
});

runTest("V23", "MathEngine rejects oversized raw numeric strings", () => {
  const huge = "1." + "0".repeat(3000);
  assert.throws(
    () => M.parseRational(huge),
    /Numeric input is too long/
  );
});

runTest("V24", "MathEngine rejects oversized machine precision k", () => {
  assert.throws(
    () => M.machineApprox(M.ONE, 5000, "round"),
    /Machine precision k exceeds the supported limit/
  );
});
```

- [ ] **Step 2: Run the validation script and verify the new tests fail**

Run: `node scripts/battery-validation.js`

Expected: `V22`, `V23`, and `V24` fail because `math-engine.js` still accepts the oversized inputs or throws the wrong low-level error.

- [ ] **Step 3: Add hard-limit constants and reusable validators in `math-engine.js`**

Insert these declarations near `POW10_CACHE`, `ZERO`, and `ONE`:

```js
  const MAX_NUMERIC_INPUT_LENGTH = 2048;
  const MAX_ABS_EXPONENT = 100000;
  const MAX_MACHINE_K = 1024;
```

Then add these helpers near `assertNonNegativeInteger(...)`:

```js
  function assertInputLength(text, name) {
    if (String(text).length > MAX_NUMERIC_INPUT_LENGTH) {
      throw new Error(name + " is too long for this calculator.");
    }
  }

  function assertExponentWithinLimit(exp) {
    if (Math.abs(exp) > MAX_ABS_EXPONENT) {
      throw new Error("Exponent magnitude exceeds the supported limit.");
    }
  }

  function assertMachinePrecision(k) {
    if (!Number.isInteger(k) || k < 1) {
      throw new Error("k must be a positive integer.");
    }
    if (k > MAX_MACHINE_K) {
      throw new Error("Machine precision k exceeds the supported limit.");
    }
  }
```

- [ ] **Step 4: Wire the validators into parsing, `pow10(...)`, and `machineApprox(...)`**

Update `pow10(...)`:

```js
  function pow10(exp) {
    assertNonNegativeInteger(exp, "Power");
    if (exp > MAX_ABS_EXPONENT) {
      throw new Error("Exponent magnitude exceeds the supported limit.");
    }
    for (let i = POW10_CACHE.length; i <= exp; i += 1) {
      POW10_CACHE.push(POW10_CACHE[i - 1] * 10n);
    }
    return POW10_CACHE[exp];
  }
```

Update `parseDecimalScientific(...)`:

```js
  function parseDecimalScientific(input) {
    const text = input.trim();
    assertInputLength(text, "Numeric input");
    const regex = /^([+-])?(?:(\d+)(?:\.(\d*))?|\.(\d+))(?:[eE]([+-]?\d+))?$/;
    const match = regex.exec(text);
    if (!match) {
      throw new Error("Invalid number format: " + input);
    }
    const expPart = match[5] ? parseInt(match[5], 10) : 0;
    assertExponentWithinLimit(expPart);
    // keep the rest of the function unchanged
  }
```

Update `parseRational(...)` to guard the full raw input before splitting:

```js
  function parseRational(input) {
    const text = String(input).trim();
    assertInputLength(text, "Numeric input");
    if (!text) {
      throw new Error("Input is empty.");
    }
    // keep the rest of the function unchanged
  }
```

Update `machineApprox(...)`:

```js
  function machineApprox(value, k, mode) {
    assertMachinePrecision(k);
    if (mode !== "chop" && mode !== "round") {
      throw new Error("mode must be 'chop' or 'round'.");
    }
    // keep the remainder unchanged
  }
```

- [ ] **Step 5: Re-run validation and engine audits**

Run:

```powershell
node scripts/battery-validation.js
node scripts/engine-correctness-audit.js
```

Expected:
- `battery-validation.js` passes `V22`, `V23`, and `V24`.
- `engine-correctness-audit.js` still exits cleanly, proving the hard caps did not break normal numeric parsing and machine arithmetic.

- [ ] **Step 6: Commit the numeric-input hardening task**

```bash
git add math-engine.js scripts/battery-validation.js
git commit -m "fix: cap scientific notation and machine precision inputs"
```

---

### Task 4: Convert The Exploratory Battery To The Shared Harness

**Files:**
- Create: `scripts/test-harness.js`
- Modify: `scripts/battery-cat1-4.js`
- Modify: `scripts/battery-cat2-3.js`
- Modify: `scripts/convergence-tests.js`

- [ ] **Step 1: Create the shared test harness**

Create `scripts/test-harness.js` with this content:

```js
"use strict";

const assert = require("assert");

function createSuite(name) {
  return { name, total: 0, failures: 0 };
}

function runCase(suite, id, name, fn) {
  suite.total += 1;
  console.log(`\nTEST ${id}: ${name}`);
  try {
    const detail = fn();
    console.log("> PASS");
    if (detail) {
      console.log(detail);
    }
  } catch (error) {
    suite.failures += 1;
    console.log("> FAIL");
    console.log(error && error.stack ? error.stack : String(error));
  }
}

function finishSuite(suite) {
  const passed = suite.total - suite.failures;
  console.log(`\nSummary: ${passed}/${suite.total} passed`);
  if (suite.failures > 0) {
    process.exitCode = 1;
  }
}

module.exports = {
  assert,
  createSuite,
  finishSuite,
  runCase
};
```

- [ ] **Step 2: Convert `scripts/battery-cat1-4.js` to assertions**

At the top of `scripts/battery-cat1-4.js`, import the harness:

```js
const { assert, createSuite, finishSuite, runCase } = require("./test-harness");
const suite = createSuite("battery-cat1-4");
```

Replace `runASTTest(...)` with:

```js
function runASTTest(id, expr, expectedHint, assertion) {
  runCase(suite, `1.${id}`, `"${expr}"`, () => {
    let ast = null;
    let thrown = "";
    try {
      ast = E.parseExpression(expr);
      if (/throw/i.test(expectedHint)) {
        const env = { x: context.MathEngine.parseRational("1"), angleMode: "rad" };
        E.evaluateValue(ast, env);
      }
    } catch (error) {
      thrown = error.message;
    }
    assertion({ ast, thrown });
    return `Expected: ${expectedHint}`;
  });
}
```

Convert representative calls exactly like this:

```js
runASTTest("1", "", "Should throw 'Expression is empty'", ({ thrown }) => {
  assert.match(thrown, /Expression is empty/);
});

runASTTest("6", "2x", "Should parse as `2 * x` (implicit mult)", ({ ast, thrown }) => {
  assert.strictEqual(thrown, "");
  assert.strictEqual(E.formatExpression(ast), "2 * x");
});
```

Replace `runBisectionTest(...)` with:

```js
function runBisectionTest(id, opt, expectedHint, assertion) {
  runCase(suite, `4.${id}`, `Bisection [${opt.interval.a}, ${opt.interval.b}] on ${opt.expression}`, () => {
    const result = R.runBisection(opt);
    assertion(result);
    return `Expected: ${expectedHint}`;
  });
}
```

Convert the continuity cases exactly like this:

```js
runBisectionTest("11", { expression: "1/x", interval: { a: "-1", b: "1" }, decisionBasis: "machine", machine: { k: 6, mode: "round" }, stopping: { kind: "epsilon", value: "0.0001" } }, "Discontinuity at 0 (Deceived!)", (result) => {
  assert.strictEqual(result.summary.intervalStatus, "invalid-continuity");
  assert.strictEqual(result.summary.stopReason, "discontinuity-detected");
  assert.strictEqual(result.summary.approximation, null);
});

runBisectionTest("12", { expression: "tan(x)", interval: { a: "1", b: "2" }, decisionBasis: "machine", machine: { k: 6, mode: "round" }, stopping: { kind: "epsilon", value: "0.0001" }, angleMode: "rad" }, "Discontinuity at pi/2 (False sign change)", (result) => {
  assert.strictEqual(result.summary.intervalStatus, "invalid-continuity");
  assert.strictEqual(result.summary.stopReason, "discontinuity-detected");
  assert.strictEqual(result.summary.approximation, null);
});
```

At the end of the file, add:

```js
finishSuite(suite);
```

- [ ] **Step 3: Convert `scripts/battery-cat2-3.js` to assertions**

At the top of `scripts/battery-cat2-3.js`, import the harness and create the suite:

```js
const { assert, createSuite, finishSuite, runCase } = require("./test-harness");
const suite = createSuite("battery-cat2-3");
```

Replace `runArithmeticTest(...)` with:

```js
function runArithmeticTest(id, name, mathLogic, expectedHint, assertion) {
  runCase(suite, id, name, () => {
    const result = mathLogic();
    assertion(result);
    return `Expected: ${expectedHint} | Actual: ${result}`;
  });
}
```

Convert representative exact and approximate cases exactly like this:

```js
runArithmeticTest("2.2", "(10000001 - 10000000)", () => {
  return C.toNumber(C.sub(M.parseRational("10000001"), M.parseRational("10000000")));
}, "1 (Exact subtraction)", (result) => {
  assert.strictEqual(result, 1);
});

runArithmeticTest("2.3", "sqrt(10001) - sqrt(10000)", () => {
  let s1 = C.sqrtValue(parseValue("10001"));
  let s2 = C.sqrtValue(parseValue("10000"));
  return C.sub(s1, s2).re;
}, "≈ 0.00499988...", (result) => {
  assert.ok(Math.abs(result - 0.004999875006) < 1e-9);
});
```

Replace `runMachineTest(...)` with:

```js
function runMachineTest(id, val, k, mode, exp, assertion) {
  runCase(suite, id, `${val} | k=${k} | ${mode}`, () => {
    const result = M.rationalToDecimalString(M.machineApprox(M.parseRational(val), k, mode).approx, 20);
    assertion(result);
    return `Expected: ${exp} | Actual: ${result}`;
  });
}
```

Convert representative machine cases exactly like this:

```js
runMachineTest("3.1", "1/3", 4, "chop", "0.3333", (result) => {
  assert.strictEqual(result, "0.3333...");
});

runMachineTest("3.4", "2/3", 4, "round", "0.6667", (result) => {
  assert.ok(result.startsWith("0.6667"));
});
```

End the file with:

```js
finishSuite(suite);
```

- [ ] **Step 4: Convert `scripts/convergence-tests.js` to assertions**

At the top of `scripts/convergence-tests.js`, import the harness:

```js
const { assert, createSuite, finishSuite, runCase } = require("./test-harness");
const suite = createSuite("convergence-tests");
```

Replace `runTestCase(...)` with:

```js
function runTestCase(num, method, options, assertion) {
  runCase(suite, num, `${method.toUpperCase()} | ${JSON.stringify(options.stopping)}`, () => {
    let result;
    if (method === "newton") result = R.runNewtonRaphson(options);
    else if (method === "secant") result = R.runSecant(options);
    else if (method === "falsePosition") result = R.runFalsePosition(options);
    else if (method === "fixedPoint") result = R.runFixedPoint(options);
    assertion(result);
    return `Stop: ${result.summary.stopReason} | Interval: ${result.summary.intervalStatus || "N/A"}`;
  });
}
```

Convert the false-position discontinuity case exactly like this:

```js
runTestCase(7.8, FP, { expression: "1/x", interval: { a: "-1", b: "1" }, decisionBasis: "machine", machine: { k: 12, mode: "round" }, stopping: { kind: "epsilon", value: "0.0001" } }, (result) => {
  assert.strictEqual(result.summary.intervalStatus, "invalid-continuity");
  assert.strictEqual(result.summary.stopReason, "discontinuity-detected");
  assert.strictEqual(result.summary.approximation, null);
});
```

Convert the Newton divergence guardrail case exactly like this:

```js
runTestCase(5.12, N, { expression: "sin(x)", dfExpression: "cos(x)", x0: "1.5708", machine: { k: 12, mode: "round" }, stopping: { kind: "epsilon", value: "0.0001" }, angleMode: "rad" }, (result) => {
  assert.ok(["diverged-step", "non-finite-evaluation", "iteration-cap"].includes(result.summary.stopReason));
});
```

End the file with:

```js
finishSuite(suite);
```

- [ ] **Step 5: Run the three converted suites**

Run:

```powershell
node scripts/battery-cat1-4.js
node scripts/battery-cat2-3.js
node scripts/convergence-tests.js
```

Expected: each suite prints `Summary: ... passed` and exits with code `0`.

- [ ] **Step 6: Commit the first harness-conversion batch**

```bash
git add scripts/test-harness.js scripts/battery-cat1-4.js scripts/battery-cat2-3.js scripts/convergence-tests.js
git commit -m "test: convert core battery suites to assertive harness"
```

---

### Task 5: Convert The Remaining Battery, Update The Runner, And Add CI

**Files:**
- Modify: `scripts/battery-cat9-10.js`
- Modify: `scripts/battery-cat11-12.js`
- Modify: `scripts/supplemental-brutal-11.js`
- Modify: `scripts/run-all-255.js`
- Create: `.github/workflows/backend-battery.yml`

- [ ] **Step 1: Convert `scripts/battery-cat9-10.js` to the harness**

At the top of `scripts/battery-cat9-10.js`, import the harness and create the suite:

```js
const { assert, createSuite, finishSuite, runCase } = require("./test-harness");
const suite = createSuite("battery-cat9-10");
```

Replace `runTest(...)` with:

```js
function runTest(id, name, logic, expected, assertion) {
  runCase(suite, id, name, () => {
    const result = logic();
    assertion(result);
    return `Expected: ${expected} | Actual: ${stringifyValue(result)}`;
  });
}
```

Convert representative value and throw cases exactly like this:

```js
runCase(suite, "9.9", "x^121 at 2", () => {
  assert.throws(() => P.parsePolynomial("x^121"), /degree/i);
});

runTest("10.13", "IEEE -> Decimal (1.0 bits)", () => {
  const decoded = I.ieeeToDecimal("0011111111110000000000000000000000000000000000000000000000000000");
  return decoded.finalValue;
}, "Should decode to 1.0.", (result) => {
  assert.strictEqual(result, 1);
});
```

End the file with:

```js
finishSuite(suite);
```

- [ ] **Step 2: Convert `scripts/battery-cat11-12.js` and `scripts/supplemental-brutal-11.js`**

At the top of `scripts/battery-cat11-12.js`, add:

```js
const { assert, createSuite, finishSuite, runCase } = require("./test-harness");
const suite = createSuite("battery-cat11-12");
```

At the top of `scripts/supplemental-brutal-11.js`, add:

```js
const { assert, createSuite, finishSuite, runCase } = require("./test-harness");
const suite = createSuite("supplemental-brutal-11");
```

In `scripts/battery-cat11-12.js`, convert the angle-mode and cross-module checks like this:

```js
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
  return { rad, deg };
}, "Radians succeed; degrees reject the interval.", ({ rad, deg }) => {
  assert.notStrictEqual(rad.summary.approximation, null);
  assert.strictEqual(deg.summary.intervalStatus, "invalid-bracket");
});
```

In `scripts/supplemental-brutal-11.js`, convert `runTest(...)` to:

```js
function runTest(id, name, method, options, assertion) {
  runCase(suite, `S${id}`, name, () => {
    let result;
    if (method === "newton") result = R.runNewtonRaphson(options);
    else if (method === "secant") result = R.runSecant(options);
    else if (method === "falsePosition") result = R.runFalsePosition(options);
    else if (method === "fixedPoint") result = R.runFixedPoint(options);
    else result = R.runBisection(options);
    assertion(result);
    return `Stop: ${result.summary.stopReason} | Interval: ${result.summary.intervalStatus || "N/A"}`;
  });
}
```

Then assert the two newly hardened cases exactly like this:

```js
runTest(1, "Newton with tiny derivative denominator", "newton", {
  expression: "x - 1",
  dfExpression: "1e-315",
  x0: "0",
  machine: { k: 12, mode: "round" },
  stopping: { kind: "iterations", value: 3 }
}, (result) => {
  assert.strictEqual(result.summary.stopReason, "non-finite-evaluation");
  assert.strictEqual(result.summary.approximation, null);
});

runTest(11, "False position discontinuity masquerading as root", "falsePosition", {
  expression: "1/(x-5)",
  interval: { a: "4", b: "6" },
  decisionBasis: "machine",
  machine: { k: 12, mode: "round" },
  stopping: { kind: "epsilon", value: "1e-5" }
}, (result) => {
  assert.strictEqual(result.summary.intervalStatus, "invalid-continuity");
  assert.strictEqual(result.summary.stopReason, "discontinuity-detected");
  assert.strictEqual(result.summary.approximation, null);
});
```

End both files with:

```js
finishSuite(suite);
```

- [ ] **Step 3: Update `scripts/run-all-255.js` to trust exit codes**

Replace the suite loop logic in `scripts/run-all-255.js` with this structure:

```js
const suites = [
  "scripts/battery-cat1-4.js",
  "scripts/battery-cat2-3.js",
  "scripts/convergence-tests.js",
  "scripts/battery-cat9-10.js",
  "scripts/battery-cat11-12.js",
  "scripts/battery-validation.js",
  "scripts/supplemental-brutal-11.js"
];

let failedSuites = 0;

for (const file of suites) {
  const run = spawnSync(process.execPath, [file], {
    cwd: ROOT,
    encoding: "utf8",
    maxBuffer: 20 * 1024 * 1024
  });

  const output = `${run.stdout || ""}${run.stderr || ""}`;
  console.log(`\n===== ${file} =====`);
  process.stdout.write(output);
  console.log(`\n[SUITE STATUS] exit=${run.status}`);

  if (run.status !== 0) {
    failedSuites += 1;
  }
}

console.log(`\n===== RUN SUMMARY =====`);
console.log(`Suites run:      ${suites.length}`);
console.log(`Failed suites:   ${failedSuites}`);

if (failedSuites > 0) {
  process.exitCode = 1;
}
```

- [ ] **Step 4: Add the GitHub Actions workflow**

Create `.github/workflows/backend-battery.yml` with this content:

```yaml
name: Backend Battery

on:
  push:
  pull_request:

jobs:
  verify:
    runs-on: ubuntu-latest

    steps:
      - name: Check out repository
        uses: actions/checkout@v4

      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: "20"

      - name: Run backend audits
        run: |
          node scripts/engine-correctness-audit.js
          node scripts/root-engine-audit.js
          node scripts/run-all-255.js
```

- [ ] **Step 5: Run the full verification path**

Run:

```powershell
node scripts/engine-correctness-audit.js
node scripts/root-engine-audit.js
node scripts/run-all-255.js
```

Expected:
- all three commands exit `0`
- `run-all-255.js` reports `Failed suites:   0`
- no suite is considered passing solely because it printed the expected number of `TEST` labels

- [ ] **Step 6: Commit the final battery and CI task**

```bash
git add scripts/battery-cat9-10.js scripts/battery-cat11-12.js scripts/supplemental-brutal-11.js scripts/run-all-255.js .github/workflows/backend-battery.yml
git commit -m "test: enforce battery assertions in local runs and ci"
```
