# Root Correctness Handling Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Root Finding Workbench results mathematically honest by aligning bounds, stop reasons, residual metadata, and finite-precision arithmetic with the approved correctness contract.

**Architecture:** Keep the existing `RootEngine` / `RootUI` split. Add focused engine metadata and audit checks first, then update UI labels and solution prose to consume the clarified result semantics without changing the layout or DOM IDs.

**Tech Stack:** Standalone browser JavaScript, Node-based audit scripts, existing `MathEngine`, `CalcEngine`, `ExpressionEngine`, and static `index.html`.

---

## Workspace Note

This folder is not a git repository: `Test-Path .git` returns `False`. Each task keeps the skill's checkpoint rhythm, but the commit step is replaced by a local checkpoint note and a focused audit command.

## File Map

- Modify: `C:\Users\Emmy Lou\Downloads\Numerical_Analysis_Final_ver-master\scripts\root-engine-audit.js`
  - Adds failing/characterization checks for root correctness semantics.
- Modify: `C:\Users\Emmy Lou\Downloads\Numerical_Analysis_Final_ver-master\root-engine.js`
  - Owns numeric semantics, bisection bounds, False Position arithmetic, stop reasons, iteration cap metadata, and residual/error/bound summary fields.
- Modify: `C:\Users\Emmy Lou\Downloads\Numerical_Analysis_Final_ver-master\root-ui.js`
  - Owns student-facing stop labels, stopping details, and solution-step prose.
- Read only: `C:\Users\Emmy Lou\Downloads\Numerical_Analysis_Final_ver-master\calc-engine.js`
  - Provides `C.add`, `C.sub`, `C.mul`, `C.div`, `C.machineApproxValue`, `C.requireRealNumber`, `C.isRationalValue`, and `C.isCalcValue`.
- Read only: `C:\Users\Emmy Lou\Downloads\Numerical_Analysis_Final_ver-master\math-engine.js`
  - Provides rational operations and strict zero checks through `M.isZero`.

## Task 1: Add Root Correctness Audit Coverage

**Files:**
- Modify: `C:\Users\Emmy Lou\Downloads\Numerical_Analysis_Final_ver-master\scripts\root-engine-audit.js`

- [ ] **Step 1: Add failing and characterization checks**

Insert this block before `report.finish();` near the end of `scripts/root-engine-audit.js`:

```javascript
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

    const firstBound = C.formatReal(run.rows[0].bound, 8);
    const secondBound = C.formatReal(run.rows[1].bound, 8);
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
    report.check(
      "False Position first interpolation point remains exact-compatible",
      "Correctness contract",
      "4/3",
      rationalText,
      rationalText === "4/3",
      "For x^2 - 2 on [1, 2], c = 2 - 2(1)/(2 - (-1)) = 4/3."
    );
  }

  {
    const run = R.runNewtonRaphson({
      expression: "x + 0.0000000000001",
      dfExpression: "1",
      x0: "0",
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
      "The reference value is 1e-13, so the stop is a numerical threshold, not an exact root."
    );
  }

  {
    const run = R.runSecant({
      expression: "x + 0.0000000000001",
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
      "The first active iterate has a tiny nonzero reference residual."
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
```

- [ ] **Step 2: Run the root audit and confirm the new checks fail**

Run:

```powershell
node scripts\root-engine-audit.js
```

Expected: existing checks pass, and the new correctness contract checks fail for bisection bounds, False Position exact-compatible interpolation, Newton stop reason, Secant stop reason, and Fixed Point cap metadata.

- [ ] **Step 3: Checkpoint**

Record that only `scripts\root-engine-audit.js` has changed in this task.

## Task 2: Fix Bisection Bound Consistency

**Files:**
- Modify: `C:\Users\Emmy Lou\Downloads\Numerical_Analysis_Final_ver-master\root-engine.js`

- [ ] **Step 1: Capture the initial iterated interval**

In `runBisection`, after this line:

```javascript
    const stopping = buildStopping(options, left, right);
```

add:

```javascript
    const initialLeft = left;
    const initialRight = right;
```

- [ ] **Step 2: Use the iterated interval for row bounds**

In the bisection row object, replace:

```javascript
        bound: toleranceFromIterations(leftInput, rightInput, iteration),
```

with:

```javascript
        bound: toleranceFromIterations(initialLeft, initialRight, iteration),
```

- [ ] **Step 3: Run the root audit**

Run:

```powershell
node scripts\root-engine-audit.js
```

Expected: the two bisection machine-decision bound checks pass. The False Position, near-zero stop reason, and cap metadata checks still fail.

- [ ] **Step 4: Checkpoint**

Record changed file: `root-engine.js`.

## Task 3: Preserve Exact-Compatible False Position Interpolation

**Files:**
- Modify: `C:\Users\Emmy Lou\Downloads\Numerical_Analysis_Final_ver-master\root-engine.js`

- [ ] **Step 1: Replace Number interpolation with engine arithmetic**

Inside `runFalsePosition`, replace this block:

```javascript
      const faVal = realNumber(aPoint.machine, "f(a)");
      const fbVal = realNumber(bPoint.machine, "f(b)");
      const denom = fbVal - faVal;

      let midpoint;
      if (Math.abs(denom) < C.EPS) {
        midpoint = iterationValue(M.div(M.add(left, right), TWO), machine, basis);
      } else {
        const aNum = realNumber(left, "a");
        const bNum = realNumber(right, "b");
        const cNum = bNum - fbVal * (bNum - aNum) / denom;
        midpoint = iterationValue(M.parseRational(String(cNum)), machine, basis);
      }
```

with:

```javascript
      const denomExact = C.sub(bPoint.machine, aPoint.machine);
      const denomVal = realNumber(denomExact, "false position denominator");

      let midpoint;
      if (Math.abs(denomVal) < C.EPS) {
        midpoint = iterationValue(C.div(C.add(left, right), TWO), machine, basis);
      } else {
        const width = C.sub(right, left);
        const numerator = C.mul(bPoint.machine, width);
        const step = C.div(numerator, denomExact);
        midpoint = iterationValue(C.sub(right, step), machine, basis);
      }
```

- [ ] **Step 2: Run the root audit**

Run:

```powershell
node scripts\root-engine-audit.js
```

Expected: the False Position exact-compatible interpolation check passes. The near-zero stop reason and cap metadata checks still fail.

- [ ] **Step 3: Checkpoint**

Record changed file: `root-engine.js`.

## Task 4: Add Honest Stop Reasons And Cap Metadata

**Files:**
- Modify: `C:\Users\Emmy Lou\Downloads\Numerical_Analysis_Final_ver-master\root-engine.js`

- [ ] **Step 1: Add zero/cap helper functions**

After `fmtStopResult`, add:

```javascript
  function initialOpenStopReason(stopping) {
    return stopping.kind === "epsilon" ? "iteration-cap" : "iteration-limit";
  }

  function isStrictZeroValue(value) {
    if (C.isRationalValue(value)) {
      return M.isZero(value);
    }
    if (C.isCalcValue(value)) {
      return value.re === 0 && value.im === 0;
    }
    return value === 0;
  }

  function zeroStopReasonForValue(referenceValue) {
    return isStrictZeroValue(referenceValue) ? "exact-zero" : "machine-zero";
  }

  function zeroStopReasonForPoint(point) {
    return point && point.exactAvailable && isStrictZeroValue(point.reference)
      ? "exact-zero"
      : "machine-zero";
  }
```

- [ ] **Step 2: Extend `fmtStopResult`**

Replace:

```javascript
  function fmtStopResult(stopping, rows) {
    const finalError = rows.length ? rows[rows.length - 1].error : null;
    return {
      kind: stopping.kind,
      input: stopping.input,
      iterationsRequired: rows.length,
      epsilonBound: stopping.kind === "epsilon" ? stopping.epsilon : finalError
    };
  }
```

with:

```javascript
  function fmtStopResult(stopping, rows, stopReason) {
    const finalError = rows.length ? rows[rows.length - 1].error : null;
    return {
      kind: stopping.kind,
      input: stopping.input,
      iterationsRequired: rows.length,
      epsilonBound: stopping.kind === "epsilon" ? stopping.epsilon : finalError,
      maxIterations: stopping.maxIterations || rows.length,
      capReached: stopping.kind === "epsilon" && stopReason === "iteration-cap"
    };
  }
```

- [ ] **Step 3: Initialize open-method stop reasons from stopping mode**

In `runNewtonRaphson`, `runSecant`, and `runFixedPoint`, replace:

```javascript
    let finalStopReason = "iteration-limit";
```

with:

```javascript
    let finalStopReason = initialOpenStopReason(stopping);
```

- [ ] **Step 4: Use honest near-zero stop reasons in Newton and Secant**

In `runNewtonRaphson`, replace:

```javascript
      if (Math.abs(fnVal) < C.EPS) {
        finalStopReason = "exact-zero";
```

with:

```javascript
      if (Math.abs(fnVal) < C.EPS) {
        finalStopReason = zeroStopReasonForValue(fn.exact);
```

In `runSecant`, replace:

```javascript
      if (Math.abs(fnVal) < C.EPS) {
        finalStopReason = "exact-zero";
```

with:

```javascript
      if (Math.abs(fnVal) < C.EPS) {
        finalStopReason = zeroStopReasonForValue(fn.exact);
```

- [ ] **Step 5: Pass stop reasons into `fmtStopResult` for open methods**

In `runNewtonRaphson`, replace:

```javascript
      stopping: fmtStopResult(stopping, rows),
```

with:

```javascript
      stopping: fmtStopResult(stopping, rows, finalStopReason),
```

Apply the same replacement in `runSecant` and `runFixedPoint`.

- [ ] **Step 6: Pass stop reasons into `fmtStopResult` for False Position**

Inside `runFalsePosition`, replace this in `earlyResult`:

```javascript
        stopping: fmtStopResult(stopping, resultRows),
```

with:

```javascript
        stopping: fmtStopResult(stopping, resultRows, stopReason),
```

Then replace:

```javascript
        return earlyResult(midpoint, "root-at-midpoint", "exact-zero", rows);
```

with:

```javascript
        return earlyResult(midpoint, "root-at-midpoint", zeroStopReasonForPoint(cPoint), rows);
```

At the end of `runFalsePosition`, replace:

```javascript
    return earlyResult(lastApprox, "valid-bracket", "iteration-limit", rows);
```

with:

```javascript
    return earlyResult(lastApprox, "valid-bracket", initialOpenStopReason(stopping), rows);
```

- [ ] **Step 7: Run the root audit**

Run:

```powershell
node scripts\root-engine-audit.js
```

Expected: the Newton, Secant, and Fixed Point correctness contract checks pass. Existing checks for old open epsilon behavior may need expectation updates from `iteration-limit` to `iteration-cap`.

- [ ] **Step 8: Update old cap expectation if needed**

If the existing check named `Open epsilon mode does not claim convergence after max iterations` still expects `iteration-limit`, change its expected value and assertion to:

```javascript
      "iteration-cap",
      run.summary.stopReason,
      run.summary.stopReason === "iteration-cap",
```

Then rerun:

```powershell
node scripts\root-engine-audit.js
```

Expected: all root-engine audit checks pass.

- [ ] **Step 9: Checkpoint**

Record changed files: `root-engine.js` and `scripts\root-engine-audit.js`.

## Task 5: Add Summary Diagnostics Without Adding UI Surface Area

**Files:**
- Modify: `C:\Users\Emmy Lou\Downloads\Numerical_Analysis_Final_ver-master\root-engine.js`
- Modify: `C:\Users\Emmy Lou\Downloads\Numerical_Analysis_Final_ver-master\scripts\root-engine-audit.js`

- [ ] **Step 1: Add summary helper functions**

After `zeroStopReasonForPoint`, add:

```javascript
  function summaryPackage(approximation, intervalStatus, stopReason, diagnostics) {
    return Object.assign({
      approximation,
      intervalStatus,
      stopReason,
      residual: null,
      residualBasis: "unavailable",
      error: null,
      bound: null,
      stopDetail: ""
    }, diagnostics || {});
  }

  function pointResidual(point, basis) {
    if (!point) {
      return { residual: null, residualBasis: "unavailable" };
    }
    if (basis === "machine") {
      return { residual: point.machine, residualBasis: "machine" };
    }
    return {
      residual: point.reference,
      residualBasis: point.exactAvailable ? "exact" : "reference"
    };
  }

  function lastRow(rows) {
    return rows.length ? rows[rows.length - 1] : null;
  }
```

- [ ] **Step 2: Use diagnostics in bracket summaries**

In `runFalsePosition`, update `earlyResult` so its `summary` field is built like this:

```javascript
        summary: summaryPackage(approximation, intervalStatus, stopReason, {
          residual: resultRows.length ? pointResidual(resultRows[resultRows.length - 1].fc, basis).residual : null,
          residualBasis: resultRows.length ? pointResidual(resultRows[resultRows.length - 1].fc, basis).residualBasis : "unavailable",
          error: resultRows.length ? resultRows[resultRows.length - 1].error : null,
          bound: resultRows.length ? resultRows[resultRows.length - 1].bound : null
        }),
```

In `runBisection`, replace each direct summary object passed to `resultPackage` with `summaryPackage(...)`. For the final successful return, use:

```javascript
    const finalRow = lastRow(rows);
    const residualData = finalRow ? pointResidual(finalRow.fc, basis) : { residual: null, residualBasis: "unavailable" };
    return resultPackage(options, ast, machine, leftPoint, rightPoint, stopping, summaryPackage(
      finalRow ? finalRow.c : C.div(C.add(left, right), TWO),
      "valid-bracket",
      options.stopping.kind === "epsilon" ? "tolerance-reached" : "iteration-limit",
      {
        residual: residualData.residual,
        residualBasis: residualData.residualBasis,
        error: finalRow ? finalRow.error : null,
        bound: finalRow ? finalRow.bound : null
      }
    ), rows);
```

For invalid bracket summaries, call:

```javascript
summaryPackage(null, "invalid-bracket", "invalid-starting-interval")
```

- [ ] **Step 3: Use diagnostics in open-method summaries**

Before each open-method return, compute the final diagnostic values.

For Newton and Secant, add before the return:

```javascript
    const finalResidual = approx != null ? evaluateFn(fAst, approx, machine, options.angleMode).approx : null;
    const finalError = lastRow && lastRow.error != null ? lastRow.error : null;
```

Then replace each open-method summary object with:

```javascript
      summary: summaryPackage(approx, null, finalStopReason, {
        residual: finalResidual,
        residualBasis: finalResidual == null ? "unavailable" : "machine",
        error: finalError
      }),
```

For Fixed Point, add before the return:

```javascript
    const finalResidual = approx != null ? C.sub(evaluateFn(gAst, approx, machine, options.angleMode).approx, approx) : null;
    const finalError = lastRow && lastRow.error != null ? lastRow.error : null;
```

Then use the same `summaryPackage` shape with `residualBasis: "machine"` when `finalResidual` exists.

- [ ] **Step 4: Add audit checks for diagnostic fields**

In `scripts/root-engine-audit.js`, add this block before `report.finish();`:

```javascript
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
```

- [ ] **Step 5: Run the root audit**

Run:

```powershell
node scripts\root-engine-audit.js
```

Expected: all root-engine audit checks pass.

- [ ] **Step 6: Checkpoint**

Record changed files: `root-engine.js` and `scripts\root-engine-audit.js`.

## Task 6: Update Student-Facing Stop Labels And Prose

**Files:**
- Modify: `C:\Users\Emmy Lou\Downloads\Numerical_Analysis_Final_ver-master\root-ui.js`

- [ ] **Step 1: Update stop reason labels**

In `formatStopReason`, replace the map entries around `exact-zero` and `iteration-limit` with:

```javascript
      "iteration-limit": "Completed the requested iterations",
      "iteration-cap": "Stopped at the safety iteration cap",
      "tolerance-reached": "Reached the requested tolerance",
      "tolerance-already-met": "Initial interval already satisfies the tolerance",
      "endpoint-root": "An endpoint is already a root",
      "exact-zero": "Reference value is exactly zero",
      "machine-zero": "Machine value is zero or near zero",
```

Keep the existing `invalid-starting-interval`, `derivative-zero`, `stagnation`, and `diverged` entries.

- [ ] **Step 2: Make stopping details mention cap exhaustion**

At the start of the epsilon branch in `formatStoppingDetails`, add:

```javascript
      if (run.stopping.capReached) {
        return "ε = " + run.stopping.input + ", stopped after " + run.stopping.maxIterations + " attempts without reaching tolerance";
      }
```

The full branch should read:

```javascript
    if (run.stopping.kind === "epsilon") {
      if (run.stopping.capReached) {
        return "ε = " + run.stopping.input + ", stopped after " + run.stopping.maxIterations + " attempts without reaching tolerance";
      }
      const suffix = run.summary.stopReason === "tolerance-reached"
        ? ", iterations = " + run.stopping.iterationsRequired
        : ", iterations tried = " + run.stopping.iterationsRequired;
      return "ε = " + run.stopping.input + suffix;
    }
```

- [ ] **Step 3: Update Newton prose for machine-zero stops**

In `buildNewtonSteps`, replace the fourth array item with:

```javascript
      run.summary.stopReason === "derivative-zero"
        ? "The method stopped early because f′(xₙ) ≈ 0."
        : run.summary.stopReason === "machine-zero"
          ? "The method stopped because the machine-computed f(xₙ) was zero or below the numerical threshold."
          : "The approximate root after " + run.rows.length + " iteration" + (run.rows.length !== 1 ? "s" : "") + " is x ≈ " + fmtVal(run.summary.approximation, 18) + ".",
```

- [ ] **Step 4: Update Secant prose for machine-zero and stagnation stops**

In `buildSecantSteps`, replace the fourth array item with:

```javascript
      run.summary.stopReason === "stagnation"
        ? "The method stopped because f(xₙ) and f(xₙ₋₁) made the secant denominator zero or near zero."
        : run.summary.stopReason === "machine-zero"
          ? "The method stopped because the machine-computed f(xₙ) was zero or below the numerical threshold."
          : "The approximate root after " + run.rows.length + " iteration" + (run.rows.length !== 1 ? "s" : "") + " is x ≈ " + fmtVal(run.summary.approximation, 18) + ".",
```

- [ ] **Step 5: Update Fixed Point prose for cap exhaustion**

In `buildFixedPointSteps`, replace the fourth array item with:

```javascript
      run.summary.stopReason === "diverged"
        ? "The iteration diverged (|x| exceeded 10⁸). Try a different g(x) or starting point."
        : run.summary.stopReason === "iteration-cap"
          ? "The iteration reached the safety cap before satisfying the tolerance. Try a different g(x), starting point, or tolerance."
          : "The approximate fixed point after " + run.rows.length + " iteration" + (run.rows.length !== 1 ? "s" : "") + " is x ≈ " + fmtVal(run.summary.approximation, 18) + ".",
```

- [ ] **Step 6: Run the root audit**

Run:

```powershell
node scripts\root-engine-audit.js
```

Expected: all root-engine audit checks pass. This script does not inspect DOM prose, but it confirms engine data still matches the UI assumptions.

- [ ] **Step 7: Checkpoint**

Record changed file: `root-ui.js`.

## Task 7: Run Full Verification

**Files:**
- Verify: `C:\Users\Emmy Lou\Downloads\Numerical_Analysis_Final_ver-master\scripts\root-engine-audit.js`
- Verify: `C:\Users\Emmy Lou\Downloads\Numerical_Analysis_Final_ver-master\scripts\engine-correctness-audit.js`
- Verify: `C:\Users\Emmy Lou\Downloads\Numerical_Analysis_Final_ver-master\scripts\ieee754-audit.js`

- [ ] **Step 1: Run root audit**

Run:

```powershell
node scripts\root-engine-audit.js
```

Expected: summary reports all checks passed.

- [ ] **Step 2: Run shared engine audit**

Run:

```powershell
node scripts\engine-correctness-audit.js
```

Expected: summary reports all checks passed.

- [ ] **Step 3: Run IEEE audit**

Run:

```powershell
node scripts\ieee754-audit.js
```

Expected: summary reports all checks passed.

- [ ] **Step 4: Manual browser smoke check**

Open `C:\Users\Emmy Lou\Downloads\Numerical_Analysis_Final_ver-master\index.html` in a browser and check these root flows:

1. Bisection: `f(x) = x - 1.4`, `a = 1.11`, `b = 1.99`, `k = 2`, chopping, machine signs decide, `n = 2`.
   - Expected: row bounds match the stored interval sequence, first `0.4`, then `0.2`.
2. Newton: `f(x) = x + 0.0000000000001`, `f′(x) = 1`, `x0 = 0`, `k = 12`, rounding, `n = 4`.
   - Expected: stopping result says machine value is zero or near zero, not exact root.
3. Fixed Point: `g(x) = x + 1`, `x0 = 0`, `k = 12`, rounding, `ε = 0.1`.
   - Expected: stopping details mention the safety iteration cap.

- [ ] **Step 5: Final checkpoint**

Final changed files should be:

```text
C:\Users\Emmy Lou\Downloads\Numerical_Analysis_Final_ver-master\scripts\root-engine-audit.js
C:\Users\Emmy Lou\Downloads\Numerical_Analysis_Final_ver-master\root-engine.js
C:\Users\Emmy Lou\Downloads\Numerical_Analysis_Final_ver-master\root-ui.js
```

The spec and plan files remain part of the planning record:

```text
C:\Users\Emmy Lou\Downloads\Numerical_Analysis_Final_ver-master\docs\superpowers\specs\2026-04-15-root-correctness-handling-design.md
C:\Users\Emmy Lou\Downloads\Numerical_Analysis_Final_ver-master\docs\superpowers\plans\2026-04-15-root-correctness-handling.md
```

## Self-Review

- Spec coverage: Tasks 1-5 cover engine result semantics, bisection bounds, False Position arithmetic, stop reasons, residual/error metadata, cap metadata, and audit coverage. Task 6 covers UI labels and prose. Task 7 covers verification.
- Incomplete marker scan: no incomplete markers are intentionally present in this plan.
- Type consistency: the plan uses existing root result objects, adds `summary.residual`, `summary.residualBasis`, `summary.error`, `summary.bound`, `summary.stopDetail`, `stopping.maxIterations`, and `stopping.capReached`, and updates UI code to read only the new stopping fields needed for display.
