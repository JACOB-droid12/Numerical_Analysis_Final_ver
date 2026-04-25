# Roots Guided Solver Studio Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Turn the standalone Roots mini app into a fast, quiz-friendly Guided Solver Studio with answer-first hierarchy, compact method guidance, and actionable result interpretation.

**Architecture:** Keep the existing Roots mini-app boundary: HTML structure in `roots/index.html`, styling in `roots/roots.css`, behavior/rendering in `roots/roots-render.js`, and audits in `scripts/`. Add UI interpretation from the existing `RootEngine` run package; do not change numerical algorithms or main calculator shell files.

**Tech Stack:** Vanilla HTML, CSS, JavaScript IIFEs, Node-based static/UI audit scripts.

---

## File Structure

- Modify: `scripts/roots-mini-app-static-audit.js`
  - Add static checks for the Guided Solver shell, quiz answer panel, result interpretation landmarks, copy-ready controls, and CSS hierarchy.
- Modify: `scripts/roots-mini-app-ui-audit.js`
  - Add fake DOM ids and runtime assertions for method guidance, interpretation text, next-action text, final metric text, and copy-ready solution output.
- Modify: `roots/index.html`
  - Add Guided Solver hero, selected-method guidance shell, and quiz answer panel landmarks.
- Modify: `roots/roots-render.js`
  - Add method metadata, result interpretation helpers, next-action helpers, final metric formatting, method guidance rendering, and copy-ready solution headers.
- Modify: `roots/roots.css`
  - Add focused visual system for the Guided Solver shell, method guidance, quiz answer panel, result actions, and responsive hierarchy.

Files that must not be edited in this plan:

- `index.html`
- `app.js`
- `styles.css`
- `root-engine.js`

## Task 1: Add Static Audit Guardrails

**Files:**
- Modify: `scripts/roots-mini-app-static-audit.js`
- Test: `node scripts/roots-mini-app-static-audit.js`

- [ ] **Step 1: Add static HTML checks for Guided Solver landmarks**

In `scripts/roots-mini-app-static-audit.js`, after `hasEmptyStateContract`, add these helper functions:

```js
function hasGuidedSolverShell(source) {
  const text = normalizedText(source);
  return /class="[^"]*\broots-guided-hero\b[^"]*"/.test(source) &&
    /id="root-method-guide"/.test(source) &&
    /id="root-method-title"/.test(source) &&
    /id="root-method-summary"/.test(source) &&
    /id="root-method-details"/.test(source) &&
    text.includes("Fast root solving for quizzes and worksheets") &&
    text.includes("Answer first. Explanation second. Trace when you need it.");
}

function hasQuizAnswerPanel(source) {
  return /id="root-quiz-answer"/.test(source) &&
    /id="root-active-method"/.test(source) &&
    /id="root-final-metric"/.test(source) &&
    /id="root-interpretation"/.test(source) &&
    /id="root-next-action"/.test(source) &&
    /id="root-copy-solution"/.test(source);
}
```

- [ ] **Step 2: Add static CSS checks for Guided Solver classes**

In `scripts/roots-mini-app-static-audit.js`, after the existing `narrowScreenMediaTableBlock` constant, add:

```js
const guidedHeroBlocks = getCssBlocks(rootsCss, ".roots-guided-hero");
const guidedHeroBlock = guidedHeroBlocks.find((block) =>
  cssBlockIncludesAll(block, [
    "display: grid",
    "border: 1px solid var(--line)"
  ])
);
const methodGuideBlocks = getCssBlocks(rootsCss, ".root-method-guide");
const methodGuideBlock = methodGuideBlocks.find((block) =>
  cssBlockIncludesAll(block, [
    "display: grid",
    "border: 1px solid var(--line)"
  ])
);
const quizAnswerBlocks = getCssBlocks(rootsCss, ".root-quiz-answer");
const quizAnswerBlock = quizAnswerBlocks.find((block) =>
  cssBlockIncludesAll(block, [
    "display: grid",
    "border: 1px solid var(--line-strong)"
  ])
);
const resultInsightBlocks = getCssBlocks(rootsCss, ".root-result-insight");
const resultInsightBlock = resultInsightBlocks.find((block) =>
  cssBlockIncludesAll(block, [
    "display: grid",
    "border: 1px solid var(--line)"
  ])
);
```

- [ ] **Step 3: Add static checks near the existing Roots UX checks**

After the existing `"Empty state gives a useful first action"` check, add:

```js
check(
  "Guided Solver shell is present",
  "hero, active method guide, and fast quiz copy",
  hasGuidedSolverShell(html)
    ? "guided solver shell present"
    : "guided solver shell missing",
  hasGuidedSolverShell(html)
);

check(
  "Quiz answer panel exposes result interpretation landmarks",
  "active method, final metric, interpretation, next action, and copy solution",
  hasQuizAnswerPanel(html)
    ? "quiz answer landmarks present"
    : "quiz answer landmarks missing",
  hasQuizAnswerPanel(html)
);
```

After the existing `"Roots CSS keeps the approximate root visually primary"` check, add:

```js
check(
  "Roots CSS includes Guided Solver hierarchy",
  "guided hero, method guide, quiz answer panel, and insight cards",
  guidedHeroBlock && methodGuideBlock && quizAnswerBlock && resultInsightBlock
    ? "guided solver styling present"
    : "guided solver styling missing",
  Boolean(guidedHeroBlock && methodGuideBlock && quizAnswerBlock && resultInsightBlock)
);
```

- [ ] **Step 4: Run the static audit and verify it fails for the new missing landmarks**

Run:

```powershell
node scripts/roots-mini-app-static-audit.js
```

Expected:

```text
[FAIL] Guided Solver shell is present
[FAIL] Quiz answer panel exposes result interpretation landmarks
[FAIL] Roots CSS includes Guided Solver hierarchy
```

The script should exit with code `1`. Existing checks should continue to pass.

- [ ] **Step 5: Commit the failing static audit**

Run:

```powershell
git add scripts/roots-mini-app-static-audit.js
git commit -m "test: add guided roots static audit"
```

Expected:

```text
[codex/roots-guided-solver-studio <sha>] test: add guided roots static audit
```

## Task 2: Add Runtime UI Audit Guardrails

**Files:**
- Modify: `scripts/roots-mini-app-ui-audit.js`
- Test: `node scripts/roots-mini-app-ui-audit.js`

- [ ] **Step 1: Add new fake DOM ids**

In `scripts/roots-mini-app-ui-audit.js`, extend the `IDS` array after `"root-convergence"` with:

```js
"root-active-method", "root-final-metric", "root-interpretation", "root-next-action",
"root-method-guide", "root-method-title", "root-method-summary", "root-method-details",
```

- [ ] **Step 2: Add successful-run assertions**

After the first Bisection run assertion:

```js
assert.strictEqual(document.elements["root-approx"].textContent, "1.4375");
```

add:

```js
assert.strictEqual(document.elements["root-active-method"].textContent, "Bisection");
assert.ok(
  document.elements["root-final-metric"].textContent.includes("epsilon <=") ||
    document.elements["root-final-metric"].textContent.includes("Final |error|"),
  "bisection final metric should summarize error or bound"
);
assert.ok(
  document.elements["root-interpretation"].textContent.includes("requested iterations"),
  "bisection interpretation should explain the stopping result"
);
assert.ok(
  document.elements["root-next-action"].textContent.includes("Increase n") ||
    document.elements["root-next-action"].textContent.includes("tolerance"),
  "bisection next action should guide tighter answers"
);
assert.ok(
  document.elements["root-method-summary"].textContent.includes("interval"),
  "bisection method guide should explain interval use"
);
```

- [ ] **Step 3: Add invalid-bracket assertions**

After:

```js
assert.strictEqual(document.elements["root-stopping-result"].textContent, "Not a valid starting bracket");
```

add:

```js
assert.ok(
  document.elements["root-interpretation"].textContent.includes("do not bracket"),
  "invalid bracket interpretation should explain the sign problem"
);
assert.ok(
  document.elements["root-next-action"].textContent.includes("opposite signs"),
  "invalid bracket next action should tell the user how to recover"
);
```

- [ ] **Step 4: Add method-guide assertions for open and fixed-point methods**

After clicking the Newton tab:

```js
click(document.elements["root-tab-newton"]);
```

add:

```js
assert.strictEqual(document.elements["root-method-title"].textContent, "Newton-Raphson");
assert.ok(document.elements["root-method-summary"].textContent.includes("derivative"));
```

After clicking the Fixed Point tab:

```js
click(document.elements["root-tab-fixedpoint"]);
```

add:

```js
assert.strictEqual(document.elements["root-method-title"].textContent, "Fixed Point");
assert.ok(document.elements["root-method-summary"].textContent.includes("g(x)"));
```

- [ ] **Step 5: Add copy-ready output assertions**

After:

```js
assert.ok(clipboard.text.includes("false position"), "copy should include current solution text");
```

add:

```js
assert.ok(clipboard.text.includes("Method: False Position"), "copy should include method header");
assert.ok(clipboard.text.includes("Approximate root:"), "copy should include approximate root");
assert.ok(clipboard.text.includes("Stopping reason:"), "copy should include stopping reason");
assert.ok(clipboard.text.includes("Next action:"), "copy should include next action guidance");
```

- [ ] **Step 6: Run the UI audit and verify it fails for missing rendered content**

Run:

```powershell
node scripts/roots-mini-app-ui-audit.js
```

Expected:

```text
AssertionError
```

The first failure should reference one of the new `root-active-method`, `root-final-metric`, `root-interpretation`, `root-next-action`, or method-guide assertions.

- [ ] **Step 7: Commit the failing UI audit**

Run:

```powershell
git add scripts/roots-mini-app-ui-audit.js
git commit -m "test: add guided roots ui audit"
```

Expected:

```text
[codex/roots-guided-solver-studio <sha>] test: add guided roots ui audit
```

## Task 3: Restructure Roots HTML For Guided Solver Landmarks

**Files:**
- Modify: `roots/index.html`
- Test: `node scripts/roots-mini-app-static-audit.js`

- [ ] **Step 1: Replace the plain module header with a Guided Solver hero**

In `roots/index.html`, replace the existing `<div class="module-header">...</div>` inside `.module-root` with:

```html
<div class="module-header roots-guided-hero">
  <div>
    <p class="eyebrow">Module IV · Guided Solver Studio</p>
    <h1>Fast root solving for quizzes and worksheets</h1>
    <p class="module-subtitle">Answer first. Explanation second. Trace when you need it.</p>
  </div>
  <div class="root-hero-card" aria-label="Guided solver priorities">
    <span class="root-hero-kicker">Quiz workflow</span>
    <strong>Run the method, read the root, copy the reasoning.</strong>
    <p>Method tabs stay quick. Tables and diagnostics stay available below the main answer.</p>
  </div>
</div>
```

- [ ] **Step 2: Add the active method guidance shell after the method tabs**

Immediately after the closing `</nav>` for `.root-method-tabs`, add:

```html
<section id="root-method-guide" class="root-method-guide" aria-label="Active method guidance">
  <div>
    <p class="result-label">Active solver</p>
    <h2 id="root-method-title">Bisection</h2>
    <p id="root-method-summary" class="root-method-summary">Use an interval where f(a) and f(b) have opposite signs.</p>
  </div>
  <p id="root-method-details" class="root-method-details">Best for quiz problems that provide a bracket or ask for guaranteed interval shrinking.</p>
</section>
```

- [ ] **Step 3: Replace the result summary grid with the quiz answer panel**

Inside `<section id="root-result-stage" class="result-stage" hidden>`, replace the current first `.root-summary-grid` block with:

```html
<section id="root-quiz-answer" class="root-quiz-answer" aria-label="Quiz-ready answer">
  <div class="root-answer-main">
    <p class="result-label">Approximate root</p>
    <p id="root-approx" class="answer-value">Not calculated yet</p>
    <p class="root-answer-method">Method: <strong id="root-active-method">Not calculated yet</strong></p>
  </div>
  <div class="root-answer-context">
    <div class="root-result-insight">
      <p class="result-label">Stopping result</p>
      <p id="root-stopping-result" class="answer-value">Not calculated yet</p>
    </div>
    <div class="root-result-insight">
      <p class="result-label">Stopping parameters</p>
      <p id="root-convergence" class="answer-value">Not calculated yet</p>
    </div>
    <div class="root-result-insight">
      <p class="result-label">Final metric</p>
      <p id="root-final-metric" class="answer-value">Not calculated yet</p>
    </div>
  </div>
  <div class="root-answer-guidance">
    <div>
      <p class="result-label">What this means</p>
      <p id="root-interpretation">Run the method to see a short interpretation.</p>
    </div>
    <div>
      <p class="result-label">Try next</p>
      <p id="root-next-action">Run the method to see the next recommended action.</p>
    </div>
  </div>
</section>
```

Do not remove `root-diagnostics`, `root-bracket-panel`, `root-convergence-graph`, `root-rate-summary`, `root-solution-panel`, or `root-iteration-table-wrap`.

- [ ] **Step 4: Run the static audit**

Run:

```powershell
node scripts/roots-mini-app-static-audit.js
```

Expected:

```text
[PASS] Guided Solver shell is present
[PASS] Quiz answer panel exposes result interpretation landmarks
[FAIL] Roots CSS includes Guided Solver hierarchy
```

The CSS failure remains expected until Task 6.

- [ ] **Step 5: Commit the HTML structure**

Run:

```powershell
git add roots/index.html
git commit -m "feat: add guided roots solver shell"
```

Expected:

```text
[codex/roots-guided-solver-studio <sha>] feat: add guided roots solver shell
```

## Task 4: Render Method Guidance And Result Interpretation

**Files:**
- Modify: `roots/roots-render.js`
- Test: `node scripts/roots-mini-app-ui-audit.js`

- [ ] **Step 1: Add method metadata**

In `roots/roots-render.js`, after `TABLE_CONFIGS`, add:

```js
const METHOD_INFO = {
  bisection: {
    label: "Bisection",
    summary: "Use an interval where f(a) and f(b) have opposite signs.",
    details: "Best for quiz problems that provide a bracket or ask for guaranteed interval shrinking."
  },
  falsePosition: {
    label: "False Position",
    summary: "Use a bracket, then estimate the crossing with a secant line.",
    details: "Often moves faster than bisection, but one endpoint can stay fixed for many steps."
  },
  newton: {
    label: "Newton-Raphson",
    summary: "Use one starting value and the derivative to jump toward the root.",
    details: "Fast near a good starting point, but sensitive to zero derivatives and unstable steps."
  },
  secant: {
    label: "Secant",
    summary: "Use two starting values to estimate the slope without a derivative.",
    details: "Useful when f'(x) is unavailable, but repeated function values can stall the method."
  },
  fixedPoint: {
    label: "Fixed Point",
    summary: "Enter g(x), then iterate x next = g(x).",
    details: "Works when the iteration settles near a fixed point; cycles and divergence mean the form or start should change."
  }
};
```

- [ ] **Step 2: Add interpretation helper functions**

After `formatStoppingDetails(run)`, add:

```js
function methodLabel(method) {
  return (METHOD_INFO[method] && METHOD_INFO[method].label) || method || EMPTY;
}

function finalMetric(run) {
  const summary = run && run.summary ? run.summary : {};
  if (summary.bound != null) return "Bound = " + fmtErr(summary.bound);
  if (summary.error != null) return "Final |error| = " + fmtErr(summary.error);
  if (summary.residual != null) return "Residual = " + fmtVal(summary.residual, 12);
  if (run && run.stopping && run.stopping.epsilonBound != null) {
    return run.method === "bisection"
      ? "epsilon <= " + fmtErr(run.stopping.epsilonBound)
      : "Final |error| = " + fmtErr(run.stopping.epsilonBound);
  }
  return "No final metric available.";
}

function interpretationText(run) {
  const summary = run && run.summary ? run.summary : {};
  const reason = summary.stopReason;
  const method = run && run.method;
  if (summary.intervalStatus === "invalid-bracket" || reason === "invalid-starting-interval") {
    return "The endpoints do not bracket a sign change, so this bracket method cannot start safely.";
  }
  if (reason === "iteration-limit") {
    return "The requested iterations completed. Use this root when the quiz asks for this fixed n.";
  }
  if (reason === "tolerance-reached") {
    return "The method reached the requested tolerance, so the last approximation satisfies your stopping rule.";
  }
  if (reason === "tolerance-already-met") {
    return "The starting interval already satisfies the requested tolerance.";
  }
  if (reason === "endpoint-root") {
    return "One endpoint is already a root, so no iteration is needed.";
  }
  if (reason === "exact-zero" || reason === "machine-zero") {
    return method === "fixedPoint"
      ? "The iteration landed on a fixed point under the current precision rule."
      : "The function value is zero or machine-zero at the reported approximation.";
  }
  if (reason === "derivative-zero") {
    return "Newton-Raphson cannot continue because the derivative is zero or too small at the current point.";
  }
  if (reason === "stagnation") {
    return "The update stalled because the denominator became too small.";
  }
  if (reason === "retained-endpoint-stagnation") {
    return "False Position kept the same endpoint too long, so the run stopped before claiming convergence.";
  }
  if (reason === "diverged" || reason === "diverged-step") {
    return "The iterates moved away from a stable answer instead of settling toward a root.";
  }
  if (reason === "cycle-detected") {
    return "The fixed-point iteration repeated a cycle instead of settling to one value.";
  }
  if (reason === "iteration-cap") {
    return "The safety cap was reached before the requested tolerance was satisfied.";
  }
  if (reason === "discontinuity-detected" || reason === "singularity-encountered" || reason === "non-finite-evaluation") {
    return "The evaluator hit an undefined or non-finite value during the run.";
  }
  if (reason === "invalid-input") {
    return "The run could not start because one or more inputs were rejected.";
  }
  return "The run completed with the displayed stopping result.";
}

function nextActionText(run) {
  const summary = run && run.summary ? run.summary : {};
  const reason = summary.stopReason;
  if (summary.intervalStatus === "invalid-bracket" || reason === "invalid-starting-interval") {
    return "Choose endpoints where f(a) and f(b) have opposite signs.";
  }
  if (reason === "iteration-limit") {
    return "Need a tighter answer? Increase n or switch to tolerance mode.";
  }
  if (reason === "tolerance-reached" || reason === "exact-zero" || reason === "machine-zero" || reason === "endpoint-root") {
    return "Copy the answer or inspect the table if your solution needs shown work.";
  }
  if (reason === "derivative-zero") {
    return "Change the starting point or check that f'(x) was entered correctly.";
  }
  if (reason === "stagnation") {
    return "Use different starting guesses or switch to a bracket method.";
  }
  if (reason === "retained-endpoint-stagnation") {
    return "Try Bisection for guaranteed interval shrinkage or choose a better bracket.";
  }
  if (reason === "diverged" || reason === "diverged-step") {
    return "Choose a closer starting point or use a bracket method when an interval is known.";
  }
  if (reason === "cycle-detected") {
    return "Try a different g(x) form or a different starting value.";
  }
  if (reason === "iteration-cap") {
    return "Increase the cap only if the table shows the error is improving.";
  }
  if (reason === "discontinuity-detected" || reason === "singularity-encountered" || reason === "non-finite-evaluation") {
    return "Move the interval or starting value away from undefined points.";
  }
  if (reason === "invalid-input") {
    return "Check the expression, machine precision, and stopping value.";
  }
  return "Review the diagnostics and table before trusting the approximation.";
}
```

- [ ] **Step 3: Add render helpers for method guide and quiz answer**

After `renderConvergenceSummary(run)`, add:

```js
function renderMethodGuide(method) {
  const info = METHOD_INFO[method] || METHOD_INFO.bisection;
  setText("root-method-title", info.label);
  setOptionalText("root-method-summary", info.summary);
  setOptionalText("root-method-details", info.details);
}

function renderQuizAnswer(run) {
  setText("root-active-method", methodLabel(run.method));
  setText("root-final-metric", finalMetric(run));
  setOptionalText("root-interpretation", interpretationText(run));
  setOptionalText("root-next-action", nextActionText(run));
}
```

- [ ] **Step 4: Wire the helpers into render and reset**

In `renderRun(run)`, after:

```js
setText("root-convergence", formatStoppingDetails(run));
```

add:

```js
renderMethodGuide(run.method);
renderQuizAnswer(run);
```

In `resetResults(state)`, after the `Object.keys(state.emptyTextById)` loop, add:

```js
renderMethodGuide(state.activeMethod);
setText("root-active-method", state.activeMethod ? methodLabel(state.activeMethod) : EMPTY);
setText("root-final-metric", "Not calculated yet");
setOptionalText("root-interpretation", "Run the method to see a short interpretation.");
setOptionalText("root-next-action", "Run the method to see the next recommended action.");
```

- [ ] **Step 5: Ensure method guide updates on tab switches**

In `roots/roots-render.js`, export a new method:

```js
globalScope.RootsRender = { renderRun, renderBisection: renderRun, resetResults, buildSolutionText, renderMethodGuide };
```

In `roots/roots-app.js`, inside `activateMethod(state, method)`, after `state.activeMethod = method;`, add:

```js
if (globalScope.RootsRender.renderMethodGuide) {
  globalScope.RootsRender.renderMethodGuide(method);
}
```

- [ ] **Step 6: Run the UI audit**

Run:

```powershell
node scripts/roots-mini-app-ui-audit.js
```

Expected:

```text
AssertionError
```

The remaining failure should be about copy-ready output headers because `buildSolutionText` is updated in Task 5.

- [ ] **Step 7: Commit the render interpretation work**

Run:

```powershell
git add roots/roots-render.js roots/roots-app.js
git commit -m "feat: render guided roots interpretation"
```

Expected:

```text
[codex/roots-guided-solver-studio <sha>] feat: render guided roots interpretation
```

## Task 5: Improve Copy-Ready Solution Text

**Files:**
- Modify: `roots/roots-render.js`
- Test: `node scripts/roots-mini-app-ui-audit.js`

- [ ] **Step 1: Replace `buildSolutionText(run)`**

In `roots/roots-render.js`, replace the existing `buildSolutionText(run)` with:

```js
function buildSolutionText(run) {
  const summary = run.summary || {};
  const header = [
    "Method: " + methodLabel(run.method),
    "Function: " + (run.canonical || run.expression || "f(x)"),
    "Machine: " + run.machine.k + " significant digits, " + (run.machine.mode === "round" ? "rounding" : "chopping"),
    "Stopping: " + formatStoppingDetails(run),
    "Approximate root: " + (summary.approximation == null ? "N/A" : fmtVal(summary.approximation, 18)),
    "Stopping reason: " + formatStopReason(summary.stopReason, run.method),
    "Final metric: " + finalMetric(run),
    "Interpretation: " + interpretationText(run),
    "Next action: " + nextActionText(run)
  ];
  const steps = solutionSteps(run).map(function numberStep(step, index) {
    return (index + 1) + ". " + step;
  });
  return header.concat(["", "Solution steps:"], steps).join("\n");
}
```

- [ ] **Step 2: Run the UI audit**

Run:

```powershell
node scripts/roots-mini-app-ui-audit.js
```

Expected:

```text
Exit code: 0
```

The script prints no output on success.

- [ ] **Step 3: Commit the copy output change**

Run:

```powershell
git add roots/roots-render.js
git commit -m "feat: add quiz-ready roots copy output"
```

Expected:

```text
[codex/roots-guided-solver-studio <sha>] feat: add quiz-ready roots copy output
```

## Task 6: Add Guided Solver Visual Styling

**Files:**
- Modify: `roots/roots.css`
- Test: `node scripts/roots-mini-app-static-audit.js`

- [ ] **Step 1: Add Guided Solver hero styling near the top of `roots/roots.css`**

After `.roots-toolbar`, add:

```css
.roots-guided-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.35fr) minmax(240px, 0.65fr);
  gap: var(--space-4);
  align-items: stretch;
  border: 1px solid var(--line);
  background:
    radial-gradient(circle at 18% 0%, color-mix(in srgb, var(--accent) 16%, transparent), transparent 34%),
    var(--surface);
}

.root-hero-card {
  display: grid;
  gap: var(--space-2);
  padding: var(--space-4);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--surface-raised);
}

.root-hero-card strong {
  color: var(--text);
  font-size: 1.05rem;
  line-height: 1.3;
}

.root-hero-card p {
  margin: 0;
  color: var(--text-subtle);
  line-height: 1.45;
}

.root-hero-kicker {
  color: var(--accent);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
```

- [ ] **Step 2: Add method guide styling before `.module-root .root-config-grid`**

Add:

```css
.root-method-guide {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(220px, 1.1fr);
  gap: var(--space-4);
  align-items: start;
  margin: 0 0 var(--space-3);
  padding: var(--space-4);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--surface-raised);
}

.root-method-guide h2 {
  margin: var(--space-1) 0;
}

.root-method-summary,
.root-method-details {
  margin: 0;
  color: var(--text-subtle);
  line-height: 1.45;
}

.root-method-details {
  padding: var(--space-3);
  border-left: 3px solid var(--accent);
  background: var(--accent-soft);
  border-radius: var(--radius);
}
```

- [ ] **Step 3: Add quiz answer panel styling near `.module-root .root-summary-grid`**

Add:

```css
.root-quiz-answer {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(280px, 1fr);
  gap: var(--space-4);
  padding: var(--space-4);
  border: 1px solid var(--line-strong);
  border-radius: calc(var(--radius) + 4px);
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--accent) 10%, transparent), transparent 42%),
    var(--surface-strong);
  box-shadow: 0 18px 42px rgba(20, 24, 31, 0.10);
}

.root-answer-main {
  display: grid;
  gap: var(--space-2);
  align-content: center;
}

.root-answer-main .answer-value {
  font-size: clamp(2.25rem, 6vw, 4.25rem);
  line-height: 1;
}

.root-answer-method {
  margin: 0;
  color: var(--text-subtle);
}

.root-answer-context {
  display: grid;
  gap: var(--space-2);
}

.root-result-insight {
  display: grid;
  gap: var(--space-1);
  padding: var(--space-3);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--surface);
}

.root-result-insight .answer-value {
  font-size: 1rem;
  line-height: 1.35;
}

.root-answer-guidance {
  display: grid;
  grid-column: 1 / -1;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-3);
}

.root-answer-guidance > div {
  padding: var(--space-3);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--surface-raised);
}

.root-answer-guidance p:last-child {
  margin-bottom: 0;
  color: var(--text);
  line-height: 1.45;
}
```

- [ ] **Step 4: Add responsive rules**

Inside the existing `@media (max-width: 768px)` block, add:

```css
.roots-guided-hero,
.root-method-guide,
.root-quiz-answer,
.root-answer-guidance {
  grid-template-columns: 1fr;
}

.root-quiz-answer {
  padding: var(--space-3);
}
```

- [ ] **Step 5: Run the static audit**

Run:

```powershell
node scripts/roots-mini-app-static-audit.js
```

Expected:

```text
[PASS] Guided Solver shell is present
[PASS] Quiz answer panel exposes result interpretation landmarks
[PASS] Roots CSS includes Guided Solver hierarchy
```

The full script should exit with code `0`.

- [ ] **Step 6: Commit the CSS polish**

Run:

```powershell
git add roots/roots.css
git commit -m "feat: style guided roots solver"
```

Expected:

```text
[codex/roots-guided-solver-studio <sha>] feat: style guided roots solver
```

## Task 7: Run Full Roots Verification

**Files:**
- Modify: none
- Test:
  - `node scripts/roots-mini-app-static-audit.js`
  - `node scripts/roots-mini-app-ui-audit.js`
  - `node scripts/roots-fast-lane-audit.js`
  - `node scripts/root-engine-audit.js`
  - `node scripts/engine-correctness-audit.js`

- [ ] **Step 1: Run static audit**

Run:

```powershell
node scripts/roots-mini-app-static-audit.js
```

Expected:

```text
[PASS] Guided Solver shell is present
[PASS] Quiz answer panel exposes result interpretation landmarks
[PASS] Roots CSS includes Guided Solver hierarchy
```

The command should exit with code `0`.

- [ ] **Step 2: Run UI audit**

Run:

```powershell
node scripts/roots-mini-app-ui-audit.js
```

Expected:

```text
Exit code: 0
```

The script may print no output on success.

- [ ] **Step 3: Run fast-lane audit**

Run:

```powershell
node scripts/roots-fast-lane-audit.js
```

Expected:

```text
[PASS] Fast lane names the compact context docs
```

The command should exit with code `0`.

- [ ] **Step 4: Run root engine audit**

Run:

```powershell
node scripts/root-engine-audit.js
```

Expected:

```text
Summary: 45/45 passed
```

- [ ] **Step 5: Run shared engine audit**

Run:

```powershell
node scripts/engine-correctness-audit.js
```

Expected:

```text
Summary: 47/47 passed
```

- [ ] **Step 6: Inspect git status**

Run:

```powershell
git status --short --branch
```

Expected:

```text
## codex/roots-guided-solver-studio
```

There should be no dirty file entries. If audit output logs or scratch files appear, remove only files created by this implementation before final handoff.

## Task 8: Handoff

**Files:**
- Modify: none

- [ ] **Step 1: Summarize implementation**

Final report should include:

```text
Implemented Guided Solver Studio for Roots:
- answer-first quiz panel
- compact active method guidance
- result interpretation and next-action guidance
- quiz-ready copy output
- responsive visual hierarchy
```

- [ ] **Step 2: Summarize verification**

Final report should include:

```text
Verified:
- node scripts/roots-mini-app-static-audit.js
- node scripts/roots-mini-app-ui-audit.js
- node scripts/roots-fast-lane-audit.js
- node scripts/root-engine-audit.js
- node scripts/engine-correctness-audit.js
```

- [ ] **Step 3: Commit nothing**

This task is reporting only. Do not create a handoff commit.
