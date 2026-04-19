# Root-Finding Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add 15 lecture-worked-example presets, convergence theory notes in solution steps, an optional post-result comparison card, and robustness fixes to the Module IV Root Finding Workbench.

**Architecture:** Presets are defined as data arrays in `root-ui.js` and loaded via dropdown + button in `index.html`, following the existing Module III pattern. Theory notes are added to existing solution-step builder functions, and comparison rows reuse the current run's problem setup through post-result `RootEngine` calls. Robustness fixes are limited to safe error handling and must preserve the existing fixed-point pseudo-convergence guard.

**Tech Stack:** Vanilla JavaScript, HTML, CSS (no dependencies)

---

## File Structure

**Modified:**
- `index.html` — Adds method-specific worked-example controls and the post-result comparison shell inside the existing Root Finding Workbench markup. This file stays declarative; no solver logic belongs here.
- `root-ui.js` — Owns preset data, preset loading, comparison-card orchestration, theory-note rendering, convergence label copy, and root-workbench event wiring. It calls `RootEngine` but does not implement numerical methods.
- `root-engine.js` — Owns numerical behavior only: fixed-point derivative estimation metadata and graceful handling for invalid or non-finite Newton evaluations. It must preserve existing convergence guardrails.
- `styles.css` — Adds compact styles for preset bands, short root hints, and the optional comparison card using existing module-root styling patterns.

**Verified:**
- `scripts/root-engine-audit.js` — Confirms existing root correctness guardrails, including the fixed-point pseudo-convergence regression.
- `scripts/engine-correctness-audit.js` — Confirms shared math, expression, and finite-precision behavior remains stable.
- `scripts/battery-validation.js` — Confirms root validation and non-crash behavior.
- `scripts/run-all-255.js` — Runs the full regression battery.

**Not modified unless a task explicitly says so:**
- `expression-engine.js` — Leave unchanged unless `root-engine.js` cannot gracefully handle the `x^(1/3)` Newton example.
- Modules I-III and IEEE-754 UI files — Out of scope for this plan.

---

### Task 1: Add Preset HTML to All Five Method Tabs

**Files:**
- Modify: `index.html:874-997` (root method input sections)

- [ ] **Step 1: Add preset band to Bisection tab**

Insert the preset band HTML immediately after `<section id="root-inputs-bisection" ...>` opens and before the `<div class="omnipotent-search-bar ...">`, matching the Module III pattern:

```html
<!-- Inside root-inputs-bisection, before the omnipotent-search-bar -->
<div class="preset-band preset-band-secondary" aria-label="Bisection worked examples" style="margin-bottom: var(--space-4);">
  <label>
    Worked example
    <select id="root-bis-preset">
      <option value="">Choose an example</option>
      <option value="bis1">x³+4x²−10 on [1, 2] (27 iters)</option>
    </select>
  </label>
  <div class="control-actions control-actions-secondary">
    <button id="root-bis-load-preset" type="button" class="ghost">Load example</button>
  </div>
</div>
```

- [ ] **Step 2: Add preset band to Newton tab**

Insert after `<section id="root-inputs-newton" ...>` opens, before `<div class="omnipotent-search-bar ...">`:

```html
<div class="preset-band preset-band-secondary" aria-label="Newton worked examples" style="margin-bottom: var(--space-4);">
  <label>
    Worked example
    <select id="root-newton-preset">
      <option value="">Choose an example</option>
      <option value="nr1">√2 approximation: x²−2</option>
      <option value="nr2">2x³+x²−x+1 (ε &lt; 0.0001)</option>
      <option value="nr3">x^(1/3) divergence</option>
      <option value="nr4">cos(x)−x (10 digits)</option>
    </select>
  </label>
  <div class="control-actions control-actions-secondary">
    <button id="root-newton-load-preset" type="button" class="ghost">Load example</button>
  </div>
</div>
```

- [ ] **Step 3: Add preset band to Secant tab**

Insert after `<section id="root-inputs-secant" ...>` opens, before `<div class="omnipotent-search-bar ...">`:

```html
<div class="preset-band preset-band-secondary" aria-label="Secant worked examples" style="margin-bottom: var(--space-4);">
  <label>
    Worked example
    <select id="root-secant-preset">
      <option value="">Choose an example</option>
      <option value="sec1">cos(x)−x (10 digits)</option>
    </select>
  </label>
  <div class="control-actions control-actions-secondary">
    <button id="root-secant-load-preset" type="button" class="ghost">Load example</button>
  </div>
</div>
```

- [ ] **Step 4: Add preset band to False Position tab**

Insert after `<section id="root-inputs-falseposition" ...>` opens, before `<div class="omnipotent-search-bar ...">`:

```html
<div class="preset-band preset-band-secondary" aria-label="False position worked examples" style="margin-bottom: var(--space-4);">
  <label>
    Worked example
    <select id="root-fp-preset">
      <option value="">Choose an example</option>
      <option value="fp1">cos(x)−x on [0, π/2]</option>
    </select>
  </label>
  <div class="control-actions control-actions-secondary">
    <button id="root-fp-load-preset" type="button" class="ghost">Load example</button>
  </div>
</div>
```

- [ ] **Step 5: Add preset band to Fixed Point tab**

Insert after `<section id="root-inputs-fixedpoint" ...>` opens, before `<div class="omnipotent-search-bar ...">`:

```html
<div class="preset-band preset-band-secondary" aria-label="Fixed point worked examples" style="margin-bottom: var(--space-4);">
  <label>
    Worked example
    <select id="root-fpi-preset">
      <option value="">Choose an example</option>
      <option value="fpi1">Fixed points of x²−2</option>
      <option value="fpi2">Unique FP of (x²−1)/3</option>
      <option value="fpi3">g(x) = 3⁻ˣ</option>
      <option value="fpi4">x³+4x²−10: g₁ (diverges)</option>
      <option value="fpi5">x³+4x²−10: g₂ (undefined)</option>
      <option value="fpi6">x³+4x²−10: g₃ (converges)</option>
      <option value="fpi7">x³+4x²−10: g₄ (fast)</option>
      <option value="fpi8">x³+4x²−10: g₅ (Newton-like)</option>
    </select>
  </label>
  <div class="control-actions control-actions-secondary">
    <button id="root-fpi-load-preset" type="button" class="ghost">Load example</button>
  </div>
</div>
```

- [ ] **Step 6: Verify HTML renders**

Open `index.html` in browser, navigate to Root Finding tab, verify all five sub-tabs show the preset dropdown. The dropdowns should be visible and styled correctly. Load buttons do nothing yet — that's Task 2.

---

### Task 2: Add Preset Data and Load Handlers in root-ui.js

**Files:**
- Modify: `root-ui.js:87-102` (after TABLE_CONFIGS, before state)

- [ ] **Step 1: Add preset data arrays**

Insert after `TABLE_CONFIGS` (around line 95) and before the state object (line 98):

```javascript
  // ─── Preset data ──────────────────────────────────────────────────────────
  const ROOT_PRESETS = {
    bisection: {
      bis1: { expression: "x^3 + 4*x^2 - 10", a: "1", b: "2", k: 6, mode: "round", stopKind: "iterations", stopValue: "27" }
    },
    newton: {
      nr1: { expression: "x^2 - 2", df: "2*x", x0: "1", k: 6, mode: "round", stopKind: "iterations", stopValue: "3" },
      nr2: { expression: "2*x^3 + x^2 - x + 1", df: "6*x^2 + 2*x - 1", x0: "-1.2", k: 6, mode: "round", stopKind: "epsilon", stopValue: "0.0001" },
      nr3: { expression: "x^(1/3)", df: "(1/3)*x^(-2/3)", x0: "0.1", k: 6, mode: "round", stopKind: "iterations", stopValue: "5" },
      nr4: { expression: "cos(x) - x", df: "-sin(x) - 1", x0: "0.785398", k: 10, mode: "round", stopKind: "iterations", stopValue: "10" }
    },
    secant: {
      sec1: { expression: "cos(x) - x", x0: "0.5", x1: "0.785398", k: 10, mode: "round", stopKind: "iterations", stopValue: "10" }
    },
    falsePosition: {
      fp1: { expression: "cos(x) - x", a: "0", b: "1.570796", k: 10, mode: "round", stopKind: "iterations", stopValue: "10" }
    },
    fixedPoint: {
      fpi1: { g: "x^2 - 2", x0: "0.5", k: 6, mode: "round", stopKind: "iterations", stopValue: "10" },
      fpi2: { g: "(x^2 - 1)/3", x0: "0.5", k: 6, mode: "round", stopKind: "iterations", stopValue: "10" },
      fpi3: { g: "3^(-x)", x0: "0.5", k: 6, mode: "round", stopKind: "iterations", stopValue: "10" },
      fpi4: { g: "x - x^3 - 4*x^2 + 10", x0: "1.5", k: 6, mode: "round", stopKind: "iterations", stopValue: "10" },
      fpi5: { g: "sqrt(10/x - 4*x)", x0: "1.5", k: 6, mode: "round", stopKind: "iterations", stopValue: "10" },
      fpi6: { g: "(1/2)*(10 - x^3)^(1/2)", x0: "1.5", k: 6, mode: "round", stopKind: "iterations", stopValue: "10" },
      fpi7: { g: "(10/(4 + x))^(1/2)", x0: "1.5", k: 6, mode: "round", stopKind: "iterations", stopValue: "10" },
      fpi8: { g: "x - (x^3 + 4*x^2 - 10)/(3*x^2 + 8*x)", x0: "1.5", k: 6, mode: "round", stopKind: "iterations", stopValue: "10" }
    }
  };
```

- [ ] **Step 2: Add load preset functions**

Insert after the preset data (before `// ─── State`):

```javascript
  function loadRootPreset(method) {
    var selectId = {
      bisection: "root-bis-preset",
      newton: "root-newton-preset",
      secant: "root-secant-preset",
      falsePosition: "root-fp-preset",
      fixedPoint: "root-fpi-preset"
    }[method];
    var selectEl = byId(selectId);
    if (!selectEl) return;
    var key = selectEl.value;
    var preset = ROOT_PRESETS[method] && ROOT_PRESETS[method][key];
    if (!preset) return;

    if (method === "bisection") {
      byId("root-bis-expression").value = preset.expression;
      byId("root-bis-a").value = preset.a;
      byId("root-bis-b").value = preset.b;
      byId("root-bis-k").value = String(preset.k);
      byId("root-bis-mode").value = preset.mode;
      byId("root-bis-stop-kind").value = preset.stopKind;
      byId("root-bis-stop-value").value = preset.stopValue;
    } else if (method === "newton") {
      byId("root-newton-expression").value = preset.expression;
      byId("root-newton-df").value = preset.df;
      byId("root-newton-x0").value = preset.x0;
      byId("root-newton-k").value = String(preset.k);
      byId("root-newton-mode").value = preset.mode;
      byId("root-newton-stop-kind").value = preset.stopKind;
      byId("root-newton-stop-value").value = preset.stopValue;
    } else if (method === "secant") {
      byId("root-secant-expression").value = preset.expression;
      byId("root-secant-x0").value = preset.x0;
      byId("root-secant-x1").value = preset.x1;
      byId("root-secant-k").value = String(preset.k);
      byId("root-secant-mode").value = preset.mode;
      byId("root-secant-stop-kind").value = preset.stopKind;
      byId("root-secant-stop-value").value = preset.stopValue;
    } else if (method === "falsePosition") {
      byId("root-fp-expression").value = preset.expression;
      byId("root-fp-a").value = preset.a;
      byId("root-fp-b").value = preset.b;
      byId("root-fp-k").value = String(preset.k);
      byId("root-fp-mode").value = preset.mode;
      byId("root-fp-stop-kind").value = preset.stopKind;
      byId("root-fp-stop-value").value = preset.stopValue;
    } else if (method === "fixedPoint") {
      byId("root-fpi-expression").value = preset.g;
      byId("root-fpi-x0").value = preset.x0;
      byId("root-fpi-k").value = String(preset.k);
      byId("root-fpi-mode").value = preset.mode;
      byId("root-fpi-stop-kind").value = preset.stopKind;
      byId("root-fpi-stop-value").value = preset.stopValue;
    }

    // Clear previous results and error state
    var cfg = METHOD_CONFIGS.find(function(c) { return c.name === method; });
    if (cfg) clearInvalid(cfg.fieldIds, "root-error-msg");
    showError("root-error-msg", "");
    state.runs[method] = null;
    resetResults();
    if (method === "bisection") syncBisectionToleranceControls();
    if (h.syncMathPreviews) h.syncMathPreviews();
    announceStatus("root-status-msg", "Example loaded. Click = to compute.");
  }
```

- [ ] **Step 3: Wire load buttons in wireEvents()**

In the `wireEvents()` function (around line 925), add after the copy solution listener (around line 941):

```javascript
    // Preset load buttons
    var presetButtons = [
      { id: "root-bis-load-preset", method: "bisection" },
      { id: "root-newton-load-preset", method: "newton" },
      { id: "root-secant-load-preset", method: "secant" },
      { id: "root-fp-load-preset", method: "falsePosition" },
      { id: "root-fpi-load-preset", method: "fixedPoint" }
    ];
    presetButtons.forEach(function(cfg) {
      var btn = byId(cfg.id);
      if (btn) btn.addEventListener("click", function() { loadRootPreset(cfg.method); });
    });
```

- [ ] **Step 4: Verify presets load correctly**

Open the app in browser. For each method tab:
1. Select a preset from the dropdown
2. Click "Load example"
3. Verify all input fields are populated correctly
4. Click `=` to compute
5. Verify the result appears without errors

Specifically test:
- Bisection: x³+4x²−10 on [1,2] — should run 27 iterations
- Newton: x²−2 with x₀=1 — should show 1.0 → 1.5 → 1.416667 → 1.414216
- Fixed Point fpi4 (g₁) — should show divergence
- Fixed Point fpi6 (g₃) — should converge

- [ ] **Step 5: Commit**

```bash
git add index.html root-ui.js
git commit -m "feat(root): add 15 lecture worked-example presets"
```

---

### Task 3: Add g′(x) Analysis to Fixed Point Solution Steps

**Files:**
- Modify: `root-engine.js:415-489` (runFixedPoint function)
- Modify: `root-ui.js:678-695` (buildFixedPointSteps function)

- [ ] **Step 1: Add numerical derivative helper to root-engine.js**

Insert before the `runFixedPoint` function (around line 415):

```javascript
  function numericalDerivative(ast, xValue, machine, angleMode) {
    var xReal = realNumber(xValue, "derivative point");
    var h = Math.max(Math.abs(xReal) * 1e-7, 1e-10);
    var hRational = M.parseRational(String(h));
    try {
      var left = evaluateFn(ast, C.sub(xValue, hRational), machine, angleMode);
      var right = evaluateFn(ast, C.add(xValue, hRational), machine, angleMode);
      var leftVal = realNumber(left.approx, "g(x-h)");
      var rightVal = realNumber(right.approx, "g(x+h)");
      var derivative = (rightVal - leftVal) / (2 * h);
      if (!Number.isFinite(derivative)) return null;
      return derivative;
    } catch (e) {
      return null;
    }
  }
```

- [ ] **Step 2: Store g′(x) data in the fixed-point result**

In `runFixedPoint()`, after the final approximation is computed (around line 468-488), just before the `return` statement, add the derivative evaluation:

```javascript
    // Evaluate g'(x) at the approximate fixed point for theory display
    var gPrimeAtRoot = null;
    if (approx != null && finalStopReason !== "diverged") {
      gPrimeAtRoot = numericalDerivative(gAst, approx, machine, options.angleMode);
    }
```

Then add `gPrimeAtRoot` to the return object (add after `rows` property on line 487):

```javascript
      gPrimeAtRoot: gPrimeAtRoot
```

- [ ] **Step 3: Update buildFixedPointSteps to show g′(x)**

In `root-ui.js`, modify `buildFixedPointSteps` (around line 678). Replace the entire function body:

```javascript
  function buildFixedPointSteps(run) {
    var prec = run.machine.k + " significant digits with " + (run.machine.mode === "round" ? "rounding" : "chopping");
    var steps = [
      "Apply fixed-point iteration with g(x) = " + run.canonical + ".",
      "The iteration formula is x\u2099\u208A\u2081 = g(x\u2099). Convergence requires |g\u2032(x)| < 1 near the fixed point.",
      run.stopping.kind === "epsilon"
        ? "Stop when |x\u2099\u208A\u2081 \u2212 x\u2099| < \u03B5 = " + run.stopping.input + "."
        : "Run for n = " + run.stopping.input + " iterations.",
      run.summary.stopReason === "diverged"
        ? "The iteration diverged (|x| exceeded 10\u2078). Try a different g(x) rearrangement where |g\u2032(x)| < 1 near the root."
        : run.summary.stopReason === "iteration-cap"
          ? "The iteration reached the safety cap before verifying convergence. Try a different g(x), starting point, or tolerance."
          : run.summary.stopReason === "exact-zero"
            ? "The method stopped because g(x\u2099) equals x\u2099 exactly."
            : openMethodLimitText(run, "x") || "The approximate fixed point after " + run.rows.length + " iteration" + (run.rows.length !== 1 ? "s" : "") + " is x \u2248 " + fmtVal(run.summary.approximation, 18) + ".",
      "Machine values use " + prec + "."
    ];

    // Add g'(x) theory note
    if (run.gPrimeAtRoot != null) {
      var absGPrime = Math.abs(run.gPrimeAtRoot);
      var gPrimeStr = C.formatReal(run.gPrimeAtRoot, 6);
      var absGPrimeStr = C.formatReal(absGPrime, 6);
      if (absGPrime < 1) {
        steps.push("g\u2032(x) at the approximate fixed point \u2248 " + gPrimeStr + ". Since |g\u2032(x)| \u2248 " + absGPrimeStr + " < 1, this supports the local convergence condition from the Fixed Point Theorem.");
      } else {
        steps.push("\u26A0\uFE0F g\u2032(x) at the approximate fixed point \u2248 " + gPrimeStr + ". Since |g\u2032(x)| \u2248 " + absGPrimeStr + " \u2265 1, convergence is not guaranteed by the Fixed Point Theorem.");
      }
    } else if (run.summary.stopReason === "diverged") {
      steps.push("The iteration diverged. Try a different g(x) rearrangement where |g\u2032(x)| < 1 near the root.");
    }

    return steps;
  }
```

- [ ] **Step 4: Verify g′(x) appears in solution steps**

Load Fixed Point preset fpi6 (g₃ converges), compute, check solution steps show "g′(x) at the approximate fixed point ≈ ... Since |g′(x)| < 1, this supports the local convergence condition from the Fixed Point Theorem."

Load Fixed Point preset fpi4 (g₁ diverges), compute, check it shows the divergence message.

- [ ] **Step 5: Commit**

```bash
git add root-engine.js root-ui.js
git commit -m "feat(root): add g'(x) analysis to fixed-point solution steps"
```

---

### Task 4: Enhance Convergence Rate Labels

**Files:**
- Modify: `root-ui.js:536-562` (estimateConvergenceRate and renderConvergenceSummary)

- [ ] **Step 1: Update convergence rate label text**

In `estimateConvergenceRate` (around line 545-549), replace the label assignment:

```javascript
    var label;
    if (p < 1.2) label = "linear convergence (order \u2248 " + p.toFixed(2) + ") \u2014 typical of Bisection and Fixed Point";
    else if (p < 1.8) label = "superlinear convergence (order \u2248 " + p.toFixed(2) + ") \u2014 typical of the Secant method";
    else label = "quadratic convergence (order \u2248 " + p.toFixed(2) + ") \u2014 typical of Newton\u2019s method";
    return { p: p.toFixed(2), label };
```

- [ ] **Step 2: Update renderConvergenceSummary to use the richer label**

In `renderConvergenceSummary` (around line 559), replace the rateText construction:

```javascript
    var rateText = rate ? " " + rate.label + "." : "";
```

This replaces the old format "Convergence order ≈ 1.00 (linear)." with the new "linear convergence (order ≈ 1.00) — typical of Bisection and Fixed Point."

- [ ] **Step 3: Verify convergence labels**

Run Newton √2 preset — should show "quadratic convergence (order ≈ 2.00) — typical of Newton's method"
Run Bisection preset — should show "linear convergence (order ≈ 1.00) — typical of Bisection and Fixed Point"

- [ ] **Step 4: Commit**

```bash
git add root-ui.js
git commit -m "feat(root): enhance convergence rate labels with lecture terminology"
```

---

### Task 5: Improve Newton and Secant Error Messages

**Files:**
- Modify: `root-ui.js:644-676` (buildNewtonSteps and buildSecantSteps)

- [ ] **Step 1: Update Newton divergence/failure messages in solution steps**

In `buildNewtonSteps` (around line 652-656), replace the derivative-zero step text:

```javascript
      run.summary.stopReason === "derivative-zero"
        ? "f\u2032(x\u2099) = 0 at iteration " + run.rows.length + ". Newton\u2019s method requires f\u2032(x) \u2260 0 at each step; try a different starting point."
        : run.summary.stopReason === "machine-zero"
          ? "The method stopped because the machine-computed f(x\u2099) was near zero and the Newton step was stable."
          : openMethodLimitText(run, "x") || "The approximate root after " + run.rows.length + " iteration" + (run.rows.length !== 1 ? "s" : "") + " is x \u2248 " + fmtVal(run.summary.approximation, 18) + ".",
```

- [ ] **Step 2: Update Secant stagnation message in solution steps**

In `buildSecantSteps` (around line 669-673), replace the stagnation step text:

```javascript
      run.summary.stopReason === "stagnation"
        ? "f(x\u2099) \u2248 f(x\u2099\u208B\u2081), making the secant slope zero. The method cannot compute a new approximation."
        : run.summary.stopReason === "machine-zero"
          ? "The method stopped because the machine-computed f(x\u2099) was zero or below the numerical threshold."
          : "The approximate root after " + run.rows.length + " iteration" + (run.rows.length !== 1 ? "s" : "") + " is x \u2248 " + fmtVal(run.summary.approximation, 18) + ".",
```

- [ ] **Step 3: Verify messages**

Run Newton preset nr3 (x^(1/3) divergence) — check solution steps show improved message.

- [ ] **Step 4: Commit**

```bash
git add root-ui.js
git commit -m "feat(root): improve Newton and Secant error messages with lecture language"
```

---

### Task 6: Preserve Fixed-Point First-Iteration Guardrails

**Files:**
- Verify: `root-engine.js` (current `runFixedPoint` epsilon guard)
- Verify: `scripts/root-engine-audit.js` (pseudo-convergence regression)

- [ ] **Step 1: Confirm the existing first-iteration guard remains present**

Inspect `runFixedPoint()` and verify the epsilon check still requires a shrinking trend before `tolerance-reached`:

```javascript
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
```

Do not add `previousError == null ||` to this condition. That would undo the existing pseudo-convergence guard.

- [ ] **Step 2: Verify the exact fixed-point exception still works**

Run:

```powershell
node -e "const fs=require('fs'),vm=require('vm');const c={console};c.window=c;c.globalThis=c;vm.createContext(c);['math-engine.js','calc-engine.js','expression-engine.js','root-engine.js'].forEach(f=>vm.runInContext(fs.readFileSync(f,'utf8'),c,{filename:f}));const r=c.RootEngine.runFixedPoint({gExpression:'x',x0:'0.5',machine:{k:12,mode:'round'},stopping:{kind:'epsilon',value:'1e-7'},angleMode:'rad'});console.log(r.summary.stopReason, r.rows.length);"
```

Expected output contains:

```text
exact-zero 1
```

- [ ] **Step 3: Verify pseudo-convergence stays rejected**

Run:

```powershell
node -e "const fs=require('fs'),vm=require('vm');const c={console};c.window=c;c.globalThis=c;vm.createContext(c);['math-engine.js','calc-engine.js','expression-engine.js','root-engine.js'].forEach(f=>vm.runInContext(fs.readFileSync(f,'utf8'),c,{filename:f}));const r=c.RootEngine.runFixedPoint({gExpression:'x + 1e-8',x0:'0',machine:{k:12,mode:'round'},stopping:{kind:'epsilon',value:'1e-7'},angleMode:'rad'});console.log(r.summary.stopReason, r.rows.length, r.rows[0] && r.rows[0].note);"
```

Expected output contains `iteration-cap`, not `tolerance-reached`.

- [ ] **Step 4: Run the existing audit**

Run:

```powershell
node scripts/root-engine-audit.js
```

Expected: `Summary: 45/45 passed`.

- [ ] **Step 5: Commit if any guardrail wording or audit comments changed**

If this task did not change files, skip the commit. If wording changed, commit only those files:

```bash
git add root-engine.js scripts/root-engine-audit.js
git commit -m "docs(root): preserve fixed-point pseudo-convergence guard"
```

---

### Task 7: Graceful x^(1/3) Divergence Handling

**Files:**
- Modify: `root-engine.js:128-219` (runNewtonRaphson)

- [ ] **Step 1: Add NaN/Infinity catch in Newton iteration loop**

In `runNewtonRaphson()`, after the `evaluateFn` call for `fn` (line 144) and before the `isStrictZeroValue` check (line 146), wrap the value extraction in a try-catch:

```javascript
      var fnValCheck;
      try {
        fnValCheck = realNumber(fn.approx, "f(x\u2099)");
      } catch (err) {
        finalStopReason = "diverged";
        rows.push({ iteration: iter, xn: xn, fxn: null, dfxn: null, xNext: null, error: null, note: "f(x\u2099) produced a non-finite value; the method cannot continue" });
        break;
      }
      if (!Number.isFinite(fnValCheck)) {
        finalStopReason = "diverged";
        rows.push({ iteration: iter, xn: xn, fxn: fn.approx, dfxn: null, xNext: null, error: null, note: "f(x\u2099) is not finite; the method has diverged" });
        break;
      }
```

Also add a NaN guard after computing `dfn` (around line 152), before the derivative-zero check:

```javascript
      var dfValCheck;
      try {
        dfValCheck = realNumber(dfn.approx, "f\u2032(x\u2099)");
      } catch (err) {
        finalStopReason = "diverged";
        rows.push({ iteration: iter, xn: xn, fxn: fn.approx, dfxn: null, xNext: null, error: null, note: "f\u2032(x\u2099) produced a non-finite value; the method cannot continue" });
        break;
      }
```

- [ ] **Step 2: Add "diverged" handling in formatStopReason**

Verify that `formatStopReason` in `root-ui.js` (line 264-280) already handles `"diverged"`. It does — it maps to "Iteration diverged (|x| exceeds 10⁸)". No change needed.

- [ ] **Step 3: Verify x^(1/3) divergence**

Load Newton preset nr3 (x^(1/3), x₀ = 0.1). Run it. The key test is **no crash, no unhandled error**. It should either:
- Show the iteration table with values doubling: 0.1, −0.2, 0.4, −0.8, 1.6
- Or catch a NaN when x goes negative (since JS `Math.pow(-0.2, 1/3)` returns NaN) and show "method diverged"

Either outcome is acceptable.

- [ ] **Step 4: Commit**

```bash
git add root-engine.js
git commit -m "fix(root): graceful handling of NaN/Infinity in Newton iteration"
```

---

### Task 8: Add Post-Result Compare Methods Card

**Files:**
- Modify: `index.html` (inside `#root-result-stage`, after `#root-rate-summary`)
- Modify: `root-ui.js` (after `renderConvergenceSummary`, plus `renderRun`, `resetResults`, and `wireEvents`)
- Modify: `styles.css` (near root module styles)

- [ ] **Step 1: Add compare trigger and output shell**

In `index.html`, insert this block immediately after:

```html
<p id="root-rate-summary" class="focus-note root-rate-summary"></p>
```

Add:

```html
          <div class="root-compare-actions" id="root-compare-actions" hidden>
            <button id="root-compare-methods" type="button" class="ghost">Compare methods</button>
          </div>
          <section id="root-compare-card" class="root-compare-card answer-hero" aria-label="Method comparison" hidden>
            <div class="root-solution-header">
              <div>
                <p class="result-label">Method comparison</p>
                <h3>Same setup, available methods</h3>
              </div>
            </div>
            <div class="table-wrap root-compare-table-wrap">
              <table class="root-compare-table">
                <thead>
                  <tr>
                    <th>Method</th>
                    <th>Status</th>
                    <th>Approximation</th>
                    <th>Iterations</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody id="root-compare-body">
                  <tr class="empty-row"><td colspan="5">Run a method, then compare.</td></tr>
                </tbody>
              </table>
            </div>
          </section>
```

- [ ] **Step 2: Add comparison helpers in `root-ui.js`**

Insert these helpers after `renderConvergenceSummary(run)` and before the `// ─── Solution Steps` comment:

```javascript
  function currentStoppingForCompare(run) {
    const stop = run && run.stopping ? run.stopping : {};
    const value = stop.input != null ? String(stop.input) : "10";
    const out = { kind: stop.kind || "iterations", value: value };
    if (run && run.method === "bisection" && stop.toleranceType) {
      out.toleranceType = stop.toleranceType;
    }
    return out;
  }

  function makeCompareSeed(run) {
    const seed = {
      expression: null,
      gExpression: null,
      dfExpression: null,
      a: null,
      b: null,
      x0: null,
      x1: null,
      machine: run.machine,
      stopping: currentStoppingForCompare(run),
      angleMode: getAngleMode()
    };

    if (run.method === "bisection") {
      seed.expression = byId("root-bis-expression").value;
      seed.a = byId("root-bis-a").value;
      seed.b = byId("root-bis-b").value;
      seed.x0 = seed.a;
      seed.x1 = seed.b;
      seed.stopping.toleranceType = byId("root-bis-tolerance-type").value;
    } else if (run.method === "falsePosition") {
      seed.expression = byId("root-fp-expression").value;
      seed.a = byId("root-fp-a").value;
      seed.b = byId("root-fp-b").value;
      seed.x0 = seed.a;
      seed.x1 = seed.b;
    } else if (run.method === "newton") {
      seed.expression = byId("root-newton-expression").value;
      seed.dfExpression = byId("root-newton-df").value;
      seed.x0 = byId("root-newton-x0").value;
    } else if (run.method === "secant") {
      seed.expression = byId("root-secant-expression").value;
      seed.x0 = byId("root-secant-x0").value;
      seed.x1 = byId("root-secant-x1").value;
    } else if (run.method === "fixedPoint") {
      seed.gExpression = byId("root-fpi-expression").value;
      seed.x0 = byId("root-fpi-x0").value;
    }

    return seed;
  }

  function compareSkip(method, note) {
    return { method: method, skipped: true, note: note };
  }

  function tryCompareRun(method, fn, note) {
    try {
      return { method: method, run: fn(), note: note || "" };
    } catch (error) {
      return { method: method, skipped: true, note: error && error.message ? error.message : "Method failed." };
    }
  }

  function buildCompareRows(run) {
    const seed = makeCompareSeed(run);
    const rows = [];
    const canUseFunction = !!seed.expression;
    const canUseBracket = canUseFunction && seed.a != null && seed.b != null;
    const canUseSecant = canUseFunction && seed.x0 != null && seed.x1 != null;

    rows.push(canUseBracket
      ? tryCompareRun("bisection", function() {
          return R.runBisection({
            expression: seed.expression,
            interval: { a: seed.a, b: seed.b },
            machine: seed.machine,
            stopping: Object.assign({ toleranceType: "relative" }, seed.stopping),
            decisionBasis: "machine",
            signDisplay: "both",
            angleMode: seed.angleMode
          });
        }, "bracketed")
      : compareSkip("bisection", "Skipped: no valid bracket setup is available."));

    rows.push(seed.dfExpression && seed.x0 != null
      ? tryCompareRun("newton", function() {
          return R.runNewtonRaphson({
            expression: seed.expression,
            dfExpression: seed.dfExpression,
            x0: seed.x0,
            machine: seed.machine,
            stopping: seed.stopping,
            angleMode: seed.angleMode
          });
        }, "needs derivative")
      : compareSkip("newton", "Skipped: derivative required."));

    rows.push(canUseSecant
      ? tryCompareRun("secant", function() {
          return R.runSecant({
            expression: seed.expression,
            x0: seed.x0,
            x1: seed.x1,
            machine: seed.machine,
            stopping: seed.stopping,
            angleMode: seed.angleMode
          });
        }, seed.a != null && seed.b != null ? "uses bracket endpoints as guesses" : "")
      : compareSkip("secant", "Skipped: two starting values required."));

    rows.push(canUseBracket
      ? tryCompareRun("falsePosition", function() {
          return R.runFalsePosition({
            expression: seed.expression,
            interval: { a: seed.a, b: seed.b },
            machine: seed.machine,
            stopping: seed.stopping,
            decisionBasis: "machine",
            signDisplay: "both",
            angleMode: seed.angleMode
          });
        }, "bracketed")
      : compareSkip("falsePosition", "Skipped: no valid bracket setup is available."));

    rows.push(seed.gExpression && seed.x0 != null
      ? tryCompareRun("fixedPoint", function() {
          return R.runFixedPoint({
            gExpression: seed.gExpression,
            x0: seed.x0,
            machine: seed.machine,
            stopping: seed.stopping,
            angleMode: seed.angleMode
          });
        }, "uses g(x)")
      : compareSkip("fixedPoint", "Skipped: no g(x) form available."));

    return rows;
  }

  function renderCompareRows(rows) {
    const body = byId("root-compare-body");
    if (!body) return;
    body.innerHTML = "";
    rows.forEach(function(item) {
      const tr = document.createElement("tr");
      const label = METHOD_CONFIGS.find(function(cfg) { return cfg.name === item.method; });
      if (item.skipped) {
        [label ? label.label : item.method, "skipped", "—", "—", item.note].forEach(function(value) {
          const td = document.createElement("td");
          td.textContent = value;
          tr.appendChild(td);
        });
      } else {
        const run = item.run;
        const approx = run.summary.approximation == null ? "N/A" : fmtRunVal(run.summary.approximation, run, 12);
        const iterations = run.rows ? String(run.rows.length) : "0";
        [label ? label.label : item.method, formatStopReason(run.summary.stopReason, run.method), approx, iterations, item.note].forEach(function(value) {
          const td = document.createElement("td");
          td.textContent = value;
          tr.appendChild(td);
        });
      }
      body.appendChild(tr);
    });
  }

  function compareMethodsForCurrentRun() {
    const run = state.runs[state.activeMethod];
    if (!run) return;
    renderCompareRows(buildCompareRows(run));
    setHidden("root-compare-card", false);
    announceStatus("root-status-msg", "Method comparison updated.");
  }
```

- [ ] **Step 3: Wire visibility and button behavior**

In `renderRun(run)`, after `renderConvergenceSummary(run);`, add:

```javascript
    setHidden("root-compare-actions", false);
    setHidden("root-compare-card", true);
```

In `resetResults()`, after clearing `root-rate-summary`, add:

```javascript
    setHidden("root-compare-actions", true);
    setHidden("root-compare-card", true);
    const compareBody = byId("root-compare-body");
    if (compareBody) {
      compareBody.innerHTML = "<tr class='empty-row'><td colspan='5'>Run a method, then compare.</td></tr>";
    }
```

In `wireEvents()`, after the copy solution listener, add:

```javascript
    const compareBtn = byId("root-compare-methods");
    if (compareBtn) compareBtn.addEventListener("click", compareMethodsForCurrentRun);
```

- [ ] **Step 4: Add compact compare styles**

In `styles.css`, near the root module styles, add:

```css
.module-root .root-compare-actions {
  display: flex;
  justify-content: flex-end;
  margin-top: var(--space-2);
}

.module-root .root-compare-card {
  margin-top: var(--space-3);
}

.module-root .root-compare-table-wrap {
  margin-top: var(--space-2);
}

.module-root .root-compare-table th,
.module-root .root-compare-table td {
  white-space: normal;
}
```

- [ ] **Step 5: Verify comparison behavior**

Open `index.html`, navigate to Root Finding, and verify:

1. Before a run, `Compare methods` is hidden.
2. After a Bisection run on `x^2 - 2`, `[1, 2]`, the button appears.
3. Clicking the button shows Bisection, False Position, and Secant rows using the bracket endpoints, while Newton and Fixed Point are skipped with clear messages.
4. Switching inputs or method clears the card.
5. After a Newton run, Newton appears and methods requiring missing bracket or `g(x)` are skipped.

- [ ] **Step 6: Commit**

```bash
git add index.html root-ui.js styles.css
git commit -m "feat(root): add optional post-result method comparison"
```

---

### Task 9: Final Verification

**Files:** None (test-only)

- [ ] **Step 1: Full verification pass**

Open the app and run through this checklist:

1. **Bisection preset**: Load "x³+4x²−10 on [1,2]", compute, verify 27 rows in table
2. **Newton preset nr1**: Load "√2 approximation", compute, verify table shows 1.0 → 1.5 → 1.416667 → 1.414216
3. **Newton preset nr2**: Load "2x³+x²−x+1", compute, verify stops when |error| < 0.0001
4. **Newton preset nr3**: Load "x^(1/3) divergence", compute, verify it shows divergence (not a crash)
5. **Newton preset nr4**: Load "cos(x)−x", compute, verify convergence to ~0.7390851332
6. **Secant preset sec1**: Load, compute, verify convergence to ~0.7390851332
7. **False Position preset fp1**: Load, compute, verify convergence to ~0.7390851332
8. **Fixed Point fpi1–fpi3**: Load each, compute, verify convergence
9. **Fixed Point fpi4 (g₁ diverges)**: Load, compute, verify divergence message
10. **Fixed Point fpi5 (g₂ undefined)**: Load, compute, verify error (sqrt of negative)
11. **Fixed Point fpi6–fpi8**: Load, compute, verify convergence
12. **Fixed Point theory**: On fpi6, check solution steps show g′(x) analysis with |g′| < 1
13. **Convergence labels**: On Newton nr1, check rate says "quadratic convergence (order ≈ 2.00)"
14. **No regressions**: Manually test a non-preset bisection case (e.g., x²−2 on [1,2]) to confirm existing behavior unchanged

- [ ] **Step 2: Confirm working tree scope**

Run:

```powershell
git status --short
```

Expected: only intentional files from the completed tasks are modified or untracked. Do not use `git add -A` in this repository because the workspace may contain unrelated generated folders and scratch test files.

- [ ] **Step 3: Run automated regression checks**

Run:

```powershell
node scripts/root-engine-audit.js
node scripts/engine-correctness-audit.js
node scripts/battery-validation.js
node scripts/run-all-255.js
```

Expected:

```text
root-engine-audit: Summary: 45/45 passed
engine-correctness-audit: Summary: 47/47 passed
battery-validation: Summary: 18/18 passed
run-all-255: Failed suites: 0
```
