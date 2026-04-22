# Roots NET Shell Brand Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Reframe the standalone Roots mini app inside a branded NET+ shell that owns navigation and utilities while preserving the current fast solver workflow.

**Architecture:** This is a Roots-only shell refactor. `roots/index.html` will replace the loose top toolbar and method-side rail with a true NET shell rail plus a solver-first workspace, `roots/roots-app.js` will add minimal in-page section navigation for existing sections, and `roots/roots.css` will restyle the page around the brand kit without changing numerical behavior. The audits are updated first so the shell contract is enforced before the UI implementation starts.

**Tech Stack:** Static HTML, vanilla JavaScript IIFEs, CSS, Node-based audit scripts, local static server for browser smoke testing.

---

## File Structure

- Modify `scripts/roots-mini-app-static-audit.js`: replace the Academic Studio-only shell assertions with NET shell assertions for the new rail, shell header utilities, and section navigation targets.
- Modify `scripts/roots-mini-app-ui-audit.js`: add fake-DOM coverage for shell navigation buttons, focus/scroll behavior, and preserved angle-toggle behavior after controls move into the shell.
- Modify `roots/index.html`: remove the loose `roots-toolbar`, add the NET shell rail and shell header, move method tabs into a workspace `Methods` section, and keep the existing setup, answer, and evidence sections intact.
- Modify `roots/roots-app.js`: add `wireShellNavigation()` for the real in-page rail and keep method switching / angle mode / copy solution behavior intact.
- Modify `roots/roots.css`: replace the current Academic Studio page framing with a NET-branded shell, including dark rail surfaces, serif-led hierarchy, calmer workspace cards, and responsive collapse rules.
- Do not modify `root-engine.js`, `roots/roots-engine-adapter.js`, main `index.html`, main `app.js`, or global `styles.css`.
- Do not modify `roots/roots-render.js` unless implementation exposes a shell-label bug during verification.

---

### Task 1: Add Failing Static Audit For The NET Shell Contract

**Files:**
- Modify: `scripts/roots-mini-app-static-audit.js`
- Test: `scripts/roots-mini-app-static-audit.js`

- [ ] **Step 1: Add helpers for the NET shell layout and CSS hooks**

Add these helpers after `hasAcademicStudioCss(source)`:

```javascript
function hasNetShellLayout(source) {
  const shellHtml = getElementHtmlByClass(source, "div", "roots-net-layout");
  const railHtml = getElementHtmlByClass(source, "nav", "root-shell-rail");
  const headerHtml = getElementHtmlByClass(source, "header", "root-shell-header");
  const methodsHtml = getElementHtmlById(source, "section", "root-method-section");
  const setupHtml = getElementHtmlById(source, "section", "root-setup-card");
  const answerHtml = getElementHtmlById(source, "section", "root-quiz-answer");
  const evidenceHtml = getElementHtmlById(source, "section", "root-evidence-stack");
  const railText = normalizedText(railHtml);
  const headerText = normalizedText(headerHtml);
  const methodsText = normalizedText(methodsHtml);

  return Boolean(shellHtml) &&
    Boolean(railHtml) &&
    Boolean(headerHtml) &&
    Boolean(methodsHtml) &&
    Boolean(setupHtml) &&
    Boolean(answerHtml) &&
    Boolean(evidenceHtml) &&
    railText.includes("NET+") &&
    railText.includes("Methods") &&
    railText.includes("Problem Setup") &&
    railText.includes("Quiz Answer") &&
    railText.includes("Evidence") &&
    headerText.includes("Back to calculator") &&
    headerText.includes("Angle") &&
    headerText.includes("Use radians") &&
    methodsText.includes("Methods") &&
    methodsText.includes("Choose the root-finding method that fits the prompt");
}

function hasNetShellUtilities(source) {
  return /class="root-shell-header"/.test(source) &&
    /id="status-angle"/.test(source) &&
    /id="angle-toggle"/.test(source) &&
    /href="\.\.\/index\.html"/.test(source) &&
    !/class="roots-toolbar"/.test(source);
}

function hasNetShellCss(source) {
  return [
    ".roots-net-layout",
    ".root-shell-rail",
    ".root-shell-brand",
    ".root-shell-links",
    ".root-shell-link",
    ".root-shell-header",
    ".root-shell-utilities",
    ".root-method-section"
  ].every((selector) => source.includes(selector));
}
```

- [ ] **Step 2: Replace the old shell checks with NET shell checks**

Replace the current `Academic Studio layout is present` check with:

```javascript
check(
  "NET shell layout is present",
  "shell rail, shell header, methods section, setup card, quiz answer, and evidence stack",
  hasNetShellLayout(html) ? "present" : "missing",
  hasNetShellLayout(html)
);
```

Replace the current `Standalone entry includes local shell controls` check with:

```javascript
check(
  "Standalone entry moves shell controls into the NET shell",
  "root-shell-header owns Back to calculator, status-angle, and angle-toggle; legacy roots-toolbar removed",
  hasNetShellUtilities(html) ? "shell utilities present" : "shell utilities missing",
  hasNetShellUtilities(html)
);
```

Replace the current `Academic Studio CSS hooks are present` check with:

```javascript
check(
  "NET shell CSS hooks are present",
  ".roots-net-layout, .root-shell-rail, .root-shell-brand, .root-shell-links, .root-shell-link, .root-shell-header, .root-shell-utilities, .root-method-section",
  hasNetShellCss(rootsCss) ? "present" : "missing",
  hasNetShellCss(rootsCss)
);
```

- [ ] **Step 3: Run the static audit and verify it fails**

Run:

```powershell
node scripts/roots-mini-app-static-audit.js
```

Expected: FAIL for the new NET shell layout, shell utilities, and CSS-hook checks because the current page still uses `roots-toolbar` and the method rail is not yet a branded shell rail.

- [ ] **Step 4: Commit the failing static audit**

Run:

```powershell
git add scripts/roots-mini-app-static-audit.js
git commit -m "test: add roots net shell static audit"
```

Expected: commit succeeds with only `scripts/roots-mini-app-static-audit.js` staged.

---

### Task 2: Add Failing Runtime Audit Coverage For Rail Navigation

**Files:**
- Modify: `scripts/roots-mini-app-ui-audit.js`
- Test: `scripts/roots-mini-app-ui-audit.js`

- [ ] **Step 1: Extend the fake DOM with NET shell IDs and scroll tracking**

In `IDS`, replace the old method-rail ID entry with these NET shell IDs:

```javascript
"root-shell-rail", "root-shell-header",
"root-shell-methods-link", "root-shell-setup-link", "root-shell-answer-link", "root-shell-evidence-link",
"root-method-section", "root-studio-workspace", "root-setup-card", "root-evidence-stack", "root-evidence-heading",
```

In `FakeElement`, add scroll/focus tracking:

```javascript
class FakeElement {
  constructor(tagName, id) {
    this.tagName = tagName;
    this.id = id || "";
    this.value = valueFor(id || "");
    this.hidden = /\shidden(?:\s|>)/i.test(attrsFor(id || ""));
    this.textContent = "";
    this.innerHTML = "";
    this.children = [];
    this.dataset = datasetFrom(attrsFor(id || ""));
    this.listeners = {};
    this.attributes = {};
    this.classList = new FakeClassList();
    this.selectionStart = this.value.length;
    this.selectionEnd = this.value.length;
    this.focusCount = 0;
    this.scrollCount = 0;
  }
  focus() {
    this.focusCount += 1;
  }
  scrollIntoView() {
    this.scrollCount += 1;
  }
}
```

Update the `ensure` tag mapping so the shell link IDs are created as buttons:

```javascript
IDS.forEach((id) => ensure(
  id,
  id.includes("compute") ||
  id.includes("tab") ||
  id === "angle-toggle" ||
  id === "root-copy-solution" ||
  id.endsWith("-link")
    ? "button"
    : "div"
));
```

- [ ] **Step 2: Add failing assertions for shell navigation behavior**

After the current static HTML assertions near the first successful Bisection run, add:

```javascript
assert.ok(ROOTS_HTML.includes("root-shell-rail"), "NET shell rail should exist in the standalone Roots HTML");
assert.ok(ROOTS_HTML.includes("root-shell-header"), "NET shell header should exist in the standalone Roots HTML");
assert.ok(ROOTS_HTML.includes("root-method-section"), "Methods section should exist in the standalone Roots HTML");

click(document.elements["root-shell-answer-link"]);
assert.strictEqual(document.elements["root-quiz-answer"].scrollCount, 1, "Quiz Answer rail click should scroll to the answer section");
assert.strictEqual(document.elements["root-quiz-answer"].focusCount, 1, "Quiz Answer rail click should focus the answer section");
assert.strictEqual(document.elements["root-shell-answer-link"].getAttribute("aria-current"), "true", "Quiz Answer rail link should become current");

click(document.elements["root-shell-evidence-link"]);
assert.strictEqual(document.elements["root-evidence-stack"].scrollCount, 1, "Evidence rail click should scroll to the evidence section");
assert.strictEqual(document.elements["root-shell-evidence-link"].getAttribute("aria-current"), "true", "Evidence rail link should become current");
assert.strictEqual(document.elements["root-shell-answer-link"].getAttribute("aria-current"), "false", "Previous rail link should clear current state");
```

- [ ] **Step 3: Run the UI audit and verify it fails**

Run:

```powershell
node scripts/roots-mini-app-ui-audit.js
```

Expected: FAIL because the current HTML has no shell rail buttons and `roots-app.js` does not yet wire in-page navigation.

- [ ] **Step 4: Commit the failing UI audit**

Run:

```powershell
git add scripts/roots-mini-app-ui-audit.js
git commit -m "test: add roots net shell ui audit"
```

Expected: commit succeeds with only `scripts/roots-mini-app-ui-audit.js` staged.

---

### Task 3: Restructure `roots/index.html` Into A NET Shell With Existing-Section Navigation

**Files:**
- Modify: `roots/index.html`
- Test: `scripts/roots-mini-app-static-audit.js`, `scripts/roots-mini-app-ui-audit.js`

- [ ] **Step 1: Replace the loose toolbar with the NET shell frame**

Replace:

```html
  <main class="roots-app-shell">
    <header class="roots-toolbar">
      <a class="ghost roots-back-link" href="../index.html">Back to calculator</a>
      <div class="status-chip"><span class="status-name">Angle</span><strong id="status-angle">DEG</strong></div>
      <button id="angle-toggle" type="button" class="ghost roots-angle-btn">Use radians</button>
    </header>

    <section class="module-shell module-root roots-module-shell">
```

with:

```html
  <main class="roots-app-shell">
    <div class="roots-net-layout">
      <nav id="root-shell-rail" class="root-shell-rail" aria-label="NET section navigation">
        <div class="root-shell-brand">
          <span class="root-shell-brand-mark">NET+</span>
          <span class="root-shell-brand-copy">Numerical Exploration Toolkit</span>
        </div>
        <div class="root-shell-module">
          <p class="result-label">Module IV · Roots</p>
          <p class="root-shell-module-title">Guided Solver Studio</p>
          <p>Fast quiz answers, clear evidence, no workspace clutter.</p>
        </div>
        <div class="root-shell-links" role="group" aria-label="Roots sections">
          <button id="root-shell-methods-link" class="root-shell-link active" type="button" data-target="root-method-section" aria-current="true">Methods</button>
          <button id="root-shell-setup-link" class="root-shell-link" type="button" data-target="root-setup-card" aria-current="false">Problem Setup</button>
          <button id="root-shell-answer-link" class="root-shell-link" type="button" data-target="root-quiz-answer" aria-current="false">Quiz Answer</button>
          <button id="root-shell-evidence-link" class="root-shell-link" type="button" data-target="root-evidence-stack" aria-current="false">Evidence</button>
        </div>
      </nav>
      <div class="root-shell-stage">
        <header class="root-shell-header">
          <div class="root-shell-header-copy">
            <p class="eyebrow">NET+ workspace</p>
            <h2>Roots</h2>
          </div>
          <div class="root-shell-utilities" aria-label="Roots utilities">
            <a class="ghost roots-back-link" href="../index.html">Back to calculator</a>
            <div class="status-chip"><span class="status-name">Angle</span><strong id="status-angle">DEG</strong></div>
            <button id="angle-toggle" type="button" class="ghost roots-angle-btn">Use radians</button>
          </div>
        </header>

        <section class="module-shell module-root roots-module-shell">
```

- [ ] **Step 2: Turn the old method rail into a workspace `Methods` section**

Replace the opening of the current `root-studio-workspace` block and the `aside#root-method-rail` wrapper with:

```html
      <div id="root-studio-workspace" class="roots-studio-workspace">
        <div class="root-studio-main">
          <section id="root-method-section" class="root-method-section root-academic-paper" aria-label="Methods" tabindex="-1">
            <div class="root-section-heading">
              <p class="result-label">Methods</p>
              <h2>Choose the root-finding method that fits the prompt</h2>
              <p>Switch methods here. The active solver note updates immediately and the setup block below stays aligned with the current choice.</p>
            </div>
            <nav class="root-method-tabs" role="tablist" aria-label="Root-finding method">
```

Keep the existing method tab buttons unchanged.

After `section#root-method-guide`, close the new section instead of the old `aside`:

```html
          </section>
```

- [ ] **Step 3: Preserve the existing setup, answer, and evidence blocks as scroll targets**

Add `tabindex="-1"` to these sections so the shell rail can focus them after scrolling:

```html
<section id="root-setup-card" class="root-setup-card root-academic-paper" aria-label="Problem setup" tabindex="-1">
<section id="root-quiz-answer" class="root-quiz-answer root-answer-card" aria-label="Quiz-ready answer" tabindex="-1">
<section id="root-evidence-stack" class="root-evidence-stack root-academic-paper" aria-label="Evidence and solution trace" tabindex="-1">
```

Do not change the current solver inputs, diagnostics, answer fields, or evidence content in this task.

- [ ] **Step 4: Close the new shell stage wrappers**

Immediately before `</main>`, close the new wrappers:

```html
        </section>
      </div>
    </div>
  </main>
```

- [ ] **Step 5: Run audits and verify only CSS / JS work remains**

Run:

```powershell
node scripts/roots-mini-app-static-audit.js
node scripts/roots-mini-app-ui-audit.js
```

Expected: the HTML-based static checks should move closer to passing, but the UI audit should still fail because `roots-app.js` does not yet wire the shell buttons.

- [ ] **Step 6: Commit the shell markup refactor**

Run:

```powershell
git add roots/index.html
git commit -m "feat: restructure roots into net shell"
```

Expected: commit succeeds with only `roots/index.html` staged.

---

### Task 4: Wire Real In-Page Shell Navigation In `roots/roots-app.js`

**Files:**
- Modify: `roots/roots-app.js`
- Test: `scripts/roots-mini-app-ui-audit.js`

- [ ] **Step 1: Add a helper that keeps the shell rail current state in sync**

Add this helper after `setStatus(message)`:

```javascript
  function setCurrentShellLink(activeId) {
    [
      "root-shell-methods-link",
      "root-shell-setup-link",
      "root-shell-answer-link",
      "root-shell-evidence-link"
    ].forEach(function updateLink(id) {
      const link = byId(id);
      if (!link) return;
      const isActive = id === activeId;
      if (link.classList && link.classList.toggle) link.classList.toggle("active", isActive);
      if (link.setAttribute) link.setAttribute("aria-current", isActive ? "true" : "false");
    });
  }
```

- [ ] **Step 2: Add `wireShellNavigation()` for existing-section scrolling and focus**

Add this function after `wireCopySolution(state)`:

```javascript
  function wireShellNavigation() {
    const links = [
      { id: "root-shell-methods-link", targetId: "root-method-section" },
      { id: "root-shell-setup-link", targetId: "root-setup-card" },
      { id: "root-shell-answer-link", targetId: "root-quiz-answer" },
      { id: "root-shell-evidence-link", targetId: "root-evidence-stack" }
    ];

    links.forEach(function wireLink(item) {
      const link = byId(item.id);
      const target = byId(item.targetId);
      if (!link || !target) return;
      link.addEventListener("click", function onShellNavClick() {
        setCurrentShellLink(item.id);
        if (target.scrollIntoView) target.scrollIntoView({ block: "start", behavior: "smooth" });
        if (target.focus) target.focus();
      });
    });
  }
```

- [ ] **Step 3: Initialize shell navigation on boot**

In the `DOMContentLoaded` handler, call `wireShellNavigation()` before `wireAngleToggle(state)` and set the initial current item:

```javascript
    wireMethodControls(state);
    wireShellNavigation();
    setCurrentShellLink("root-shell-methods-link");
    wireAngleToggle(state);
```

- [ ] **Step 4: Run the UI audit and verify shell behavior passes**

Run:

```powershell
node scripts/roots-mini-app-ui-audit.js
```

Expected: PASS for the new shell link scroll/focus assertions and the preserved angle-toggle assertions.

- [ ] **Step 5: Commit the shell navigation wiring**

Run:

```powershell
git add roots/roots-app.js
git commit -m "feat: wire roots net shell navigation"
```

Expected: commit succeeds with only `roots/roots-app.js` staged.

---

### Task 5: Implement The NET+ Brand Shell In `roots/roots.css`

**Files:**
- Modify: `roots/roots.css`
- Test: `scripts/roots-mini-app-static-audit.js`, `scripts/roots-mini-app-ui-audit.js`

- [ ] **Step 1: Replace the top-level page framing with a shell layout**

Replace the current `.roots-app-shell` and `.roots-toolbar` rules near the top of the file with:

```css
.roots-app-shell {
  width: min(1400px, calc(100vw - 32px));
  margin: 0 auto;
  padding: 24px 0 48px;
}

.roots-net-layout {
  display: grid;
  grid-template-columns: minmax(220px, 260px) minmax(0, 1fr);
  gap: 20px;
  align-items: start;
}

.root-shell-stage {
  display: grid;
  gap: var(--space-4);
  min-width: 0;
}
```

- [ ] **Step 2: Add the NET rail and shell-header styles**

Add these blocks after `.root-academic-paper`:

```css
.root-shell-rail {
  position: sticky;
  top: 16px;
  display: grid;
  gap: var(--space-4);
  padding: 20px 18px;
  border: 1px solid rgba(226, 214, 186, 0.2);
  border-radius: 28px;
  background:
    radial-gradient(circle at 80% 12%, rgba(214, 184, 138, 0.12), transparent 32%),
    linear-gradient(180deg, #24391d 0%, #1e2f18 100%);
  box-shadow: 0 24px 60px rgba(17, 24, 15, 0.24);
}

.root-shell-brand {
  display: grid;
  gap: 6px;
}

.root-shell-brand-mark {
  color: #f7f4ec;
  font-family: "Freight Text Pro", "Iowan Old Style", "Times New Roman", serif;
  font-size: 2rem;
  line-height: 1;
  letter-spacing: -0.04em;
}

.root-shell-brand-copy,
.root-shell-module p,
.root-shell-module-title {
  color: #f7f4ec;
}

.root-shell-module-title {
  margin: 0;
  font-family: "Freight Text Pro", "Iowan Old Style", "Times New Roman", serif;
  font-size: 1.35rem;
  line-height: 1.1;
}

.root-shell-links {
  display: grid;
  gap: 10px;
}

.root-shell-link {
  width: 100%;
  padding: 0.85rem 1rem;
  border: 1px solid rgba(247, 244, 236, 0.12);
  border-radius: 999px;
  background: rgba(247, 244, 236, 0.06);
  color: #f7f4ec;
  text-align: left;
  font: inherit;
  cursor: pointer;
}

.root-shell-link.active,
.root-shell-link[aria-current="true"] {
  background: #efe2b7;
  color: #24391d;
  border-color: #efe2b7;
}

.root-shell-header {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-3);
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border: 1px solid rgba(36, 57, 29, 0.12);
  border-radius: 24px;
  background: rgba(255, 248, 232, 0.82);
  backdrop-filter: blur(10px);
}

.root-shell-utilities {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
}
```

- [ ] **Step 3: Convert the workspace into a single content stack and restyle the methods section**

Replace the current `roots-studio-workspace`, `root-method-rail`, and `root-studio-main` blocks with:

```css
.roots-studio-workspace {
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--space-4);
}

.root-studio-main {
  display: grid;
  gap: var(--space-4);
  min-width: 0;
}

.root-method-section {
  display: grid;
  gap: var(--space-3);
  padding: clamp(1rem, 2.4vw, 1.5rem);
}

.root-method-section .root-method-tabs {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: var(--space-2);
  margin: 0;
}

.root-method-section .root-method-guide {
  grid-template-columns: minmax(0, 1fr) minmax(260px, 0.8fr);
  margin: 0;
  padding: var(--space-3);
  border-color: rgba(139, 123, 90, 0.2);
  background: rgba(239, 226, 183, 0.24);
}
```

- [ ] **Step 4: Tune the hero and answer blocks to match the brand kit without changing their content order**

Replace the current `.roots-studio-hero` and `.root-studio-workflow` styling with:

```css
.roots-studio-hero {
  grid-template-columns: minmax(0, 1.15fr) minmax(280px, 0.85fr);
  gap: var(--space-4);
  padding: 0;
  border: 0;
  background: transparent;
}

.root-studio-title-card {
  padding: clamp(1.5rem, 3vw, 2.2rem);
}

.root-studio-title-card h1 {
  max-width: 12ch;
  color: #24391d;
  font-family: "Freight Text Pro", "Iowan Old Style", "Times New Roman", serif;
  font-size: clamp(2.6rem, 6vw, 4.8rem);
  line-height: 0.95;
  letter-spacing: -0.05em;
}

.root-studio-workflow {
  color: #f7f4ec;
  border-color: rgba(36, 57, 29, 0.24);
  background:
    radial-gradient(circle at 82% 18%, rgba(214, 184, 138, 0.16), transparent 34%),
    linear-gradient(180deg, #24391d 0%, #1f3118 100%);
  box-shadow: var(--root-shadow);
}

.root-answer-card {
  border: 0;
  color: #f7f4ec;
  background:
    radial-gradient(circle at 92% 10%, rgba(214, 184, 138, 0.18), transparent 28%),
    linear-gradient(180deg, #24391d 0%, #1f3118 100%);
  box-shadow: var(--root-shadow);
}
```

- [ ] **Step 5: Add responsive collapse rules for the new shell**

Inside `@media (max-width: 768px)`, add:

```css
  .roots-net-layout,
  .roots-studio-hero {
    grid-template-columns: 1fr;
  }

  .root-shell-rail {
    position: static;
  }

  .root-shell-header,
  .root-shell-utilities {
    flex-direction: column;
    align-items: stretch;
  }

  .root-method-section .root-method-guide,
  .root-answer-context,
  .root-answer-guidance {
    grid-template-columns: 1fr;
  }
```

Inside `@media (max-width: 720px)`, add:

```css
  .root-method-section .root-method-tabs {
    grid-template-columns: 1fr;
  }

  .root-shell-link {
    border-radius: 18px;
  }
```

- [ ] **Step 6: Run static and UI audits**

Run:

```powershell
node scripts/roots-mini-app-static-audit.js
node scripts/roots-mini-app-ui-audit.js
```

Expected: both audits pass after the new selectors, shell utilities, and rail wiring are in place.

- [ ] **Step 7: Commit the brand shell styling**

Run:

```powershell
git add roots/roots.css
git commit -m "feat: apply net shell brand styling to roots"
```

Expected: commit succeeds with only `roots/roots.css` staged.

---

### Task 6: Verify The Roots Fast Lane Still Works

**Files:**
- No planned source changes unless verification exposes a bug
- Test: `scripts/roots-mini-app-static-audit.js`, `scripts/roots-mini-app-ui-audit.js`, `scripts/roots-fast-lane-audit.js`

- [ ] **Step 1: Run the Roots audit battery**

Run:

```powershell
node scripts/roots-mini-app-static-audit.js
node scripts/roots-mini-app-ui-audit.js
node scripts/roots-fast-lane-audit.js
```

Expected: all three commands pass.

- [ ] **Step 2: Start a local static server**

Run:

```powershell
python -m http.server 7432
```

Expected: server listens on `http://127.0.0.1:7432/`.

- [ ] **Step 3: Smoke test shell controls and Bisection**

Open:

```text
http://127.0.0.1:7432/roots/index.html
```

Verify these shell behaviors first:

```text
Click Methods -> focus lands on the Methods section
Click Problem Setup -> focus lands on the setup card
Click Quiz Answer -> focus lands on the answer card
Click Evidence -> focus lands on the evidence stack
Back to calculator still links to ../index.html
Angle chip starts at DEG
Angle toggle flips to RAD and button text changes to Use degrees
```

Then run:

```text
Function f(x): x^2 - 2
Left endpoint a: 1
Right endpoint b: 2
Stopping mode: Given iterations n
Stopping value: 4
Machine rule: Rounding
```

Expected:

```text
Approximate root: 1.4375
Method: Bisection
The answer card remains dominant
Interpretation and Next action remain visible above Evidence
Diagnostics, graph, solution steps, and iteration table still render below
```

- [ ] **Step 4: Run engine audits only if a non-UI file changed**

If `git diff --name-only HEAD~6..HEAD` includes `root-engine.js`, `math-engine.js`, `calc-engine.js`, `expression-engine.js`, or `roots/roots-engine-adapter.js`, run:

```powershell
node scripts/root-engine-audit.js
node scripts/engine-correctness-audit.js
```

Expected: both commands pass. If none of those files changed, record that engine audits were not required because the pass stayed inside Roots shell HTML/CSS/JS plus audits.

- [ ] **Step 5: Commit any verification fix**

If verification exposes a bug and a fix is required, run:

```powershell
git add roots/index.html roots/roots.css roots/roots-app.js scripts/roots-mini-app-static-audit.js scripts/roots-mini-app-ui-audit.js
git commit -m "fix: polish roots net shell verification"
```

Expected: commit includes only the files changed for the verification fix. If no fix is needed, do not create a commit.

---

## Self-Review Checklist

- Spec coverage: Tasks cover the NET+ brand block, real shell rail, shell-owned Back / Angle / radians toggle, existing-section navigation only, preserved solver-first content order, no fake product features, responsive behavior, and required audits plus live smoke testing.
- Placeholder scan: The plan uses concrete selectors, IDs, copy, commands, and expected outcomes. There are no `TODO`, `TBD`, or “implement later” placeholders.
- Type consistency: The plan consistently uses `root-shell-rail`, `root-shell-header`, `root-shell-methods-link`, `root-shell-setup-link`, `root-shell-answer-link`, `root-shell-evidence-link`, and `root-method-section` across HTML, JS, CSS, and audit tasks.
