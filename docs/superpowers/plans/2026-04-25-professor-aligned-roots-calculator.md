# Professor-Aligned Roots Calculator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reshape the Roots mini-app to mirror the professor's quiz/exam workflow — preset-based problem loading (population birth-rate model + quiz problems), exam-style iteration tables, classified stopping checks, fixed-point ranking comparison, original final-answer formatter, regression coverage for the lecture cases, and Vercel deployment clarity.

**Architecture:** Stay vanilla JS / static HTML. Add a new `roots/roots-presets.js` module that owns preset definitions and population-equation safety rules; extend `roots-app.js` to wire a preset selector and a fixed-point comparison runner; extend `roots-render.js` with method-specific exam-table column sets, a categorical stopping-check panel, and a paragraph final-answer formatter. Tighten `scripts/root-engine-audit.js` and `scripts/roots-mini-app-ui-audit.js` with the lecture/quiz cases and align angle-mode initialization (state and DOM both default to RAD).

**Tech Stack:** Vanilla JavaScript (no framework, IIFE modules attaching to `window`), HTML, CSS. Existing `RootEngine` (numerical methods), `CalcEngine` (formatting), `ExpressionEngine` (parser). Node 18+ for headless audit scripts. Vercel static hosting.

---

## File Structure

**New files:**
- `roots/roots-presets.js` — Preset catalog (population, quiz bisection, quiz Newton, quiz fixed-point ranking) and helper that maps a chosen preset onto the active method's input fields. Keeps preset literals out of `roots-app.js`.
- `roots/roots-comparison.js` — Fixed-point ranking runner. Calls `RootEngine.runFixedPoint` once per candidate `g(x)` from the same `p0`, classifies each result (converged / diverged / cycle / undefined / stalled), and ranks the convergent ones.
- `vercel.json` — Minimal explicit static-hosting config so Vercel does not guess routing.

**Modified files:**
- `roots/index.html` — Add the preset selector card above the methods section, the population-warning region, the comparison entry inside the fixed-point panel, and the "Format final answer" button + output region. Update the initial angle status display to `RAD` and the toggle button text to `Use degrees`.
- `roots/roots-state.js` — Add a `selectedPreset` field and a `comparison` slot for the latest fixed-point ranking result. Keep `angleMode: "rad"` (already correct) and make sure preset/comparison helpers live with the rest of the state surface.
- `roots/roots-app.js` — Wire the preset selector, x=0 warning, comparison runner button, and final-answer formatter button. Continue to call existing `activateMethod` / `computeActiveMethod`. Load `roots-presets.js` and `roots-comparison.js` before `roots-app.js`.
- `roots/roots-render.js` — Replace `TABLE_CONFIGS` headers with the exam-aligned column shapes; add a `Correction` column for Newton; add the categorical stopping-check panel renderer; add comparison-result table renderer; add the final-answer paragraph builder; add `renderFinalAnswerParagraph` and `renderComparisonResult` exports.
- `roots/roots-engine-adapter.js` — Add `runFixedPointComparison(candidates, x0, machine, stopping, angleMode)` that loops `runFixedPoint` for each candidate (so `roots-comparison.js` can stay UI-only).
- `root-engine.js` — No numerical changes beyond what is already on disk (the safer midpoint `a + (b-a)/2`). Keep that uncommitted change. No new methods.
- `scripts/root-engine-audit.js` — Replace the failing `0.00097656` expectation with the exact `0.0009765625`, add the population-equation regressions (every method) and the Newton quiz cases, and add the `21^(1/3)` ranking regression.
- `scripts/roots-mini-app-ui-audit.js` — Update first-click expectation (initial state is `RAD`, so first click flips to `DEG`), and add coverage for: preset selection, x=0 warning, exam-table column headers, stopping-check panel, final-answer paragraph, fixed-point ranking output.
- `README.md` — Add a short "Vercel deployment" section describing root directory, no build, output directory, main and roots routes.

---

## Bite-Sized Task Granularity

Tasks 1–2 are independent unblockers (audits go green again). Tasks 3–7 add presets and the population workflow. Tasks 8–10 add exam tables, stopping check, and final-answer formatter (UI render layer). Tasks 11–13 add the fixed-point comparison runner end-to-end. Tasks 14–15 close out audits and Vercel.

---

### Task 1: Align angle-mode initialization (state, DOM, and audit)

The audit `scripts/roots-mini-app-ui-audit.js` currently fails because `roots-state.js` starts at `angleMode: "rad"` but `roots/index.html` shows `DEG` and the audit expects the *first* toggle click to produce `RAD`. The spec says "Trig examples should default to radians for numerical-analysis convention." Fix is: keep state at `rad`, make the DOM start at `RAD`, and update the audit so first click flips to `DEG`.

**Files:**
- Modify: `roots/index.html:17` (the `<strong id="status-angle">` text)
- Modify: `roots/index.html:18` (the angle-toggle button label)
- Modify: `scripts/roots-mini-app-ui-audit.js:364-369` (first-click expectations)

- [ ] **Step 1: Run the failing audit to confirm the current failure**

Run: `node scripts/roots-mini-app-ui-audit.js`
Expected: AssertionError on the line `assert.strictEqual(document.elements["status-angle"].textContent, "RAD");` after the first click.

- [ ] **Step 2: Update the standalone Roots HTML so the initial display matches the `rad` state**

In `roots/index.html`, change the angle status chip and the toggle button:

```html
<div class="status-chip"><span class="status-name">Angle</span><strong id="status-angle">RAD</strong></div>
<button id="angle-toggle" type="button" class="ghost roots-angle-btn">Use degrees</button>
```

(Replace the prior `DEG` / `Use radians` values on lines 17–18.)

- [ ] **Step 3: Update the audit to reflect the new defaults**

In `scripts/roots-mini-app-ui-audit.js`, replace the angle-toggle block (around lines 364-369) with:

```js
assert.strictEqual(document.elements["status-angle"].textContent, "RAD");
click(document.elements["angle-toggle"]);
assert.strictEqual(document.elements["status-angle"].textContent, "DEG");
click(document.elements["angle-toggle"]);
assert.strictEqual(document.elements["status-angle"].textContent, "RAD");
click(document.elements["angle-toggle"]);
assert.strictEqual(document.elements["status-angle"].textContent, "DEG");
```

The pre-click assertion documents the on-load state; the three clicks then alternate.

- [ ] **Step 4: Run the audit again to confirm it now passes**

Run: `node scripts/roots-mini-app-ui-audit.js`
Expected: process exits 0, no assertion errors.

- [ ] **Step 5: Run the static audit to confirm no regression**

Run: `node scripts/roots-mini-app-static-audit.js`
Expected: process exits 0.

- [ ] **Step 6: Commit**

```bash
git add roots/index.html scripts/roots-mini-app-ui-audit.js
git commit -m "fix: align Roots angle-mode default to radians on load"
```

---

### Task 2: Correct the bisection-bound audit expectation

`scripts/root-engine-audit.js` currently asserts the bound `0.00097656`, but the engine returns the exact value `1/2^10 = 0.0009765625`. The exact value is correct; the rounded literal is the bug. Replace it.

**Files:**
- Modify: `scripts/root-engine-audit.js` (the assertion that compares against `"0.00097656"`)

- [ ] **Step 1: Locate the current expectation**

Run: `grep -n "0.00097656" scripts/root-engine-audit.js` (or use the Grep tool).
Expected: a single line containing the literal `"0.00097656"`.

- [ ] **Step 2: Run the audit to capture the failing case**

Run: `node scripts/root-engine-audit.js`
Expected: 46/47 passed; the failing line names the bisection bound.

- [ ] **Step 3: Replace the expectation with the exact value**

Replace `"0.00097656"` with `"0.0009765625"` in `scripts/root-engine-audit.js`. Update both the `expected` string (printed in the report) and the `===` comparison so they both reference `0.0009765625`. If the assertion uses `C.formatReal(value, n)` with too-narrow `n`, widen `n` to `10` so the formatter produces the full literal.

- [ ] **Step 4: Run the audit to confirm 47/47**

Run: `node scripts/root-engine-audit.js`
Expected: `Summary: 47/47 passed`, exit code 0.

- [ ] **Step 5: Commit**

```bash
git add scripts/root-engine-audit.js
git commit -m "fix: assert exact bisection bound 0.0009765625 in root-engine audit"
```

---

### Task 3: Create the preset catalog module

Define every preset in one place so the UI can stay declarative. Each preset names a method, a label, an optional warning, and a `fields` map keyed by the same input ids that `roots-state.js` already lists.

**Files:**
- Create: `roots/roots-presets.js`
- Test: ad-hoc — Task 5 wires the presets and Task 14 audits them in the headless harness.

- [ ] **Step 1: Create `roots/roots-presets.js` with the full preset catalog**

```js
"use strict";

(function initRootsPresets(globalScope) {
  // Population birth-rate equation:
  // f(x) = 1000000*e^x + (435000/x)*(e^x - 1) - 1564000
  // Root near x = 0.1009979297. f(0) is undefined (1/x), so all starts must avoid 0.
  const POPULATION_F = "1000000*e^x + (435000/x)*(e^x - 1) - 1564000";
  const POPULATION_DF = "1000000*e^x + 435000*(x*e^x - (e^x - 1))/x^2";
  const POPULATION_G = "log((1564000*x + 435000)/(1000000*x + 435000))";

  const PRESETS = [
    {
      id: "population-bisection",
      group: "Population birth-rate model",
      label: "Population — Bisection on [0.1, 0.15]",
      method: "bisection",
      warnIfZero: ["root-bis-a", "root-bis-b"],
      fields: {
        "root-bis-expression": POPULATION_F,
        "root-bis-a": "0.1",
        "root-bis-b": "0.15",
        "root-bis-k": "12",
        "root-bis-mode": "round",
        "root-bis-stop-kind": "iterations",
        "root-bis-stop-value": "10",
        "root-bis-tolerance-type": "absolute",
        "root-bis-decision-basis": "machine",
        "root-bis-sign-display": "both"
      }
    },
    {
      id: "population-falseposition",
      group: "Population birth-rate model",
      label: "Population — False Position on [0.1, 0.15]",
      method: "falsePosition",
      warnIfZero: ["root-fp-a", "root-fp-b"],
      fields: {
        "root-fp-expression": POPULATION_F,
        "root-fp-a": "0.1",
        "root-fp-b": "0.15",
        "root-fp-k": "12",
        "root-fp-mode": "round",
        "root-fp-stop-kind": "iterations",
        "root-fp-stop-value": "8",
        "root-fp-decision-basis": "machine",
        "root-fp-sign-display": "both"
      }
    },
    {
      id: "population-newton",
      group: "Population birth-rate model",
      label: "Population — Newton from x0 = 0.12",
      method: "newton",
      warnIfZero: ["root-newton-x0"],
      fields: {
        "root-newton-expression": POPULATION_F,
        "root-newton-df": POPULATION_DF,
        "root-newton-x0": "0.12",
        "root-newton-k": "12",
        "root-newton-mode": "round",
        "root-newton-stop-kind": "iterations",
        "root-newton-stop-value": "6"
      }
    },
    {
      id: "population-secant",
      group: "Population birth-rate model",
      label: "Population — Secant from 0.1, 0.15",
      method: "secant",
      warnIfZero: ["root-secant-x0", "root-secant-x1"],
      fields: {
        "root-secant-expression": POPULATION_F,
        "root-secant-x0": "0.1",
        "root-secant-x1": "0.15",
        "root-secant-k": "12",
        "root-secant-mode": "round",
        "root-secant-stop-kind": "iterations",
        "root-secant-stop-value": "6"
      }
    },
    {
      id: "population-fixedpoint",
      group: "Population birth-rate model",
      label: "Population — Fixed Point g(x) from x0 = 0.1",
      method: "fixedPoint",
      warnIfZero: [],
      fields: {
        "root-fpi-expression": POPULATION_G,
        "root-fpi-x0": "0.1",
        "root-fpi-k": "12",
        "root-fpi-mode": "round",
        "root-fpi-stop-kind": "epsilon",
        "root-fpi-stop-value": "0.0001"
      }
    },
    {
      id: "quiz-bisection-cubic",
      group: "Quiz problems",
      label: "Quiz Bisection — x^3 - 7x^2 + 14x + 6, eps = 1e-2",
      method: "bisection",
      fields: {
        "root-bis-expression": "x^3 - 7*x^2 + 14*x + 6",
        "root-bis-a": "-1",
        "root-bis-b": "0",
        "root-bis-k": "12",
        "root-bis-mode": "round",
        "root-bis-stop-kind": "epsilon",
        "root-bis-stop-value": "0.01",
        "root-bis-tolerance-type": "absolute",
        "root-bis-decision-basis": "machine",
        "root-bis-sign-display": "both"
      }
    },
    {
      id: "quiz-newton-a",
      group: "Quiz Newton problems",
      label: "Quiz Newton — x^3 - 2x^2 - 5 on [1, 4]",
      method: "newton",
      fields: {
        "root-newton-expression": "x^3 - 2*x^2 - 5",
        "root-newton-df": "3*x^2 - 4*x",
        "root-newton-x0": "2.5",
        "root-newton-k": "12",
        "root-newton-mode": "round",
        "root-newton-stop-kind": "epsilon",
        "root-newton-stop-value": "0.0001"
      }
    },
    {
      id: "quiz-newton-b",
      group: "Quiz Newton problems",
      label: "Quiz Newton — x^3 + 3x^2 - 1 on [-3, -2]",
      method: "newton",
      fields: {
        "root-newton-expression": "x^3 + 3*x^2 - 1",
        "root-newton-df": "3*x^2 + 6*x",
        "root-newton-x0": "-2.5",
        "root-newton-k": "12",
        "root-newton-mode": "round",
        "root-newton-stop-kind": "epsilon",
        "root-newton-stop-value": "0.0001"
      }
    },
    {
      id: "quiz-newton-c",
      group: "Quiz Newton problems",
      label: "Quiz Newton — x - cos(x) on [0, pi/2]",
      method: "newton",
      fields: {
        "root-newton-expression": "x - cos(x)",
        "root-newton-df": "1 + sin(x)",
        "root-newton-x0": "0.7853981633974483",
        "root-newton-k": "12",
        "root-newton-mode": "round",
        "root-newton-stop-kind": "epsilon",
        "root-newton-stop-value": "0.0001"
      }
    },
    {
      id: "quiz-newton-d",
      group: "Quiz Newton problems",
      label: "Quiz Newton — x - 0.8 - 0.2 sin(x) on [0, pi/2]",
      method: "newton",
      fields: {
        "root-newton-expression": "x - 0.8 - 0.2*sin(x)",
        "root-newton-df": "1 - 0.2*cos(x)",
        "root-newton-x0": "0.7853981633974483",
        "root-newton-k": "12",
        "root-newton-mode": "round",
        "root-newton-stop-kind": "epsilon",
        "root-newton-stop-value": "0.0001"
      }
    },
    {
      id: "quiz-fixedpoint-ranking",
      group: "Fixed-point ranking",
      label: "Fixed-point ranking — 21^(1/3), p0 = 1",
      method: "fixedPoint",
      // The ranking tool reads candidates separately; the single-method form below is
      // used as the "currently visible" formula in the fixed-point panel.
      fields: {
        "root-fpi-expression": "(20*x + 21/(x^2)) / 21",
        "root-fpi-x0": "1",
        "root-fpi-k": "12",
        "root-fpi-mode": "round",
        "root-fpi-stop-kind": "epsilon",
        "root-fpi-stop-value": "0.0001"
      },
      ranking: {
        target: "21^(1/3)",
        p0: "1",
        candidates: [
          { id: "a", label: "g_a(x) = (20x + 21/x^2)/21", g: "(20*x + 21/(x^2)) / 21" },
          { id: "b", label: "g_b(x) = x - (x^3 - 21)/(3 x^2)", g: "x - (x^3 - 21)/(3*x^2)" },
          { id: "c", label: "g_c(x) = x - (x^4 - 21x)/(x^2 - 21)", g: "x - (x^4 - 21*x)/(x^2 - 21)" },
          { id: "d", label: "g_d(x) = sqrt(21/x)", g: "sqrt(21/x)" }
        ]
      }
    }
  ];

  function listGroups() {
    const order = [];
    const seen = Object.create(null);
    PRESETS.forEach(function trackGroup(preset) {
      if (!seen[preset.group]) {
        seen[preset.group] = true;
        order.push(preset.group);
      }
    });
    return order.map(function buildGroup(name) {
      return {
        name: name,
        presets: PRESETS.filter(function matchGroup(p) { return p.group === name; })
      };
    });
  }

  function findPreset(id) {
    for (let i = 0; i < PRESETS.length; i += 1) {
      if (PRESETS[i].id === id) return PRESETS[i];
    }
    return null;
  }

  // Returns the list of field ids whose value is "0" (or "0.0", etc.) and which the
  // preset flagged as unsafe for the population equation.
  function zeroWarnings(preset, getValue) {
    if (!preset || !preset.warnIfZero || !preset.warnIfZero.length) return [];
    return preset.warnIfZero.filter(function isZero(id) {
      const raw = getValue(id);
      if (raw == null || raw === "") return false;
      const n = Number(raw);
      return Number.isFinite(n) && n === 0;
    });
  }

  globalScope.RootsPresets = {
    list: function list() { return PRESETS.slice(); },
    listGroups: listGroups,
    find: findPreset,
    zeroWarnings: zeroWarnings
  };
})(window);
```

- [ ] **Step 2: Confirm the file parses**

Run: `node -e "const fs=require('fs'); const vm=require('vm'); const ctx={window:{}}; vm.createContext(ctx); vm.runInContext(fs.readFileSync('roots/roots-presets.js','utf8'), ctx); console.log(Object.keys(ctx.window.RootsPresets));"`
Expected: `[ 'list', 'listGroups', 'find', 'zeroWarnings' ]`.

- [ ] **Step 3: Commit**

```bash
git add roots/roots-presets.js
git commit -m "feat(roots): add professor/quiz preset catalog module"
```

---

### Task 4: Add preset selector and population-warning UI to `roots/index.html`

The selector belongs above the methods section so it cannot be missed, but it must not hide the existing method tabs or input panels.

**Files:**
- Modify: `roots/index.html` — add a preset card and a warning paragraph; load the new script.

- [ ] **Step 1: Add the preset card markup just above the methods section**

Insert this block immediately before the existing `<section id="root-method-section" ...>` line (around line 51 in `roots/index.html`):

```html
<section id="root-preset-card" class="root-preset-card root-academic-paper" aria-label="Quiz and lecture presets">
  <div class="root-section-heading">
    <p class="result-label">Presets</p>
    <h2>Load a professor or quiz problem</h2>
    <p>Choose a preset to fill the active method's inputs. You can still edit values after loading.</p>
  </div>
  <div class="root-preset-controls">
    <label for="root-preset-select">Preset</label>
    <select id="root-preset-select" aria-label="Preset problem">
      <option value="">Custom (no preset)</option>
    </select>
    <button id="root-preset-apply" type="button" class="btn-calculate-omni" aria-label="Apply preset to active method">Load preset</button>
  </div>
  <p id="root-preset-warning" class="inline-error" role="alert" hidden></p>
  <p id="root-preset-status" class="focus-note" role="status" aria-live="polite"></p>
</section>
```

- [ ] **Step 2: Add the script tag for `roots-presets.js`**

In the script block at the bottom of `roots/index.html` (around line 390), insert this line **before** the `roots-app.js` line:

```html
<script defer src="./roots-presets.js?v=roots-v1"></script>
```

- [ ] **Step 3: Confirm static audit still parses the HTML**

Run: `node scripts/roots-mini-app-static-audit.js`
Expected: process exits 0.

- [ ] **Step 4: Commit**

```bash
git add roots/index.html
git commit -m "feat(roots): add preset selector card to standalone shell"
```

---

### Task 5: Wire preset selector in `roots/roots-app.js` and `roots-state.js`

When the user picks a preset and clicks Load, switch to the preset's method, fill its fields, and clear cached runs for that method. After load, validate against the population x=0 rule and surface a warning.

**Files:**
- Modify: `roots/roots-state.js` — add a `selectedPreset` field and a `comparison` slot.
- Modify: `roots/roots-app.js` — populate the `<select>`, wire the Load button, fire `input` events so existing handlers clear cached runs.

- [ ] **Step 1: Extend `createState` in `roots/roots-state.js`**

Replace the current `createState` body (lines 61-76) with:

```js
function createState() {
  return {
    activeMethod: "bisection",
    angleMode: "rad",
    runs: Object.create(null),
    methodConfigs: METHOD_CONFIGS,
    selectedPreset: "",
    comparison: null,
    emptyTextById: {
      "root-approx": "Not calculated yet",
      "root-stopping-result": "Not calculated yet",
      "root-convergence": "Not calculated yet",
      "root-interval-status": "Not calculated yet",
      "root-sign-summary": "Not calculated yet",
      "root-decision-summary": "Not calculated yet"
    }
  };
}
```

- [ ] **Step 2: Add a preset-wiring function in `roots/roots-app.js`**

Insert this function near the other `wire*` helpers (e.g., right before `function wireSymbols()` at line 274):

```js
function populatePresetSelect() {
  const select = byId("root-preset-select");
  if (!select || !globalScope.RootsPresets) return;
  // Remove any prior dynamic options, keep the first "Custom" option.
  while (select.options && select.options.length > 1) select.remove(1);
  globalScope.RootsPresets.listGroups().forEach(function addGroup(group) {
    const optGroup = document.createElement("optgroup");
    optGroup.label = group.name;
    group.presets.forEach(function addPreset(preset) {
      const opt = document.createElement("option");
      opt.value = preset.id;
      opt.textContent = preset.label;
      optGroup.appendChild(opt);
    });
    select.appendChild(optGroup);
  });
}

function applySelectedPreset(state) {
  const select = byId("root-preset-select");
  const status = byId("root-preset-status");
  const warning = byId("root-preset-warning");
  const presetId = select ? select.value : "";
  if (!presetId) {
    if (status) status.textContent = "Pick a preset, then click Load.";
    if (warning) { warning.hidden = true; warning.textContent = ""; }
    return;
  }
  const preset = globalScope.RootsPresets.find(presetId);
  if (!preset) return;

  state.selectedPreset = presetId;
  activateMethod(state, preset.method);

  Object.keys(preset.fields).forEach(function setField(id) {
    const el = byId(id);
    if (!el) return;
    el.value = preset.fields[id];
    if (el.dispatchEvent && typeof Event === "function") {
      el.dispatchEvent(new Event("input", { bubbles: true }));
      el.dispatchEvent(new Event("change", { bubbles: true }));
    }
  });
  syncStoppingControls();

  const zeros = globalScope.RootsPresets.zeroWarnings(preset, function readField(id) {
    const el = byId(id);
    return el ? el.value : "";
  });
  if (warning) {
    if (zeros.length) {
      warning.textContent =
        "This preset uses an equation that divides by x. Replace any 0 starting value before running (" +
        zeros.join(", ") + ").";
      warning.hidden = false;
    } else {
      warning.hidden = true;
      warning.textContent = "";
    }
  }
  if (status) status.textContent = "Loaded preset: " + preset.label;
}

function wirePresets(state) {
  populatePresetSelect();
  const button = byId("root-preset-apply");
  if (button) button.addEventListener("click", function onApply() { applySelectedPreset(state); });
  const select = byId("root-preset-select");
  if (select) {
    select.addEventListener("change", function onSelect() {
      state.selectedPreset = select.value;
      const status = byId("root-preset-status");
      if (status) status.textContent = select.value ? "Click Load to apply this preset." : "Pick a preset, then click Load.";
    });
  }
}
```

- [ ] **Step 3: Call `wirePresets(state)` from the existing DOMContentLoaded handler**

In the `document.addEventListener("DOMContentLoaded", ...)` handler at the bottom of `roots/roots-app.js` (line 446), add `wirePresets(state);` immediately after the existing `wireSymbols();` call.

- [ ] **Step 4: Sanity-check the load order**

Confirm `roots/index.html` loads scripts in this order: `roots-state.js`, `roots-engine-adapter.js`, `roots-render.js`, `roots-presets.js`, `roots-app.js`. (`roots-presets.js` was inserted before `roots-app.js` in Task 4.)

- [ ] **Step 5: Run the static audit and the existing UI audit**

Run: `node scripts/roots-mini-app-static-audit.js && node scripts/roots-mini-app-ui-audit.js`
Expected: both exit 0. (The UI audit doesn't yet exercise presets — that comes in Task 14 — but it must continue to pass.)

- [ ] **Step 6: Commit**

```bash
git add roots/roots-state.js roots/roots-app.js
git commit -m "feat(roots): wire preset selector with population x=0 warning"
```

---

### Task 6: Add population-equation regressions to `scripts/root-engine-audit.js`

Verify the population equation converges near `0.1009979297` for every applicable method, with starting values from the presets.

**Files:**
- Modify: `scripts/root-engine-audit.js` — append five new checks inside the `run()` body before `report.finish()`.

- [ ] **Step 1: Add the regression block**

Append this block inside `function run()` (just before the existing `report.finish();` call at line 756):

```js
{
  const F = "1000000*e^x + (435000/x)*(e^x - 1) - 1564000";
  const DF = "1000000*e^x + 435000*(x*e^x - (e^x - 1))/x^2";
  const G = "log((1564000*x + 435000)/(1000000*x + 435000))";
  const TARGET = 0.1009979297;
  const TOL = 1e-5;

  function nearTarget(value) {
    const n = realOrMessage(C, value, "approximation");
    return typeof n === "number" && Math.abs(n - TARGET) <= TOL;
  }

  const popBis = R.runBisection({
    expression: F, interval: { a: "0.1", b: "0.15" },
    machine: { k: 12, mode: "round" },
    stopping: { kind: "iterations", value: 20 },
    decisionBasis: "machine", signDisplay: "both", angleMode: "rad"
  });
  report.check(
    "Population — Bisection converges near 0.1009979297",
    "Population equation",
    "near 0.1009979297 (+/- 1e-5)",
    String(popBis.summary.approximation),
    nearTarget(popBis.summary.approximation)
  );

  const popFP = R.runFalsePosition({
    expression: F, interval: { a: "0.1", b: "0.15" },
    machine: { k: 12, mode: "round" },
    stopping: { kind: "iterations", value: 20 },
    decisionBasis: "machine", signDisplay: "both", angleMode: "rad"
  });
  report.check(
    "Population — False Position converges near 0.1009979297",
    "Population equation",
    "near 0.1009979297 (+/- 1e-5)",
    String(popFP.summary.approximation),
    nearTarget(popFP.summary.approximation)
  );

  const popNewton = R.runNewtonRaphson({
    expression: F, dfExpression: DF, x0: "0.12",
    machine: { k: 12, mode: "round" },
    stopping: { kind: "iterations", value: 10 },
    angleMode: "rad"
  });
  report.check(
    "Population — Newton converges near 0.1009979297",
    "Population equation",
    "near 0.1009979297 (+/- 1e-5)",
    String(popNewton.summary.approximation),
    nearTarget(popNewton.summary.approximation)
  );

  const popSecant = R.runSecant({
    expression: F, x0: "0.1", x1: "0.15",
    machine: { k: 12, mode: "round" },
    stopping: { kind: "iterations", value: 10 },
    angleMode: "rad"
  });
  report.check(
    "Population — Secant converges near 0.1009979297",
    "Population equation",
    "near 0.1009979297 (+/- 1e-5)",
    String(popSecant.summary.approximation),
    nearTarget(popSecant.summary.approximation)
  );

  const popFixed = R.runFixedPoint({
    gExpression: G, x0: "0.1",
    machine: { k: 12, mode: "round" },
    stopping: { kind: "epsilon", value: "1e-8" },
    angleMode: "rad"
  });
  report.check(
    "Population — Fixed-point form converges near 0.1009979297",
    "Population equation",
    "near 0.1009979297 (+/- 1e-5)",
    String(popFixed.summary.approximation),
    nearTarget(popFixed.summary.approximation)
  );

  const popZeroBis = captureRun(function popZero() {
    return R.runBisection({
      expression: F, interval: { a: "0", b: "0.15" },
      machine: { k: 12, mode: "round" },
      stopping: { kind: "iterations", value: 4 },
      decisionBasis: "machine", signDisplay: "both", angleMode: "rad"
    });
  });
  // The engine should either throw or surface an invalid summary because f(0) is undefined.
  const rejectedZero = popZeroBis.error
    || (popZeroBis.run && (
      popZeroBis.run.summary.intervalStatus === "invalid-continuity"
      || popZeroBis.run.summary.stopReason === "discontinuity-detected"
      || popZeroBis.run.summary.stopReason === "non-finite-evaluation"
      || popZeroBis.run.summary.stopReason === "singularity-encountered"
      || popZeroBis.run.summary.stopReason === "invalid-input"
    ));
  report.check(
    "Population — x=0 starting endpoint is rejected or flagged",
    "Population equation",
    "throws or invalid-continuity / discontinuity / non-finite",
    popZeroBis.error ? popZeroBis.error.message : String(popZeroBis.run && popZeroBis.run.summary.stopReason),
    Boolean(rejectedZero)
  );
}
```

- [ ] **Step 2: Run the audit**

Run: `node scripts/root-engine-audit.js`
Expected: all checks pass. If any population check fails, the failure narrative will name the method — investigate before continuing (do not relax `TOL`).

- [ ] **Step 3: Commit**

```bash
git add scripts/root-engine-audit.js
git commit -m "test(roots): add population-equation regressions for all methods"
```

---

### Task 7: Add quiz Newton + fixed-point ranking regressions to `scripts/root-engine-audit.js`

Verify the four Newton quiz problems each stop with `|x_(n+1) - x_n| < 0.0001` and that the four `21^(1/3)` formulas produce a stable ranking pattern (a and b converge, c diverges or fails, d cycles or fails).

**Files:**
- Modify: `scripts/root-engine-audit.js` — append two more blocks before `report.finish()`.

- [ ] **Step 1: Append the Newton quiz regression block**

```js
{
  const cases = [
    { name: "x^3 - 2x^2 - 5", f: "x^3 - 2*x^2 - 5", df: "3*x^2 - 4*x", x0: "2.5", expected: 2.6906474480286287 },
    { name: "x^3 + 3x^2 - 1", f: "x^3 + 3*x^2 - 1", df: "3*x^2 + 6*x", x0: "-2.5", expected: -2.879385241571816 },
    { name: "x - cos(x)", f: "x - cos(x)", df: "1 + sin(x)", x0: "0.7853981633974483", expected: 0.7390851332151607 },
    { name: "x - 0.8 - 0.2 sin(x)", f: "x - 0.8 - 0.2*sin(x)", df: "1 - 0.2*cos(x)", x0: "0.7853981633974483", expected: 0.964333888806146 }
  ];

  cases.forEach(function checkCase(c) {
    const run = R.runNewtonRaphson({
      expression: c.f, dfExpression: c.df, x0: c.x0,
      machine: { k: 12, mode: "round" },
      stopping: { kind: "epsilon", value: "0.0001" },
      angleMode: "rad"
    });
    const approx = realOrMessage(C, run.summary.approximation, "Newton quiz approximation");
    const close = typeof approx === "number" && Math.abs(approx - c.expected) <= 5e-4;
    const finalRow = run.rows[run.rows.length - 1];
    const stoppedByStep = finalRow && typeof finalRow.error === "number" && finalRow.error < 0.0001;
    report.check(
      "Newton quiz — " + c.name + " stops under |x next - x| < 1e-4",
      "Newton quiz",
      "approx near " + c.expected + " and final |dx| < 1e-4",
      "approx=" + approx + ", final|dx|=" + (finalRow ? finalRow.error : "n/a"),
      Boolean(close && stoppedByStep)
    );
  });
}
```

- [ ] **Step 2: Append the fixed-point ranking regression block**

```js
{
  const target = Math.cbrt(21);
  const TOL = 1e-3;

  function classify(run) {
    if (!run || !run.summary) return "no-run";
    const a = run.summary.approximation;
    if (run.summary.stopReason === "cycle-detected") return "cycle";
    if (run.summary.stopReason === "diverged" || run.summary.stopReason === "diverged-step") return "diverged";
    if (run.summary.stopReason === "non-finite-evaluation"
      || run.summary.stopReason === "singularity-encountered") return "undefined";
    if (a == null) return "no-approx";
    const n = realOrMessage(C, a, "approx");
    if (typeof n !== "number") return "no-approx";
    return Math.abs(n - target) <= TOL ? "converged" : "off-target";
  }

  const candidates = {
    a: "(20*x + 21/(x^2)) / 21",
    b: "x - (x^3 - 21)/(3*x^2)",
    c: "x - (x^4 - 21*x)/(x^2 - 21)",
    d: "sqrt(21/x)"
  };

  const classes = {};
  Object.keys(candidates).forEach(function evalCandidate(key) {
    const result = captureRun(function runCandidate() {
      return R.runFixedPoint({
        gExpression: candidates[key], x0: "1",
        machine: { k: 14, mode: "round" },
        stopping: { kind: "epsilon", value: "1e-8" },
        angleMode: "rad"
      });
    });
    classes[key] = result.error ? "undefined" : classify(result.run);
  });

  // The professor's expected ranking: a and b are clearly convergent (b is faster as it's
  // Newton's iteration), c is unstable, d is non-convergent. We do not pin the exact label
  // for c/d, only that a and b converge and c/d are not classified as converged.
  report.check(
    "Fixed-point ranking — g_a converges to 21^(1/3)",
    "Fixed-point ranking",
    "converged",
    classes.a,
    classes.a === "converged"
  );
  report.check(
    "Fixed-point ranking — g_b converges to 21^(1/3)",
    "Fixed-point ranking",
    "converged",
    classes.b,
    classes.b === "converged"
  );
  report.check(
    "Fixed-point ranking — g_c does not converge",
    "Fixed-point ranking",
    "anything except converged",
    classes.c,
    classes.c !== "converged"
  );
  report.check(
    "Fixed-point ranking — g_d does not converge",
    "Fixed-point ranking",
    "anything except converged",
    classes.d,
    classes.d !== "converged"
  );
}
```

- [ ] **Step 3: Run the audit**

Run: `node scripts/root-engine-audit.js`
Expected: every new check passes. If a Newton expected-root literal disagrees with the engine, recompute the converged value at higher precision and update the expected literal once — do not weaken the tolerance below `5e-4`.

- [ ] **Step 4: Commit**

```bash
git add scripts/root-engine-audit.js
git commit -m "test(roots): add Newton quiz and 21^(1/3) ranking regressions"
```

---

### Task 8: Add exam-style table column shapes in `roots-render.js`

The current `TABLE_CONFIGS` covers most columns. Adjust headers to match the spec wording and add the Newton "correction" column.

**Files:**
- Modify: `roots/roots-render.js` — update `TABLE_CONFIGS` and the matching row builders (`bracketRowValues`, `rowValues` Newton branch).

- [ ] **Step 1: Replace `TABLE_CONFIGS` (lines 7-13) with the exam-aligned headers**

```js
const TABLE_CONFIGS = {
  bisection: {
    headers: ["n", "a_n", "b_n", "p_n", "f(p_n)", "Signs", "Kept interval", "Bound", "Error", "Note"],
    colSpan: 10
  },
  falsePosition: {
    headers: ["n", "a_n", "b_n", "p_n", "f(p_n)", "Signs", "Retained interval", "Error", "Note"],
    colSpan: 9
  },
  newton: {
    headers: ["n", "x_n", "f(x_n)", "f'(x_n)", "Correction f/f'", "x_(n+1)", "Error", "Note"],
    colSpan: 8
  },
  secant: {
    headers: ["n", "x_(n-1)", "x_n", "f(x_(n-1))", "f(x_n)", "x_(n+1)", "Error", "Note"],
    colSpan: 8
  },
  fixedPoint: {
    headers: ["n", "p_n", "g(p_n)", "|p_n - p_(n-1)|", "Note"],
    colSpan: 5
  }
};
```

- [ ] **Step 2: Update `bracketRowValues` to match the new column counts**

Replace the body of `bracketRowValues` (around lines 530-549) with:

```js
function bracketRowValues(row, run) {
  const sd = run.signDisplay || "both";
  const exact = row.exactSigns || {};
  const machine = row.machineSigns || {};
  const fcCell = fmtPoint(row.fc, sd, run);
  const signsCell =
    "a: " + formatSignPair(sd, exact.a, machine.a)
    + ", b: " + formatSignPair(sd, exact.b, machine.b)
    + ", c: " + formatSignPair(sd, exact.c, machine.c);
  const keptCell = row.decision === "left" ? "[a, c]" : "[c, b]";
  if (run.method === "bisection") {
    return [
      row.iteration,
      fmtVal(row.a, 12),
      fmtVal(row.b, 12),
      fmtVal(row.c, 12),
      fcCell,
      signsCell,
      keptCell,
      row.bound == null ? "-" : fmtErr(row.bound),
      fmtErr(row.error),
      row.note || ""
    ];
  }
  return [
    row.iteration,
    fmtVal(row.a, 12),
    fmtVal(row.b, 12),
    fmtVal(row.c, 12),
    fcCell,
    signsCell,
    keptCell,
    fmtErr(row.error),
    row.note || ""
  ];
}
```

- [ ] **Step 3: Update the Newton branch in `rowValues` to include the correction column**

Replace the Newton branch (around line 553-555) with:

```js
if (run.method === "newton") {
  const fxn = realNumber(row.fxn);
  const dfxn = realNumber(row.dfxn);
  const correction = fxn != null && dfxn != null && dfxn !== 0
    ? C.formatReal(fxn / dfxn, 12)
    : "-";
  return [
    row.iteration,
    fmtVal(row.xn, 12),
    fmtVal(row.fxn, 12),
    fmtVal(row.dfxn, 12),
    correction,
    fmtVal(row.xNext, 12),
    fmtErr(row.error),
    row.note || ""
  ];
}
```

- [ ] **Step 4: Update the `resetResults` placeholder colspan**

The existing line `body.innerHTML = "<tr class=\"empty-row\"><td colspan=\"13\">No steps yet.</td></tr>";` (line 630) should be `colspan="10"` to match the widest exam-table header (bisection, 10 columns).

- [ ] **Step 5: Run audits to confirm row counts and table content still parse**

Run: `node scripts/roots-mini-app-ui-audit.js`
Expected: existing assertions still pass. The audit asserts text content in `root-iteration-body` only for fixed-point's first iterate (`0.540302305868`); both old and new layouts retain that cell.

- [ ] **Step 6: Commit**

```bash
git add roots/roots-render.js
git commit -m "feat(roots): use professor-style column headers in iteration tables"
```

---

### Task 9: Add a categorical stopping-check panel under the iteration table

The existing render emits one `stopping-result` summary in the answer card. The spec wants a compact panel below the table that explicitly lists the stop category. Reuse the existing `formatStopReason` map and add a structured panel.

**Files:**
- Modify: `roots/index.html` — add a `<section id="root-stopping-check">` below the iteration table wrapper.
- Modify: `roots/roots-render.js` — render the panel inside `renderRun` and reset it in `resetResults`.

- [ ] **Step 1: Add the panel container to `roots/index.html`**

Inside `<section id="root-evidence-stack" ...>`, immediately after `</div>` that closes `root-iteration-table-wrap` (around line 366), add:

```html
<section id="root-stopping-check" class="root-stopping-check answer-hero" aria-label="Stopping check">
  <div class="root-section-heading">
    <p class="result-label">Stopping check</p>
    <h3 id="root-stop-category">Not calculated yet</h3>
  </div>
  <ul id="root-stop-bullets" class="root-stop-bullets"></ul>
</section>
```

- [ ] **Step 2: Add a renderer in `roots/roots-render.js`**

Insert these helpers near the other renderers (e.g., right after `renderConvergenceSummary`):

```js
function classifyStop(run) {
  const reason = run && run.summary && run.summary.stopReason;
  const status = run && run.summary && run.summary.intervalStatus;
  if (status === "invalid-bracket") return "Invalid bracket";
  if (reason === "iteration-limit") return "Requested iterations completed";
  if (reason === "iteration-cap") return "Safety cap reached";
  if (reason === "tolerance-reached") return "Tolerance reached";
  if (reason === "tolerance-already-met") return "Tolerance already met by starting interval";
  if (reason === "endpoint-root") return "Endpoint is the root";
  if (reason === "exact-zero") return "Exact zero residual";
  if (reason === "machine-zero") return "Machine-zero residual";
  if (reason === "derivative-zero") return "Derivative is zero";
  if (reason === "stagnation") return "Denominator stalled";
  if (reason === "diverged" || reason === "diverged-step") return "Iterates diverged";
  if (reason === "cycle-detected") return "Cycle detected";
  if (reason === "retained-endpoint-stagnation") return "Retained endpoint stagnation (false position)";
  if (reason === "discontinuity-detected" || reason === "singularity-encountered" || reason === "non-finite-evaluation") {
    return "Singularity or non-finite value";
  }
  if (reason === "invalid-input" || reason === "invalid-starting-interval") return "Invalid input";
  return "Run ended";
}

function bisectionStopBullets(run) {
  const summary = run.summary || {};
  const stopping = run.stopping || {};
  const bullets = [];
  if (stopping.epsilonBound != null) {
    bullets.push("Guaranteed interval bound = " + fmtErr(stopping.epsilonBound));
  }
  const lastRow = run.rows && run.rows[run.rows.length - 1];
  if (lastRow && lastRow.error != null) {
    bullets.push("Successive-midpoint error |p_n - p_(n-1)| = " + fmtErr(lastRow.error));
  }
  if (summary.residual != null) {
    bullets.push("Residual |f(p_n)| = " + fmtVal(summary.residual, 12));
  }
  return bullets;
}

function generalStopBullets(run) {
  const summary = run.summary || {};
  const bullets = [];
  if (summary.error != null) bullets.push("Final |error| = " + fmtErr(summary.error));
  if (summary.bound != null) bullets.push("Final bound = " + fmtErr(summary.bound));
  if (summary.residual != null) bullets.push("Residual = " + fmtVal(summary.residual, 12));
  if (summary.cyclePeriod != null) bullets.push("Cycle period = " + summary.cyclePeriod);
  return bullets;
}

function renderStoppingCheck(run) {
  const category = byId("root-stop-category");
  const list = byId("root-stop-bullets");
  if (!category || !list) return;
  category.textContent = classifyStop(run);
  const bullets = run && run.method === "bisection" ? bisectionStopBullets(run) : generalStopBullets(run);
  list.innerHTML = bullets.length
    ? bullets.map(function bullet(text) { return "<li>" + escapeHtml(text) + "</li>"; }).join("")
    : "<li>No additional stopping detail.</li>";
}
```

- [ ] **Step 3: Call `renderStoppingCheck(run)` from `renderRun`**

In `renderRun` (line 585), add `renderStoppingCheck(run);` after `renderTable(run);`.

- [ ] **Step 4: Reset the panel in `resetResults`**

Inside `resetResults`, after the existing `if (body) body.innerHTML = ...` line, add:

```js
const stopCategory = byId("root-stop-category");
const stopBullets = byId("root-stop-bullets");
if (stopCategory) stopCategory.textContent = state.emptyTextById["root-stopping-result"] || "Not calculated yet";
if (stopBullets) stopBullets.innerHTML = "";
```

- [ ] **Step 5: Run the UI audit**

Run: `node scripts/roots-mini-app-ui-audit.js`
Expected: passes. (Task 14 will add explicit stopping-check assertions.)

- [ ] **Step 6: Commit**

```bash
git add roots/index.html roots/roots-render.js
git commit -m "feat(roots): add categorical stopping-check panel under iteration table"
```

---

### Task 10: Add the final-answer paragraph formatter

A one-click button that builds an exam-style paragraph from the live run, not canned text.

**Files:**
- Modify: `roots/index.html` — add a button + output region inside the answer card.
- Modify: `roots/roots-render.js` — export `buildFinalAnswerParagraph(run)`.
- Modify: `roots/roots-app.js` — wire the button.

- [ ] **Step 1: Add the markup in `roots/index.html`**

Inside `<div class="root-answer-actions">` (around line 299), after the existing copy-answer button, add:

```html
<button id="root-format-answer" type="button" class="root-answer-copy">Format final answer</button>
```

Then add a paragraph slot just below `<div class="root-answer-actions">` and before `<div class="root-answer-context">`:

```html
<p id="root-final-answer-paragraph" class="root-final-answer-paragraph" role="region" aria-live="polite"></p>
```

- [ ] **Step 2: Add the builder in `roots/roots-render.js`**

Insert this near `buildAnswerText`:

```js
function methodSentenceLabel(method) {
  const map = {
    bisection: "the bisection method",
    falsePosition: "the false position method",
    newton: "the Newton-Raphson method",
    secant: "the secant method",
    fixedPoint: "fixed-point iteration"
  };
  return map[method] || "the selected method";
}

function stoppingSentence(run) {
  const summary = run && run.summary ? run.summary : {};
  const stopping = run && run.stopping ? run.stopping : {};
  const reason = summary.stopReason;
  if (reason === "iteration-limit") {
    return "the requested iteration count n = " + stopping.input + " was reached";
  }
  if (reason === "tolerance-reached") {
    return "the iterate change fell below epsilon = " + stopping.input;
  }
  if (reason === "iteration-cap") {
    return "the safety cap of " + stopping.maxIterations + " iterations was reached before tolerance";
  }
  if (reason === "exact-zero" || reason === "machine-zero") {
    return "the residual reached zero (or machine-zero) at the reported approximation";
  }
  if (reason === "endpoint-root") {
    return "an endpoint was already a root";
  }
  if (reason === "derivative-zero") {
    return "the derivative became zero, halting the Newton step";
  }
  if (reason === "retained-endpoint-stagnation") {
    return "false position kept the same endpoint long enough to trip the stagnation guard";
  }
  if (reason === "diverged" || reason === "diverged-step") {
    return "the iterates moved away from a single root";
  }
  if (reason === "cycle-detected") {
    return "the iteration entered a cycle";
  }
  if (reason === "discontinuity-detected" || reason === "singularity-encountered" || reason === "non-finite-evaluation") {
    return "the function became undefined or non-finite during the run";
  }
  if (reason === "invalid-starting-interval") {
    return "the starting interval did not bracket a sign change";
  }
  return "the run ended (" + (reason || "unspecified reason") + ")";
}

function buildFinalAnswerParagraph(run) {
  if (!run) return "";
  const summary = run.summary || {};
  const root = summary.approximation == null ? "N/A" : fmtVal(summary.approximation, 12);
  const equation = run.canonical || run.expression || "f(x)";
  const equationKind = run.method === "fixedPoint" ? "g(x) = " : "f(x) = ";
  const stopping = run.stopping || {};
  const iters = (run.rows || []).length;
  const stopText = stoppingSentence(run);
  return (
    "Using " + methodSentenceLabel(run.method) + " on " + equationKind + equation
    + ", the approximate solution is x = " + root + " after " + iters + " iteration" + (iters === 1 ? "" : "s") + ". "
    + "The stopping condition was satisfied because " + stopText + " ("
    + (stopping.kind === "epsilon" ? "epsilon = " + stopping.input : "n = " + stopping.input)
    + ")."
  );
}
```

Then add `buildFinalAnswerParagraph` to the `globalScope.RootsRender = { ... }` export (line 681).

- [ ] **Step 3: Wire the button in `roots/roots-app.js`**

Add this function and call it from the DOMContentLoaded handler:

```js
function wireFormatAnswer(state) {
  const button = byId("root-format-answer");
  const target = byId("root-final-answer-paragraph");
  if (!button || !target) return;
  button.addEventListener("click", function onFormat() {
    const run = state.runs[state.activeMethod];
    if (!run) {
      target.textContent = "Run a method first to generate the formatted answer.";
      return;
    }
    target.textContent = globalScope.RootsRender.buildFinalAnswerParagraph(run);
  });
}
```

In the DOMContentLoaded handler (line 446), add `wireFormatAnswer(state);` after `wireCopyAnswer(state);`.

- [ ] **Step 4: Run the UI audit to confirm no regression**

Run: `node scripts/roots-mini-app-ui-audit.js`
Expected: passes.

- [ ] **Step 5: Commit**

```bash
git add roots/index.html roots/roots-render.js roots/roots-app.js
git commit -m "feat(roots): add one-click exam-style final answer formatter"
```

---

### Task 11: Add the fixed-point ranking adapter and runner

The fixed-point engine already returns `summary.stopReason`, `summary.approximation`, and `rows`. The new comparison runner calls it once per candidate.

**Files:**
- Modify: `roots/roots-engine-adapter.js` — export `runFixedPointComparison`.
- Create: `roots/roots-comparison.js` — compare and classify candidates.

- [ ] **Step 1: Add `runFixedPointComparison` to `roots/roots-engine-adapter.js`**

Append before the `globalScope.RootsEngineAdapter = ...` line:

```js
function runFixedPointComparison(candidates, x0, machine, stopping, angleMode) {
  return candidates.map(function runCandidate(candidate) {
    try {
      const run = R.runFixedPoint({
        gExpression: candidate.g,
        x0: x0,
        machine: machine,
        stopping: stopping,
        angleMode: angleMode
      });
      return { id: candidate.id, label: candidate.label, g: candidate.g, run: run, error: null };
    } catch (err) {
      return { id: candidate.id, label: candidate.label, g: candidate.g, run: null, error: err };
    }
  });
}
```

Then update the export to:

```js
globalScope.RootsEngineAdapter = { runMethod, runFixedPointComparison };
```

- [ ] **Step 2: Create `roots/roots-comparison.js`**

```js
"use strict";

(function initRootsComparison(globalScope) {
  function classify(result, target, tolerance) {
    if (!result) return { kind: "missing", note: "No result returned." };
    if (result.error) return { kind: "undefined", note: result.error.message || "Evaluation failed." };
    const summary = result.run && result.run.summary;
    if (!summary) return { kind: "undefined", note: "No summary." };
    if (summary.stopReason === "cycle-detected") return { kind: "cycle", note: "Cycle period " + (summary.cyclePeriod || "?") };
    if (summary.stopReason === "diverged" || summary.stopReason === "diverged-step") {
      return { kind: "diverged", note: "Iterates moved away." };
    }
    if (summary.stopReason === "non-finite-evaluation"
      || summary.stopReason === "singularity-encountered"
      || summary.stopReason === "discontinuity-detected") {
      return { kind: "undefined", note: "Function became undefined." };
    }
    if (summary.stopReason === "iteration-cap") {
      return { kind: "stalled", note: "Cap reached without tolerance." };
    }
    const approx = Number(summary.approximation);
    if (!Number.isFinite(approx)) return { kind: "undefined", note: "Approximation not finite." };
    if (typeof target === "number" && Number.isFinite(target) && Math.abs(approx - target) <= tolerance) {
      return { kind: "converged", note: "Within tolerance of target." };
    }
    return { kind: "off-target", note: "Settled away from target." };
  }

  function rank(results, target, tolerance) {
    const classified = results.map(function withClass(result) {
      const klass = classify(result, target, tolerance);
      const rows = result.run && result.run.rows ? result.run.rows : [];
      const finalError = rows.length ? rows[rows.length - 1].error : null;
      return {
        id: result.id,
        label: result.label,
        g: result.g,
        kind: klass.kind,
        note: klass.note,
        iterations: rows.length,
        finalError: typeof finalError === "number" ? finalError : null,
        approximation: result.run && result.run.summary ? result.run.summary.approximation : null
      };
    });

    const converged = classified.filter(function isConverged(r) { return r.kind === "converged"; });
    converged.sort(function byIterations(a, b) {
      if (a.iterations !== b.iterations) return a.iterations - b.iterations;
      const ae = a.finalError == null ? Infinity : a.finalError;
      const be = b.finalError == null ? Infinity : b.finalError;
      return ae - be;
    });
    const others = classified.filter(function notConverged(r) { return r.kind !== "converged"; });
    return { ranked: converged, others: others };
  }

  function runRanking(presetRanking, machine, stopping, angleMode) {
    const targetExpression = presetRanking.target;
    const target = (function evalTarget() {
      try {
        const E = globalScope.ExpressionEngine;
        const C = globalScope.CalcEngine;
        if (!E || !C) return NaN;
        const ast = E.parse(targetExpression);
        const env = E.createEnvironment({ angleMode: angleMode });
        const value = E.evaluate(ast, env);
        return Number(C.requireRealNumber(value, "target"));
      } catch (err) {
        return NaN;
      }
    })();
    const TOL = 1e-3;
    const results = globalScope.RootsEngineAdapter.runFixedPointComparison(
      presetRanking.candidates, presetRanking.p0, machine, stopping, angleMode
    );
    return { target: target, ranking: rank(results, target, TOL) };
  }

  globalScope.RootsComparison = { runRanking: runRanking, classify: classify, rank: rank };
})(window);
```

- [ ] **Step 3: Load the new script in `roots/index.html`**

Add this line in the script block, immediately after the `roots-presets.js` line:

```html
<script defer src="./roots-comparison.js?v=roots-v1"></script>
```

- [ ] **Step 4: Smoke-test the module under Node**

Run:

```bash
node -e "const fs=require('fs'); const vm=require('vm'); const ctx={console}; ctx.window=ctx; ctx.globalThis=ctx; vm.createContext(ctx); ['math-engine.js','calc-engine.js','expression-engine.js','root-engine.js','roots/roots-engine-adapter.js','roots/roots-comparison.js'].forEach(f=>vm.runInContext(fs.readFileSync(f,'utf8'),ctx,{filename:f})); const preset={target:'21^(1/3)',p0:'1',candidates:[{id:'a',label:'a',g:'(20*x + 21/(x^2)) / 21'},{id:'b',label:'b',g:'x - (x^3 - 21)/(3*x^2)'}]}; console.log(JSON.stringify(ctx.window.RootsComparison.runRanking(preset,{k:14,mode:'round'},{kind:'epsilon',value:'1e-8'},'rad').ranking.ranked.map(r=>({id:r.id,iters:r.iterations}))));"
```

Expected: a JSON line listing both `a` and `b` as converged with positive iteration counts.

- [ ] **Step 5: Commit**

```bash
git add roots/roots-engine-adapter.js roots/roots-comparison.js roots/index.html
git commit -m "feat(roots): add fixed-point ranking adapter and classification module"
```

---

### Task 12: Render the ranking result in the fixed-point panel

When the active method is `fixedPoint` *and* the loaded preset has a `ranking` block, expose a "Run ranking" button and display the ranked + others tables under the iteration table.

**Files:**
- Modify: `roots/index.html` — add a ranking control inside the fixed-point input panel.
- Modify: `roots/roots-render.js` — add `renderComparisonResult(state)`.
- Modify: `roots/roots-app.js` — wire the button to call the comparison runner and render its result.

- [ ] **Step 1: Add the ranking control in `roots/index.html`**

Inside `<section id="root-inputs-fixedpoint" ...>`, after the closing `</div>` for the `root-config-grid` (around line 277), add:

```html
<div class="root-fpi-ranking" hidden id="root-fpi-ranking-controls">
  <button id="root-fpi-rank-run" type="button" class="ghost roots-angle-btn">Run fixed-point ranking</button>
  <p id="root-fpi-rank-status" class="focus-note" role="status" aria-live="polite"></p>
</div>
```

Also add a result region inside `root-evidence-stack`, immediately after the new `root-stopping-check` section:

```html
<section id="root-comparison-panel" class="root-comparison-panel answer-hero" aria-label="Fixed-point ranking" hidden>
  <div class="root-section-heading">
    <p class="result-label">Fixed-point ranking</p>
    <h3>Comparison of g(x) candidates</h3>
  </div>
  <p id="root-comparison-target" class="focus-note"></p>
  <table class="root-comparison-table">
    <thead><tr><th>Rank</th><th>Formula</th><th>Outcome</th><th>Iterations</th><th>Final |dx|</th><th>Approximation</th><th>Note</th></tr></thead>
    <tbody id="root-comparison-body"></tbody>
  </table>
</section>
```

- [ ] **Step 2: Add `renderComparisonResult` in `roots/roots-render.js`**

```js
function renderComparisonResult(comparison) {
  const panel = byId("root-comparison-panel");
  const target = byId("root-comparison-target");
  const body = byId("root-comparison-body");
  if (!panel || !target || !body) return;
  if (!comparison) {
    panel.hidden = true;
    target.textContent = "";
    body.innerHTML = "";
    return;
  }
  panel.hidden = false;
  target.textContent = "Target: " + (Number.isFinite(comparison.target) ? C.formatReal(comparison.target, 12) : "unknown");
  const rows = []
    .concat(comparison.ranking.ranked.map(function rankRow(r, i) { return Object.assign({ rank: String(i + 1) }, r); }))
    .concat(comparison.ranking.others.map(function otherRow(r) { return Object.assign({ rank: "—" }, r); }));
  if (!rows.length) {
    body.innerHTML = "<tr class=\"empty-row\"><td colspan=\"7\">No comparison rows.</td></tr>";
    return;
  }
  body.innerHTML = rows.map(function rowHtml(r) {
    return "<tr>"
      + "<td>" + escapeHtml(r.rank) + "</td>"
      + "<td>" + escapeHtml(r.label) + "</td>"
      + "<td>" + escapeHtml(r.kind) + "</td>"
      + "<td>" + escapeHtml(r.iterations) + "</td>"
      + "<td>" + escapeHtml(r.finalError == null ? "-" : C.formatReal(r.finalError, 8)) + "</td>"
      + "<td>" + escapeHtml(r.approximation == null ? "-" : fmtVal(r.approximation, 12)) + "</td>"
      + "<td>" + escapeHtml(r.note) + "</td>"
      + "</tr>";
  }).join("");
}
```

Add `renderComparisonResult` to the `globalScope.RootsRender = { ... }` export.

- [ ] **Step 3: Wire the ranking button in `roots/roots-app.js`**

Add these helpers near `wireFormatAnswer`:

```js
function refreshRankingControls(state) {
  const controls = byId("root-fpi-ranking-controls");
  if (!controls) return;
  const presetId = state.selectedPreset;
  const preset = presetId && globalScope.RootsPresets ? globalScope.RootsPresets.find(presetId) : null;
  const show = !!(preset && preset.ranking && state.activeMethod === "fixedPoint");
  controls.hidden = !show;
  if (!show) {
    state.comparison = null;
    globalScope.RootsRender.renderComparisonResult(null);
  }
}

function wireRankingButton(state) {
  const button = byId("root-fpi-rank-run");
  const status = byId("root-fpi-rank-status");
  if (!button) return;
  button.addEventListener("click", function onRun() {
    const preset = globalScope.RootsPresets.find(state.selectedPreset);
    if (!preset || !preset.ranking) {
      if (status) status.textContent = "Load the fixed-point ranking preset first.";
      return;
    }
    const machine = {
      k: Number(byId("root-fpi-k").value),
      mode: byId("root-fpi-mode").value
    };
    const stopping = {
      kind: byId("root-fpi-stop-kind").value,
      value: byId("root-fpi-stop-value").value
    };
    try {
      const comparison = globalScope.RootsComparison.runRanking(preset.ranking, machine, stopping, state.angleMode);
      state.comparison = comparison;
      globalScope.RootsRender.renderComparisonResult(comparison);
      if (status) status.textContent = "Ranked " + comparison.ranking.ranked.length + " convergent formula(s).";
    } catch (err) {
      if (status) status.textContent = err && err.message ? err.message : "Ranking failed.";
    }
  });
}
```

- [ ] **Step 4: Call the new wiring helpers and refresh on method/preset change**

In the DOMContentLoaded handler, add `wireRankingButton(state);` after `wireFormatAnswer(state);`. Then in `activateMethod` (line 114) add `refreshRankingControls(state);` at the end, and in `applySelectedPreset` (Task 5) add `refreshRankingControls(state);` after `syncStoppingControls();`.

- [ ] **Step 5: Run the UI audit**

Run: `node scripts/roots-mini-app-ui-audit.js`
Expected: passes.

- [ ] **Step 6: Commit**

```bash
git add roots/index.html roots/roots-render.js roots/roots-app.js
git commit -m "feat(roots): render fixed-point ranking comparison in evidence stack"
```

---

### Task 13: Extend `scripts/roots-mini-app-ui-audit.js` with preset, table, stopping-check, formatter, and ranking coverage

Lock the new behaviors into the headless audit so they cannot regress.

**Files:**
- Modify: `scripts/roots-mini-app-ui-audit.js` — register the new ids in `IDS`/`BUTTON_IDS`, add the new file to `FILES`, append assertions.

- [ ] **Step 1: Register the new file in `FILES`**

In `scripts/roots-mini-app-ui-audit.js`, update the `FILES` list (lines 10-20) to include `roots/roots-presets.js` and `roots/roots-comparison.js` *before* `roots/roots-app.js`:

```js
const FILES = [
  "math-engine.js",
  "calc-engine.js",
  "expression-engine.js",
  "root-engine.js",
  "math-display.js",
  "roots/roots-state.js",
  "roots/roots-engine-adapter.js",
  "roots/roots-render.js",
  "roots/roots-presets.js",
  "roots/roots-comparison.js",
  "roots/roots-app.js"
];
```

- [ ] **Step 2: Register the new DOM ids**

In the `IDS` array (lines 107-130), add (without breaking the existing entries):

```js
"root-preset-card", "root-preset-select", "root-preset-apply", "root-preset-warning", "root-preset-status",
"root-stopping-check", "root-stop-category", "root-stop-bullets",
"root-format-answer", "root-final-answer-paragraph",
"root-fpi-ranking-controls", "root-fpi-rank-run", "root-fpi-rank-status",
"root-comparison-panel", "root-comparison-target", "root-comparison-body"
```

In `BUTTON_IDS` (lines 132-149), add:

```js
"root-preset-apply",
"root-format-answer",
"root-fpi-rank-run"
```

- [ ] **Step 3: The fake `<select>` needs the same option list as the real DOM**

Right above the `if (selector === ".symbol-trigger")` line in `querySelectorAll` (around line 188), the existing harness already returns "" for unknown selectors. The `populatePresetSelect` helper calls `select.options` and `select.remove(1)`. Add minimal `options`/`remove` support to `FakeElement`:

In `FakeElement`'s constructor (line 60-76), set `this.options = []` after `this.children = []`. Then add these methods to the class:

```js
remove(index) {
  if (this.options) this.options.splice(index, 1);
}
appendChild(child) {
  this.children.push(child);
  if (this.tagName === "select" || this.tagName === "optgroup") {
    if (child.tagName === "option") this.options.push(child);
    if (child.tagName === "optgroup" && child.options) {
      this.options.push.apply(this.options, child.options);
    }
  }
  return child;
}
```

(Replace the existing `appendChild` method.)

In `makeDocument().createElement(tag)`, the returned `FakeElement` already calls the constructor; ensure that when the harness creates an `<option>` it preserves `value` and `textContent` so the audit can later read them:

No further change required — the existing `FakeElement` already exposes `value` and `textContent`.

- [ ] **Step 4: Append preset / table / stopping / formatter / ranking assertions**

At the end of `scripts/roots-mini-app-ui-audit.js`, append:

```js
// --- Preset selector ---
const presetSelect = document.elements["root-preset-select"];
assert.ok(presetSelect.options && presetSelect.options.length > 1,
  "preset selector should expose at least one preset after init");

presetSelect.value = "population-newton";
click(document.elements["root-preset-apply"]);
assert.strictEqual(document.elements["root-newton-expression"].value,
  "1000000*e^x + (435000/x)*(e^x - 1) - 1564000",
  "population Newton preset should populate f(x)");
assert.strictEqual(document.elements["root-newton-x0"].value, "0.12",
  "population Newton preset should populate x0");
assert.strictEqual(document.elements["root-inputs-newton"].hidden, false,
  "loading a Newton preset should reveal the Newton input panel");

presetSelect.value = "population-bisection";
click(document.elements["root-preset-apply"]);
document.elements["root-bis-a"].value = "0";
document.elements["root-bis-a"].dispatchEvent({ type: "input" });
click(document.elements["root-preset-apply"]);
assert.strictEqual(document.elements["root-preset-warning"].hidden, false,
  "loading the population preset with a 0 endpoint should warn the user");

// Reset to a safe value and run.
document.elements["root-bis-a"].value = "0.1";
document.elements["root-bis-a"].dispatchEvent({ type: "input" });
click(document.elements["root-bis-compute"]);
const popApprox = Number(document.elements["root-approx"].textContent);
assert.ok(Math.abs(popApprox - 0.1009979297) <= 1e-4,
  "population bisection preset should converge near 0.1009979297, got " + popApprox);

// --- Exam-style table headers ---
assert.ok(document.elements["root-iteration-thead"].innerHTML.includes("p_n"),
  "bisection table header should use the exam column name p_n");
assert.ok(document.elements["root-iteration-thead"].innerHTML.includes("Kept interval"),
  "bisection table header should include the kept-interval column");

// --- Stopping check panel ---
assert.notStrictEqual(document.elements["root-stop-category"].textContent, "",
  "stopping check panel should be populated after a run");
assert.ok(document.elements["root-stop-bullets"].innerHTML.length > 0,
  "stopping check panel should list at least one bullet after a run");

// --- Final answer formatter ---
click(document.elements["root-format-answer"]);
const finalParagraph = document.elements["root-final-answer-paragraph"].textContent;
assert.ok(finalParagraph.includes("the bisection method"),
  "final answer paragraph should name the active method");
assert.ok(finalParagraph.includes("approximate solution is x ="),
  "final answer paragraph should state the approximate solution");

// --- Newton table includes the correction column ---
click(document.elements["root-tab-newton"]);
setValues(document, {
  "root-newton-expression": "x^2 - 2",
  "root-newton-df": "2x",
  "root-newton-x0": "1",
  "root-newton-k": "12",
  "root-newton-mode": "round",
  "root-newton-stop-kind": "iterations",
  "root-newton-stop-value": "4"
});
click(document.elements["root-newton-compute"]);
assert.ok(document.elements["root-iteration-thead"].innerHTML.includes("Correction"),
  "Newton table header should include the correction column");

// --- Fixed-point ranking ---
presetSelect.value = "quiz-fixedpoint-ranking";
click(document.elements["root-preset-apply"]);
assert.strictEqual(document.elements["root-fpi-ranking-controls"].hidden, false,
  "ranking controls should appear after loading the ranking preset");
click(document.elements["root-fpi-rank-run"]);
assert.strictEqual(document.elements["root-comparison-panel"].hidden, false,
  "comparison panel should appear after running the ranking");
const comparisonHtml = document.elements["root-comparison-body"].innerHTML;
assert.ok(comparisonHtml.includes("converged"),
  "comparison body should include at least one converged outcome");
```

- [ ] **Step 5: Run the UI audit**

Run: `node scripts/roots-mini-app-ui-audit.js`
Expected: process exits 0, no assertion errors.

- [ ] **Step 6: Run the static audit**

Run: `node scripts/roots-mini-app-static-audit.js`
Expected: process exits 0.

- [ ] **Step 7: Commit**

```bash
git add scripts/roots-mini-app-ui-audit.js
git commit -m "test(roots): cover presets, exam tables, stopping panel, formatter, and ranking"
```

---

### Task 14: Add explicit Vercel deployment notes (and optional `vercel.json`)

Make the static deployment contract explicit. Default to a one-line `vercel.json` plus a README section.

**Files:**
- Create: `vercel.json` (repository root).
- Modify: `README.md` — add a "Vercel deployment" section.

- [ ] **Step 1: Confirm there is no existing `vercel.json` to merge with**

Run: `ls vercel.json 2>/dev/null || echo "no existing vercel.json"`
Expected: `no existing vercel.json`. If it does already exist, merge the content below into the existing file rather than overwriting.

- [ ] **Step 2: Create the minimal `vercel.json`**

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "cleanUrls": true,
  "rewrites": [
    { "source": "/roots", "destination": "/roots/index.html" }
  ]
}
```

(`cleanUrls` makes `/roots` resolve to `/roots/index.html` without `.html` suffixes; the explicit rewrite covers the no-trailing-slash case.)

- [ ] **Step 3: Append a deployment section to `README.md`**

Add (anywhere appropriate near the bottom) a new section:

```markdown
## Vercel deployment

This is a fully static site — no build step is required.

- **Root directory:** repository root
- **Build command:** none
- **Output directory:** repository root
- **Main route:** `index.html`
- **Roots mini-app route:** `roots/index.html` (also reachable as `/roots` via the `vercel.json` rewrite)

To deploy locally with the Vercel CLI: `npx vercel --prod` from the repository root.
```

- [ ] **Step 4: Commit**

```bash
git add vercel.json README.md
git commit -m "chore(deploy): add explicit Vercel static config and deployment note"
```

---

### Task 15: Final verification across every audit listed in acceptance criteria

Confirm the full deterministic audit list passes end to end before declaring the work complete.

**Files:** none (verification only).

- [ ] **Step 1: Run every required audit**

Run each (sequentially, so a failing audit is easy to spot):

```bash
node scripts/engine-correctness-audit.js
node scripts/root-engine-audit.js
node scripts/roots-mini-app-static-audit.js
node scripts/roots-mini-app-ui-audit.js
node scripts/roots-fast-lane-audit.js
```

Expected: every script exits 0. Capture the final summary line of each (e.g., `Summary: 47/47 passed`) for the PR description.

- [ ] **Step 2: Spot-check the population workflow in a real browser**

Run: `python -m http.server 8000` (or any static server) at the repo root, then open `http://localhost:8000/roots/`. Load the "Population — Newton from x0 = 0.12" preset, click `=`, then click `Format final answer`. Confirm the paragraph includes "the Newton-Raphson method" and an `x =` near `0.10099`.

- [ ] **Step 3: Spot-check the ranking workflow**

Load the "Fixed-point ranking — 21^(1/3), p0 = 1" preset, click `Run fixed-point ranking`, and confirm at least two formulas appear in the ranked table and the rest appear in the "others" rows with `cycle`, `diverged`, `undefined`, or `stalled` outcomes.

- [ ] **Step 4: Commit a final checkpoint if anything had to be patched**

If any audit failed and required a fix, fix the underlying cause (do not weaken the audit), then commit:

```bash
git add <files>
git commit -m "fix(roots): resolve <specific issue> uncovered by final audit pass"
```

If no fix was needed, no commit.

---

## Self-Review

**Spec coverage check (each spec section → task):**
- §1 Professor Mode Presets → Tasks 3, 4, 5
- §2 Population Equation Setup → Tasks 3 (catalog), 5 (x=0 warning), 6 (regressions)
- §3 Quiz Presets → Tasks 3 (catalog), 7 (Newton + ranking regressions)
- §4 Exam Table Format → Task 8
- §5 Stopping Check Panel → Task 9
- §6 Final Answer Formatter → Task 10
- §7 Fixed-Point Ranking Tool → Tasks 11, 12, 13
- Engine Hardening Requirements → Tasks 2 (`0.0009765625`), 6 (population), 7 (Newton stop rule + ranking), 1 (radians default)
- Vercel Readiness → Task 14
- Acceptance criteria audit list → Task 15

**Placeholder scan:** No "TODO", "TBD", "fill in details", "similar to Task N", or vague "add validation" steps appear above. Every code block is the literal content the engineer should paste.

**Type/identifier consistency:**
- `RootsPresets.list / listGroups / find / zeroWarnings` — defined in Task 3 and consumed in Tasks 5, 12, 13.
- `RootsEngineAdapter.runFixedPointComparison(candidates, x0, machine, stopping, angleMode)` — defined in Task 11 and consumed in Task 11's `RootsComparison.runRanking`.
- `RootsComparison.runRanking(presetRanking, machine, stopping, angleMode)` — defined in Task 11 and called from Task 12's `wireRankingButton`.
- `RootsRender.buildFinalAnswerParagraph(run)` — defined in Task 10 and called in Task 10's `wireFormatAnswer`.
- `RootsRender.renderComparisonResult(comparison)` — defined in Task 12 and called in Task 12's `wireRankingButton` and `refreshRankingControls`.
- DOM ids are stable (`root-preset-*`, `root-stop-*`, `root-final-answer-paragraph`, `root-fpi-ranking-controls`, `root-comparison-*`) and registered both in HTML (Tasks 4, 9, 10, 12) and in the audit `IDS`/`BUTTON_IDS` arrays (Task 13).
