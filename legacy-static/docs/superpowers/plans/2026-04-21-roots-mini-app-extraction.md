# Roots Mini-App Extraction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a standalone static Roots mini-app with parity to the current Root Finding feature, then replace the calculator's full Roots tab with a small bridge that links to the mini-app.

**Architecture:** Keep `root-engine.js` and the shared math/evaluation core in place, but move the Roots UI into a dedicated `roots/` surface composed of focused files for app bootstrapping, state, rendering, and engine adaptation. Verify the extraction with repo-native Node audit scripts before shrinking the main calculator tab into a lightweight link and deleting the old monolithic `root-ui.js` layer.

**Tech Stack:** Static HTML, vanilla JavaScript, existing `MathEngine` / `CalcEngine` / `ExpressionEngine` / `RootEngine` / `MathDisplay`, CSS, Node audit scripts, Git.

---

## File Structure

- Create: `roots/index.html`
  - Standalone Roots entry point with local angle toggle, symbol popover, all five method panels, and the existing result-stage shape.
- Create: `roots/roots-app.js`
  - Mini-app bootstrap, DOM wiring, angle toggle, symbol popover, math-preview sync, and compute orchestration.
- Create: `roots/roots-state.js`
  - Active method, cached runs, angle mode, and reset/recompute state.
- Create: `roots/roots-render.js`
  - Summary cards, diagnostics, graph, solution steps, copy state, and iteration-table rendering.
- Create: `roots/roots-engine-adapter.js`
  - Thin adapter from DOM field values to `RootEngine` calls with normalized outputs.
- Create: `roots/roots.css`
  - Roots-specific styles extracted from `styles.css` plus standalone shell rules.
- Create: `scripts/roots-mini-app-static-audit.js`
  - Static checks for the standalone page, required shared script tags, and the post-cutover bridge state in the main calculator.
- Create: `scripts/roots-mini-app-ui-audit.js`
  - VM + fake-DOM audit for standalone compute wiring, multi-method rendering, angle mode, copy, and symbol insertion behavior.
- Create: `docs/roots-context.md`
  - AI-facing file map and edit-boundary notes for future Roots work.
- Modify: `index.html`
  - Replace the full Roots panel with a compact bridge after parity is verified and remove main-page loading of `root-engine.js` / `root-ui.js`.
- Modify: `app.js`
  - Remove `RootUI` assumptions from bootstrap and refresh flows while keeping the root tab navigable.
- Modify: `styles.css`
  - Remove Roots-only style blocks after they are moved into `roots/roots.css`, then add compact bridge styling.
- Modify: `README.md`
  - Document both entry points and the new audit commands.
- Delete: `root-ui.js`
  - Remove the legacy monolithic Roots UI layer after the standalone audits pass and the main calculator switches to the bridge.

## Task 1: Scaffold The Standalone Roots Shell

**Files:**
- Create: `roots/index.html`
- Create: `roots/roots-app.js`
- Create: `roots/roots-state.js`
- Create: `roots/roots-render.js`
- Create: `roots/roots-engine-adapter.js`
- Create: `roots/roots.css`
- Create: `scripts/roots-mini-app-static-audit.js`

- [ ] **Step 1: Write the failing static audit for the standalone shell**

```js
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const ROOTS_HTML = path.join(ROOT, "roots", "index.html");

function check(name, expected, actual, passed) {
  console.log(`[${passed ? "PASS" : "FAIL"}] ${name}`);
  console.log(`  Expected: ${expected}`);
  console.log(`  Actual:   ${actual}`);
  console.log("");
  if (!passed) process.exitCode = 1;
}

const exists = fs.existsSync(ROOTS_HTML);
const html = exists ? fs.readFileSync(ROOTS_HTML, "utf8") : "";

check(
  "Standalone entry exists",
  "roots/index.html should exist",
  exists ? "present" : "missing",
  exists
);

check(
  "Standalone entry loads shared roots dependencies",
  "../math-engine.js, ../calc-engine.js, ../expression-engine.js, ../root-engine.js, ../math-display.js",
  html.match(/\.\.\/[a-z-]+\.js/g)?.join(", ") || "no shared scripts",
  /\.\.\/math-engine\.js/.test(html) &&
    /\.\.\/calc-engine\.js/.test(html) &&
    /\.\.\/expression-engine\.js/.test(html) &&
    /\.\.\/root-engine\.js/.test(html) &&
    /\.\.\/math-display\.js/.test(html)
);

check(
  "Standalone entry includes local shell controls",
  "angle-toggle, status-angle, symbol-popover, root-method-tabs, root-result-stage",
  [
    /id="angle-toggle"/.test(html) ? "angle-toggle" : null,
    /id="status-angle"/.test(html) ? "status-angle" : null,
    /id="symbol-popover"/.test(html) ? "symbol-popover" : null,
    /class="root-method-tabs"/.test(html) ? "root-method-tabs" : null,
    /id="root-result-stage"/.test(html) ? "root-result-stage" : null
  ].filter(Boolean).join(", ") || "no required shell controls",
  /id="angle-toggle"/.test(html) &&
    /id="status-angle"/.test(html) &&
    /id="symbol-popover"/.test(html) &&
    /class="root-method-tabs"/.test(html) &&
    /id="root-result-stage"/.test(html)
);
```

- [ ] **Step 2: Run the static audit and confirm it fails because the standalone page does not exist yet**

Run:

```powershell
node scripts/roots-mini-app-static-audit.js
```

Expected:

```text
[FAIL] Standalone entry exists
  Expected: roots/index.html should exist
  Actual:   missing
```

- [ ] **Step 3: Create the standalone HTML shell with local angle controls, symbol popover, and Roots containers**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Roots Workbench</title>
  <link rel="stylesheet" href="../styles.css?v=roots-base">
  <link rel="stylesheet" href="./roots.css?v=roots-v1">
</head>
<body class="roots-standalone">
  <main class="roots-app-shell">
    <header class="roots-toolbar">
      <a class="ghost roots-back-link" href="../index.html">Back to calculator</a>
      <div class="status-chip"><span class="status-name">Angle</span><strong id="status-angle">DEG</strong></div>
      <button id="angle-toggle" type="button" class="ghost roots-angle-btn">Use radians</button>
    </header>

    <section class="module-shell module-root roots-module-shell">
      <div class="module-header">
        <div>
          <p class="eyebrow">Module IV</p>
          <h1>Root finding workbench</h1>
          <p class="module-subtitle">Solve f(x) = 0 with the same five methods, tables, diagnostics, and convergence views from the calculator.</p>
        </div>
      </div>

      <nav class="root-method-tabs" role="tablist" aria-label="Root-finding method">
        <button class="root-method-tab active" data-method="bisection" role="tab" aria-selected="true">Bisection</button>
        <button class="root-method-tab" data-method="newton" role="tab" aria-selected="false">Newton-Raphson</button>
        <button class="root-method-tab" data-method="secant" role="tab" aria-selected="false">Secant</button>
        <button class="root-method-tab" data-method="falsePosition" role="tab" aria-selected="false">False Position</button>
        <button class="root-method-tab" data-method="fixedPoint" role="tab" aria-selected="false">Fixed Point</button>
      </nav>

      <section id="root-inputs-bisection" class="root-method-inputs"></section>
      <section id="root-inputs-newton" class="root-method-inputs" hidden></section>
      <section id="root-inputs-secant" class="root-method-inputs" hidden></section>
      <section id="root-inputs-falseposition" class="root-method-inputs" hidden></section>
      <section id="root-inputs-fixedpoint" class="root-method-inputs" hidden></section>

      <p id="root-error-msg" class="inline-error" role="alert" hidden></p>
      <p id="root-status-msg" class="visually-hidden" role="status" aria-live="polite"></p>

      <section id="root-empty" class="empty-state">
        <p class="result-label">Try a root-finding run</p>
      </section>

      <section id="root-result-stage" class="result-stage" hidden>
        <div class="root-summary-grid">
          <div class="answer-hero answer-hero-major"><p class="result-label">Approximate root</p><p id="root-approx" class="answer-value">Not calculated yet</p></div>
          <div class="answer-hero answer-hero-major"><p class="result-label">Stopping result</p><p id="root-stopping-result" class="answer-value">Not calculated yet</p></div>
          <div class="answer-hero answer-hero-major"><p class="result-label">Stopping parameters</p><p id="root-convergence" class="answer-value">Not calculated yet</p></div>
        </div>
        <div id="root-diagnostics" class="root-diagnostics" hidden></div>
        <div id="root-bracket-panel" class="comparison-grid comparison-grid-board" hidden></div>
        <div id="root-convergence-graph" class="root-convergence-graph" aria-label="Convergence graph"></div>
        <p id="root-rate-summary" class="focus-note root-rate-summary"></p>
        <section class="root-solution-panel answer-hero" aria-label="Solution steps">
          <div class="root-solution-header">
            <h2>Solution steps</h2>
            <button id="root-copy-solution" type="button" class="link">Copy solution</button>
          </div>
          <ol id="root-solution-steps" class="root-solution-steps"></ol>
          <p id="root-copy-status" class="focus-note" role="status" aria-live="polite"></p>
        </section>
        <table class="root-iteration-table">
          <thead id="root-iteration-thead"></thead>
          <tbody id="root-iteration-body"></tbody>
        </table>
      </section>
    </section>
  </main>

  <div id="symbol-popover" class="symbol-popover" aria-label="Math symbols" hidden>
    <button type="button" class="symbol-btn" data-symbol-insert="sqrt(" aria-label="Insert square root">√(</button>
    <button type="button" class="symbol-btn" data-symbol-insert="sin(" aria-label="Insert sine">sin(</button>
    <button type="button" class="symbol-btn" data-symbol-insert="cos(" aria-label="Insert cosine">cos(</button>
    <button type="button" class="symbol-btn" data-symbol-insert="e^(" aria-label="Insert e to a power">e^(</button>
  </div>

  <script defer src="../math-engine.js?v=roots-v1"></script>
  <script defer src="../calc-engine.js?v=roots-v1"></script>
  <script defer src="../expression-engine.js?v=roots-v1"></script>
  <script defer src="../root-engine.js?v=roots-v1"></script>
  <script defer src="../math-display.js?v=roots-v1"></script>
  <script defer src="./roots-state.js?v=roots-v1"></script>
  <script defer src="./roots-engine-adapter.js?v=roots-v1"></script>
  <script defer src="./roots-render.js?v=roots-v1"></script>
  <script defer src="./roots-app.js?v=roots-v1"></script>
</body>
</html>
```

- [ ] **Step 4: Create boot/module stubs so the standalone page has a real surface to wire into**

```js
// roots/roots-state.js
"use strict";

(function initRootsState(globalScope) {
  function createState() {
    return {
      activeMethod: "bisection",
      angleMode: "deg",
      runs: Object.create(null)
    };
  }

  globalScope.RootsState = { createState };
})(window);
```

```js
// roots/roots-engine-adapter.js
"use strict";

(function initRootsEngineAdapter(globalScope) {
  function runMethod() {
    throw new Error("RootsEngineAdapter.runMethod() is not implemented yet.");
  }

  globalScope.RootsEngineAdapter = { runMethod };
})(window);
```

```js
// roots/roots-render.js
"use strict";

(function initRootsRender(globalScope) {
  function mountShell() {}
  function resetResults() {}

  globalScope.RootsRender = { mountShell, resetResults };
})(window);
```

```js
// roots/roots-app.js
"use strict";

(function initRootsApp(globalScope) {
  function byId(id) {
    return document.getElementById(id);
  }

  document.addEventListener("DOMContentLoaded", function onReady() {
    const state = globalScope.RootsState.createState();
    byId("angle-toggle").addEventListener("click", function onAngleToggle() {
      state.angleMode = state.angleMode === "deg" ? "rad" : "deg";
      byId("status-angle").textContent = state.angleMode.toUpperCase();
      byId("angle-toggle").textContent = state.angleMode === "deg" ? "Use radians" : "Use degrees";
    });
  });
})(window);
```

```css
/* roots/roots.css */
.roots-standalone {
  min-height: 100vh;
}

.roots-app-shell {
  width: min(1100px, calc(100vw - 32px));
  margin: 0 auto;
  padding: 24px 0 48px;
}

.roots-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 16px;
}
```

- [ ] **Step 5: Re-run the static audit until the standalone shell checks pass**

Run:

```powershell
node scripts/roots-mini-app-static-audit.js
```

Expected:

```text
[PASS] Standalone entry exists
[PASS] Standalone entry loads shared roots dependencies
[PASS] Standalone entry includes local shell controls
```

- [ ] **Step 6: Commit the standalone shell scaffold**

```bash
git add roots/index.html roots/roots-app.js roots/roots-state.js roots/roots-render.js roots/roots-engine-adapter.js roots/roots.css scripts/roots-mini-app-static-audit.js
git commit -m "feat: scaffold standalone roots mini-app shell"
```

## Task 2: Implement Bisection Through The Standalone Adapter/State/Render Path

**Files:**
- Create: `scripts/roots-mini-app-ui-audit.js`
- Modify: `roots/roots-app.js`
- Modify: `roots/roots-state.js`
- Modify: `roots/roots-render.js`
- Modify: `roots/roots-engine-adapter.js`
- Modify: `roots/index.html`

- [ ] **Step 1: Write the failing standalone UI audit for the bisection happy path**

```js
"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = path.resolve(__dirname, "..");
const ROOTS_HTML = fs.readFileSync(path.join(ROOT, "roots", "index.html"), "utf8");
const FILES = [
  "math-engine.js",
  "calc-engine.js",
  "expression-engine.js",
  "root-engine.js",
  "math-display.js",
  "roots/roots-state.js",
  "roots/roots-engine-adapter.js",
  "roots/roots-render.js",
  "roots/roots-app.js"
];

function valueFor(id) {
  const input = ROOTS_HTML.match(new RegExp(`<input[^>]*id="${id}"[^>]*value="([^"]*)"`, "i"));
  if (input) return input[1];
  const select = ROOTS_HTML.match(new RegExp(`<select[^>]*id="${id}"[^>]*>[\\s\\S]*?<option[^>]*value="([^"]*)"[^>]*selected`, "i"));
  if (select) return select[1];
  return "";
}

class FakeElement {
  constructor(tagName, id) {
    this.tagName = tagName;
    this.id = id || "";
    this.value = valueFor(id || "");
    this.hidden = false;
    this.textContent = "";
    this.innerHTML = "";
    this.children = [];
    this.dataset = {};
    this.listeners = {};
    this.classList = { add() {}, remove() {}, toggle() {} };
  }
  addEventListener(type, handler) {
    if (!this.listeners[type]) this.listeners[type] = [];
    this.listeners[type].push(handler);
  }
  appendChild(child) {
    this.children.push(child);
    return child;
  }
}

function makeDocument() {
  const elements = {};
  function ensure(id, tag = "div") {
    if (!elements[id]) elements[id] = new FakeElement(tag, id);
    return elements[id];
  }

  [
    "status-angle", "angle-toggle", "root-bis-expression", "root-bis-a", "root-bis-b",
    "root-bis-k", "root-bis-mode", "root-bis-stop-kind", "root-bis-stop-value",
    "root-bis-tolerance-type", "root-bis-decision-basis", "root-bis-sign-display",
    "root-bis-compute", "root-empty", "root-result-stage", "root-approx",
    "root-stopping-result", "root-convergence", "root-error-msg", "root-status-msg",
    "root-iteration-thead", "root-iteration-body", "root-solution-steps"
  ].forEach((id) => ensure(id, id.includes("compute") || id === "angle-toggle" ? "button" : "div"));

  const methodButtons = ["bisection", "newton", "secant", "falsePosition", "fixedPoint"].map((method) => {
    const button = new FakeElement("button");
    button.dataset.method = method;
    return button;
  });

  return {
    elements,
    createElement(tag) {
      return new FakeElement(tag);
    },
    getElementById(id) {
      return ensure(id);
    },
    querySelectorAll(selector) {
      return selector === "[data-method]" ? methodButtons : [];
    },
    addEventListener(type, handler) {
      if (type === "DOMContentLoaded") handler();
    }
  };
}

const document = makeDocument();
const context = {
  console,
  document,
  navigator: { clipboard: { writeText: () => Promise.resolve() } },
  window: null
};
context.window = context;
context.globalThis = context;
vm.createContext(context);

for (const file of FILES) {
  const source = fs.readFileSync(path.join(ROOT, file), "utf8");
  vm.runInContext(source, context, { filename: file });
}

document.elements["root-bis-expression"].value = "x^2 - 2";
document.elements["root-bis-a"].value = "1";
document.elements["root-bis-b"].value = "2";
document.elements["root-bis-k"].value = "6";
document.elements["root-bis-mode"].value = "round";
document.elements["root-bis-stop-kind"].value = "iterations";
document.elements["root-bis-stop-value"].value = "4";
document.elements["root-bis-decision-basis"].value = "exact";
document.elements["root-bis-sign-display"].value = "both";

const clickHandlers = document.elements["root-bis-compute"].listeners.click || [];
assert.ok(clickHandlers.length > 0, "bisection compute button should be wired");
clickHandlers[0]();

assert.strictEqual(document.elements["root-approx"].textContent, "1.4375");
assert.strictEqual(document.elements["root-empty"].hidden, true);
assert.strictEqual(document.elements["root-result-stage"].hidden, false);
```

- [ ] **Step 2: Run the standalone UI audit and confirm it fails before compute wiring exists**

Run:

```powershell
node scripts/roots-mini-app-ui-audit.js
```

Expected:

```text
AssertionError [ERR_ASSERTION]: bisection compute button should be wired
```

- [ ] **Step 3: Implement focused state, adapter, and render code for the bisection path**

```js
// roots/roots-state.js
"use strict";

(function initRootsState(globalScope) {
  function createState() {
    return {
      activeMethod: "bisection",
      angleMode: "deg",
      runs: Object.create(null),
      emptyTextById: {
        "root-approx": "Not calculated yet",
        "root-stopping-result": "Not calculated yet",
        "root-convergence": "Not calculated yet"
      }
    };
  }

  function storeRun(state, method, run) {
    state.runs[method] = run;
  }

  globalScope.RootsState = { createState, storeRun };
})(window);
```

```js
// roots/roots-engine-adapter.js
"use strict";

(function initRootsEngineAdapter(globalScope) {
  const R = globalScope.RootEngine;

  function runMethod(method, fields, angleMode) {
    if (method !== "bisection") {
      throw new Error(`Unsupported method in Task 2: ${method}`);
    }

    return R.runBisection({
      expression: fields["root-bis-expression"],
      interval: { a: fields["root-bis-a"], b: fields["root-bis-b"] },
      machine: { k: Number(fields["root-bis-k"]), mode: fields["root-bis-mode"] },
      stopping: {
        kind: fields["root-bis-stop-kind"],
        value: fields["root-bis-stop-value"],
        toleranceType: fields["root-bis-tolerance-type"] || "absolute"
      },
      decisionBasis: fields["root-bis-decision-basis"] || "machine",
      signDisplay: fields["root-bis-sign-display"] || "both",
      angleMode
    });
  }

  globalScope.RootsEngineAdapter = { runMethod };
})(window);
```

```js
// roots/roots-render.js
"use strict";

(function initRootsRender(globalScope) {
  const C = globalScope.CalcEngine;

  function setText(id, value) {
    document.getElementById(id).textContent = value;
  }

  function renderBisection(run) {
    setText("root-approx", C.formatReal(C.requireRealNumber(run.summary.approximation, "root"), 8));
    setText("root-stopping-result", run.summary.stopReason || run.summary.intervalStatus || "complete");
    setText("root-convergence", run.stopping.kind === "iterations"
      ? `n = ${run.stopping.input}, ε <= ${C.formatReal(run.stopping.epsilonBound, 8)}`
      : `ε = ${run.stopping.input}`);
    document.getElementById("root-empty").hidden = true;
    document.getElementById("root-result-stage").hidden = false;
  }

  function resetResults(state) {
    Object.keys(state.emptyTextById).forEach((id) => setText(id, state.emptyTextById[id]));
    document.getElementById("root-empty").hidden = false;
    document.getElementById("root-result-stage").hidden = true;
  }

  globalScope.RootsRender = { renderBisection, resetResults };
})(window);
```

- [ ] **Step 4: Wire the bisection button in `roots-app.js` and add the minimum standalone form fields**

```html
<section id="root-inputs-bisection" class="root-method-inputs control-band control-band-expression" aria-label="Bisection controls">
  <div class="expression-row">
    <label class="input-with-symbol">
      <input id="root-bis-expression" type="text" maxlength="300" placeholder="x^3 - x - 1" aria-label="Function f(x)">
      <button type="button" class="symbol-trigger" data-symbol-target="root-bis-expression" aria-label="Open symbols">f(x)</button>
    </label>
    <button id="root-bis-compute" type="button" class="btn-calculate-omni" aria-label="Run bisection">=</button>
  </div>
  <div class="root-config-grid">
    <label>Left endpoint a<input id="root-bis-a" type="text" value="1"></label>
    <label>Right endpoint b<input id="root-bis-b" type="text" value="2"></label>
    <label>Significant digits (k)<input id="root-bis-k" type="number" min="1" max="25" step="1" value="6"></label>
    <label>Machine rule<select id="root-bis-mode"><option value="chop">Chopping</option><option value="round" selected>Rounding</option></select></label>
    <label>Stopping mode<select id="root-bis-stop-kind"><option value="iterations" selected>Given iterations n</option><option value="epsilon">Given tolerance ε</option></select></label>
    <label>Stopping value (n or ε)<input id="root-bis-stop-value" type="text" value="4"></label>
    <label hidden><select id="root-bis-tolerance-type"><option value="absolute" selected>Absolute</option><option value="relative">Relative</option></select></label>
    <label hidden><select id="root-bis-decision-basis"><option value="exact" selected>Exact signs decide</option><option value="machine">Machine signs decide</option></select></label>
    <label hidden><select id="root-bis-sign-display"><option value="both" selected>Exact and machine signs</option><option value="machine">Machine only</option><option value="exact">Exact only</option></select></label>
  </div>
</section>
```

```js
// roots/roots-app.js
"use strict";

(function initRootsApp(globalScope) {
  function byId(id) {
    return document.getElementById(id);
  }

  function fieldsForBisection() {
    return {
      "root-bis-expression": byId("root-bis-expression").value,
      "root-bis-a": byId("root-bis-a").value,
      "root-bis-b": byId("root-bis-b").value,
      "root-bis-k": byId("root-bis-k").value,
      "root-bis-mode": byId("root-bis-mode").value,
      "root-bis-stop-kind": byId("root-bis-stop-kind").value,
      "root-bis-stop-value": byId("root-bis-stop-value").value,
      "root-bis-tolerance-type": byId("root-bis-tolerance-type").value,
      "root-bis-decision-basis": byId("root-bis-decision-basis").value,
      "root-bis-sign-display": byId("root-bis-sign-display").value
    };
  }

  document.addEventListener("DOMContentLoaded", function onReady() {
    const state = globalScope.RootsState.createState();
    globalScope.RootsRender.resetResults(state);

    byId("root-bis-compute").addEventListener("click", function onBisectionCompute() {
      const run = globalScope.RootsEngineAdapter.runMethod("bisection", fieldsForBisection(), state.angleMode);
      globalScope.RootsState.storeRun(state, "bisection", run);
      globalScope.RootsRender.renderBisection(run);
    });

    byId("angle-toggle").addEventListener("click", function onAngleToggle() {
      state.angleMode = state.angleMode === "deg" ? "rad" : "deg";
      byId("status-angle").textContent = state.angleMode.toUpperCase();
      byId("angle-toggle").textContent = state.angleMode === "deg" ? "Use radians" : "Use degrees";
    });
  });
})(window);
```

- [ ] **Step 5: Re-run the standalone UI audit until the bisection path passes**

Run:

```powershell
node scripts/roots-mini-app-ui-audit.js
```

Expected:

```text
process exits with code 0 and no assertion failures
```

- [ ] **Step 6: Commit the first working standalone compute path**

```bash
git add roots/index.html roots/roots-app.js roots/roots-state.js roots/roots-render.js roots/roots-engine-adapter.js scripts/roots-mini-app-ui-audit.js
git commit -m "feat: wire standalone roots bisection flow"
```

## Task 3: Reach Full Roots Parity Inside The Standalone Mini-App

**Files:**
- Modify: `roots/index.html`
- Modify: `roots/roots-app.js`
- Modify: `roots/roots-state.js`
- Modify: `roots/roots-render.js`
- Modify: `roots/roots-engine-adapter.js`
- Modify: `roots/roots.css`
- Modify: `scripts/roots-mini-app-ui-audit.js`

- [ ] **Step 1: Extend the standalone UI audit with the remaining methods and shell behaviors so parity failures appear before the extraction is declared done**

```js
// Add to scripts/roots-mini-app-ui-audit.js after the bisection assertions.

// Extend the fake document fixture first:
// - add FakeElement#setAttribute
// - add IDs for root-newton-*, root-fpi-*, root-copy-solution, root-copy-status
// - make querySelectorAll("[data-symbol-target]") return symbol-trigger buttons
// - make querySelectorAll("[data-symbol-insert]") return symbol-popover buttons

document.elements["angle-toggle"].listeners.click[0]();
assert.strictEqual(document.elements["status-angle"].textContent, "RAD");

const methodButtons = document.querySelectorAll("[data-method]");
methodButtons.find((button) => button.dataset.method === "newton").listeners.click[0]();
document.elements["root-newton-expression"].value = "x^2 - 2";
document.elements["root-newton-df"].value = "2x";
document.elements["root-newton-x0"].value = "1";
document.elements["root-newton-k"].value = "12";
document.elements["root-newton-mode"].value = "round";
document.elements["root-newton-stop-kind"].value = "iterations";
document.elements["root-newton-stop-value"].value = "4";
document.elements["root-newton-compute"].listeners.click[0]();
assert.strictEqual(document.elements["root-approx"].textContent, "1.41421356237");

methodButtons.find((button) => button.dataset.method === "fixedPoint").listeners.click[0]();
document.elements["root-fpi-expression"].value = "cos(x)";
document.elements["root-fpi-x0"].value = "1";
document.elements["root-fpi-k"].value = "12";
document.elements["root-fpi-mode"].value = "round";
document.elements["root-fpi-stop-kind"].value = "iterations";
document.elements["root-fpi-stop-value"].value = "1";
document.elements["root-fpi-compute"].listeners.click[0]();
assert.ok(/0\.540302305868/.test(document.elements["root-iteration-body"].textContent));

document.querySelectorAll("[data-symbol-target]")[0].listeners.click[0]();
document.querySelectorAll("[data-symbol-insert]")[0].listeners.click[0]();
assert.ok(document.elements["root-bis-expression"].value.includes("sqrt("));

document.elements["root-copy-solution"].listeners.click[0]();
assert.strictEqual(document.elements["root-copy-status"].textContent, "Solution copied.");
```

- [ ] **Step 2: Run the expanded UI audit and confirm it fails on the unimplemented methods and shell helpers**

Run:

```powershell
node scripts/roots-mini-app-ui-audit.js
```

Expected:

```text
AssertionError [ERR_ASSERTION]: Expected values to be strictly equal:
+ actual - expected
+ ''
- '1.41421356237'
```

- [ ] **Step 3: Copy the full Roots markup into `roots/index.html`, including all five method panels, advanced controls, summaries, diagnostics, graph, steps, and table regions**

```html
<section id="root-inputs-newton" class="root-method-inputs control-band control-band-expression" aria-label="Newton-Raphson controls" hidden>
  <div class="expression-row">
    <label class="input-with-symbol">
      <input id="root-newton-expression" type="text" maxlength="300" placeholder="x^3 - x - 1" aria-label="Function f(x)">
      <button type="button" class="symbol-trigger" data-symbol-target="root-newton-expression" aria-label="Open symbols">f(x)</button>
    </label>
    <button id="root-newton-compute" type="button" class="btn-calculate-omni" aria-label="Run Newton-Raphson">=</button>
  </div>
  <div class="root-config-grid">
    <label>Derivative f′(x)<input id="root-newton-df" type="text" maxlength="300" placeholder="3x^2 - 1" aria-label="Derivative f'(x)"></label>
    <label>Starting point x₀<input id="root-newton-x0" type="text" value="1"></label>
    <label>Significant digits (k)<input id="root-newton-k" type="number" min="1" max="25" step="1" value="6"></label>
    <label>Machine rule<select id="root-newton-mode"><option value="chop">Chopping</option><option value="round" selected>Rounding</option></select></label>
    <label>Stopping mode<select id="root-newton-stop-kind"><option value="iterations" selected>Given iterations n</option><option value="epsilon">Given tolerance ε</option></select></label>
    <label>Stopping value (n or ε)<input id="root-newton-stop-value" type="text" value="4"></label>
  </div>
</section>
```

Add these exact extracted sections after the Newton block:

- `root-inputs-secant` with `root-secant-expression`, `root-secant-x0`, `root-secant-x1`, `root-secant-k`, `root-secant-mode`, `root-secant-stop-kind`, `root-secant-stop-value`, and `root-secant-compute`
- `root-inputs-falseposition` with `root-fp-expression`, `root-fp-a`, `root-fp-b`, `root-fp-k`, `root-fp-mode`, `root-fp-stop-kind`, `root-fp-stop-value`, `root-fp-decision-basis`, `root-fp-sign-display`, `root-fp-compute`, and `root-fp-advanced`
- `root-inputs-fixedpoint` with `root-fpi-expression`, `root-fpi-x0`, `root-fpi-k`, `root-fpi-mode`, `root-fpi-stop-kind`, `root-fpi-stop-value`, and `root-fpi-compute`
- the existing result-stage children from the current `#tab-root` panel: `root-diagnostics`, `root-bracket-panel`, `root-interval-status`, `root-sign-summary`, `root-decision-summary`, `root-convergence-graph`, `root-rate-summary`, `root-solution-steps`, `root-copy-solution`, `root-copy-status`, `root-iteration-thead`, and `root-iteration-body`

- [ ] **Step 4: Finish the standalone adapter, renderer, and shell wiring so all five methods, previews, symbol insertion, copy, graph, and advanced controls behave through the mini-app modules**

```js
// roots/roots-engine-adapter.js
function runMethod(method, fields, angleMode) {
  switch (method) {
    case "bisection":
      return R.runBisection({
        expression: fields["root-bis-expression"],
        interval: { a: fields["root-bis-a"], b: fields["root-bis-b"] },
        machine: { k: Number(fields["root-bis-k"]), mode: fields["root-bis-mode"] },
        stopping: {
          kind: fields["root-bis-stop-kind"],
          value: fields["root-bis-stop-value"],
          toleranceType: fields["root-bis-tolerance-type"]
        },
        decisionBasis: fields["root-bis-decision-basis"],
        signDisplay: fields["root-bis-sign-display"],
        angleMode
      });
    case "newton":
      return R.runNewtonRaphson({
        expression: fields["root-newton-expression"],
        dfExpression: fields["root-newton-df"],
        x0: fields["root-newton-x0"],
        machine: { k: Number(fields["root-newton-k"]), mode: fields["root-newton-mode"] },
        stopping: { kind: fields["root-newton-stop-kind"], value: fields["root-newton-stop-value"] },
        angleMode
      });
    case "secant":
      return R.runSecant({
        expression: fields["root-secant-expression"],
        x0: fields["root-secant-x0"],
        x1: fields["root-secant-x1"],
        machine: { k: Number(fields["root-secant-k"]), mode: fields["root-secant-mode"] },
        stopping: { kind: fields["root-secant-stop-kind"], value: fields["root-secant-stop-value"] },
        angleMode
      });
    case "falsePosition":
      return R.runFalsePosition({
        expression: fields["root-fp-expression"],
        interval: { a: fields["root-fp-a"], b: fields["root-fp-b"] },
        machine: { k: Number(fields["root-fp-k"]), mode: fields["root-fp-mode"] },
        stopping: { kind: fields["root-fp-stop-kind"], value: fields["root-fp-stop-value"] },
        decisionBasis: fields["root-fp-decision-basis"],
        signDisplay: fields["root-fp-sign-display"],
        angleMode
      });
    case "fixedPoint":
      return R.runFixedPoint({
        gExpression: fields["root-fpi-expression"],
        x0: fields["root-fpi-x0"],
        machine: { k: Number(fields["root-fpi-k"]), mode: fields["root-fpi-mode"] },
        stopping: { kind: fields["root-fpi-stop-kind"], value: fields["root-fpi-stop-value"] },
        angleMode
      });
    default:
      throw new Error(`Unknown root method: ${method}`);
  }
}
```

```js
// roots/roots-app.js
function wireMethodTabs(state) {
  document.querySelectorAll("[data-method]").forEach((button) => {
    button.addEventListener("click", function onMethodTabClick() {
      state.activeMethod = button.dataset.method;
      document.querySelectorAll("[data-method]").forEach((peer) => peer.setAttribute("aria-selected", String(peer === button)));
      ["bisection", "newton", "secant", "falsePosition", "fixedPoint"].forEach((name) => {
        byId(`root-inputs-${name === "falsePosition" ? "falseposition" : name === "fixedPoint" ? "fixedpoint" : name}`).hidden = name !== state.activeMethod;
      });
      globalScope.RootsRender.renderStoredRun(state);
    });
  });
}

let currentSymbolTarget = null;

function wireSymbolPopover() {
  document.querySelectorAll("[data-symbol-target]").forEach((trigger) => {
    trigger.addEventListener("click", function onSymbolTriggerClick() {
      currentSymbolTarget = trigger.dataset.symbolTarget;
      byId("symbol-popover").hidden = false;
    });
  });

  document.querySelectorAll("[data-symbol-insert]").forEach((button) => {
    button.addEventListener("click", function onSymbolInsert() {
      const input = byId(currentSymbolTarget);
      const start = input.selectionStart || input.value.length;
      const end = input.selectionEnd || input.value.length;
      input.value = `${input.value.slice(0, start)}${button.dataset.symbolInsert}${input.value.slice(end)}`;
      byId("symbol-popover").hidden = true;
    });
  });
}

function wireCopySolution() {
  byId("root-copy-solution").addEventListener("click", function onCopySolution() {
    const text = Array.from(byId("root-solution-steps").children).map((item) => item.textContent).join("\n");
    navigator.clipboard.writeText(text).then(function onCopied() {
      byId("root-copy-status").textContent = "Solution copied.";
    });
  });
}
```

```js
// roots/roots-render.js
function renderRun(run, state) {
  renderSummary(run);
  renderDiagnostics(run);
  renderBracketPanel(run);
  renderSolutionSteps(run);
  renderIterationTable(run);
  renderConvergenceGraph(run);
  document.getElementById("root-empty").hidden = true;
  document.getElementById("root-result-stage").hidden = false;
}

function renderStoredRun(state) {
  const run = state.runs[state.activeMethod];
  if (!run) {
    resetResults(state);
    return;
  }
  renderRun(run, state);
}
```

```css
/* roots/roots.css */
.roots-standalone .module-root .root-config-grid {
  display: grid;
  gap: var(--space-3);
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
}

.roots-standalone .root-method-tab[aria-selected="true"] {
  background: var(--accent);
  color: var(--accent-ink);
}

.roots-standalone .root-convergence-graph {
  min-height: 320px;
}
```

Move these exact selector groups from `styles.css` into `roots/roots.css` during this step so the standalone page owns all Roots-only presentation:

- `.module-root .root-config-grid`
- `.module-root .root-summary-grid`
- `.module-root .root-diagnostics`
- `.module-root .root-diagnostic` and `.module-root .root-diagnostic-warning`
- `.module-root .root-advanced-options`
- `.module-root .root-solution-panel` and `.root-solution-steps`
- `.root-convergence-graph`
- `.root-graph-*`
- `.root-rate-summary`

- [ ] **Step 5: Re-run the standalone audits until the full Roots surface passes**

Run:

```powershell
node scripts/root-engine-audit.js
node scripts/roots-mini-app-ui-audit.js
```

Expected:

```text
Summary: all root-engine checks passed
process exits with code 0 and no assertion failures from roots-mini-app-ui-audit.js
```

- [ ] **Step 6: Commit the full standalone Roots parity pass**

```bash
git add roots/index.html roots/roots-app.js roots/roots-state.js roots/roots-render.js roots/roots-engine-adapter.js roots/roots.css scripts/roots-mini-app-ui-audit.js
git commit -m "feat: complete standalone roots mini-app parity"
```

## Task 4: Replace The Main Calculator Roots Tab With A Bridge And Remove Legacy Wiring

**Files:**
- Modify: `scripts/roots-mini-app-static-audit.js`
- Modify: `index.html`
- Modify: `app.js`
- Modify: `styles.css`
- Delete: `root-ui.js`

- [ ] **Step 1: Extend the static audit so the cutover fails until the main shell is a bridge and the old Roots UI file is gone**

```js
// Add to scripts/roots-mini-app-static-audit.js
const MAIN_HTML = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const APP_JS = fs.readFileSync(path.join(ROOT, "app.js"), "utf8");
const LEGACY_ROOT_UI = path.join(ROOT, "root-ui.js");

check(
  "Main calculator bridge links to standalone roots app",
  'href="roots/index.html"',
  MAIN_HTML.match(/href="[^"]+"/)?.[0] || "no standalone link",
  /href="roots\/index\.html"/.test(MAIN_HTML)
);

check(
  "Main calculator no longer loads root-ui.js",
  "root-ui.js script tag should be absent",
  /root-ui\.js/.test(MAIN_HTML) ? "present" : "absent",
  !/root-ui\.js/.test(MAIN_HTML)
);

check(
  "App bootstrap no longer references RootUI",
  "app.js should not reference RootUI or RU.recompute()",
  /RootUI|RU\.recompute|RU\.init/.test(APP_JS) ? "legacy references present" : "legacy references removed",
  !/RootUI|RU\.recompute|RU\.init/.test(APP_JS)
);

check(
  "App shell no longer tracks root-only previews or result IDs",
  "ROOT_RESULT_IDS and root preview IDs removed from app.js",
  /ROOT_RESULT_IDS|root-bis-expression-preview|root-newton-expression-preview|root-fpi-expression-preview/.test(APP_JS)
    ? "root shell bookkeeping present"
    : "root shell bookkeeping removed",
  !/ROOT_RESULT_IDS|root-bis-expression-preview|root-newton-expression-preview|root-fpi-expression-preview/.test(APP_JS)
);

check(
  "Legacy root-ui.js file removed",
  "root-ui.js deleted after cutover",
  fs.existsSync(LEGACY_ROOT_UI) ? "present" : "deleted",
  !fs.existsSync(LEGACY_ROOT_UI)
);
```

- [ ] **Step 2: Run the static audit and confirm the cutover checks fail while the main calculator still hosts the old Roots UI**

Run:

```powershell
node scripts/roots-mini-app-static-audit.js
```

Expected:

```text
[FAIL] Main calculator no longer loads root-ui.js
  Expected: root-ui.js script tag should be absent
  Actual:   present
```

- [ ] **Step 3: Replace the main `tab-root` panel with a bridge and remove the standalone-unneeded scripts from `index.html`**

```html
<section id="tab-root" class="panel" role="tabpanel" aria-labelledby="tab-btn-root" tabindex="0" hidden>
  <div class="bridge-panel bridge-panel-root">
    <p class="eyebrow">Roots</p>
    <h2>Open the dedicated Roots workbench</h2>
    <p>All five methods, graphs, diagnostics, and solution steps now live in the standalone Roots mini-app.</p>
    <p><a class="btn-primary" href="roots/index.html">Open Roots workbench</a></p>
  </div>
</section>
```

```html
<!-- Remove these script tags from the main index page -->
<!-- <script defer src="root-engine.js?v=root3"></script> -->
<!-- <script defer src="root-ui.js?v=root3"></script> -->
```

- [ ] **Step 4: Remove `RootUI` from `app.js`, trim bridge styling into `styles.css`, and delete the legacy file**

```js
// app.js bootstrap header
const I = globalScope.IEEE754;
const M = globalScope.MathEngine;
const C = globalScope.CalcEngine;
const E = globalScope.ExpressionEngine;
const D = globalScope.MathDisplay;
const P = globalScope.PolyEngine;
if (!I || !M || !C || !E || !D || !P) {
  throw new Error("IEEE754, MathEngine, CalcEngine, ExpressionEngine, MathDisplay, and PolyEngine must be loaded before app.js.");
}
```

```js
// app.js root-specific constants and preview config
const PREVIEW_FIELDS = [
  { inputId: "basic-expression", previewId: "basic-expression-preview", allowVariable: false, className: "math-preview math-preview-wide" },
  { inputId: "error-exact", previewId: "error-exact-preview", allowVariable: false, className: "math-preview math-preview-inline" },
  { inputId: "error-approx", previewId: "error-approx-preview", allowVariable: false, className: "math-preview math-preview-inline" },
  { inputId: "poly-expression", previewId: "poly-expression-preview", allowVariable: true, className: "math-preview math-preview-wide" },
  { inputId: "poly-x", previewId: "poly-x-preview", allowVariable: false, className: "math-preview math-preview-inline" }
];

captureEmptyTexts(EXPRESSION_RESULT_IDS);
captureEmptyTexts(BASIC_RESULT_IDS);
captureEmptyTexts(ERROR_RESULT_IDS);
captureEmptyTexts(POLY_RESULT_IDS);
captureEmptyTexts(IEEE_RESULT_IDS);
captureEmptyTexts([
  "basic-sandbox-alt-value",
  "basic-sandbox-note",
  "basic-sandbox-current-value",
  "basic-sandbox-current-setup",
  "basic-sandbox-current-expression"
]);
```

```js
// app.js refreshComputedViews
function refreshComputedViews() {
  if (state.expressionComparison) computeExpressionModule();
  if (state.basicExact !== null) computeBasicModule();
  if (state.errorComputed) computeErrorModule();
  if (state.polyComparison) computePolynomialModule();
  clearStatus("basic-status-msg");
  clearStatus("error-status-msg");
  clearStatus("poly-status-msg");
}
```

```css
/* styles.css */
#tab-root .bridge-panel {
  display: grid;
  gap: var(--space-4);
  max-width: 42rem;
}
```

```text
Delete file: root-ui.js
```

- [ ] **Step 5: Re-run the static audit until the bridge and legacy-removal checks pass**

Run:

```powershell
node scripts/roots-mini-app-static-audit.js
```

Expected:

```text
[PASS] Main calculator bridge links to standalone roots app
[PASS] Main calculator no longer loads root-ui.js
[PASS] App bootstrap no longer references RootUI
[PASS] App shell no longer tracks root-only previews or result IDs
[PASS] Legacy root-ui.js file removed
```

- [ ] **Step 6: Commit the main-shell cutover**

```bash
git add index.html app.js styles.css scripts/roots-mini-app-static-audit.js
git rm root-ui.js
git commit -m "refactor: move calculator roots tab to standalone bridge"
```

## Task 5: Add Roots Context Docs And Run Final Verification

**Files:**
- Create: `docs/roots-context.md`
- Modify: `README.md`

- [ ] **Step 1: Confirm the final docs are still missing before writing them**

Run:

```powershell
@(
  Test-Path 'docs/roots-context.md'
  (Select-String -Path README.md -Pattern 'roots/index.html' -Quiet)
)
```

Expected:

```text
False
False
```

- [ ] **Step 2: Write the AI-facing Roots context doc and update the README entry points and audit commands**

```md
<!-- docs/roots-context.md -->
# Roots Context

## File map

- `roots/index.html` - standalone Roots shell and all Roots-only markup
- `roots/roots-app.js` - boot, events, angle mode, symbol popover, preview sync, compute orchestration
- `roots/roots-state.js` - active method, angle mode, cached runs
- `roots/roots-render.js` - summary cards, diagnostics, graph, solution steps, copy state, table rendering
- `roots/roots-engine-adapter.js` - maps field values to `RootEngine` calls
- `roots/roots.css` - Roots-only styles
- `root-engine.js` - shared numerical core

## Edit boundaries

- Change UI layout or copy in `roots/index.html` and `roots/roots.css`
- Change interaction wiring in `roots/roots-app.js`
- Change render behavior in `roots/roots-render.js`
- Change request packaging in `roots/roots-engine-adapter.js`
- Change numerical behavior only in `root-engine.js`

## Verification

Run:

    node scripts/root-engine-audit.js
    node scripts/roots-mini-app-static-audit.js
    node scripts/roots-mini-app-ui-audit.js
```

```md
<!-- README.md additions -->
## Run locally

1. Open `index.html` for the main calculator.
2. Open `roots/index.html` for the standalone Roots workbench.
3. No installation or backend is required.

## Verify

    node scripts/engine-correctness-audit.js
    node scripts/root-engine-audit.js
    node scripts/roots-mini-app-static-audit.js
    node scripts/roots-mini-app-ui-audit.js
```

- [ ] **Step 3: Run the full verification set and confirm the extraction passes as a complete unit**

Run:

```powershell
node scripts/engine-correctness-audit.js
node scripts/root-engine-audit.js
node scripts/roots-mini-app-static-audit.js
node scripts/roots-mini-app-ui-audit.js
```

Expected:

```text
Summary: all checks passed
```

- [ ] **Step 4: Commit the docs and verification finish line**

```bash
git add docs/roots-context.md README.md
git commit -m "docs: add roots mini-app context and verification guide"
```
