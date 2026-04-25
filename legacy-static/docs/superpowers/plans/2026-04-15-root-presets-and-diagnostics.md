# Root Presets And Diagnostics Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add shared and method-specific root-finding presets plus richer final diagnostics without changing the current tabbed Root Finding Workbench structure.

**Architecture:** Add a small UI-owned preset module that keeps preset data and application rules pure and testable, then extend `RootEngine` summary metadata so the UI can render two new headline metrics and a method-aware diagnostics panel. Keep the existing `RootEngine` / `RootUI` split, and layer the new preset strips and diagnostics panel into the current markup and styles instead of reshaping the module flow.

**Tech Stack:** Standalone browser JavaScript, static `index.html`, `styles.css`, Node-based audit scripts, and the existing `MathEngine`, `CalcEngine`, `ExpressionEngine`, `RootEngine`, and `RootUI` globals.

---

## Workspace Note

This folder is not a git repository: `Test-Path .git` returns `False`. Each task keeps the checkpoint rhythm, but the commit step is replaced by a local checkpoint note and a focused audit command.

## File Map

- Create: `C:\Users\Emmy Lou\Downloads\Numerical_Analysis_Final_ver-master\root-presets.js`
  - Owns the preset registry, compatibility helpers, and the pure first-use vs reuse application-planning logic.
- Modify: `C:\Users\Emmy Lou\Downloads\Numerical_Analysis_Final_ver-master\root-engine.js`
  - Extends summary metadata with residual magnitude, last-step error, relative error, and guarantee descriptors.
- Modify: `C:\Users\Emmy Lou\Downloads\Numerical_Analysis_Final_ver-master\root-ui.js`
  - Renders shared and method-local preset chips, applies presets to the active tab, adds the diagnostics panel, and resets new UI state.
- Modify: `C:\Users\Emmy Lou\Downloads\Numerical_Analysis_Final_ver-master\index.html`
  - Adds the global preset strip, per-method preset containers, two new summary cards, the diagnostics panel, and the `root-presets.js` script include.
- Modify: `C:\Users\Emmy Lou\Downloads\Numerical_Analysis_Final_ver-master\styles.css`
  - Styles preset chips, the `More examples` overflow, and the diagnostics panel layout.
- Modify: `C:\Users\Emmy Lou\Downloads\Numerical_Analysis_Final_ver-master\scripts\root-engine-audit.js`
  - Adds diagnostic summary checks for the new engine metadata.
- Create: `C:\Users\Emmy Lou\Downloads\Numerical_Analysis_Final_ver-master\scripts\root-presets-audit.js`
  - Verifies preset coverage, compatibility, autorun vs fill-only behavior, and first-use vs reuse preservation rules.
- Read only: `C:\Users\Emmy Lou\Downloads\Numerical_Analysis_Final_ver-master\calc-engine.js`
  - Provides numeric formatting and real-number conversion helpers already used by the root module.
- Read only: `C:\Users\Emmy Lou\Downloads\Numerical_Analysis_Final_ver-master\math-engine.js`
  - Provides rational support used by root calculations and summary metadata.

## Task 1: Create The Preset Catalog And Preset Audit

**Files:**
- Create: `C:\Users\Emmy Lou\Downloads\Numerical_Analysis_Final_ver-master\scripts\root-presets-audit.js`
- Create: `C:\Users\Emmy Lou\Downloads\Numerical_Analysis_Final_ver-master\root-presets.js`

- [ ] **Step 1: Write the failing preset audit**

Create `scripts/root-presets-audit.js` with this content:

```javascript
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const ROOT = __dirname ? path.resolve(__dirname, "..") : process.cwd();

function loadPresets() {
  const context = { console };
  context.globalThis = context;
  context.window = context;
  vm.createContext(context);
  const source = fs.readFileSync(path.join(ROOT, "root-presets.js"), "utf8");
  vm.runInContext(source, context, { filename: "root-presets.js" });
  return context.RootPresets;
}

function makeReporter() {
  const results = [];
  return {
    check(name, expected, actual, passed, note) {
      results.push({ name, expected, actual, passed, note: note || "" });
    },
    finish() {
      const failures = results.filter((result) => !result.passed);
      for (const result of results) {
        console.log(`[${result.passed ? "PASS" : "FAIL"}] ${result.name}`);
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

function run() {
  const P = loadPresets();
  const report = makeReporter();

  const shared = P.getSharedPresets().map((preset) => preset.id).join(",");
  report.check(
    "Shared presets include the three approved worked examples",
    "shared-sqrt2,shared-exp-minus-x,shared-sin-minus-halfx",
    shared,
    shared === "shared-sqrt2,shared-exp-minus-x,shared-sin-minus-halfx"
  );

  const fixedPointLocal = P.getMethodPresets("fixedPoint").map((preset) => preset.id).join(",");
  report.check(
    "Fixed Point keeps its local divergent preset",
    "fixed-diverges",
    fixedPointLocal,
    fixedPointLocal === "fixed-diverges"
  );

  report.check(
    "Shared sqrt(2) preset is compatible with Newton",
    "true",
    String(P.isPresetCompatible("shared-sqrt2", "newton")),
    P.isPresetCompatible("shared-sqrt2", "newton") === true
  );

  report.check(
    "Shared sqrt(2) preset is not compatible with Fixed Point",
    "false",
    String(P.isPresetCompatible("shared-sqrt2", "fixedPoint")),
    P.isPresetCompatible("shared-sqrt2", "fixedPoint") === false
  );

  const firstUse = P.resolvePresetApplication("shared-sqrt2", "newton", {
    machine: { k: 9, mode: "chop" },
    stopping: { kind: "epsilon", value: "0.001" },
    advanced: {}
  }, false);
  report.check(
    "First use applies the preset's canonical machine mode",
    "round",
    firstUse.machine.mode,
    firstUse.machine.mode === "round"
  );
  report.check(
    "First use applies the preset's canonical stop kind",
    "iterations",
    firstUse.stopping.kind,
    firstUse.stopping.kind === "iterations"
  );

  const reuse = P.resolvePresetApplication("shared-sqrt2", "newton", {
    machine: { k: 9, mode: "chop" },
    stopping: { kind: "epsilon", value: "0.001" },
    advanced: {}
  }, true);
  report.check(
    "Reuse preserves the current machine mode",
    "chop",
    reuse.machine.mode,
    reuse.machine.mode === "chop"
  );
  report.check(
    "Reuse preserves the current stop kind",
    "epsilon",
    reuse.stopping.kind,
    reuse.stopping.kind === "epsilon"
  );

  const autoPreset = P.resolvePresetApplication("shared-exp-minus-x", "secant", {
    machine: { k: 6, mode: "round" },
    stopping: { kind: "iterations", value: "4" },
    advanced: {}
  }, false);
  report.check(
    "Shared demo presets autorun",
    "true",
    String(autoPreset.shouldRun),
    autoPreset.shouldRun === true
  );

  const fillOnlyPreset = P.resolvePresetApplication("secant-stagnates", "secant", {
    machine: { k: 6, mode: "round" },
    stopping: { kind: "iterations", value: "4" },
    advanced: {}
  }, false);
  report.check(
    "Failure-case presets fill without autorun",
    "false",
    String(fillOnlyPreset.shouldRun),
    fillOnlyPreset.shouldRun === false
  );

  report.finish();
}

run();
```

- [ ] **Step 2: Run the new preset audit and confirm it fails**

Run:

```powershell
node scripts\root-presets-audit.js
```

Expected: FAIL because `root-presets.js` does not exist yet.

- [ ] **Step 3: Create the preset catalog module**

Create `root-presets.js` with this content:

```javascript
"use strict";

(function initRootPresets(globalScope) {
  const PRESETS = [
    {
      id: "shared-sqrt2",
      label: "sqrt(2)",
      tag: "classic",
      scope: "shared",
      runMode: "autorun",
      methods: ["bisection", "newton", "secant", "falsePosition"],
      payloadByMethod: {
        bisection: {
          expression: "x^2 - 2",
          interval: { a: "1", b: "2" },
          machine: { k: 6, mode: "round" },
          stopping: { kind: "iterations", value: "4" },
          advanced: { signDisplay: "both", decisionBasis: "exact" }
        },
        newton: {
          expression: "x^2 - 2",
          dfExpression: "2x",
          starts: { x0: "1" },
          machine: { k: 6, mode: "round" },
          stopping: { kind: "iterations", value: "4" }
        },
        secant: {
          expression: "x^2 - 2",
          starts: { x0: "1", x1: "2" },
          machine: { k: 6, mode: "round" },
          stopping: { kind: "iterations", value: "4" }
        },
        falsePosition: {
          expression: "x^2 - 2",
          interval: { a: "1", b: "2" },
          machine: { k: 6, mode: "round" },
          stopping: { kind: "iterations", value: "4" },
          advanced: { signDisplay: "both", decisionBasis: "exact" }
        }
      }
    },
    {
      id: "shared-exp-minus-x",
      label: "e^(-x)-x",
      tag: "transcendental",
      scope: "shared",
      runMode: "autorun",
      methods: ["bisection", "newton", "secant", "falsePosition"],
      payloadByMethod: {
        bisection: {
          expression: "e^(-x) - x",
          interval: { a: "0", b: "1" },
          machine: { k: 6, mode: "round" },
          stopping: { kind: "iterations", value: "4" },
          advanced: { signDisplay: "both", decisionBasis: "exact" }
        },
        newton: {
          expression: "e^(-x) - x",
          dfExpression: "-e^(-x) - 1",
          starts: { x0: "0.5" },
          machine: { k: 6, mode: "round" },
          stopping: { kind: "iterations", value: "4" }
        },
        secant: {
          expression: "e^(-x) - x",
          starts: { x0: "0", x1: "1" },
          machine: { k: 6, mode: "round" },
          stopping: { kind: "iterations", value: "4" }
        },
        falsePosition: {
          expression: "e^(-x) - x",
          interval: { a: "0", b: "1" },
          machine: { k: 6, mode: "round" },
          stopping: { kind: "iterations", value: "4" },
          advanced: { signDisplay: "both", decisionBasis: "exact" }
        }
      }
    },
    {
      id: "shared-sin-minus-halfx",
      label: "sin(x)-x/2",
      tag: "oscillatory",
      scope: "shared",
      runMode: "autorun",
      methods: ["bisection", "newton", "secant", "falsePosition"],
      payloadByMethod: {
        bisection: {
          expression: "sin(x) - x/2",
          interval: { a: "1", b: "2" },
          machine: { k: 6, mode: "round" },
          stopping: { kind: "iterations", value: "4" },
          advanced: { signDisplay: "both", decisionBasis: "exact" }
        },
        newton: {
          expression: "sin(x) - x/2",
          dfExpression: "cos(x) - 1/2",
          starts: { x0: "2" },
          machine: { k: 6, mode: "round" },
          stopping: { kind: "iterations", value: "4" }
        },
        secant: {
          expression: "sin(x) - x/2",
          starts: { x0: "1", x1: "2" },
          machine: { k: 6, mode: "round" },
          stopping: { kind: "iterations", value: "4" }
        },
        falsePosition: {
          expression: "sin(x) - x/2",
          interval: { a: "1", b: "2" },
          machine: { k: 6, mode: "round" },
          stopping: { kind: "iterations", value: "4" },
          advanced: { signDisplay: "both", decisionBasis: "exact" }
        }
      }
    },
    {
      id: "newton-bad-start",
      label: "Bad Newton start",
      tag: "wanders",
      scope: "method",
      runMode: "fill",
      methods: ["newton"],
      payloadByMethod: {
        newton: {
          expression: "x^3 - 2x + 2",
          dfExpression: "3x^2 - 2",
          starts: { x0: "0" },
          machine: { k: 6, mode: "round" },
          stopping: { kind: "iterations", value: "4" }
        }
      }
    },
    {
      id: "secant-stagnates",
      label: "Secant stagnation",
      tag: "stagnates",
      scope: "method",
      runMode: "fill",
      methods: ["secant"],
      payloadByMethod: {
        secant: {
          expression: "x^2 - 1",
          starts: { x0: "1", x1: "1" },
          machine: { k: 6, mode: "round" },
          stopping: { kind: "iterations", value: "4" }
        }
      }
    },
    {
      id: "fp-slow",
      label: "Slow false position",
      tag: "slow",
      scope: "method",
      runMode: "fill",
      methods: ["falsePosition"],
      payloadByMethod: {
        falsePosition: {
          expression: "x^10 - 1",
          interval: { a: "0", b: "2" },
          machine: { k: 12, mode: "round" },
          stopping: { kind: "epsilon", value: "0.000001" },
          advanced: { signDisplay: "both", decisionBasis: "exact" }
        }
      }
    },
    {
      id: "fixed-diverges",
      label: "Divergent fixed point",
      tag: "diverges",
      scope: "method",
      runMode: "fill",
      methods: ["fixedPoint"],
      payloadByMethod: {
        fixedPoint: {
          gExpression: "x + 1",
          starts: { x0: "0" },
          machine: { k: 12, mode: "round" },
          stopping: { kind: "epsilon", value: "0.1" }
        }
      }
    }
  ];

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function getPresetById(id) {
    return PRESETS.find(function(preset) { return preset.id === id; }) || null;
  }

  function getSharedPresets() {
    return PRESETS.filter(function(preset) { return preset.scope === "shared"; }).map(clone);
  }

  function getMethodPresets(method) {
    return PRESETS.filter(function(preset) {
      return preset.scope === "method" && preset.methods.indexOf(method) >= 0;
    }).map(clone);
  }

  function isPresetCompatible(idOrPreset, method) {
    const preset = typeof idOrPreset === "string" ? getPresetById(idOrPreset) : idOrPreset;
    return !!(preset && preset.methods.indexOf(method) >= 0);
  }

  function resolvePresetApplication(idOrPreset, method, currentSettings, hasUsedPreset) {
    const preset = typeof idOrPreset === "string" ? getPresetById(idOrPreset) : idOrPreset;
    if (!preset || !isPresetCompatible(preset, method)) {
      throw new Error("Preset is not compatible with method " + method + ".");
    }

    const payload = clone(preset.payloadByMethod[method]);
    const plan = {
      shouldRun: preset.runMode === "autorun",
      expression: payload.expression || "",
      dfExpression: payload.dfExpression || "",
      gExpression: payload.gExpression || "",
      interval: payload.interval || null,
      starts: payload.starts || null,
      machine: payload.machine || null,
      stopping: payload.stopping || null,
      advanced: payload.advanced || null
    };

    if (hasUsedPreset && currentSettings) {
      plan.machine = currentSettings.machine || plan.machine;
      plan.stopping = currentSettings.stopping || plan.stopping;
      if (plan.advanced) {
        plan.advanced = Object.assign({}, plan.advanced, currentSettings.advanced || {});
      }
    }

    return plan;
  }

  globalScope.RootPresets = {
    getPresetById,
    getSharedPresets,
    getMethodPresets,
    isPresetCompatible,
    resolvePresetApplication
  };
})(window);
```

- [ ] **Step 4: Run the preset audit to confirm it passes**

Run:

```powershell
node scripts\root-presets-audit.js
```

Expected: `Summary: 10/10 passed`

- [ ] **Step 5: Checkpoint**

Record changed files:

```text
C:\Users\Emmy Lou\Downloads\Numerical_Analysis_Final_ver-master\root-presets.js
C:\Users\Emmy Lou\Downloads\Numerical_Analysis_Final_ver-master\scripts\root-presets-audit.js
```

## Task 2: Extend RootEngine Summary Diagnostics

**Files:**
- Modify: `C:\Users\Emmy Lou\Downloads\Numerical_Analysis_Final_ver-master\scripts\root-engine-audit.js`
- Modify: `C:\Users\Emmy Lou\Downloads\Numerical_Analysis_Final_ver-master\root-engine.js`

- [ ] **Step 1: Add failing diagnostic checks to the root engine audit**

Insert this block before `report.finish();` in `scripts/root-engine-audit.js`:

```javascript
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

    report.check(
      "Bisection summary exposes a numeric residual magnitude",
      "positive number",
      String(run.summary.residualAbs),
      typeof run.summary.residualAbs === "number" && run.summary.residualAbs > 0
    );
    report.check(
      "Bisection summary marks a true bound guarantee",
      "bound",
      run.summary.guaranteeKind,
      run.summary.guaranteeKind === "bound"
    );
    report.check(
      "Bisection summary exposes the final bound value",
      "0.0625",
      C.formatReal(run.summary.guaranteeValue, 8),
      C.formatReal(run.summary.guaranteeValue, 8) === "0.0625"
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
      "Newton summary exposes residual magnitude",
      "positive number",
      String(run.summary.residualAbs),
      typeof run.summary.residualAbs === "number" && run.summary.residualAbs > 0
    );
    report.check(
      "Newton summary exposes relative error",
      "positive number",
      String(run.summary.relativeError),
      typeof run.summary.relativeError === "number" && run.summary.relativeError > 0
    );
    report.check(
      "Newton summary marks heuristic-only guarantees",
      "heuristic",
      run.summary.guaranteeKind,
      run.summary.guaranteeKind === "heuristic"
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
      "Fixed Point summary still exposes last-step error under divergence or cap exhaustion",
      "positive number",
      String(run.summary.lastStepError),
      typeof run.summary.lastStepError === "number" && run.summary.lastStepError > 0
    );
    report.check(
      "Fixed Point summary marks heuristic-only guarantees",
      "heuristic",
      run.summary.guaranteeKind,
      run.summary.guaranteeKind === "heuristic"
    );
  }
```

- [ ] **Step 2: Run the root engine audit and confirm the new checks fail**

Run:

```powershell
node scripts\root-engine-audit.js
```

Expected: existing checks pass, and the new `residualAbs`, `relativeError`, `lastStepError`, and `guaranteeKind` checks fail.

- [ ] **Step 3: Extend the engine summary helpers**

In `root-engine.js`, update `summaryPackage` and add the new helper functions after `lastRow`:

```javascript
  function summaryPackage(approximation, intervalStatus, stopReason, diagnostics) {
    return Object.assign({
      approximation,
      intervalStatus,
      stopReason,
      residual: null,
      residualBasis: "unavailable",
      residualAbs: null,
      error: null,
      lastStepError: null,
      relativeError: null,
      relativeErrorNote: "",
      bound: null,
      guaranteeKind: "none",
      guaranteeValue: null,
      stopDetail: ""
    }, diagnostics || {});
  }

  function magnitudeNumber(value, label) {
    if (value == null) {
      return null;
    }
    return Math.abs(realNumber(value, label));
  }

  function relativeErrorSummary(approximation, lastStepError) {
    if (approximation == null || lastStepError == null) {
      return { relativeError: null, relativeErrorNote: "" };
    }
    const denom = Math.abs(realNumber(approximation, "Approximation"));
    if (denom < C.EPS) {
      return {
        relativeError: null,
        relativeErrorNote: "Relative error is unstable near zero."
      };
    }
    return {
      relativeError: lastStepError / denom,
      relativeErrorNote: ""
    };
  }

  function diagnosticsSummary(approximation, residual, residualBasis, lastStepError, guaranteeKind, guaranteeValue) {
    const relative = relativeErrorSummary(approximation, lastStepError);
    return {
      residual,
      residualBasis: residual == null ? "unavailable" : residualBasis,
      residualAbs: magnitudeNumber(residual, "Residual"),
      error: lastStepError,
      lastStepError: lastStepError,
      relativeError: relative.relativeError,
      relativeErrorNote: relative.relativeErrorNote,
      bound: guaranteeKind === "bound" ? guaranteeValue : null,
      guaranteeKind: guaranteeKind || "none",
      guaranteeValue: guaranteeValue == null ? null : guaranteeValue
    };
  }
```

- [ ] **Step 4: Thread diagnostics through each method summary**

Update the `summary:` blocks in `root-engine.js` to merge `diagnosticsSummary(...)`.

For Newton and Secant, use this pattern:

```javascript
      summary: summaryPackage(approx, null, finalStopReason, Object.assign(
        diagnosticsSummary(approx, finalResidual, "machine", finalError, "heuristic", null)
      )),
```

For Fixed Point, use:

```javascript
      summary: summaryPackage(approx, null, finalStopReason, Object.assign(
        diagnosticsSummary(approx, finalResidual, finalResidual == null ? "unavailable" : "machine", finalError, "heuristic", null)
      )),
```

For False Position `earlyResult`, compute:

```javascript
        summary: summaryPackage(approximation, intervalStatus, stopReason, Object.assign(
          diagnosticsSummary(
            approximation,
            residualData.residual,
            residualData.residualBasis,
            finalBracketRow ? finalBracketRow.error : null,
            intervalStatus === "valid-bracket" || intervalStatus === "root-at-midpoint" ? "bracket" : "none",
            null
          ),
          {
            bound: finalBracketRow ? finalBracketRow.bound : null
          }
        )),
```

For Bisection:

- endpoint-root and invalid-bracket summaries use `guaranteeKind: "none"`
- `tolerance-already-met` and the final successful return use `guaranteeKind: "bound"`
- the successful final return uses the final row bound as `guaranteeValue`

Use this final-success pattern:

```javascript
    return resultPackage(options, ast, machine, leftPoint, rightPoint, stopping, summaryPackage(
      finalBracketRow ? finalBracketRow.c : C.div(C.add(left, right), TWO),
      "valid-bracket",
      options.stopping.kind === "epsilon" ? "tolerance-reached" : "iteration-limit",
      Object.assign(
        diagnosticsSummary(
          finalBracketRow ? finalBracketRow.c : C.div(C.add(left, right), TWO),
          residualData.residual,
          residualData.residualBasis,
          finalBracketRow ? finalBracketRow.error : null,
          "bound",
          finalBracketRow ? finalBracketRow.bound : null
        )
      )
    ), rows);
```

- [ ] **Step 5: Run the root engine audit and confirm it passes**

Run:

```powershell
node scripts\root-engine-audit.js
```

Expected: `Summary: 33/33 passed`

- [ ] **Step 6: Checkpoint**

Record changed files:

```text
C:\Users\Emmy Lou\Downloads\Numerical_Analysis_Final_ver-master\root-engine.js
C:\Users\Emmy Lou\Downloads\Numerical_Analysis_Final_ver-master\scripts\root-engine-audit.js
```

## Task 3: Add Preset And Diagnostics Markup

**Files:**
- Modify: `C:\Users\Emmy Lou\Downloads\Numerical_Analysis_Final_ver-master\index.html`

- [ ] **Step 1: Add the global shared preset strip above the method tabs**

In `index.html`, insert this block between the module header and the existing `<nav class="root-method-tabs"...>`:

```html
        <section class="root-preset-strip" aria-label="Worked examples">
          <div class="root-preset-strip-header">
            <div>
              <p class="result-label">Worked examples</p>
              <h3>Shared problem presets</h3>
            </div>
            <p class="focus-note">Pick a classic problem, then try it with different compatible methods.</p>
          </div>
          <div id="root-shared-preset-row" class="root-preset-row"></div>
          <details id="root-shared-preset-more" class="root-preset-more" hidden>
            <summary>More examples</summary>
            <div id="root-shared-preset-overflow" class="root-preset-row"></div>
          </details>
        </section>
```

- [ ] **Step 2: Add a local preset container to each method section**

In each root method input section, immediately after the existing `<p class="input-hint">...</p>`, insert the matching block:

```html
            <div class="root-local-presets">
              <p class="result-label">Method examples</p>
              <div id="root-local-presets-bisection" class="root-preset-row"></div>
            </div>
```

Use these ids per method:

- `root-local-presets-bisection`
- `root-local-presets-newton`
- `root-local-presets-secant`
- `root-local-presets-falsePosition`
- `root-local-presets-fixedPoint`

- [ ] **Step 3: Expand the summary cards and add the diagnostics panel**

Replace the current 3-card `root-summary-grid` block with:

```html
          <div class="root-summary-grid">
            <div class="answer-hero answer-hero-major"><p class="result-label">Approximate root</p><p id="root-approx" class="answer-value is-empty">Not calculated yet.</p></div>
            <div class="answer-hero answer-hero-major"><p class="result-label">Stopping result</p><p id="root-stopping-result" class="answer-value is-empty">Not calculated yet.</p></div>
            <div class="answer-hero answer-hero-major"><p class="result-label">Stopping parameters</p><p id="root-convergence" class="answer-value is-empty">Not calculated yet.</p></div>
            <div class="answer-hero"><p class="result-label">Final residual</p><p id="root-final-residual" class="answer-value is-empty">Not calculated yet.</p></div>
            <div class="answer-hero"><p class="result-label">Last-step error</p><p id="root-last-step-error" class="answer-value is-empty">Not calculated yet.</p></div>
          </div>
```

Then insert this block after the bracket panel and before the convergence graph:

```html
          <section id="root-diagnostics-panel" class="root-diagnostics-panel answer-hero" aria-label="Final diagnostics" hidden>
            <div class="root-diagnostics-header">
              <div>
                <p class="result-label">Final diagnostics</p>
                <h3>Interpret the final approximation</h3>
              </div>
            </div>
            <dl class="root-diagnostics-grid">
              <div><dt>Residual basis</dt><dd id="root-diagnostics-basis">Not calculated yet.</dd></div>
              <div><dt>Approximate relative error</dt><dd id="root-diagnostics-relative">Not calculated yet.</dd></div>
              <div><dt>Successive-difference error</dt><dd id="root-diagnostics-step">Not calculated yet.</dd></div>
              <div><dt>Bound / guarantee value</dt><dd id="root-diagnostics-guarantee-value">Not calculated yet.</dd></div>
            </dl>
            <p id="root-diagnostics-guarantee-text" class="focus-note">Run the method to see diagnostics.</p>
          </section>
```

- [ ] **Step 4: Load the preset module before `root-ui.js`**

In the script list near the bottom of `index.html`, insert:

```html
  <script src="root-presets.js?v=root-presets1"></script>
```

so the order becomes:

```html
  <script src="root-engine.js?v=root3"></script>
  <script src="root-presets.js?v=root-presets1"></script>
  <script src="root-ui.js?v=root3"></script>
```

- [ ] **Step 5: Sanity check the HTML structure**

Run:

```powershell
Select-String -Path index.html -Pattern 'root-shared-preset-row|root-local-presets-|root-final-residual|root-diagnostics-panel|root-presets.js'
```

Expected: one match for each new id or script include.

- [ ] **Step 6: Checkpoint**

Record changed file:

```text
C:\Users\Emmy Lou\Downloads\Numerical_Analysis_Final_ver-master\index.html
```

## Task 4: Style The Preset Strips And Diagnostics Panel

**Files:**
- Modify: `C:\Users\Emmy Lou\Downloads\Numerical_Analysis_Final_ver-master\styles.css`

- [ ] **Step 1: Add preset strip styles near the existing root-module styles**

Insert this block alongside the current `.root-method-tabs` and `.root-summary-grid` styles:

```css
.module-root .root-preset-strip,
.module-root .root-local-presets,
.module-root .root-diagnostics-panel {
  display: grid;
  gap: var(--space-3);
}

.module-root .root-preset-strip {
  margin-bottom: var(--space-3);
}

.module-root .root-preset-strip-header {
  display: flex;
  flex-wrap: wrap;
  align-items: end;
  justify-content: space-between;
  gap: var(--space-2) var(--space-3);
}

.module-root .root-preset-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-2);
}

.module-root .root-preset-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-1) var(--space-3);
  border: 1px solid var(--line);
  border-radius: var(--radius-pill);
  background: var(--surface);
  color: var(--text);
  cursor: pointer;
}

.module-root .root-preset-chip:hover {
  background: var(--surface-raised);
}

.module-root .root-preset-chip[disabled] {
  opacity: 0.55;
  cursor: not-allowed;
}

.module-root .root-preset-tag {
  font-size: 0.75rem;
  color: var(--text-subtle);
}

.module-root .root-preset-more summary {
  cursor: pointer;
}
```

- [ ] **Step 2: Add diagnostics layout styles**

Insert this block below the new preset styles:

```css
.module-root .root-diagnostics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, var(--root-summary-min)), 1fr));
  gap: var(--space-3);
  margin: 0;
}

.module-root .root-diagnostics-grid > div {
  display: grid;
  gap: var(--space-1);
}

.module-root .root-diagnostics-grid dt {
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  color: var(--text-subtle);
}

.module-root .root-diagnostics-grid dd {
  margin: 0;
  color: var(--text);
}
```

- [ ] **Step 3: Make the five-card summary hold together on larger screens**

Replace the current large-screen summary override:

```css
  .module-root .root-summary-grid {
      grid-template-columns: minmax(0, 1.25fr) repeat(3, minmax(0, 1fr));
    }
```

with:

```css
  .module-root .root-summary-grid {
      grid-template-columns: minmax(0, 1.25fr) repeat(4, minmax(0, 1fr));
    }
```

- [ ] **Step 4: Scan the stylesheet for the new root selectors**

Run:

```powershell
Select-String -Path styles.css -Pattern 'root-preset-strip|root-preset-chip|root-diagnostics-grid|root-diagnostics-panel'
```

Expected: matches for the new preset and diagnostics rules.

- [ ] **Step 5: Checkpoint**

Record changed file:

```text
C:\Users\Emmy Lou\Downloads\Numerical_Analysis_Final_ver-master\styles.css
```

## Task 5: Wire Presets And Diagnostics In RootUI

**Files:**
- Modify: `C:\Users\Emmy Lou\Downloads\Numerical_Analysis_Final_ver-master\root-ui.js`

- [ ] **Step 1: Add the preset dependency, field bindings, and state**

At the top of `root-ui.js`, add the preset dependency and state:

```javascript
  const P = globalScope.RootPresets;
  if (!R || !C || !M || !E || !P) {
    throw new Error("RootEngine, RootPresets, CalcEngine, MathEngine, and ExpressionEngine must be loaded before root-ui.js.");
  }
```

Then add these bindings below `METHOD_CONFIGS`:

```javascript
  const METHOD_BINDINGS = {
    bisection: {
      expression: "root-bis-expression",
      intervalA: "root-bis-a",
      intervalB: "root-bis-b",
      machineK: "root-bis-k",
      machineMode: "root-bis-mode",
      stopKind: "root-bis-stop-kind",
      stopValue: "root-bis-stop-value",
      signDisplay: "root-bis-sign-display",
      decisionBasis: "root-bis-decision-basis",
      localPresetRow: "root-local-presets-bisection"
    },
    newton: {
      expression: "root-newton-expression",
      derivative: "root-newton-df",
      x0: "root-newton-x0",
      machineK: "root-newton-k",
      machineMode: "root-newton-mode",
      stopKind: "root-newton-stop-kind",
      stopValue: "root-newton-stop-value",
      localPresetRow: "root-local-presets-newton"
    },
    secant: {
      expression: "root-secant-expression",
      x0: "root-secant-x0",
      x1: "root-secant-x1",
      machineK: "root-secant-k",
      machineMode: "root-secant-mode",
      stopKind: "root-secant-stop-kind",
      stopValue: "root-secant-stop-value",
      localPresetRow: "root-local-presets-secant"
    },
    falsePosition: {
      expression: "root-fp-expression",
      intervalA: "root-fp-a",
      intervalB: "root-fp-b",
      machineK: "root-fp-k",
      machineMode: "root-fp-mode",
      stopKind: "root-fp-stop-kind",
      stopValue: "root-fp-stop-value",
      signDisplay: "root-fp-sign-display",
      decisionBasis: "root-fp-decision-basis",
      localPresetRow: "root-local-presets-falsePosition"
    },
    fixedPoint: {
      gExpression: "root-fpi-expression",
      x0: "root-fpi-x0",
      machineK: "root-fpi-k",
      machineMode: "root-fpi-mode",
      stopKind: "root-fpi-stop-kind",
      stopValue: "root-fpi-stop-value",
      localPresetRow: "root-local-presets-fixedPoint"
    }
  };
```

Extend `state` with:

```javascript
    usedPresets: {}
```

- [ ] **Step 2: Add preset rendering and pure-application adapters**

Insert these helpers above `runCompute()`:

```javascript
  function readCurrentSettings(method) {
    const binding = METHOD_BINDINGS[method];
    return {
      machine: {
        k: Number(byId(binding.machineK).value),
        mode: byId(binding.machineMode).value
      },
      stopping: {
        kind: byId(binding.stopKind).value,
        value: byId(binding.stopValue).value
      },
      advanced: binding.signDisplay ? {
        signDisplay: byId(binding.signDisplay).value,
        decisionBasis: byId(binding.decisionBasis).value
      } : {}
    };
  }

  function writePresetPlan(method, plan) {
    const binding = METHOD_BINDINGS[method];
    if (binding.expression && plan.expression) byId(binding.expression).value = plan.expression;
    if (binding.derivative && plan.dfExpression) byId(binding.derivative).value = plan.dfExpression;
    if (binding.gExpression && plan.gExpression) byId(binding.gExpression).value = plan.gExpression;
    if (binding.intervalA && plan.interval) byId(binding.intervalA).value = plan.interval.a;
    if (binding.intervalB && plan.interval) byId(binding.intervalB).value = plan.interval.b;
    if (binding.x0 && plan.starts) byId(binding.x0).value = plan.starts.x0;
    if (binding.x1 && plan.starts && plan.starts.x1 != null) byId(binding.x1).value = plan.starts.x1;
    if (plan.machine) {
      byId(binding.machineK).value = plan.machine.k;
      byId(binding.machineMode).value = plan.machine.mode;
    }
    if (plan.stopping) {
      byId(binding.stopKind).value = plan.stopping.kind;
      byId(binding.stopValue).value = plan.stopping.value;
    }
    if (binding.signDisplay && plan.advanced) {
      byId(binding.signDisplay).value = plan.advanced.signDisplay;
      byId(binding.decisionBasis).value = plan.advanced.decisionBasis;
    }
  }

  function makePresetChip(preset, method) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "root-preset-chip";
    btn.dataset.presetId = preset.id;
    btn.dataset.method = method;
    btn.disabled = !P.isPresetCompatible(preset.id, method);
    btn.innerHTML = '<span>' + preset.label + '</span><span class="root-preset-tag">' + preset.tag + '</span>';
    return btn;
  }

  function renderSharedPresets() {
    const activeMethod = state.activeMethod;
    const primary = byId("root-shared-preset-row");
    const overflow = byId("root-shared-preset-overflow");
    const more = byId("root-shared-preset-more");
    if (!primary || !overflow || !more) return;

    primary.innerHTML = "";
    overflow.innerHTML = "";

    const presets = P.getSharedPresets();
    presets.slice(0, 3).forEach(function(preset) { primary.appendChild(makePresetChip(preset, activeMethod)); });
    presets.slice(3).forEach(function(preset) { overflow.appendChild(makePresetChip(preset, activeMethod)); });
    more.hidden = presets.length <= 3;
  }

  function renderLocalPresets(method) {
    const rowId = METHOD_BINDINGS[method].localPresetRow;
    const row = byId(rowId);
    if (!row) return;
    row.innerHTML = "";
    P.getMethodPresets(method).forEach(function(preset) {
      row.appendChild(makePresetChip(preset, method));
    });
  }

  function applyPreset(presetId, method) {
    const hasUsedPreset = !!state.usedPresets[presetId];
    const plan = P.resolvePresetApplication(presetId, method, readCurrentSettings(method), hasUsedPreset);
    writePresetPlan(method, plan);
    state.usedPresets[presetId] = true;
    if (plan.shouldRun) {
      runCompute();
    } else {
      resetResults();
      announceStatus("root-status-msg", "Preset loaded. Review the inputs, then click = to run.");
    }
  }
```

- [ ] **Step 3: Render presets on init and tab switch**

In `activateMethod(name)`, after the advanced-options visibility block, add:

```javascript
    renderSharedPresets();
    renderLocalPresets(name);
```

Then in `init(...)`, after `wireEvents();`, add:

```javascript
      renderSharedPresets();
      renderLocalPresets(state.activeMethod);
```

- [ ] **Step 4: Add delegated preset click handling**

In `wireEvents()`, add this block after the compute-button wiring:

```javascript
    const rootPanel = byId("tab-root");
    if (rootPanel) {
      rootPanel.addEventListener("click", function(event) {
        const chip = event.target.closest(".root-preset-chip");
        if (!chip || chip.disabled) return;
        const method = chip.dataset.method || state.activeMethod;
        applyPreset(chip.dataset.presetId, method);
      });
    }
```

Keep the existing debounced input reset logic on the same `rootPanel`; do not remove it.

- [ ] **Step 5: Add diagnostics formatting and rendering**

Insert these helpers near the existing formatting utilities:

```javascript
  function fmtMetric(value) {
    if (value == null) return "—";
    return C.formatReal(value, 8);
  }

  function formatRelativeMetric(run) {
    if (run.summary.relativeError == null) {
      return run.summary.relativeErrorNote || "—";
    }
    return C.formatReal(run.summary.relativeError, 8);
  }

  function formatGuaranteeValue(run) {
    if (run.summary.guaranteeKind === "bound" && run.summary.guaranteeValue != null) {
      return C.formatReal(run.summary.guaranteeValue, 8);
    }
    if (run.summary.guaranteeKind === "bracket") {
      return "Bracket remains valid";
    }
    if (run.summary.guaranteeKind === "heuristic") {
      return "No strict bound";
    }
    return "—";
  }

  function buildGuaranteeText(run) {
    if (run.method === "bisection") {
      return "The interval still brackets a root, and the reported bound comes from the current bracket width.";
    }
    if (run.method === "falsePosition") {
      return "Bracket logic still guides the method, but the final step size is not a guaranteed root-error bound.";
    }
    if (run.method === "newton" || run.method === "secant") {
      return "A small residual and a small step size suggest convergence, but they do not prove the true root error.";
    }
    return "A small step and a small fixed-point residual may suggest settling, but convergence is not guaranteed unless contraction conditions hold.";
  }

  function renderDiagnostics(run) {
    const panel = byId("root-diagnostics-panel");
    if (!panel) return;
    panel.hidden = false;
    setContent("root-final-residual", fmtMetric(run.summary.residualAbs));
    setContent("root-last-step-error", fmtMetric(run.summary.lastStepError));
    setContent("root-diagnostics-basis", run.summary.residualBasis || "unavailable");
    setContent("root-diagnostics-relative", formatRelativeMetric(run));
    setContent("root-diagnostics-step", fmtMetric(run.summary.lastStepError));
    setContent("root-diagnostics-guarantee-value", formatGuaranteeValue(run));
    setContent("root-diagnostics-guarantee-text", buildGuaranteeText(run));
  }
```

Then in `renderRun(run)`, after `setContent("root-convergence", formatStoppingDetails(run));`, add:

```javascript
    renderDiagnostics(run);
```

- [ ] **Step 6: Reset the new preset and diagnostics UI cleanly**

In `resetResults()`, extend the reset list and hide the diagnostics panel:

```javascript
    const diagnosticsPanel = byId("root-diagnostics-panel");
    if (diagnosticsPanel) diagnosticsPanel.hidden = true;

    ["root-approx", "root-stopping-result", "root-convergence", "root-final-residual", "root-last-step-error", "root-interval-status", "root-sign-summary", "root-decision-summary", "root-diagnostics-basis", "root-diagnostics-relative", "root-diagnostics-step", "root-diagnostics-guarantee-value", "root-diagnostics-guarantee-text"].forEach(function(id) {
      const el = byId(id);
      if (el) el.textContent = EMPTY_VALUE;
    });
```

- [ ] **Step 7: Run both audits after the UI wiring**

Run:

```powershell
node scripts\root-presets-audit.js
node scripts\root-engine-audit.js
```

Expected:

- `Summary: 10/10 passed`
- `Summary: 33/33 passed`

- [ ] **Step 8: Checkpoint**

Record changed file:

```text
C:\Users\Emmy Lou\Downloads\Numerical_Analysis_Final_ver-master\root-ui.js
```

## Task 6: Full Verification

**Files:**
- Verify: `C:\Users\Emmy Lou\Downloads\Numerical_Analysis_Final_ver-master\scripts\root-presets-audit.js`
- Verify: `C:\Users\Emmy Lou\Downloads\Numerical_Analysis_Final_ver-master\scripts\root-engine-audit.js`
- Verify: `C:\Users\Emmy Lou\Downloads\Numerical_Analysis_Final_ver-master\scripts\engine-correctness-audit.js`
- Verify: `C:\Users\Emmy Lou\Downloads\Numerical_Analysis_Final_ver-master\scripts\ieee754-audit.js`

- [ ] **Step 1: Run the preset audit**

Run:

```powershell
node scripts\root-presets-audit.js
```

Expected: `Summary: 10/10 passed`

- [ ] **Step 2: Run the root engine audit**

Run:

```powershell
node scripts\root-engine-audit.js
```

Expected: `Summary: 33/33 passed`

- [ ] **Step 3: Run the shared engine audit**

Run:

```powershell
node scripts\engine-correctness-audit.js
```

Expected: `Summary: 44/44 passed`

- [ ] **Step 4: Run the IEEE audit**

Run:

```powershell
node scripts\ieee754-audit.js
```

Expected: `Summary: 7/7 passed`

- [ ] **Step 5: Manual browser smoke check**

Open `C:\Users\Emmy Lou\Downloads\Numerical_Analysis_Final_ver-master\index.html` in a browser and verify these flows:

1. Shared preset autorun:
   - Active tab: Newton-Raphson
   - Click `sqrt(2)`
   - Expected: fields populate with `x^2 - 2`, `2x`, `x0 = 1`, and the result stage appears automatically.

2. Preset reuse preserves current numerical settings:
   - Still on Newton-Raphson
   - Change `k` to `9`, machine mode to `Chopping`, and stopping mode to `Given tolerance` with `0.001`
   - Click `e^(-x)-x`
   - Expected: expression, derivative, and start value change, but `k = 9`, `Chopping`, and tolerance mode remain.

3. Failure-case preset fills only:
   - Active tab: Secant
   - Click `Secant stagnation`
   - Expected: the fields populate, the status message tells the student to review and run, and the result stage stays in its empty state until `=` is pressed.

4. Diagnostics panel on a valid run:
   - Active tab: Bisection
   - Run `sqrt(2)` or enter `x^2 - 2` on `[1, 2]`
   - Expected: `Final residual` and `Last-step error` cards show numbers, the diagnostics panel shows a residual basis, an approximate relative error, and guarantee text about the bracket bound.

5. Diagnostics panel on a failure-style run:
   - Active tab: Fixed Point
   - Load `Divergent fixed point`
   - Click `=`
   - Expected: the stopping result reflects cap exhaustion or divergence, and the diagnostics panel explains that the step size is evidence only, not a guarantee of convergence.

- [ ] **Step 6: Final checkpoint**

Final changed files should be:

```text
C:\Users\Emmy Lou\Downloads\Numerical_Analysis_Final_ver-master\root-presets.js
C:\Users\Emmy Lou\Downloads\Numerical_Analysis_Final_ver-master\root-engine.js
C:\Users\Emmy Lou\Downloads\Numerical_Analysis_Final_ver-master\root-ui.js
C:\Users\Emmy Lou\Downloads\Numerical_Analysis_Final_ver-master\index.html
C:\Users\Emmy Lou\Downloads\Numerical_Analysis_Final_ver-master\styles.css
C:\Users\Emmy Lou\Downloads\Numerical_Analysis_Final_ver-master\scripts\root-engine-audit.js
C:\Users\Emmy Lou\Downloads\Numerical_Analysis_Final_ver-master\scripts\root-presets-audit.js
```

The planning record remains:

```text
C:\Users\Emmy Lou\Downloads\Numerical_Analysis_Final_ver-master\docs\superpowers\specs\2026-04-15-root-presets-and-diagnostics-design.md
C:\Users\Emmy Lou\Downloads\Numerical_Analysis_Final_ver-master\docs\superpowers\plans\2026-04-15-root-presets-and-diagnostics.md
```

## Self-Review

- Spec coverage: the plan covers the preset registry, global and local preset surfaces, hybrid preset application, five-card summary, diagnostics panel, method-aware guarantee presentation inputs, and both audit plus manual verification.
- Placeholder scan: no `TODO`, `TBD`, or “similar to above” shortcuts remain.
- Type consistency: the plan consistently uses `residualAbs`, `lastStepError`, `relativeError`, `relativeErrorNote`, `guaranteeKind`, and `guaranteeValue`, plus the `RootPresets.resolvePresetApplication(...)` API across tasks.
