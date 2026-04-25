# Root Solution Report Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a classroom-style `Solution steps` panel and `Copy solution` action to the bisection root module.

**Architecture:** Reuse the existing `state.rootRun` result object and do not change `root-engine.js`. Add static placeholders in `index.html`, formatting/copy helpers in `app.js`, and lightweight styles in `styles.css`.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, browser Clipboard API, existing Node audit scripts.

---

### Task 1: Add Solution Report UI

**Files:**
- Modify: `C:\Users\Emmy Lou\Downloads\Numerical_Analysis_Final_ver-master\index.html`
- Modify: `C:\Users\Emmy Lou\Downloads\Numerical_Analysis_Final_ver-master\styles.css`
- Modify: `C:\Users\Emmy Lou\Downloads\Numerical_Analysis_Final_ver-master\app.js`
- Test: `C:\Users\Emmy Lou\Downloads\Numerical_Analysis_Final_ver-master\scripts\engine-correctness-audit.js`
- Test: `C:\Users\Emmy Lou\Downloads\Numerical_Analysis_Final_ver-master\scripts\root-engine-audit.js`

- [ ] **Step 1: Add the solution panel markup**

Insert this panel inside `#root-result-stage`, after the root sign summary cards and before the iteration table:

```html
<section id="root-solution-panel" class="root-solution-panel answer-hero" aria-label="Bisection solution steps">
  <div class="root-solution-header">
    <div>
      <p class="result-label">Solution steps</p>
      <h3>Classroom-style explanation</h3>
    </div>
    <button id="root-copy-solution" type="button" class="ghost">Copy solution</button>
  </div>
  <ol id="root-solution-steps" class="root-solution-steps">
    <li>Run bisection to generate solution steps.</li>
  </ol>
  <p id="root-copy-status" class="focus-note" role="status" aria-live="polite"></p>
</section>
```

- [ ] **Step 2: Add styling for the panel**

Add these CSS rules near the existing `.module-root` styles:

```css
.module-root .root-solution-panel {
  gap: var(--space-3);
}

.module-root .root-solution-header {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  align-items: start;
  justify-content: space-between;
}

.module-root .root-solution-header h3 {
  margin-top: var(--space-1);
}

.module-root .root-solution-steps {
  display: grid;
  gap: var(--space-2);
  margin: 0;
  padding-left: var(--space-5);
}

.module-root .root-solution-steps li {
  line-height: 1.5;
}
```

- [ ] **Step 3: Add report helpers in `app.js`**

Add helper functions near the existing root formatting helpers:

```js
function rootSignWord(sign) {
  if (sign < 0) {
    return "negative";
  }
  if (sign > 0) {
    return "positive";
  }
  return "zero";
}

function buildRootSolutionSteps(run) {
  const intervalText = "[" + shortValue(run.initial.left.x, 12, 8) + ", " + shortValue(run.initial.right.x, 12, 8) + "]";
  const precisionText = run.machine.k + " significant digits with " + (run.machine.mode === "round" ? "rounding" : "chopping");
  const steps = [
    "Start with f(x) = " + run.canonical + " on the interval " + intervalText + ".",
    "Check the endpoint signs: f(a) is " + rootSignWord(run.initial.left.exactSign) + " and f(b) is " + rootSignWord(run.initial.right.exactSign) + ".",
    "Since the endpoint signs are opposite, the interval brackets a root. Use c = (a + b) / 2 and keep the half-interval with the sign change.",
    run.stopping.kind === "epsilon"
      ? "For tolerance epsilon = " + run.stopping.input + ", the required number of iterations is n = " + run.stopping.iterationsRequired + "."
      : "For n = " + run.stopping.input + " iterations, the error bound is epsilon <= " + C.formatReal(run.stopping.epsilonBound, 8) + ".",
    "The approximate root after the final step is " + shortValue(run.summary.approximation, 18, 12) + ".",
    "Machine values use " + precisionText + "."
  ];
  if (run.summary.intervalStatus === "invalid-bracket") {
    steps[2] = "The endpoint signs are not opposite, so the selected interval does not bracket a root for the bisection method.";
  } else if (run.summary.intervalStatus === "root-at-a") {
    steps[2] = "The left endpoint is already a root, so no bisection iterations are needed.";
  } else if (run.summary.intervalStatus === "root-at-b") {
    steps[2] = "The right endpoint is already a root, so no bisection iterations are needed.";
  } else if (run.summary.intervalStatus === "root-at-midpoint") {
    steps[4] = "A midpoint evaluated to zero, so the approximate root is " + shortValue(run.summary.approximation, 18, 12) + ".";
  }
  return steps;
}

function renderRootSolutionSteps(run) {
  const list = byId("root-solution-steps");
  list.innerHTML = "";
  const steps = buildRootSolutionSteps(run);
  for (const step of steps) {
    const li = document.createElement("li");
    li.textContent = step;
    list.appendChild(li);
  }
  setContent("root-copy-status", "", false);
}

function rootSolutionText(run) {
  return buildRootSolutionSteps(run)
    .map(function mapStep(step, index) {
      return String(index + 1) + ". " + step;
    })
    .join("\n");
}
```

- [ ] **Step 4: Render the report after bisection**

Inside `renderRootRun(run)`, after the summary/sign cards are updated and before rendering the table body, call:

```js
renderRootSolutionSteps(run);
```

- [ ] **Step 5: Reset the report on clear**

Inside `resetRootResults()`, clear the solution list and status:

```js
const solutionList = byId("root-solution-steps");
if (solutionList) {
  solutionList.innerHTML = "<li>Run bisection to generate solution steps.</li>";
}
setContent("root-copy-status", "", false);
```

- [ ] **Step 6: Add copy handler**

Add:

```js
function copyRootSolution() {
  if (!state.rootRun) {
    setContent("root-copy-status", "Run bisection first, then copy the solution.", false);
    return;
  }
  const text = rootSolutionText(state.rootRun);
  if (!navigator.clipboard || !navigator.clipboard.writeText) {
    setContent("root-copy-status", "Clipboard is not available. Select the solution steps and copy them manually.", false);
    return;
  }
  navigator.clipboard.writeText(text)
    .then(function handleCopySuccess() {
      setContent("root-copy-status", "Solution copied.", false);
    })
    .catch(function handleCopyError() {
      setContent("root-copy-status", "Copy failed. Select the solution steps and copy them manually.", false);
    });
}
```

Register it in the existing listener setup:

```js
byId("root-copy-solution").addEventListener("click", copyRootSolution);
```

- [ ] **Step 7: Run expression audit**

Run: `node scripts\engine-correctness-audit.js`

Expected: `Summary: 44/44 passed`

- [ ] **Step 8: Run root audit**

Run: `node scripts\root-engine-audit.js`

Expected: `Summary: 8/8 passed`

- [ ] **Step 9: Source-check feature strings**

Run:

```powershell
Select-String -Path 'index.html','app.js','styles.css' -Pattern 'root-solution-panel|root-solution-steps|root-copy-solution|Solution steps|Copy solution|buildRootSolutionSteps|copyRootSolution'
```

Expected: all feature IDs/functions appear in the intended files.

## Self-Review

- Spec coverage: The plan adds a visible solution steps panel, a copy action, formatting from `state.rootRun`, invalid bracket/endpoint messaging, and the required audits.
- Placeholder scan: No placeholders remain.
- Type consistency: The plan only uses existing root run fields present in `root-engine.js` and existing formatting helpers in `app.js`.
