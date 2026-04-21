# Roots Phase 2 Fast Lane And UX Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a documented AI fast lane for Roots work, then polish the standalone Roots workbench without changing numerical behavior.

**Architecture:** Phase 2 keeps the Phase 1 boundary intact: the main calculator remains a bridge, Roots UI work stays in `roots/`, and numerical behavior stays in `root-engine.js`. The first tasks add routing docs and audit coverage so later UI polish can be made with small, focused context.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript IIFEs, Node-based audit scripts, no framework and no build step.

---

## File Structure

- Create: `docs/roots-ai-fast-lane.md`
  - AI-facing routing guide for future Roots tasks.
- Modify/Create: `AGENTS.md`
  - Repository-level agent instructions with an updated Roots fast-lane section.
- Modify: `README.md`
  - Short pointer to the Roots context docs and fast-lane guide.
- Create: `scripts/roots-fast-lane-audit.js`
  - Lightweight docs audit that verifies routing docs mention the required files and commands.
- Modify: `scripts/roots-mini-app-static-audit.js`
  - Adds static checks for the UX polish landmarks.
- Modify: `roots/index.html`
  - Adds first-run guide copy, method category cues, and clearer empty-state/result structure.
- Modify: `roots/roots.css`
  - Adds responsive, accessible layout polish for the new Roots UI landmarks.
- Optional Modify: `roots/roots-render.js`
  - Only if the result hierarchy needs a rendering hook that cannot be handled by markup/CSS.

## Task 1: Add Roots AI Fast Lane Docs

**Files:**
- Create: `docs/roots-ai-fast-lane.md`
- Modify/Create: `AGENTS.md`
- Modify: `README.md`
- Create: `scripts/roots-fast-lane-audit.js`

- [ ] **Step 1: Confirm current docs state**

Run:

```powershell
Test-Path docs/roots-ai-fast-lane.md
Test-Path AGENTS.md
Select-String -Path README.md -Pattern 'roots-ai-fast-lane|roots-context' -Quiet
```

Expected before implementation:

```text
False
True
False
```

If `AGENTS.md` does not exist in a fresh checkout, the implementation should create it with the content in Step 3.

- [ ] **Step 2: Create `docs/roots-ai-fast-lane.md`**

Create the file with this content:

````md
# Roots AI Fast Lane

Use this file before editing Roots. The goal is to keep AI context small and avoid touching the main calculator unless the request explicitly crosses that boundary.

## Start Here

1. Read `docs/roots-context.md`.
2. Pick one route below.
3. Read only the files listed for that route.
4. Run the matching audits before finishing.

## Routes

### Roots UI, Copy, Or Styling

Read:

- `docs/roots-context.md`
- `docs/roots-ai-fast-lane.md`
- `roots/index.html`
- `roots/roots.css`

Do not edit `index.html`, `app.js`, or `styles.css` for ordinary Roots mini-app UI work.

Run:

```powershell
node scripts/roots-mini-app-static-audit.js
node scripts/roots-mini-app-ui-audit.js
```

### Roots Interaction Wiring

Read:

- `docs/roots-context.md`
- `roots/roots-app.js`
- `roots/roots-state.js`
- `roots/index.html`

Run:

```powershell
node scripts/roots-mini-app-ui-audit.js
node scripts/roots-mini-app-static-audit.js
```

### Roots Rendering

Read:

- `docs/roots-context.md`
- `roots/roots-render.js`
- `roots/roots-state.js`
- `roots/index.html`

Run:

```powershell
node scripts/roots-mini-app-ui-audit.js
```

### Roots Adapter Or Request Packaging

Read:

- `docs/roots-context.md`
- `roots/roots-engine-adapter.js`
- `roots/roots-state.js`
- `root-engine.js` only for public API names and expected option fields

Run:

```powershell
node scripts/root-engine-audit.js
node scripts/roots-mini-app-ui-audit.js
```

### Roots Numerical Behavior

Read:

- `docs/roots-context.md`
- `root-engine.js`
- `scripts/root-engine-audit.js`
- `scripts/engine-correctness-audit.js` when expression or arithmetic behavior changes

Run:

```powershell
node scripts/engine-correctness-audit.js
node scripts/root-engine-audit.js
```

### Main Calculator Roots Bridge

Read:

- `index.html`
- `app.js`
- `styles.css`
- `scripts/roots-mini-app-static-audit.js`

Run:

```powershell
node scripts/roots-mini-app-static-audit.js
node scripts/engine-correctness-audit.js
```

## Boundary Rule

If a request does not fit one route, ask one short clarification before reading broad context. If a change crosses from `roots/` into the main calculator, name that boundary crossing before editing.

## Full Verification

Use this when a task is broad or uncertain:

```powershell
node scripts/engine-correctness-audit.js
node scripts/root-engine-audit.js
node scripts/roots-mini-app-static-audit.js
node scripts/roots-mini-app-ui-audit.js
```
````

- [ ] **Step 3: Update `AGENTS.md` with current Roots architecture and fast-lane rules**

If `AGENTS.md` already exists, update its Roots-related sections so it no longer says `root-ui.js` is active. Add this section near the top, after the project overview:

```md
## Roots Fast Lane

Roots UI work should start with `docs/roots-context.md` and `docs/roots-ai-fast-lane.md`.

Current Roots architecture:

| File | Responsibility |
|------|---------------|
| `root-engine.js` | Root-finding numerical core: bisection, Newton, secant, false position, fixed point |
| `roots/index.html` | Standalone Roots shell and markup |
| `roots/roots-app.js` | Roots DOM events, angle toggle, symbols, compute orchestration |
| `roots/roots-state.js` | Active method, cached runs, angle mode, default state |
| `roots/roots-render.js` | Result cards, diagnostics, graph, solution steps, tables |
| `roots/roots-engine-adapter.js` | Maps UI fields to `RootEngine` calls |
| `roots/roots.css` | Roots-only styling |
| `index.html` | Main calculator shell; the Roots tab is only a bridge to `roots/index.html` |

`root-ui.js` has been removed. The main calculator no longer loads `root-engine.js` or `root-ui.js`.

For ordinary Roots UI/copy/style work, do not edit `index.html`, `app.js`, or `styles.css`. Use the route table in `docs/roots-ai-fast-lane.md`.
```

Keep the existing test battery section, but add these two lines if missing:

```md
- `node scripts/roots-mini-app-static-audit.js` — Roots entry-point, bridge, and static UI audit
- `node scripts/roots-mini-app-ui-audit.js` — standalone Roots wiring audit
```

- [ ] **Step 4: Add a README pointer**

Under `## Project layout`, add these bullets after `docs/superpowers/specs/` and `docs/superpowers/plans/`:

```md
- `docs/roots-context.md` - compact Roots file map and edit boundaries for AI-assisted work
- `docs/roots-ai-fast-lane.md` - routing guide for low-context Roots edits
```

- [ ] **Step 5: Create `scripts/roots-fast-lane-audit.js`**

Create the file with this content:

```js
"use strict";

const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const requiredFiles = {
  "docs/roots-ai-fast-lane.md": fs.readFileSync(path.join(ROOT, "docs", "roots-ai-fast-lane.md"), "utf8"),
  "docs/roots-context.md": fs.readFileSync(path.join(ROOT, "docs", "roots-context.md"), "utf8"),
  "AGENTS.md": fs.readFileSync(path.join(ROOT, "AGENTS.md"), "utf8"),
  "README.md": fs.readFileSync(path.join(ROOT, "README.md"), "utf8")
};

function check(name, expected, actual, passed) {
  console.log(`[${passed ? "PASS" : "FAIL"}] ${name}`);
  console.log(`  Expected: ${expected}`);
  console.log(`  Actual:   ${actual}`);
  console.log("");
  if (!passed) process.exitCode = 1;
}

function includesAll(text, values) {
  return values.every((value) => text.includes(value));
}

const fastLane = requiredFiles["docs/roots-ai-fast-lane.md"];
const context = requiredFiles["docs/roots-context.md"];
const agents = requiredFiles["AGENTS.md"];
const readme = requiredFiles["README.md"];

check(
  "Fast lane names the compact context docs",
  "docs/roots-context.md and docs/roots-ai-fast-lane.md",
  includesAll(fastLane, ["docs/roots-context.md", "docs/roots-ai-fast-lane.md"]) ? "present" : "missing",
  includesAll(fastLane, ["docs/roots-context.md", "docs/roots-ai-fast-lane.md"])
);

check(
  "Fast lane routes ordinary Roots UI work away from main shell files",
  "do not edit index.html, app.js, or styles.css for ordinary Roots UI work",
  includesAll(fastLane, ["Do not edit `index.html`, `app.js`, or `styles.css`", "ordinary Roots mini-app UI work"]) ? "present" : "missing",
  includesAll(fastLane, ["Do not edit `index.html`, `app.js`, or `styles.css`", "ordinary Roots mini-app UI work"])
);

check(
  "Fast lane maps all critical Roots files",
  "roots app, render, state, adapter, css, root-engine",
  includesAll(fastLane, [
    "roots/index.html",
    "roots/roots-app.js",
    "roots/roots-state.js",
    "roots/roots-render.js",
    "roots/roots-engine-adapter.js",
    "roots/roots.css",
    "root-engine.js"
  ]) ? "present" : "missing",
  includesAll(fastLane, [
    "roots/index.html",
    "roots/roots-app.js",
    "roots/roots-state.js",
    "roots/roots-render.js",
    "roots/roots-engine-adapter.js",
    "roots/roots.css",
    "root-engine.js"
  ])
);

check(
  "Fast lane lists full verification commands",
  "all four Roots verification commands",
  includesAll(fastLane, [
    "node scripts/engine-correctness-audit.js",
    "node scripts/root-engine-audit.js",
    "node scripts/roots-mini-app-static-audit.js",
    "node scripts/roots-mini-app-ui-audit.js"
  ]) ? "present" : "missing",
  includesAll(fastLane, [
    "node scripts/engine-correctness-audit.js",
    "node scripts/root-engine-audit.js",
    "node scripts/roots-mini-app-static-audit.js",
    "node scripts/roots-mini-app-ui-audit.js"
  ])
);

check(
  "AGENTS.md reflects removed legacy root-ui.js",
  "root-ui.js has been removed",
  agents.includes("`root-ui.js` has been removed") ? "present" : "missing",
  agents.includes("`root-ui.js` has been removed")
);

check(
  "README points to Roots AI docs",
  "docs/roots-context.md and docs/roots-ai-fast-lane.md",
  includesAll(readme, ["docs/roots-context.md", "docs/roots-ai-fast-lane.md"]) ? "present" : "missing",
  includesAll(readme, ["docs/roots-context.md", "docs/roots-ai-fast-lane.md"])
);

check(
  "Roots context still names the main edit boundaries",
  "state, render, adapter, numerical behavior",
  includesAll(context, [
    "State, caches, and default values",
    "Render behavior",
    "Adapter and request packaging",
    "Numerical behavior"
  ]) ? "present" : "missing",
  includesAll(context, [
    "State, caches, and default values",
    "Render behavior",
    "Adapter and request packaging",
    "Numerical behavior"
  ])
);
```

- [ ] **Step 6: Run the fast-lane audit**

Run:

```powershell
node scripts/roots-fast-lane-audit.js
```

Expected:

```text
[PASS] Fast lane names the compact context docs
[PASS] Fast lane routes ordinary Roots UI work away from main shell files
[PASS] Fast lane maps all critical Roots files
[PASS] Fast lane lists full verification commands
[PASS] AGENTS.md reflects removed legacy root-ui.js
[PASS] README points to Roots AI docs
[PASS] Roots context still names the main edit boundaries
```

- [ ] **Step 7: Commit the fast-lane docs**

Run:

```bash
git add AGENTS.md README.md docs/roots-ai-fast-lane.md scripts/roots-fast-lane-audit.js
git commit -m "docs: add roots ai fast lane"
```

## Task 2: Add UX Polish Regression Checks

**Files:**
- Modify: `scripts/roots-mini-app-static-audit.js`

- [ ] **Step 1: Add static checks for the planned UX landmarks**

In `scripts/roots-mini-app-static-audit.js`, after the existing `"Standalone entry includes local shell controls"` check, add these checks:

```js
check(
  "Standalone entry includes a Roots first-run guide",
  "root-start-guide with three steps",
  /class="[^"]*root-start-guide[^"]*"/.test(html) &&
    (html.match(/class="[^"]*root-start-step[^"]*"/g) || []).length >= 3
    ? "first-run guide present"
    : "first-run guide missing",
  /class="[^"]*root-start-guide[^"]*"/.test(html) &&
    (html.match(/class="[^"]*root-start-step[^"]*"/g) || []).length >= 3
);

check(
  "Method tabs expose method categories",
  "two bracket tabs, two open tabs, one fixed-point tab",
  [
    `bracket:${(html.match(/data-method-kind="bracket"/g) || []).length}`,
    `open:${(html.match(/data-method-kind="open"/g) || []).length}`,
    `fixed-point:${(html.match(/data-method-kind="fixed-point"/g) || []).length}`
  ].join(", "),
  (html.match(/data-method-kind="bracket"/g) || []).length === 2 &&
    (html.match(/data-method-kind="open"/g) || []).length === 2 &&
    (html.match(/data-method-kind="fixed-point"/g) || []).length === 1
);

check(
  "Empty state gives a useful first action",
  "root-empty includes a short action prompt",
  /id="root-empty"[\s\S]*Pick a method[\s\S]*Run the method/.test(html)
    ? "empty prompt present"
    : "empty prompt missing",
  /id="root-empty"[\s\S]*Pick a method[\s\S]*Run the method/.test(html)
);
```

- [ ] **Step 2: Run the static audit and confirm the new checks fail before markup changes**

Run:

```powershell
node scripts/roots-mini-app-static-audit.js
```

Expected:

```text
[FAIL] Standalone entry includes a Roots first-run guide
[FAIL] Method tabs expose method categories
[FAIL] Empty state gives a useful first action
```

The older checks should continue to pass.

- [ ] **Step 3: Commit the failing audit checks**

Run:

```bash
git add scripts/roots-mini-app-static-audit.js
git commit -m "test: add roots ux polish audit checks"
```

## Task 3: Polish First-Run Guide And Method Navigation

**Files:**
- Modify: `roots/index.html`
- Modify: `roots/roots.css`

- [ ] **Step 1: Add a first-run guide below the module header**

In `roots/index.html`, place this block immediately after the `.module-header` block and before the method tab navigation:

```html
      <section class="root-start-guide" aria-label="Roots quick start">
        <div class="root-start-step">
          <span class="root-step-number" aria-hidden="true">1</span>
          <div>
            <h2>Pick a method</h2>
            <p>Use bracket methods when you have an interval, or open methods when you have starting guesses.</p>
          </div>
        </div>
        <div class="root-start-step">
          <span class="root-step-number" aria-hidden="true">2</span>
          <div>
            <h2>Enter the function</h2>
            <p>Type f(x), choose the machine rule, then set iterations or tolerance.</p>
          </div>
        </div>
        <div class="root-start-step">
          <span class="root-step-number" aria-hidden="true">3</span>
          <div>
            <h2>Read the run</h2>
            <p>Check the approximate root, stopping reason, diagnostics, graph, and iteration table.</p>
          </div>
        </div>
      </section>
```

- [ ] **Step 2: Add method categories to the existing tab buttons**

Replace the method tab button labels in `roots/index.html` with this structure while keeping each existing `id`, `data-method`, `role`, `aria-selected`, and `aria-controls` value:

```html
        <button id="root-tab-bisection" class="root-method-tab active" data-method="bisection" data-method-kind="bracket" role="tab" aria-selected="true" aria-controls="root-inputs-bisection"><span class="method-kind">Bracket</span><span>Bisection</span></button>
        <button id="root-tab-newton" class="root-method-tab" data-method="newton" data-method-kind="open" role="tab" aria-selected="false" aria-controls="root-inputs-newton"><span class="method-kind">Open</span><span>Newton-Raphson</span></button>
        <button id="root-tab-secant" class="root-method-tab" data-method="secant" data-method-kind="open" role="tab" aria-selected="false" aria-controls="root-inputs-secant"><span class="method-kind">Open</span><span>Secant</span></button>
        <button id="root-tab-falseposition" class="root-method-tab" data-method="falsePosition" data-method-kind="bracket" role="tab" aria-selected="false" aria-controls="root-inputs-falseposition"><span class="method-kind">Bracket</span><span>False Position</span></button>
        <button id="root-tab-fixedpoint" class="root-method-tab" data-method="fixedPoint" data-method-kind="fixed-point" role="tab" aria-selected="false" aria-controls="root-inputs-fixedpoint"><span class="method-kind">Fixed-point</span><span>Fixed Point</span></button>
```

- [ ] **Step 3: Improve the empty state copy**

Replace the current `root-empty` section with:

```html
      <section id="root-empty" class="empty-state root-empty-state">
        <p class="result-label">Ready when you are</p>
        <h2>Pick a method, enter a function, and run the method.</h2>
        <p class="input-hint">Results will appear here with the approximate root, stopping reason, diagnostics, graph, solution steps, and iteration table.</p>
      </section>
```

- [ ] **Step 4: Add CSS for the guide and method categories**

In `roots/roots.css`, add this block after `.module-root .root-summary-grid`:

```css
.root-start-guide {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: var(--space-3);
  margin: var(--space-4) 0;
}

.root-start-step {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: var(--space-2);
  align-items: start;
  padding: var(--space-3);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: var(--surface-raised);
}

.root-start-step h2 {
  margin: 0 0 var(--space-1);
  font-size: 1rem;
}

.root-start-step p {
  margin: 0;
  color: var(--text-subtle);
  line-height: 1.45;
}

.root-step-number {
  display: inline-grid;
  place-items: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 50%;
  background: var(--accent);
  color: var(--on-accent, #fff);
  font-weight: 700;
}
```

Update the existing `.root-method-tab` block so category labels stack without resizing the tab bar:

```css
.root-method-tab {
  display: grid;
  gap: 2px;
  min-width: 9rem;
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  background: transparent;
  color: var(--text-subtle);
  font: inherit;
  font-size: 0.875rem;
  cursor: pointer;
  transition: background 0.15s, color 0.15s, border-color 0.15s;
}

.method-kind {
  color: inherit;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
  opacity: 0.72;
}
```

Add this responsive rule near the end of `roots/roots.css`:

```css
@media (max-width: 720px) {
  .root-start-guide {
    grid-template-columns: 1fr;
  }

  .root-method-tab {
    min-width: min(100%, 10rem);
    flex: 1 1 9rem;
  }
}
```

- [ ] **Step 5: Run the static audit and confirm the new checks pass**

Run:

```powershell
node scripts/roots-mini-app-static-audit.js
```

Expected:

```text
[PASS] Standalone entry includes a Roots first-run guide
[PASS] Method tabs expose method categories
[PASS] Empty state gives a useful first action
```

- [ ] **Step 6: Run the UI wiring audit**

Run:

```powershell
node scripts/roots-mini-app-ui-audit.js
```

Expected: no output and exit code `0`.

- [ ] **Step 7: Commit the first-run and method navigation polish**

Run:

```bash
git add roots/index.html roots/roots.css
git commit -m "feat: polish roots first-run flow"
```

## Task 4: Polish Results, Diagnostics, And Narrow Layout

**Files:**
- Modify: `roots/roots.css`
- Modify: `scripts/roots-mini-app-static-audit.js`

- [ ] **Step 1: Add static checks for result hierarchy and responsive table polish**

In `scripts/roots-mini-app-static-audit.js`, after the existing `"Standalone iteration table has a scroll wrapper"` check, add:

```js
const rootsCss = fs.readFileSync(path.join(ROOT, "roots", "roots.css"), "utf8");

check(
  "Roots CSS keeps the approximate root visually primary",
  "root-summary-grid first answer hero receives primary styling",
  /\.root-summary-grid\s+\.answer-hero:first-child[\s\S]*background:\s*var\(--surface-strong/.test(rootsCss)
    ? "primary summary styling present"
    : "primary summary styling missing",
  /\.root-summary-grid\s+\.answer-hero:first-child[\s\S]*background:\s*var\(--surface-strong/.test(rootsCss)
);

check(
  "Roots CSS includes narrow-screen table support",
  "root-iteration-table-wrap and max-width media query",
  /root-iteration-table-wrap/.test(rootsCss) && /@media\s*\(max-width:\s*720px\)/.test(rootsCss)
    ? "responsive table support present"
    : "responsive table support missing",
  /root-iteration-table-wrap/.test(rootsCss) && /@media\s*\(max-width:\s*720px\)/.test(rootsCss)
);
```

- [ ] **Step 2: Run the static audit and confirm the first new check fails if styling is missing**

Run:

```powershell
node scripts/roots-mini-app-static-audit.js
```

Expected before CSS polish:

```text
[FAIL] Roots CSS keeps the approximate root visually primary
```

If the current CSS already passes the table-support check, keep it passing.

- [ ] **Step 3: Strengthen result and diagnostics styling**

In `roots/roots.css`, replace the current `.module-root .root-summary-grid .answer-hero:first-child` block with:

```css
.module-root .root-summary-grid .answer-hero:first-child {
  border-color: var(--line-strong);
  background: var(--surface-strong);
  box-shadow: 0 10px 24px rgba(20, 24, 31, 0.08);
}

.module-root .root-summary-grid .answer-hero:first-child .answer-value {
  font-size: clamp(1.8rem, 4vw, 2.6rem);
}
```

Add this after `.module-root .root-diagnostic-warning`:

```css
.module-root .root-diagnostics:not([hidden]) {
  margin: calc(-1 * var(--space-1)) 0 var(--space-1);
}

.module-root .root-rate-summary:empty,
.module-root #root-copy-status:empty {
  display: none;
}
```

Add this after `.root-iteration-table th, .root-iteration-table td`:

```css
.root-iteration-table th {
  position: sticky;
  top: 0;
  background: var(--surface);
  z-index: 1;
}

.root-iteration-table-wrap {
  border: 1px solid var(--line);
  border-radius: var(--radius);
}
```

- [ ] **Step 4: Run all Roots audits**

Run:

```powershell
node scripts/roots-mini-app-static-audit.js
node scripts/roots-mini-app-ui-audit.js
```

Expected:

```text
[PASS] Roots CSS keeps the approximate root visually primary
[PASS] Roots CSS includes narrow-screen table support
```

`roots-mini-app-ui-audit.js` should exit with code `0`.

- [ ] **Step 5: Commit the results and layout polish**

Run:

```bash
git add roots/roots.css scripts/roots-mini-app-static-audit.js
git commit -m "feat: polish roots result layout"
```

## Task 5: Final Verification And Handoff

**Files:**
- Modify: `README.md` only if Task 1 did not already add the fast-lane pointer.

- [ ] **Step 1: Run the full verification set**

Run:

```powershell
node scripts/roots-fast-lane-audit.js
node scripts/engine-correctness-audit.js
node scripts/root-engine-audit.js
node scripts/roots-mini-app-static-audit.js
node scripts/roots-mini-app-ui-audit.js
```

Expected:

```text
[PASS] Fast lane names the compact context docs
Summary: 47/47 passed
Summary: 45/45 passed
[PASS] Standalone entry exists
```

`roots-mini-app-ui-audit.js` should exit with code `0` and may print no output.

- [ ] **Step 2: Manually inspect the standalone Roots page**

Run:

```powershell
python -m http.server 7432
```

Open:

```text
http://localhost:7432/roots/index.html
```

Check these exact points:

- The first-run guide is visible above the method tabs.
- Each method tab shows its category.
- The page fits at a narrow width around 390px.
- The iteration table scrolls horizontally instead of forcing page overflow.
- Running Bisection with `x^2 - 2`, `a = 1`, `b = 2`, `n = 4` still shows approximate root `1.4375`.

Stop the server with `Ctrl+C`.

- [ ] **Step 3: Confirm dirty worktree contents before final commit**

Run:

```powershell
git status --short
```

Expected: only files intentionally changed by Phase 2 should appear. If unrelated pre-existing local files are present, do not add them.

- [ ] **Step 4: Commit any README/handoff-only cleanup**

If Task 5 changed `README.md`, run:

```bash
git add README.md
git commit -m "docs: note roots phase 2 workflow"
```

If Task 5 did not change files, do not create an empty commit.

- [ ] **Step 5: Report completion**

Final report should include:

```text
Phase 2 complete locally.

Fast lane:
- docs/roots-ai-fast-lane.md
- AGENTS.md Roots Fast Lane section
- scripts/roots-fast-lane-audit.js

UX polish:
- first-run guide
- method categories
- clearer empty/result hierarchy
- responsive table polish

Verification:
- node scripts/roots-fast-lane-audit.js
- node scripts/engine-correctness-audit.js
- node scripts/root-engine-audit.js
- node scripts/roots-mini-app-static-audit.js
- node scripts/roots-mini-app-ui-audit.js
```
