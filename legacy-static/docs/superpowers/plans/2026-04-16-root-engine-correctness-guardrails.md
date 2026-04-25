# RootEngine Correctness Guardrails Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prevent Newton-Raphson and Fixed Point from falsely reporting convergence when the iteration has not verified a trustworthy root or fixed point.

**Architecture:** Add targeted guardrail helpers inside `root-engine.js`, then apply them only to Newton-Raphson and Fixed Point. Keep exact-root exits fast, keep Secant/False Position/Bisection behavior unchanged, and use existing row notes plus UI copy to explain rejected convergence.

**Tech Stack:** Plain browser JavaScript, VM-loaded Node audit scripts, existing `MathEngine`, `CalcEngine`, `ExpressionEngine`, and `RootEngine`.

---

## File Structure

- Modify: `scripts/root-engine-audit.js`
  - Adds red-green regression checks for Newton flat-valley false success, Newton exact root with zero derivative, Fixed Point exact hit, and Fixed Point pseudo-convergence.
- Modify: `root-engine.js`
  - Adds convergence helper functions near the existing stop-reason helpers.
  - Updates `runNewtonRaphson()` so near-zero residuals only count as `machine-zero` when the step is stable.
  - Updates `runFixedPoint()` so epsilon success requires exact equality or a shrinking trend.
- Modify: `root-ui.js`
  - Clarifies Newton and Fixed Point solution text when a run reaches a limit without verified convergence.

## Task 1: Add Failing Regression Tests

**Files:**
- Modify: `scripts/root-engine-audit.js`

- [ ] **Step 1: Replace the existing Newton near-zero threshold test with a stable-step case**

In `scripts/root-engine-audit.js`, find the block whose report name is `"Newton near-zero threshold does not claim exact zero"`. Replace that whole block with:

```javascript
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
```

- [ ] **Step 2: Insert correctness guardrail tests**

In `scripts/root-engine-audit.js`, insert this block after the existing `Fixed Point marks cap as reached` check and before the next top-level test block:

```javascript
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

    report.check(
      "Fixed Point rejects constant tiny-step pseudo-convergence",
      "Correctness guardrails",
      "iteration-cap, not tolerance-reached",
      run.summary.stopReason + " after " + run.rows.length + " row(s)",
      run.summary.stopReason === "iteration-cap" && run.rows.length === 100,
      "A constant nonzero step below epsilon is drift, not convergence."
    );
  }
```

- [ ] **Step 3: Run the audit and verify the new tests fail before implementation**

Run:

```powershell
node scripts/root-engine-audit.js
```

Expected before implementation:

```text
[FAIL] Correctness guardrails :: Newton rejects flat-valley machine-zero false success
[FAIL] Correctness guardrails :: Newton exact root wins before zero derivative
[FAIL] Correctness guardrails :: Fixed Point exact fixed value stops as exact-zero
[FAIL] Correctness guardrails :: Fixed Point rejects constant tiny-step pseudo-convergence
```

- [ ] **Step 4: Commit the failing tests**

Run:

```powershell
git add scripts/root-engine-audit.js
git commit -m "test: cover root convergence guardrails"
```

## Task 2: Add Shared Guardrail Helpers

**Files:**
- Modify: `root-engine.js`

- [ ] **Step 1: Add helper functions after `zeroStopReasonForPoint()`**

In `root-engine.js`, place these helpers immediately after `zeroStopReasonForPoint(point)`:

```javascript
  function stepTolerance(stopping) {
    return stopping && stopping.kind === "epsilon" ? stopping.epsilon : C.EPS;
  }

  function relativeStepError(error, nextValue) {
    const nextReal = realNumber(nextValue, "Next iterate");
    return error / Math.max(1, Math.abs(nextReal));
  }

  function stepIsStableForConvergence(error, nextValue, stopping) {
    const tolerance = stepTolerance(stopping);
    return error <= tolerance || relativeStepError(error, nextValue) <= tolerance;
  }

  function exactDifferenceIsZero(left, right) {
    return isStrictZeroValue(C.sub(left, right));
  }

  function fixedPointStepIsShrinking(error, previousError) {
    if (previousError == null) {
      return false;
    }
    const scale = Math.max(1, previousError);
    return error < previousError && Math.abs(previousError - error) > C.EPS * scale;
  }
```

- [ ] **Step 2: Run the audits**

Run:

```powershell
node scripts/root-engine-audit.js
node scripts/engine-correctness-audit.js
```

Expected after helpers only:

```text
root-engine-audit.js still fails the four new correctness guardrail tests.
engine-correctness-audit.js reports Summary: 47/47 passed.
```

- [ ] **Step 3: Commit the helpers**

Run:

```powershell
git add root-engine.js
git commit -m "feat: add root convergence guard helpers"
```

## Task 3: Harden Newton-Raphson Stop Logic

**Files:**
- Modify: `root-engine.js`

- [ ] **Step 1: Replace the Newton loop body**

In `runNewtonRaphson(options)`, replace the current `for (let iter = 1; iter <= stopping.maxIterations; iter += 1) { ... }` loop with this loop:

```javascript
    for (let iter = 1; iter <= stopping.maxIterations; iter += 1) {
      const fn = evaluateFn(fAst, xn, machine, options.angleMode);

      if (isStrictZeroValue(fn.exact)) {
        finalStopReason = "exact-zero";
        rows.push({
          iteration: iter,
          xn,
          fxn: fn.approx,
          dfxn: null,
          xNext: xn,
          error: 0,
          note: "f(x\u2099) is exactly zero"
        });
        break;
      }

      const dfn = evaluateFn(dfAst, xn, machine, options.angleMode);
      const dfVal = realNumber(dfn.approx, "f'(x\u2099)");

      if (Math.abs(dfVal) < C.EPS) {
        finalStopReason = "derivative-zero";
        rows.push({ iteration: iter, xn, fxn: fn.approx, dfxn: dfn.approx, xNext: null, error: null, note: "f\u2032(x) \u2248 0, method cannot continue" });
        break;
      }

      const stepExact = C.div(fn.approx, dfn.approx);
      const stepStored = machineStore(stepExact, machine);
      const xNextExact = C.sub(xn, stepStored);
      const xNext = machineStore(xNextExact, machine);
      const error = Math.abs(realNumber(C.sub(xNext, xn), "Newton error"));

      rows.push({ iteration: iter, xn, fxn: fn.approx, dfxn: dfn.approx, xNext, error, note: "" });

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

      if (stopping.kind === "epsilon" && error < stopping.epsilon) {
        finalStopReason = "tolerance-reached";
        break;
      }
    }
```

- [ ] **Step 2: Run the root audit and verify Newton guardrail tests pass**

Run:

```powershell
node scripts/root-engine-audit.js
```

Expected after Newton change:

```text
[PASS] Correctness guardrails :: Newton rejects flat-valley machine-zero false success
[PASS] Correctness guardrails :: Newton exact root wins before zero derivative
[FAIL] Correctness guardrails :: Fixed Point exact fixed value stops as exact-zero
[FAIL] Correctness guardrails :: Fixed Point rejects constant tiny-step pseudo-convergence
```

- [ ] **Step 3: Commit Newton hardening**

Run:

```powershell
git add root-engine.js
git commit -m "fix: guard newton machine-zero convergence"
```

## Task 4: Harden Fixed Point Stop Logic

**Files:**
- Modify: `root-engine.js`

- [ ] **Step 1: Add previous-error tracking before the Fixed Point loop**

In `runFixedPoint(options)`, immediately after `const DIVERGE_LIMIT = 1e8;`, add:

```javascript
    let previousError = null;
```

- [ ] **Step 2: Replace the Fixed Point loop body**

In `runFixedPoint(options)`, replace the current `for (let iter = 1; iter <= stopping.maxIterations; iter += 1) { ... }` loop with this loop:

```javascript
    for (let iter = 1; iter <= stopping.maxIterations; iter += 1) {
      const gn = evaluateFn(gAst, xn, machine, options.angleMode);
      const xNext = machineStore(gn.approx, machine);
      const xnReal = realNumber(xn, "x\u2099");
      const xNextReal = realNumber(xNext, "g(x\u2099)");
      const error = Math.abs(xNextReal - xnReal);
      const exactFixedPoint = exactDifferenceIsZero(xNext, xn);

      rows.push({ iteration: iter, xn, gxn: xNext, error, note: "" });

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

- [ ] **Step 3: Run the root audit and verify all guardrail tests pass**

Run:

```powershell
node scripts/root-engine-audit.js
```

Expected:

```text
Summary: 44/44 passed
```

- [ ] **Step 4: Run the non-root engine audit**

Run:

```powershell
node scripts/engine-correctness-audit.js
```

Expected:

```text
Summary: 47/47 passed
```

- [ ] **Step 5: Commit Fixed Point hardening**

Run:

```powershell
git add root-engine.js
git commit -m "fix: guard fixed-point pseudo-convergence"
```

## Task 5: Clarify User-Facing Solution Text

**Files:**
- Modify: `root-ui.js`

- [ ] **Step 1: Add an open-method convergence helper before `buildNewtonSteps(run)`**

In `root-ui.js`, immediately before `function buildNewtonSteps(run)`, add:

```javascript
  function openMethodLimitText(run, noun) {
    if (run.summary.stopReason !== "iteration-cap" && run.summary.stopReason !== "iteration-limit") {
      return null;
    }
    return "The method stopped without verifying convergence; the last iterate is " + noun + " \u2248 " + fmtVal(run.summary.approximation, 18) + ".";
  }
```

- [ ] **Step 2: Replace the Newton result line in `buildNewtonSteps(run)`**

Inside the array returned by `buildNewtonSteps(run)`, replace the current stop-reason ternary expression with:

```javascript
      run.summary.stopReason === "derivative-zero"
        ? "The method stopped early because f\u2032(x\u2099) \u2248 0."
        : run.summary.stopReason === "machine-zero"
          ? "The method stopped because the machine-computed f(x\u2099) was near zero and the Newton step was stable."
          : openMethodLimitText(run, "x") || "The approximate root after " + run.rows.length + " iteration" + (run.rows.length !== 1 ? "s" : "") + " is x \u2248 " + fmtVal(run.summary.approximation, 18) + ".",
```

- [ ] **Step 3: Replace the Fixed Point result line in `buildFixedPointSteps(run)`**

Inside the array returned by `buildFixedPointSteps(run)`, replace the current stop-reason ternary expression with:

```javascript
      run.summary.stopReason === "diverged"
        ? "The iteration diverged (|x| exceeded 10\u2078). Try a different g(x) or starting point."
        : run.summary.stopReason === "iteration-cap"
          ? "The iteration reached the safety cap before verifying convergence. Try a different g(x), starting point, or tolerance."
          : run.summary.stopReason === "exact-zero"
            ? "The method stopped because g(x\u2099) equals x\u2099 exactly."
            : openMethodLimitText(run, "x") || "The approximate fixed point after " + run.rows.length + " iteration" + (run.rows.length !== 1 ? "s" : "") + " is x \u2248 " + fmtVal(run.summary.approximation, 18) + ".",
```

- [ ] **Step 4: Run audits after UI copy change**

Run:

```powershell
node scripts/root-engine-audit.js
node scripts/engine-correctness-audit.js
```

Expected:

```text
root-engine-audit.js reports Summary: 44/44 passed.
engine-correctness-audit.js reports Summary: 47/47 passed.
```

- [ ] **Step 5: Commit UI copy**

Run:

```powershell
git add root-ui.js
git commit -m "clarify unverified convergence messaging"
```

## Task 6: Final Verification

**Files:**
- Read: `docs/superpowers/specs/2026-04-16-root-engine-correctness-guardrails-design.md`
- Read: `docs/superpowers/plans/2026-04-16-root-engine-correctness-guardrails.md`
- Verify: `root-engine.js`
- Verify: `root-ui.js`
- Verify: `scripts/root-engine-audit.js`

- [ ] **Step 1: Run the full available audit set**

Run:

```powershell
node scripts/root-engine-audit.js
node scripts/engine-correctness-audit.js
```

Expected:

```text
root-engine-audit.js reports Summary: 44/44 passed.
engine-correctness-audit.js reports Summary: 47/47 passed.
```

- [ ] **Step 2: Verify the spec acceptance criteria manually**

Confirm these outcomes from the audit output or direct run results:

```text
Newton normal convergence still works for x^2 - 2.
Newton exact starting root stops immediately.
Newton flat-valley trap does not report machine-zero.
Fixed Point exact fixed point stops immediately.
Fixed Point g(x) = x + 1e-8 does not report tolerance-reached on iteration 1.
Bisection relative-tolerance tests still pass.
Secant and False Position audit checks still pass.
```

- [ ] **Step 3: Check the final diff**

Run:

```powershell
git status --short
git diff --check
```

Expected:

```text
git diff --check exits with code 0.
Only intended tracked files are modified or staged.
Unrelated untracked tool folders remain unstaged.
```

- [ ] **Step 4: Commit any final fixes if needed**

If Step 3 shows intentional uncommitted tracked changes, run:

```powershell
git add root-engine.js root-ui.js scripts/root-engine-audit.js
git commit -m "fix: harden root convergence correctness"
```

If there are no intentional uncommitted tracked changes, do not create an empty commit.
