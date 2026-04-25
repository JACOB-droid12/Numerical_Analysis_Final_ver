# Root Module Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Harden the Roots module so invalid brackets, angle-mode changes, exact-vs-machine decision wording, and sign-disagreement warnings are clear and safe for students.

**Architecture:** Keep the bisection algorithm in `root-engine.js` and keep user-facing copy/rendering in `app.js` and `index.html`. Add only small data-shape improvements to the root result package so the UI can render consistent warnings and solution steps without re-solving.

**Tech Stack:** Standalone browser app, plain JavaScript, HTML, CSS, Node-based audit scripts, Playwright CLI for browser verification.

---

### Task 1: Add Root Sign Disagreement Metadata

**Files:**
- Modify: `root-engine.js`
- Modify: `scripts/root-engine-audit.js`

- [ ] **Step 1: Add failing audit coverage for endpoint disagreement notes**

Add a case to `scripts/root-engine-audit.js` after the existing sign-analysis test:

```javascript
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
```

- [ ] **Step 2: Run the audit and verify it fails**

Run:

```powershell
node scripts/root-engine-audit.js
```

Expected: the new checks fail because `run.initial.note` is undefined and the row note only covers midpoint `c`.

- [ ] **Step 3: Implement note helpers in `root-engine.js`**

Add helper functions near `makeInitial()`:

```javascript
  function disagreementLabels(labels, exactSigns, machineSigns) {
    const out = [];
    for (const label of labels) {
      if (exactSigns[label] !== machineSigns[label]) {
        out.push(label);
      }
    }
    return out;
  }

  function formatDisagreementNote(labels) {
    if (!labels.length) {
      return "";
    }
    if (labels.length === 1) {
      return "Exact and machine signs differ at " + labels[0] + ".";
    }
    return "Exact and machine signs differ at " + labels.join(", ") + ".";
  }
```

Then update `makeInitial()`:

```javascript
  function makeInitial(leftPoint, rightPoint) {
    const labels = disagreementLabels(
      ["a", "b"],
      { a: leftPoint.exactSign, b: rightPoint.exactSign },
      { a: leftPoint.machineSign, b: rightPoint.machineSign }
    );
    return {
      left: leftPoint,
      right: rightPoint,
      hasDisagreement: labels.length > 0,
      disagreementPoints: labels,
      note: formatDisagreementNote(labels)
    };
  }
```

Update row note assembly:

```javascript
        note: formatDisagreementNote(disagreementLabels(
          ["a", "b", "c"],
          { a: aPoint.exactSign, b: bPoint.exactSign, c: cPoint.exactSign },
          { a: aPoint.machineSign, b: bPoint.machineSign, c: cPoint.machineSign }
        ))
```

- [ ] **Step 4: Run the audit and verify it passes**

Run:

```powershell
node scripts/root-engine-audit.js
```

Expected: all checks pass, including the new endpoint and row note checks.

### Task 2: Render Invalid Brackets Safely

**Files:**
- Modify: `app.js`

- [ ] **Step 1: Add invalid-bracket rendering logic**

Update `renderRootRun(run)` so the approximate root card avoids displaying a left endpoint for invalid intervals:

```javascript
    const approximationText = run.summary.intervalStatus === "invalid-bracket"
      ? "N/A"
      : shortValue(run.summary.approximation, 18, 12);
    setContent("root-approx", approximationText, false);
```

This replaces the existing direct `setContent("root-approx", shortValue(...))` call.

- [ ] **Step 2: Update root status message for invalid brackets**

Keep the existing invalid-bracket status message, but ensure it does not include the approximation value. The current conditional already satisfies this:

```javascript
      const message = run.summary.intervalStatus === "invalid-bracket"
        ? "This interval does not bracket a sign change with the selected decision rule. Try a wider interval or switch the decision rule."
        : "Root module updated. Approximate root = " + shortValue(run.summary.approximation, 14, 10) + ".";
```

- [ ] **Step 3: Browser-check invalid bracket behavior**

Use the Roots module with:

```text
f(x) = x^2 + 1
a = 0
b = 1
```

Expected: `Interval status` says no sign change, and `Approximate root` says `N/A`.

### Task 3: Align Solution Text With Decision Basis

**Files:**
- Modify: `app.js`

- [ ] **Step 1: Add basis-aware sign helpers**

Add helpers near `rootSignWord(sign)`:

```javascript
  function rootDecisionSign(point, basis) {
    return basis === "machine" ? point.machineSign : point.exactSign;
  }

  function rootDecisionBasisLabel(basis) {
    return basis === "machine" ? "machine" : "exact";
  }

  function rootInitialSignNote(run) {
    return run.initial && run.initial.note ? " " + run.initial.note : "";
  }
```

- [ ] **Step 2: Update `buildRootSolutionSteps(run)` endpoint sign prose**

Replace the second opening step with:

```javascript
      "Check the endpoint signs using " + rootDecisionBasisLabel(run.decisionBasis) + " signs: f(a) is " +
        rootSignWord(rootDecisionSign(run.initial.left, run.decisionBasis)) +
        " and f(b) is " +
        rootSignWord(rootDecisionSign(run.initial.right, run.decisionBasis)) +
        "." + rootInitialSignNote(run)
```

- [ ] **Step 3: Update endpoint-root prose to name the selected basis**

For `root-at-a`, use:

```javascript
        "The left endpoint is a root under the selected " + rootDecisionBasisLabel(run.decisionBasis) + " sign rule, so no bisection iterations are needed.",
```

For `root-at-b`, use:

```javascript
        "The right endpoint is a root under the selected " + rootDecisionBasisLabel(run.decisionBasis) + " sign rule, so no bisection iterations are needed.",
```

- [ ] **Step 4: Browser-check machine-decision prose**

Use:

```text
f(x) = ((10000 + x) - 10000)
a = -2
b = 2
k = 1
Machine rule = Chopping
Signs used to choose the next interval = Machine signs decide
```

Expected: solution text says it is using machine signs, reports `f(b)` as zero, and does not say `f(b)` is positive.

### Task 4: Harden Angle-Mode Behavior

**Files:**
- Modify: `app.js`
- Modify: `index.html`

- [ ] **Step 1: Include Roots in angle-mode refresh**

Update `refreshComputedViews()` to recompute Roots when a Roots run exists:

```javascript
    if (state.rootRun) {
      computeRootModule();
    }
```

Place it after the polynomial refresh so angle-mode changes affect the active Roots result.

- [ ] **Step 2: Add Roots trig hint copy**

Update the Roots input hint in `index.html` to:

```html
            <p class="input-hint">Enter f(x) as a one-variable expression in x. Try <code>x^2 - 2</code>, <code>sin(x) - x/2</code>, or <code>e^(-x) - x</code>. Trig functions use the current <strong>Angle</strong> setting in the sidebar.</p>
```

- [ ] **Step 3: Browser-check stale angle behavior**

Use:

```text
f(x) = sin(x) - x/2
a = 1
b = 2
n = 4
```

Run in DEG, then toggle to RAD.

Expected: the Roots result recomputes or clears automatically; it must not keep showing the DEG invalid-bracket result after the status chip says RAD.

### Task 5: Final Verification

**Files:**
- Test: `scripts/engine-correctness-audit.js`
- Test: `scripts/root-engine-audit.js`
- Browser: `index.html` served locally

- [ ] **Step 1: Run full automated audits**

Run:

```powershell
node scripts/engine-correctness-audit.js
node scripts/root-engine-audit.js
```

Expected:

```text
Summary: 44/44 passed
Summary: 10/10 passed
```

- [ ] **Step 2: Run browser smoke checks**

Serve the app:

```powershell
python -m http.server 8000 --bind 127.0.0.1
```

Open:

```text
http://127.0.0.1:8000/index.html
```

Check the four scenarios from Tasks 2, 3, and 4 plus the baseline:

```text
f(x) = x^2 - 2
a = 1
b = 2
n = 4
Expected approximate root = 1.4375
Expected bound = 0.0625
```

- [ ] **Step 3: Clean up local test server and report results**

Stop the local HTTP server. Report the changed files and the audit/browser outcomes.

## Self-Review

- Spec coverage: invalid brackets are covered by Task 2; angle mode is covered by Task 4; decision-basis prose is covered by Task 3; sign-disagreement warnings are covered by Task 1.
- Placeholder scan: this plan contains concrete files, code snippets, commands, and expected outputs.
- Type consistency: the plan uses existing `run.initial`, `run.rows`, `run.decisionBasis`, `exactSign`, and `machineSign` shapes, with new `note` and `disagreementPoints` metadata added in Task 1.
- Git note: this workspace is not a git repository, so the normal commit steps are intentionally omitted.
