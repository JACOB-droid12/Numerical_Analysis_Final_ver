# Roots Academic Studio Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild the standalone Roots mini app into a warm Academic Studio UI that keeps quiz solving fast and answer-first.

**Architecture:** This is a Roots-only UI layer change. HTML defines the new study-tool layout, CSS owns the Academic Studio visual system and responsive behavior, and existing render/app modules keep method switching and answer rendering intact with small selector-safe adjustments only where needed.

**Tech Stack:** Static HTML, vanilla JavaScript IIFEs, CSS, Node-based audit scripts, local static server for browser smoke testing.

---

## File Structure

- Modify `scripts/roots-mini-app-static-audit.js`: add static assertions for Academic Studio layout, method rail, setup panel, answer-first result, and evidence section.
- Modify `scripts/roots-mini-app-ui-audit.js`: keep runtime assertions aligned with the new markup while preserving method switching, answer rendering, and copy behavior checks.
- Modify `roots/index.html`: reorganize the standalone Roots shell into hero, method rail/guidance, setup panels, answer stage, and evidence sections.
- Modify `roots/roots.css`: replace the current generic Guided Solver styling with the Academic Studio visual system, layout, focus states, and mobile collapse rules.
- Modify `roots/roots-render.js`: only update copy/section labels if the redesigned result stage needs stronger evidence wording; do not change numerical behavior.
- Do not modify `root-engine.js`, main `index.html`, main `app.js`, or global `styles.css`.

---

### Task 1: Add Failing Static Layout Audit

**Files:**
- Modify: `scripts/roots-mini-app-static-audit.js`
- Test: `scripts/roots-mini-app-static-audit.js`

- [ ] **Step 1: Add static helpers for the Academic Studio contract**

Add these helpers after `hasQuizAnswerPanel(source)`:

```javascript
function hasAcademicStudioLayout(source) {
  const heroHtml = getElementHtmlByClass(source, "div", "roots-studio-hero");
  const workspaceHtml = getElementHtmlByClass(source, "div", "roots-studio-workspace");
  const methodRailHtml = getElementHtmlByClass(source, "aside", "root-method-rail");
  const setupHtml = getElementHtmlByClass(source, "section", "root-setup-card");
  const evidenceHtml = getElementHtmlByClass(source, "section", "root-evidence-stack");
  const heroText = normalizedText(heroHtml);
  const workspaceText = normalizedText(workspaceHtml);

  return Boolean(heroHtml) &&
    Boolean(workspaceHtml) &&
    Boolean(methodRailHtml) &&
    Boolean(setupHtml) &&
    Boolean(evidenceHtml) &&
    heroText.includes("Guided Solver Studio") &&
    heroText.includes("Pick method") &&
    heroText.includes("Enter values") &&
    heroText.includes("Copy answer") &&
    workspaceText.includes("Method") &&
    workspaceText.includes("Problem setup") &&
    workspaceText.includes("Evidence");
}

function hasAcademicStudioCss(source) {
  return [
    ".roots-studio-hero",
    ".roots-studio-workspace",
    ".root-method-rail",
    ".root-setup-card",
    ".root-answer-card",
    ".root-evidence-stack",
    ".root-academic-paper"
  ].every((selector) => source.includes(selector));
}
```

- [ ] **Step 2: Add failing audit checks**

Add these checks near the existing Guided Solver and CSS checks:

```javascript
check(
  "Academic Studio layout is present",
  "hero, workspace, method rail, setup card, answer card, and evidence stack",
  hasAcademicStudioLayout(html) ? "present" : "missing",
  hasAcademicStudioLayout(html)
);

check(
  "Academic Studio CSS hooks are present",
  ".roots-studio-hero, .roots-studio-workspace, .root-method-rail, .root-setup-card, .root-answer-card, .root-evidence-stack, .root-academic-paper",
  hasAcademicStudioCss(fs.readFileSync(path.join(ROOT, "roots", "roots.css"), "utf8")) ? "present" : "missing",
  hasAcademicStudioCss(fs.readFileSync(path.join(ROOT, "roots", "roots.css"), "utf8"))
);
```

- [ ] **Step 3: Run static audit and verify it fails**

Run:

```powershell
node scripts/roots-mini-app-static-audit.js
```

Expected: FAIL for `Academic Studio layout is present` and `Academic Studio CSS hooks are present`.

- [ ] **Step 4: Commit the failing audit**

Run:

```powershell
git add scripts/roots-mini-app-static-audit.js
git commit -m "test: add roots academic studio static audit"
```

Expected: commit succeeds with only `scripts/roots-mini-app-static-audit.js` staged.

---

### Task 2: Add Failing Runtime UI Audit Expectations

**Files:**
- Modify: `scripts/roots-mini-app-ui-audit.js`
- Test: `scripts/roots-mini-app-ui-audit.js`

- [ ] **Step 1: Add new static ID expectations to the fake DOM list**

In `IDS`, keep all existing IDs and add these IDs near the existing result/setup IDs:

```javascript
"root-studio-workspace", "root-method-rail", "root-setup-card", "root-evidence-stack", "root-evidence-heading",
```

- [ ] **Step 2: Add runtime assertions for preserved answer-first behavior**

After the first successful Bisection run assertions, add:

```javascript
assert.ok(
  ROOTS_HTML.includes("root-studio-workspace"),
  "Academic Studio workspace should exist in the standalone Roots HTML"
);
assert.ok(
  ROOTS_HTML.includes("root-method-rail"),
  "Academic Studio method rail should exist in the standalone Roots HTML"
);
assert.ok(
  ROOTS_HTML.includes("root-setup-card"),
  "Academic Studio setup card should exist in the standalone Roots HTML"
);
assert.ok(
  ROOTS_HTML.includes("root-evidence-stack"),
  "Academic Studio evidence stack should exist in the standalone Roots HTML"
);
assert.strictEqual(
  document.elements["root-evidence-heading"].textContent || "Evidence",
  "Evidence"
);
```

- [ ] **Step 3: Run UI audit and verify it fails**

Run:

```powershell
node scripts/roots-mini-app-ui-audit.js
```

Expected: FAIL because the new layout hooks do not exist yet.

- [ ] **Step 4: Commit the failing runtime audit**

Run:

```powershell
git add scripts/roots-mini-app-ui-audit.js
git commit -m "test: add roots academic studio ui audit"
```

Expected: commit succeeds with only `scripts/roots-mini-app-ui-audit.js` staged.

---

### Task 3: Restructure Roots HTML Into Academic Studio Layout

**Files:**
- Modify: `roots/index.html`
- Test: `scripts/roots-mini-app-static-audit.js`, `scripts/roots-mini-app-ui-audit.js`

- [ ] **Step 1: Replace the current hero and quick-start block with Academic Studio hero markup**

Replace the `div.module-header.roots-guided-hero` and the following `section.root-start-guide` with:

```html
      <div class="module-header roots-guided-hero roots-studio-hero">
        <div class="root-academic-paper root-studio-title-card">
          <p class="eyebrow">Module IV · Roots</p>
          <h1>Guided Solver Studio</h1>
          <p class="module-subtitle">Fast quiz answers with enough explanation to show your work.</p>
        </div>
        <div class="root-hero-card root-studio-workflow" role="note" aria-label="Guided solver priorities">
          <span class="root-hero-kicker">Quick workflow</span>
          <strong>Pick method. Enter values. Run. Copy answer.</strong>
          <p>Method guidance stays visible, while tables and diagnostics stay available below the answer.</p>
        </div>
      </div>
```

- [ ] **Step 2: Wrap method selector, guide, inputs, and results in a studio workspace**

Insert this opening wrapper immediately before the method `nav`:

```html
      <div id="root-studio-workspace" class="roots-studio-workspace">
        <aside id="root-method-rail" class="root-method-rail root-academic-paper" aria-label="Root method selection">
          <p class="result-label">Method</p>
```

Move the existing `nav.root-method-tabs` inside this `aside`, then keep `section#root-method-guide` immediately after the `nav` inside the same `aside`. Close the `aside` after `section#root-method-guide`:

```html
        </aside>
        <div class="root-studio-main">
```

Close `div.root-studio-main` and `div.roots-studio-workspace` immediately before the closing `</section>` for `.module-root`.

- [ ] **Step 3: Wrap all method input panels in a setup card**

Insert this opening block immediately before `section#root-inputs-bisection`:

```html
          <section id="root-setup-card" class="root-setup-card root-academic-paper" aria-label="Problem setup">
            <div class="root-section-heading">
              <p class="result-label">1 · Problem setup</p>
              <h2>Enter the function and method values</h2>
              <p>Use the active method panel below. Press the equals button to run the solver.</p>
            </div>
```

Close this setup card immediately after `section#root-inputs-fixedpoint`:

```html
          </section>
```

- [ ] **Step 4: Add the answer card hook to the quiz answer panel**

Change:

```html
        <section id="root-quiz-answer" class="root-quiz-answer" aria-label="Quiz-ready answer">
```

to:

```html
        <section id="root-quiz-answer" class="root-quiz-answer root-answer-card" aria-label="Quiz-ready answer">
```

- [ ] **Step 5: Wrap diagnostics, graph, solution, and table in an evidence stack**

Inside `section#root-result-stage`, after `section#root-quiz-answer`, wrap the existing diagnostics, bracket panel, graph, rate summary, solution panel, and iteration table with:

```html
        <section id="root-evidence-stack" class="root-evidence-stack root-academic-paper" aria-label="Evidence and solution trace">
          <div class="root-section-heading">
            <p class="result-label">3 · Evidence</p>
            <h2 id="root-evidence-heading">Evidence</h2>
            <p>Use these details when you need diagnostics, graph behavior, solution steps, or the full iteration table.</p>
          </div>
```

Close the evidence stack after the iteration table wrapper:

```html
        </section>
```

- [ ] **Step 6: Run audits and verify HTML still needs CSS**

Run:

```powershell
node scripts/roots-mini-app-static-audit.js
node scripts/roots-mini-app-ui-audit.js
```

Expected: UI audit passes or only fails for CSS-hook-specific static checks. Static audit still fails until Task 4 adds CSS selectors.

- [ ] **Step 7: Commit HTML restructure**

Run:

```powershell
git add roots/index.html
git commit -m "feat: structure roots academic studio layout"
```

Expected: commit succeeds with only `roots/index.html` staged.

---

### Task 4: Implement Academic Studio CSS System

**Files:**
- Modify: `roots/roots.css`
- Test: `scripts/roots-mini-app-static-audit.js`, `scripts/roots-mini-app-ui-audit.js`

- [ ] **Step 1: Add Academic Studio design tokens and page background**

At the top of `roots/roots.css`, replace the current `.roots-standalone` block with:

```css
.roots-standalone {
  --root-paper: #fff8e8;
  --root-paper-strong: #f3e4bd;
  --root-ink: #24321d;
  --root-ink-soft: #44543a;
  --root-sage: #dfeedd;
  --root-sage-line: #b9cda9;
  --root-gold-line: #d8c58f;
  --root-shadow: 0 24px 70px rgba(54, 45, 25, 0.16);
  min-height: 100vh;
  background:
    radial-gradient(circle at 12% 0%, rgba(218, 197, 143, 0.36), transparent 34%),
    radial-gradient(circle at 88% 12%, rgba(185, 205, 169, 0.42), transparent 30%),
    linear-gradient(135deg, #f8f0df 0%, #edf5e8 100%);
}
```

- [ ] **Step 2: Add paper, hero, and workspace layout CSS**

Add after `.roots-toolbar`:

```css
.root-academic-paper {
  border: 1px solid var(--root-gold-line);
  border-radius: calc(var(--radius) + 6px);
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.46), rgba(255, 255, 255, 0)),
    var(--root-paper);
  box-shadow: 0 1px 0 rgba(255, 255, 255, 0.72) inset;
}

.roots-studio-hero {
  grid-template-columns: minmax(0, 1.2fr) minmax(260px, 0.8fr);
  padding: 0;
  border: 0;
  background: transparent;
}

.root-studio-title-card,
.root-studio-workflow {
  padding: clamp(1.25rem, 3vw, 2rem);
}

.root-studio-title-card h1 {
  max-width: 12ch;
  color: var(--root-ink);
  font-size: clamp(2.4rem, 7vw, 5rem);
  line-height: 0.94;
  letter-spacing: -0.06em;
}

.root-studio-workflow {
  color: var(--root-paper);
  border-color: rgba(36, 50, 29, 0.24);
  background:
    radial-gradient(circle at 85% 10%, rgba(223, 238, 221, 0.22), transparent 38%),
    var(--root-ink);
  box-shadow: var(--root-shadow);
}

.root-studio-workflow strong,
.root-studio-workflow p {
  color: inherit;
}

.roots-studio-workspace {
  display: grid;
  grid-template-columns: minmax(230px, 0.34fr) minmax(0, 1fr);
  gap: var(--space-4);
  align-items: start;
  margin-top: var(--space-4);
}

.root-method-rail {
  position: sticky;
  top: 16px;
  display: grid;
  gap: var(--space-3);
  padding: var(--space-3);
}

.root-studio-main {
  display: grid;
  gap: var(--space-4);
  min-width: 0;
}
```

- [ ] **Step 3: Convert method tabs into a vertical rail**

Add after the existing `.root-method-guide` styles:

```css
.root-method-rail .root-method-tabs {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-2);
  margin: 0;
}

.root-method-rail .root-method-tab {
  justify-content: flex-start;
  min-height: 48px;
  border-color: transparent;
  background: color-mix(in srgb, var(--root-paper-strong) 72%, white);
  color: var(--root-ink-soft);
}

.root-method-rail .root-method-tab.active {
  color: var(--root-paper);
  background: var(--root-ink);
  box-shadow: 0 12px 30px rgba(36, 50, 29, 0.2);
}

.root-method-rail .root-method-guide {
  grid-template-columns: 1fr;
  margin: 0;
  padding: var(--space-3);
  border-color: var(--root-sage-line);
  background: var(--root-sage);
}
```

- [ ] **Step 4: Style setup, answer, and evidence sections**

Add after `.module-root .root-config-grid`:

```css
.root-section-heading {
  display: grid;
  gap: var(--space-1);
  margin-bottom: var(--space-3);
}

.root-section-heading h2 {
  margin: 0;
  color: var(--root-ink);
  font-size: clamp(1.25rem, 2.8vw, 1.9rem);
  letter-spacing: -0.03em;
}

.root-section-heading p {
  margin: 0;
  color: var(--text-subtle);
  line-height: 1.5;
}

.root-setup-card,
.root-evidence-stack {
  padding: clamp(1rem, 2.4vw, 1.5rem);
}

.root-setup-card .calculator-band {
  border-color: rgba(216, 197, 143, 0.76);
  background: rgba(255, 255, 255, 0.42);
}

.root-answer-card {
  border: 0;
  color: var(--root-paper);
  background:
    radial-gradient(circle at 90% 0%, rgba(223, 238, 221, 0.22), transparent 34%),
    var(--root-ink);
  box-shadow: var(--root-shadow);
}

.root-answer-card .root-answer-main,
.root-answer-card .root-result-insight,
.root-answer-card .root-answer-guidance > div {
  border-color: rgba(255, 248, 232, 0.18);
  background: rgba(255, 248, 232, 0.08);
}

.root-answer-card .result-label,
.root-answer-card .answer-value,
.root-answer-card strong,
.root-answer-card p {
  color: inherit;
}

.root-answer-card .result-label {
  color: color-mix(in srgb, var(--root-sage) 84%, white);
}

.root-answer-card #root-approx {
  color: #fff8e8;
  text-shadow: 0 1px 0 rgba(0, 0, 0, 0.16);
}

.root-evidence-stack {
  display: grid;
  gap: var(--space-4);
}
```

- [ ] **Step 5: Add responsive collapse rules**

Inside the existing `@media (max-width: 768px)` block, add:

```css
  .roots-studio-hero,
  .roots-studio-workspace {
    grid-template-columns: 1fr;
  }

  .root-method-rail {
    position: static;
  }

  .root-method-rail .root-method-tabs {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .root-studio-title-card h1 {
    max-width: none;
  }
```

Inside the existing smallest-width media block, add:

```css
  .root-method-rail .root-method-tabs {
    grid-template-columns: 1fr;
  }
```

- [ ] **Step 6: Run audits and verify they pass**

Run:

```powershell
node scripts/roots-mini-app-static-audit.js
node scripts/roots-mini-app-ui-audit.js
```

Expected: both audits pass.

- [ ] **Step 7: Commit CSS implementation**

Run:

```powershell
git add roots/roots.css
git commit -m "feat: style roots academic studio"
```

Expected: commit succeeds with only `roots/roots.css` staged.

---

### Task 5: Polish Result Rendering and Evidence Copy

**Files:**
- Modify: `roots/roots-render.js`
- Test: `scripts/roots-mini-app-ui-audit.js`

- [ ] **Step 1: Strengthen evidence language in solution copy output**

In `buildCopyText(run)`, keep existing numerical values and replace only section headings with this sequence:

```javascript
const lines = [
  "Quiz-ready answer",
  "Approximate root: " + (run.rootDisplay || "N/A"),
  "Method: " + methodLabel,
  "Stopping result: " + stoppingResult,
  "Stopping parameters: " + convergence,
  "Final metric: " + finalMetric,
  "",
  "Interpretation",
  interpretation,
  "",
  "Next action",
  nextAction,
  "",
  "Evidence",
  ...solutionSteps
];
```

If the current implementation builds this array differently, preserve the same data sources and use the exact heading strings above.

- [ ] **Step 2: Add UI audit assertion for evidence heading in copied solution**

In `scripts/roots-mini-app-ui-audit.js`, after `click(document.elements["root-copy-solution"]);`, add:

```javascript
assert.ok(clipboard.text.includes("Quiz-ready answer"), "copied solution should start with quiz-ready answer");
assert.ok(clipboard.text.includes("Evidence"), "copied solution should include evidence section");
```

- [ ] **Step 3: Run UI audit**

Run:

```powershell
node scripts/roots-mini-app-ui-audit.js
```

Expected: PASS.

- [ ] **Step 4: Commit rendering polish**

Run:

```powershell
git add roots/roots-render.js scripts/roots-mini-app-ui-audit.js
git commit -m "fix: align roots answer copy with academic studio"
```

Expected: commit succeeds with only the render file and UI audit staged.

---

### Task 6: Full Roots Verification and Browser Smoke

**Files:**
- No planned source changes unless verification exposes a bug.
- Test: Roots audit battery and live browser smoke.

- [ ] **Step 1: Run Roots verification commands**

Run:

```powershell
node scripts/roots-mini-app-static-audit.js
node scripts/roots-mini-app-ui-audit.js
node scripts/roots-fast-lane-audit.js
```

Expected: all commands pass.

- [ ] **Step 2: Run engine safety audits only if numerical/request files changed**

If `git diff --name-only HEAD~5..HEAD` includes `root-engine.js`, `math-engine.js`, `calc-engine.js`, `expression-engine.js`, or `roots/roots-engine-adapter.js`, run:

```powershell
node scripts/root-engine-audit.js
node scripts/engine-correctness-audit.js
```

Expected: both commands pass. If none of those files changed, record that engine audits were not required because the change was UI-only.

- [ ] **Step 3: Start local static server**

Run:

```powershell
python -m http.server 7432
```

Expected: server listens on `http://127.0.0.1:7432/`.

- [ ] **Step 4: Smoke test Bisection in browser**

Open:

```text
http://127.0.0.1:7432/roots/index.html
```

Use these values:

```text
Function f(x): x^2 - 2
Left endpoint a: 1
Right endpoint b: 2
Stopping mode: Given iterations n
Stopping value: 4
Machine rule: Rounding
```

Click Run Bisection.

Expected:

```text
Approximate root: 1.4375
Method: Bisection
Stopping result: Completed the requested iterations
Final metric includes epsilon <= 0.0625 or final error information
Evidence section remains visible below the answer
Solution steps and iteration table render
```

- [ ] **Step 5: Commit any verification fix**

If a bug is found and fixed, run:

```powershell
git add roots/index.html roots/roots.css roots/roots-render.js scripts/roots-mini-app-static-audit.js scripts/roots-mini-app-ui-audit.js
git commit -m "fix: polish roots academic studio verification"
```

Expected: commit includes only files changed for the verification fix. If no fix is needed, do not create a commit.

---

## Self-Review Checklist

- Spec coverage: Tasks cover Roots-only scope, single-screen layout, Academic Studio visual system, answer-first result, evidence sections, responsive behavior, accessibility-preserving tab/panel structure, audits, and live smoke testing.
- Placeholder scan: This plan has complete file paths, concrete checks, and specified tests.
- Boundary check: No task edits `root-engine.js`, main `index.html`, main `app.js`, global `styles.css`, or companion site files.
- Test design: Audits fail before implementation, pass after implementation, and browser smoke verifies the quiz-critical Bisection path.
