# Student Clarity Simplification Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Simplify the calculator for first-time students by foregrounding the core workflows, collapsing advanced tools by default, trimming duplicate guidance, and fixing the mobile control regression without changing any numerical behavior.

**Architecture:** Keep the current static HTML/CSS/JS app structure and existing computational engines intact. Reuse the existing layout-reorganization hooks in `app.js` to consolidate advanced sections into a single disclosure per module, trim or rewrite noisy copy in `index.html`, and retune the visual hierarchy in `styles.css` so the default view feels calmer on desktop and mobile.

**Tech Stack:** Static HTML, vanilla JavaScript, CSS, existing runtime modules (`app.js`, `index.html`, `styles.css`), browser validation with Playwright MCP, syntax checks with Node.

---

### Task 1: Lock the baseline structure and approved copy targets

**Files:**
- Inspect: `C:\Users\Emmy Lou\Downloads\New folder (16)\docs\plans\2026-03-09-student-clarity-simplification-design.md`
- Inspect: `C:\Users\Emmy Lou\Downloads\New folder (16)\index.html`
- Inspect: `C:\Users\Emmy Lou\Downloads\New folder (16)\app.js`
- Inspect: `C:\Users\Emmy Lou\Downloads\New folder (16)\styles.css`

**Step 1: Confirm the sections that must become secondary**

Record these as advanced-only by default:
- Module I: `Exact details`, `Operation helper`, `Machine trace`
- Module II: extra import tools and post-result reading details
- Module III: examples, exact details, method details, `Machine trace`

**Step 2: Confirm the sections that must remain first-class**

Record these as always visible:
- hero orientation
- quick guide disclosure
- module tabs
- primary input controls per module
- primary result summaries per module
- post-result cross-module send/import actions

**Step 3: Lock the copy simplification targets**

Use these as the rewrite targets:
- shorter hero subtitle
- shorter empty-state copy in all three modules
- clearer result helper text around `p` and `p*`
- removal of duplicate guide controls

**Step 4: Capture the pre-change regression screens**

Use Playwright to save baseline screenshots for:
- desktop home view
- mobile home view
- Module II empty state
- Module III empty state

Expected: baseline images saved for visual diffing before any edits.

### Task 2: Simplify the global shell and onboarding controls

**Files:**
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\index.html`
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\app.js`
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\styles.css`

**Step 1: Remove the standalone guide toggle controls from the header**

Delete:
- `#welcome-dismiss`
- `#welcome-restore-wrap`
- `#welcome-show`

Keep `#welcome-strip` as the single source of guide visibility.

**Step 2: Rewrite the hero copy to one practical sentence**

Replace the current subtitle with a shorter version such as:

```html
<p class="subtitle">
  Work exam-style machine arithmetic, error, and polynomial problems with textbook-style notation and quick result checks.
</p>
```

**Step 3: Simplify the quick guide copy and actions**

Keep the disclosure, but reduce it to one short explanation and two actions:
- start with Module I
- load a worked example

Expected: the guide feels optional and supportive, not like a second landing page.

**Step 4: Update onboarding state logic in `app.js`**

Remove references to the deleted guide-toggle elements from:
- `syncOnboardingUI()`
- `dismissWelcomeGuide()`
- `showWelcomeGuide()`
- any startup event binding

Expected: onboarding still remembers completion and the guide still opens/closes safely.

**Step 5: Commit**

```bash
git add index.html app.js styles.css docs/plans/2026-03-09-student-clarity-simplification-design.md docs/plans/2026-03-09-student-clarity-simplification.md
git commit -m "feat: simplify onboarding shell for student-first flow"
```

### Task 3: Consolidate advanced tools into one disclosure per module

**Files:**
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\app.js`
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\index.html`
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\styles.css`

**Step 1: Create one shared advanced-tools panel label**

In `app.js`, update the layout-move helpers so each module builds one outer disclosure labeled:

```js
"Advanced tools"
```

Use the existing `createDisclosurePanel()` helper rather than creating a parallel system.

**Step 2: Move Module I secondary content under the shared disclosure**

Ensure the Module I advanced panel contains:
- exact details strip and note
- single operation helper
- stored-number details
- worked examples for the helper
- expression trace

Expected: Module I opens with only the expression workflow, result cards, and post-result send actions visible.

**Step 3: Move Module II secondary content under the shared disclosure**

Place these in the Module II advanced panel:
- extra import tools
- `How to read this` interpretation block after results

Keep `Calculate error` and one main import button visible outside the disclosure.

**Step 4: Move Module III secondary content under the shared disclosure**

Place these in the Module III advanced panel:
- worked examples
- exact details
- method details
- machine trace

Keep the main input controls, verdict, and method summary cards outside the disclosure.

**Step 5: Preserve hidden/result-dependent behavior**

Confirm `syncOnboardingUI()` still hides or reveals moved sections correctly after they change parents.

Expected: advanced content stays collapsed and does not leak into the empty state.

**Step 6: Commit**

```bash
git add app.js index.html styles.css
git commit -m "feat: group advanced tools behind one disclosure per module"
```

### Task 4: Rewrite module copy and result guidance for first-time students

**Files:**
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\index.html`
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\app.js`

**Step 1: Simplify the Module I empty state and helper copy**

Replace the current empty-state heading with a shorter prompt such as:

```html
<h3 class="empty-title">Try the starter example or enter your own expression to see the machine result.</h3>
```

Update the answer guide text to clarify `p*` in plain language.

**Step 2: Simplify the Module II empty state**

Use shorter action-led language, for example:

```html
<h3 class="empty-title">Import a machine result or enter a true value and approximation to compare them.</h3>
```

**Step 3: Simplify the Module III empty state and method explanation**

Use shorter copy for the empty state and verdict explainer so the result area feels readable after calculation.

**Step 4: Keep post-result next steps explicit**

Verify the visible follow-up actions say what happens next, for example:
- `Send stepwise p* to Errors`
- `Send final-only p* to Errors`

Rename buttons in `index.html` and any matching status text in `app.js` if needed.

**Step 5: Run a quick copy regression pass**

Search for repeated phrases like `how machine arithmetic works`, `quick guide`, and `final-only p*` and trim duplicates without changing math meaning.

Run: `rg -n "how machine arithmetic works|Quick guide|final-only p\\*" "C:\Users\Emmy Lou\Downloads\New folder (16)\index.html" "C:\Users\Emmy Lou\Downloads\New folder (16)\app.js"`

Expected: duplicate explanatory phrasing is reduced and remaining labels are intentional.

**Step 6: Commit**

```bash
git add index.html app.js
git commit -m "copy: clarify student-facing guidance across modules"
```

### Task 5: Retune hierarchy and mobile behavior in CSS

**Files:**
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\styles.css`

**Step 1: Demote secondary chrome**

Reduce the visual weight of:
- `.status-strip`
- `.micro-panel`
- `.tabs-home` secondary captions

Target:
- slightly less contrast
- slightly less padding
- less competition with the active module content

**Step 2: Tighten the hero and quick-guide spacing**

Adjust:
- `.masthead`
- `.masthead-copy`
- `.subtitle`
- `.welcome-strip`

Target: shorter landing area with faster access to Module I.

**Step 3: Style the shared advanced-tools disclosures**

Add or retune selectors for the new outer advanced panels so they read as optional support rather than primary cards.

Target:
- clear label
- quieter background
- consistent spacing for stacked subsections

**Step 4: Fix the mobile select/control regression**

Inspect and correct the selectors affecting:
- `select`
- `.search-settings`
- `.control-actions`
- `.search-shell`

Target:
- one visible dropdown affordance per select
- no repeated-chevron rendering on mobile
- calculate row remains readable and tappable

**Step 5: Keep result cards visually primary**

Retune:
- `.result-stage`
- `.comparison-grid-triple`
- `.comparison-grid-board`
- `.answer-hero`

Target:
- results stand out more strongly than help text or advanced tools
- post-result flow is obvious at a glance

**Step 6: Keep final values in the latest active CSS block**

Do not scatter the intended final styles across older duplicate sections. Place the final override values in the last active tuning area so the effective cascade stays obvious.

**Step 7: Commit**

```bash
git add styles.css
git commit -m "style: simplify hierarchy and fix mobile controls"
```

### Task 6: Verify behavior, copy, and responsiveness

**Files:**
- Test: `C:\Users\Emmy Lou\Downloads\New folder (16)\index.html`
- Test: `C:\Users\Emmy Lou\Downloads\New folder (16)\app.js`
- Test: `C:\Users\Emmy Lou\Downloads\New folder (16)\styles.css`

**Step 1: Run syntax checks**

Run:

```bash
node --check "C:\Users\Emmy Lou\Downloads\New folder (16)\app.js"
```

Expected: success with no output.

**Step 2: Run the built-in Module I verification**

Open the app, expand `Advanced tools`, load the single-operation helper example if needed, and click `Run required test`.

Expected output includes:
- `Exact check: PASS`
- `k=8 chop check: PASS`
- `k=8 round check: PASS`

**Step 3: Browser-check the simplified empty states**

Verify on desktop and mobile:
- hero is shorter
- quick guide is still available
- advanced tools are collapsed by default
- primary action is obvious in Module I

**Step 4: Browser-check post-result flows**

Verify:
- Module I shows result cards and send actions after calculation
- Module II can import a Module I result
- Module III still computes and shows verdict plus summary cards

Use these fixtures:
- Module I: `((1/3 + 6/5) + 0.948854) - (5/30 + 6/59)`, `k=8`, `Chopping`
- Module II: import Module I stepwise result
- Module III: `2x - x^3/3 + x^5/60`, `x = 3.14159/3`, `k=8`, `Rounding`

**Step 5: Confirm the mobile select bug is gone**

At a narrow viewport, verify:
- the `Machine rule` control shows one dropdown affordance
- the calculate row stays aligned
- controls do not overlap or clip

**Step 6: Save final screenshots for comparison**

Capture:
- desktop home view
- mobile home view
- Module I with results
- Module II with imported result
- Module III with comparison results

Expected: screenshots clearly show a calmer first screen and preserved power features.

**Step 7: Commit**

```bash
git add index.html app.js styles.css
git commit -m "test: verify student-clarity simplification flow"
```

## Important constraints

- Do not change `math-engine.js`, `calc-engine.js`, `expression-engine.js`, `poly-engine.js`, or `math-display.js`.
- Do not change numerical outputs, import semantics, or machine-arithmetic logic.
- Keep existing accessibility semantics (`tablist`, `tabpanel`, `details`, `aria-live`) intact while moving panels.
- Prefer reusing existing DOM movement code in `applyExamModeLayout()` instead of introducing a second layout mode.

## Test scenarios

- First-time student can identify Module I as the starting point immediately.
- Advanced tools remain discoverable but collapsed by default.
- All current result flows still work after sections are moved.
- The guide remains available without separate hide/show buttons.
- Mobile controls remain legible and stable.
