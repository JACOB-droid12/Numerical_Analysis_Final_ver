# Bisection Root Module Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dedicated `Roots` tab that solves `f(x) = 0` with the Bisection Method, reuses the app's `k`-digit chop/round model, supports iteration-or-tolerance stopping, and shows exact or machine sign analysis in a tabular result view.

**Architecture:** Keep root-finding math in a new `root-engine.js` layer, keep `app.js` focused on DOM state and rendering, and extend the existing expression/calculator layer only where the approved design requires broader one-variable input support. Verify the math layer first with Node audit scripts, then wire the static browser UI and finish with manual browser checks.

**Tech Stack:** Static HTML, vanilla JavaScript, existing `MathEngine` / `CalcEngine` / `ExpressionEngine`, CSS, Node audit scripts, manual browser verification on Windows.

**Workspace note:** This folder is not currently a git repository, so each checkpoint step uses a conditional commit command that prints a skip message when `.git` is absent.

---

## File Structure

- Modify: `calc-engine.js`
  - Add real-valued helpers needed for root-friendly transcendental input and general real powers.
- Modify: `expression-engine.js`
  - Route supported transcendental calls and `^` evaluation through the updated calculator helpers.
- Create: `root-engine.js`
  - Own interval validation, stopping formulas, sign packaging, and the bisection loop.
- Modify: `scripts/engine-correctness-audit.js`
  - Add regression checks for new expression support used by the root module.
- Create: `scripts/root-engine-audit.js`
  - Verify root-engine bootstrap, bracket validation, stopping formulas, endpoint roots, and sign-disagreement packaging.
- Modify: `index.html`
  - Add the `Roots` tab and panel markup and load `root-engine.js` before `app.js`.
- Modify: `styles.css`
  - Style the root module controls, summary cards, reasoning note, and iteration table.
- Modify: `app.js`
  - Add root-module state, reset helpers, render helpers, event listeners, and compute flow.
- Modify: `README.md`
  - Document the new audit commands and the Roots module entry point.

### Task 1: Extend Expression Support For Root Inputs

**Files:**
- Modify: `calc-engine.js`
- Modify: `expression-engine.js`
- Modify: `scripts/engine-correctness-audit.js`

- [ ] **Step 1: Write the failing engine audit for the approved transcendental examples**

```js
  {
    const trig = E.evaluateComparison(
      E.parseExpression("sin(x) - x/2", { allowVariable: true }),
      { k: 6, mode: "round" },
      { x: M.parseRational("1"), angleMode: "rad" },
      { expression: "sin(x) - x/2" }
    );

    report.check(
      "sin(x) - x/2 evaluates in radian mode",
      "Transcendental support",
      "0.341471",
      C.formatReal(trig.step.approx.re, 8),
      C.formatReal(trig.step.approx.re, 8) === "0.341471"
    );
  }

  {
    const expo = E.evaluateComparison(
      E.parseExpression("e^(-x) - x", { allowVariable: true }),
      { k: 6, mode: "round" },
      { x: M.parseRational("1"), angleMode: "rad" },
      { expression: "e^(-x) - x" }
    );

    report.check(
      "e^(-x) - x supports real exponents",
      "Transcendental support",
      "-0.632121",
      C.formatReal(expo.step.approx.re, 8),
      C.formatReal(expo.step.approx.re, 8) === "-0.632121"
    );
  }
```

- [ ] **Step 2: Run the shared engine audit and confirm the new cases fail**

Run:

```powershell
node scripts/engine-correctness-audit.js
```

Expected:

```text
[FAIL] Transcendental support :: sin(x) - x/2 evaluates in radian mode
Note: Unsupported function: sin
```

- [ ] **Step 3: Add the calculator helpers that the new expressions require**

```js
  function sinValue(value, angleMode) {
    const theta = toRadians(requireRealNumber(value, "sin() input"), angleMode || "deg");
    return makeCalc(Math.sin(theta), 0);
  }

  function expValue(value) {
    return makeCalc(Math.exp(requireRealNumber(value, "exp() input")), 0);
  }

  function powValue(base, exponent) {
    if (isRationalValue(exponent) && exponent.sign >= 0 && exponent.den === 1n) {
      return powInt(base, exponent);
    }
    const realBase = requireRealNumber(base, "Base");
    const realExponent = requireRealNumber(exponent, "Exponent");
    if (realBase < 0 && Math.abs(realExponent - Math.round(realExponent)) > EPS) {
      throw new Error("Fractional powers of negative bases are not supported.");
    }
    return makeCalc(Math.pow(realBase, realExponent), 0);
  }
```

Export the new helpers from `globalScope.CalcEngine`.

- [ ] **Step 4: Route `ExpressionEngine` calls and `^` evaluation through those helpers**

```js
      if (name === "sin") {
        if (ast.args.length !== 1) {
          throw new Error("sin() expects exactly one argument.");
        }
        return C.sinValue(evaluateValue(ast.args[0], env), env.angleMode || "deg");
      }
      if (name === "exp") {
        if (ast.args.length !== 1) {
          throw new Error("exp() expects exactly one argument.");
        }
        return C.expValue(evaluateValue(ast.args[0], env));
      }
```

Use the same power helper in both binary evaluation paths:

```js
    if (op === "^") {
      return C.powValue(left, right);
    }
```

- [ ] **Step 5: Re-run the shared engine audit until the old and new checks pass**

Run:

```powershell
node scripts/engine-correctness-audit.js
```

Expected:

```text
[PASS] Transcendental support :: sin(x) - x/2 evaluates in radian mode
[PASS] Transcendental support :: e^(-x) - x supports real exponents
Summary: all checks passed
```

- [ ] **Step 6: Checkpoint the evaluator work**

Run:

```powershell
if (Test-Path .git) {
  git add calc-engine.js expression-engine.js scripts/engine-correctness-audit.js
  git commit -m "feat: add root-friendly transcendental expression support"
} else {
  Write-Output "Skipping commit: workspace has no .git directory."
}
```

Expected:

```text
Skipping commit: workspace has no .git directory.
```

### Task 2: Scaffold `RootEngine` And Its Audit Harness

**Files:**
- Create: `root-engine.js`
- Create: `scripts/root-engine-audit.js`

- [ ] **Step 1: Write the failing audit harness for the new engine**

```js
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
    R: context.RootEngine
  };
}

const { R } = loadEngines();
console.log(typeof R.runBisection);
process.exitCode = typeof R.runBisection === "function" ? 0 : 1;
```

- [ ] **Step 2: Run the new audit and confirm it fails because the file does not exist yet**

Run:

```powershell
node scripts/root-engine-audit.js
```

Expected:

```text
Error: ENOENT: no such file or directory, open '...\\root-engine.js'
```

- [ ] **Step 3: Create the bootstrap file with the stable public API name**

```js
"use strict";

(function initRootEngine(globalScope) {
  const M = globalScope.MathEngine;
  const C = globalScope.CalcEngine;
  const E = globalScope.ExpressionEngine;
  if (!M || !C || !E) {
    throw new Error("MathEngine, CalcEngine, and ExpressionEngine must be loaded before RootEngine.");
  }

  function runBisection() {
    throw new Error("runBisection is not implemented yet.");
  }

  globalScope.RootEngine = {
    runBisection
  };
})(window);
```

- [ ] **Step 4: Re-run the bootstrap audit and verify the engine is discoverable**

Run:

```powershell
node scripts/root-engine-audit.js
```

Expected:

```text
function
```

- [ ] **Step 5: Checkpoint the new engine scaffold**

Run:

```powershell
if (Test-Path .git) {
  git add root-engine.js scripts/root-engine-audit.js
  git commit -m "feat: scaffold root engine"
} else {
  Write-Output "Skipping commit: workspace has no .git directory."
}
```

Expected:

```text
Skipping commit: workspace has no .git directory.
```

### Task 3: Implement Bisection Logic In `root-engine.js`

**Files:**
- Modify: `root-engine.js`
- Modify: `scripts/root-engine-audit.js`

- [ ] **Step 1: Replace the bootstrap audit with concrete bisection checks**

```js
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

    report.check("Iteration mode returns four rows", "Bisection loop", "4", String(run.rows.length), run.rows.length === 4);
    report.check("Latest midpoint after four iterations", "Bisection loop", "1.4375", C.formatReal(C.requireRealNumber(run.summary.approximation, "Approximation"), 8), C.formatReal(C.requireRealNumber(run.summary.approximation, "Approximation"), 8) === "1.4375");
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
      expression: "x - 2",
      interval: { a: "2", b: "5" },
      machine: { k: 6, mode: "chop" },
      stopping: { kind: "iterations", value: 5 },
      decisionBasis: "machine",
      signDisplay: "machine",
      angleMode: "rad"
    });

    report.check("Endpoint root exits immediately", "Edge cases", "root-at-a", run.summary.intervalStatus, run.summary.intervalStatus === "root-at-a");
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
  }
```

- [ ] **Step 2: Run the root audit and capture the expected failures**

Run:

```powershell
node scripts/root-engine-audit.js
```

Expected:

```text
[FAIL] Bisection loop :: Iteration mode returns four rows
[FAIL] Stopping formulas :: Tolerance mode computes required iterations
```

- [ ] **Step 3: Add the numeric helpers that every bisection run needs**

```js
  function parseScalarInput(text, label) {
    const ast = E.parseExpression(String(text), { allowVariable: false });
    const value = E.evaluateValue(ast, { angleMode: "rad" });
    const real = C.requireRealNumber(value, label);
    return M.parseRational(String(real));
  }

  function iterationsFromTolerance(aValue, bValue, epsilonValue) {
    const width = Math.abs(C.requireRealNumber(C.sub(bValue, aValue), "Interval width"));
    const epsilon = C.requireRealNumber(epsilonValue, "Tolerance");
    if (!(epsilon > 0)) {
      throw new Error("Tolerance epsilon must be greater than 0.");
    }
    return Math.max(0, Math.ceil(Math.log2(width / epsilon)));
  }

  function toleranceFromIterations(aValue, bValue, iterations) {
    const width = Math.abs(C.requireRealNumber(C.sub(bValue, aValue), "Interval width"));
    if (!Number.isInteger(iterations) || iterations < 0) {
      throw new Error("Iteration count must be a non-negative integer.");
    }
    return width / Math.pow(2, iterations);
  }
```

- [ ] **Step 4: Package each function evaluation with exact and machine signs**

```js
  function classifySign(value) {
    const real = C.requireRealNumber(value, "Bisection values");
    if (Math.abs(real) < C.EPS) {
      return 0;
    }
    return real < 0 ? -1 : 1;
  }

  function evaluatePoint(ast, xValue, machine, angleMode) {
    const env = { x: xValue, angleMode: angleMode || "rad" };
    const exactAvailable = E.isExactCompatible(ast, env);
    const reference = exactAvailable ? E.evaluateExact(ast, env) : E.evaluateValue(ast, env);
    const comparison = E.evaluateComparison(ast, machine, env, { expression: E.formatExpression(ast) });
    return {
      x: xValue,
      exactAvailable,
      reference,
      machine: comparison.step.approx,
      exactSign: classifySign(reference),
      machineSign: classifySign(comparison.step.approx),
      canonical: comparison.canonical
    };
  }
```

- [ ] **Step 5: Implement the bisection loop and return a stable result package**

```js
  function runBisection(options) {
    const ast = E.parseExpression(String(options.expression), { allowVariable: true });
    const machine = options.machine;
    let left = parseScalarInput(options.interval.a, "Left endpoint a");
    let right = parseScalarInput(options.interval.b, "Right endpoint b");
    if (C.requireRealNumber(left, "Left endpoint a") >= C.requireRealNumber(right, "Right endpoint b")) {
      throw new Error("Interval must satisfy a < b.");
    }

    const leftPoint = evaluatePoint(ast, left, machine, options.angleMode);
    const rightPoint = evaluatePoint(ast, right, machine, options.angleMode);
    const chosenLeftSign = options.decisionBasis === "machine" ? leftPoint.machineSign : leftPoint.exactSign;
    const chosenRightSign = options.decisionBasis === "machine" ? rightPoint.machineSign : rightPoint.exactSign;
    const stopping = options.stopping.kind === "epsilon"
      ? {
          kind: "epsilon",
          input: String(options.stopping.value),
          iterationsRequired: iterationsFromTolerance(left, right, parseScalarInput(options.stopping.value, "Tolerance epsilon")),
          epsilonBound: C.requireRealNumber(parseScalarInput(options.stopping.value, "Tolerance epsilon"), "Tolerance epsilon")
        }
      : {
          kind: "iterations",
          input: Number(options.stopping.value),
          iterationsRequired: Number(options.stopping.value),
          epsilonBound: toleranceFromIterations(left, right, Number(options.stopping.value))
        };

    if (chosenLeftSign * chosenRightSign > 0) {
      return {
        expression: options.expression,
        canonical: E.formatExpression(ast),
        machine,
        decisionBasis: options.decisionBasis,
        signDisplay: options.signDisplay,
        initial: { left: leftPoint, right: rightPoint, hasDisagreement: leftPoint.exactSign !== leftPoint.machineSign || rightPoint.exactSign !== rightPoint.machineSign },
        stopping,
        summary: { approximation: left, intervalStatus: "invalid-bracket", stopReason: "invalid-starting-interval" },
        rows: []
      };
    }

    const rows = [];
    let currentLeft = left;
    let currentRight = right;

    for (let iteration = 1; iteration <= stopping.iterationsRequired; iteration += 1) {
      const midpoint = C.div(C.add(currentLeft, currentRight), M.makeRational(1, 2n, 1n));
      const aPoint = evaluatePoint(ast, currentLeft, machine, options.angleMode);
      const bPoint = evaluatePoint(ast, currentRight, machine, options.angleMode);
      const cPoint = evaluatePoint(ast, midpoint, machine, options.angleMode);
      const leftSign = options.decisionBasis === "machine" ? aPoint.machineSign : aPoint.exactSign;
      const midSign = options.decisionBasis === "machine" ? cPoint.machineSign : cPoint.exactSign;
      const keepLeftHalf = leftSign === 0 || leftSign * midSign <= 0;

      rows.push({
        iteration,
        a: currentLeft,
        b: currentRight,
        c: midpoint,
        fa: aPoint,
        fb: bPoint,
        fc: cPoint,
        exactSigns: { a: aPoint.exactSign, b: bPoint.exactSign, c: cPoint.exactSign },
        machineSigns: { a: aPoint.machineSign, b: bPoint.machineSign, c: cPoint.machineSign },
        decision: keepLeftHalf ? "left" : "right",
        width: Math.abs(C.requireRealNumber(C.sub(currentRight, currentLeft), "Interval width")),
        bound: toleranceFromIterations(left, right, iteration),
        note: cPoint.exactSign !== cPoint.machineSign ? "Exact and machine midpoint signs differ." : ""
      });

      if (keepLeftHalf) {
        currentRight = midpoint;
      } else {
        currentLeft = midpoint;
      }
    }

    return {
      expression: options.expression,
      canonical: E.formatExpression(ast),
      machine,
      decisionBasis: options.decisionBasis,
      signDisplay: options.signDisplay,
      initial: { left: leftPoint, right: rightPoint, hasDisagreement: leftPoint.exactSign !== leftPoint.machineSign || rightPoint.exactSign !== rightPoint.machineSign },
      stopping,
      summary: { approximation: rows.length ? rows[rows.length - 1].c : C.div(C.add(left, right), M.makeRational(1, 2n, 1n)), intervalStatus: "valid-bracket", stopReason: options.stopping.kind === "epsilon" ? "tolerance-reached" : "iteration-limit" },
      rows
    };
  }
```

Export the finished API:

```js
  globalScope.RootEngine = {
    iterationsFromTolerance,
    toleranceFromIterations,
    runBisection
  };
```

- [ ] **Step 6: Re-run the root audit until the new checks pass**

Run:

```powershell
node scripts/root-engine-audit.js
```

Expected:

```text
[PASS] Bisection loop :: Iteration mode returns four rows
[PASS] Stopping formulas :: Tolerance mode computes required iterations
[PASS] Edge cases :: Endpoint root exits immediately
[PASS] Edge cases :: Invalid bracket is reported
```

- [ ] **Step 7: Checkpoint the core root logic**

Run:

```powershell
if (Test-Path .git) {
  git add root-engine.js scripts/root-engine-audit.js
  git commit -m "feat: implement bisection root engine"
} else {
  Write-Output "Skipping commit: workspace has no .git directory."
}
```

Expected:

```text
Skipping commit: workspace has no .git directory.
```

### Task 4: Add The Roots Tab Markup And Styles

**Files:**
- Modify: `index.html`
- Modify: `styles.css`

- [ ] **Step 1: Add the sidebar entry, panel shell, and script include in `index.html`**

```html
        <button id="tab-btn-root" type="button" class="sidebar-nav-item" data-tab="root" role="tab" aria-selected="false" aria-controls="tab-root" aria-label="Bisection Roots" tabindex="-1">
          <span class="sidebar-icon">r</span>
          <span class="sidebar-label">Roots</span>
        </button>
```

```html
    <section id="tab-root" class="panel" role="tabpanel" aria-labelledby="tab-btn-root" tabindex="0" hidden>
      <div class="module-shell module-root">
        <header class="module-header">
          <div>
            <p class="module-kicker">Module IV</p>
            <h2>Bisection Method Workbench</h2>
          </div>
          <p class="module-copy">Bracket a root, choose the stopping rule, and inspect the interval updates.</p>
        </header>

        <section class="control-band control-band-expression" aria-label="Root-finding controls">
          <div class="omnipotent-search-bar calculator-band">
            <div class="field-shell field-shell-expression search-shell">
              <input id="root-expression" type="text" maxlength="300" placeholder="x^3 - x - 1">
              <button type="button" class="symbol-trigger" data-symbol-target="root-expression" aria-label="Open symbols" title="Open symbols">f(x)</button>
              <button id="root-compute" type="button" class="btn-calculate-omni" title="Run bisection">=</button>
            </div>
            <div class="root-config-grid">
              <label>Left endpoint a<input id="root-a" type="text" value="1"></label>
              <label>Right endpoint b<input id="root-b" type="text" value="2"></label>
              <label>Significant digits (k)<input id="root-k" type="number" min="1" max="25" step="1" value="6"></label>
              <label>Machine rule<select id="root-mode"><option value="chop">Chopping</option><option value="round" selected>Rounding</option></select></label>
              <label>Stopping mode<select id="root-stop-kind"><option value="iterations" selected>Given iterations n</option><option value="epsilon">Given tolerance epsilon</option></select></label>
              <label>Stopping value<input id="root-stop-value" type="text" value="4"></label>
              <label>Sign display<select id="root-sign-display"><option value="both" selected>Both</option><option value="machine">Machine only</option><option value="exact">Exact only</option></select></label>
              <label>Decision basis<select id="root-decision-basis"><option value="machine">Machine-based bisection</option><option value="exact" selected>Exact-based bisection</option></select></label>
            </div>
            <p id="root-reasoning-note" class="focus-note">Exact-based bisection follows the mathematical bracket, while machine-based bisection follows chopped or rounded signs at each step.</p>
          </div>
          <p id="root-error-msg" class="inline-error" role="alert" aria-live="assertive" aria-atomic="true" hidden></p>
        </section>

        <p id="root-status-msg" class="visually-hidden" role="status" aria-live="polite" aria-atomic="true"></p>

        <section id="root-empty" class="empty-state">
          <p class="result-label">Try a root-finding run</p>
          <h3 class="empty-title">Enter a function and interval to see whether the bisection method brackets a root.</h3>
        </section>

        <section id="root-result-stage" class="result-stage" hidden>
          <div class="root-summary-grid">
            <div class="answer-hero answer-hero-major"><p class="result-label">Approximate root</p><p id="root-approx" class="answer-value is-empty">Not calculated yet.</p></div>
            <div class="answer-hero answer-hero-major"><p class="result-label">Interval status</p><p id="root-interval-status" class="answer-value is-empty">Not calculated yet.</p></div>
            <div class="answer-hero answer-hero-major"><p class="result-label">Stopping result</p><p id="root-stopping-result" class="answer-value is-empty">Not calculated yet.</p></div>
            <div class="answer-hero answer-hero-major"><p class="result-label">Convergence summary</p><p id="root-convergence" class="answer-value is-empty">Not calculated yet.</p></div>
          </div>
          <div class="comparison-grid comparison-grid-board">
            <div class="answer-hero"><p class="result-label">Initial sign analysis</p><p id="root-sign-summary" class="answer-value is-empty">Not calculated yet.</p></div>
            <div class="answer-hero"><p class="result-label">Decision basis</p><p id="root-decision-summary" class="answer-value is-empty">Not calculated yet.</p></div>
          </div>
          <div class="table-wrap">
            <table class="root-iteration-table">
              <thead><tr><th>i</th><th>a</th><th>b</th><th>c</th><th>f(a)</th><th>f(b)</th><th>f(c)</th><th>Signs</th><th>Decision</th><th>Width</th><th>Bound</th><th>Note</th></tr></thead>
              <tbody id="root-iteration-body"></tbody>
            </table>
          </div>
        </section>
      </div>
    </section>
```

```html
  <script src="root-engine.js?v=root1"></script>
  <script src="app.js?v=student4"></script>
```

- [ ] **Step 2: Add the root-module layout rules in `styles.css`**

```css
.module-root .root-config-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-top: 16px;
}

.module-root .root-summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 18px;
}

.root-iteration-table th,
.root-iteration-table td {
  white-space: nowrap;
  vertical-align: top;
}
```

- [ ] **Step 3: Run a quick structural check on the new markup IDs**

Run:

```powershell
Select-String -Path index.html -Pattern 'tab-btn-root|tab-root|root-expression|root-compute|root-iteration-body'
```

Expected:

```text
index.html: <button id="tab-btn-root" ...
index.html: <section id="tab-root" ...
index.html: <tbody id="root-iteration-body"></tbody>
```

### Task 5: Wire `app.js` To The New Engine And Verify The Browser Flow

**Files:**
- Modify: `app.js`
- Modify: `README.md`

- [ ] **Step 1: Extend the bootstrap dependencies, field IDs, result IDs, and preview config**

```js
  const R = globalScope.RootEngine;
  if (!I || !M || !C || !E || !D || !P || !R) {
    throw new Error("IEEE754, MathEngine, CalcEngine, ExpressionEngine, MathDisplay, PolyEngine, and RootEngine must be loaded before app.js.");
  }

  const ROOT_RESULT_IDS = ["root-approx", "root-interval-status", "root-stopping-result", "root-convergence", "root-sign-summary", "root-decision-summary"];
  const ROOT_FIELD_IDS = ["root-expression", "root-a", "root-b", "root-k", "root-mode", "root-stop-kind", "root-stop-value", "root-sign-display", "root-decision-basis"];
```

```js
    { inputId: "root-expression", previewId: "root-expression-preview", allowVariable: true, className: "math-preview math-preview-wide" }
```

Add `rootRun: null` to the shared `state`.

- [ ] **Step 2: Add reset, note, and formatting helpers**

```js
  function clearRootFeedback() {
    clearInvalid(ROOT_FIELD_IDS, "root-error-msg");
    showError("root-error-msg", "");
  }

  function resetRootResults() {
    for (const id of ROOT_RESULT_IDS) {
      setText(id, EMPTY_VALUE);
    }
    byId("root-empty").hidden = false;
    byId("root-result-stage").hidden = true;
    byId("root-iteration-body").innerHTML = "";
    state.rootRun = null;
  }

  function formatRootSign(sign) {
    return sign === 0 ? "0" : sign < 0 ? "-" : "+";
  }

  function formatRootDisplayedSigns(signDisplay, exactSign, machineSign) {
    if (signDisplay === "exact") return "E(" + formatRootSign(exactSign) + ")";
    if (signDisplay === "machine") return "M(" + formatRootSign(machineSign) + ")";
    return "E(" + formatRootSign(exactSign) + ") / M(" + formatRootSign(machineSign) + ")";
  }
```

- [ ] **Step 3: Implement the compute and render path for the root module**

```js
  function computeRootModule() {
    clearRootFeedback();
    try {
      const run = R.runBisection({
        expression: byId("root-expression").value,
        interval: { a: byId("root-a").value, b: byId("root-b").value },
        machine: { k: Number(byId("root-k").value), mode: byId("root-mode").value },
        stopping: { kind: byId("root-stop-kind").value, value: byId("root-stop-value").value },
        decisionBasis: byId("root-decision-basis").value,
        signDisplay: byId("root-sign-display").value,
        angleMode: state.angleMode
      });
      state.rootRun = run;
      renderRootRun(run);
    } catch (error) {
      markInvalid(ROOT_FIELD_IDS, "root-error-msg");
      showError("root-error-msg", error.message);
    }
  }

  function renderRootRun(run) {
    byId("root-empty").hidden = true;
    byId("root-result-stage").hidden = false;
    setContent("root-approx", shortValue(run.summary.approximation, 18, 12), false);
    setContent("root-interval-status", run.summary.intervalStatus, false);
    setContent("root-stopping-result", run.summary.stopReason, false);
    setContent("root-convergence", run.stopping.kind === "epsilon" ? "epsilon = " + run.stopping.input + ", n = " + run.stopping.iterationsRequired : "n = " + run.stopping.input + ", epsilon <= " + C.formatReal(run.stopping.epsilonBound, 8), false);
    setContent("root-sign-summary", "f(a): " + formatRootDisplayedSigns(run.signDisplay, run.initial.left.exactSign, run.initial.left.machineSign) + ", f(b): " + formatRootDisplayedSigns(run.signDisplay, run.initial.right.exactSign, run.initial.right.machineSign), false);
    setContent("root-decision-summary", run.decisionBasis === "machine" ? "Machine-based bracketing" : "Exact-based bracketing", false);
    byId("root-iteration-body").innerHTML = run.rows.map(function (row) {
      const signText = "a: " + formatRootDisplayedSigns(run.signDisplay, row.exactSigns.a, row.machineSigns.a) + ", b: " + formatRootDisplayedSigns(run.signDisplay, row.exactSigns.b, row.machineSigns.b) + ", c: " + formatRootDisplayedSigns(run.signDisplay, row.exactSigns.c, row.machineSigns.c);
      const decisionText = row.decision === "left" ? "Keep [a, c]" : "Keep [c, b]";
      return "<tr><td>" + row.iteration + "</td><td>" + shortValue(row.a, 14, 10) + "</td><td>" + shortValue(row.b, 14, 10) + "</td><td>" + shortValue(row.c, 14, 10) + "</td><td>" + shortValue(row.fa.machine, 14, 10) + "</td><td>" + shortValue(row.fb.machine, 14, 10) + "</td><td>" + shortValue(row.fc.machine, 14, 10) + "</td><td>" + signText + "</td><td>" + decisionText + "</td><td>" + C.formatReal(row.width, 8) + "</td><td>" + C.formatReal(row.bound, 8) + "</td><td>" + row.note + "</td></tr>";
    }).join("");
  }
```

- [ ] **Step 4: Wire the controls and the reset behavior**

```js
    byId("root-compute").addEventListener("click", computeRootModule);

    var debouncedRootReset = debounce(function () {
      clearRootFeedback();
      resetRootResults();
    }, 60);

    ROOT_FIELD_IDS.forEach(function (fieldId) {
      byId(fieldId).addEventListener("input", debouncedRootReset);
      byId(fieldId).addEventListener("change", debouncedRootReset);
    });
```

Initialize the module on startup:

```js
    resetRootResults();
```

- [ ] **Step 5: Update `README.md` and run the final verification pass**

```md
## Verification

- `node scripts/engine-correctness-audit.js` checks the shared numeric engines.
- `node scripts/root-engine-audit.js` checks the bisection solver and interval/sign logic.
- Open `index.html` in a browser and use the `Roots` tab for manual verification.
```

Run:

```powershell
node scripts/engine-correctness-audit.js
node scripts/root-engine-audit.js
Start-Process .\index.html
```

Expected:

```text
Summary: all checks passed
[PASS] Bisection loop :: Iteration mode returns four rows
[PASS] Edge cases :: Invalid bracket is reported
```

Manual browser checks:

- `x^2 - 2`, `a = 1`, `b = 2`, `n = 4`, `Exact-based`, `Both`
  - expect 4 rows and approximate root `1.4375`
- `sin(x) - x/2`, `a = 1`, `b = 2`, `epsilon = 0.01`, `Machine-based`, `Machine only`, radians
  - expect a valid bracket and a positive required iteration count
- `x^2 + 1`, `a = 0`, `b = 1`
  - expect an invalid bracket message

## Self-Review

- Spec coverage:
  - approximate solution in an interval: Task 3 and Task 5
  - sign identification and function evaluation: Task 1, Task 3, Task 5
  - root determination: Task 3 and Task 5
  - iterations from tolerance: Task 3
  - tolerance from iterations: Task 3 and Task 5
  - chopped/rounded `k`-digit iteration behavior: Task 1, Task 3, Task 5
  - tabular iteration output: Task 4 and Task 5
- Placeholder scan:
  - no `TBD`, `TODO`, or deferred “implement later” markers remain
- Type and naming consistency:
  - `run.summary.approximation`
  - `run.summary.intervalStatus`
  - `run.summary.stopReason`
  - `run.stopping.iterationsRequired`
  - `run.stopping.epsilonBound`
  - `run.initial.hasDisagreement`
  - `run.rows`
