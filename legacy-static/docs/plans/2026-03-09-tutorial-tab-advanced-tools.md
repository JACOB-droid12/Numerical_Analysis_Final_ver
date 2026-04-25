# Tutorial Tab and Advanced Tools Separation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a dedicated Tutorial tab, move practice content out of calculator advanced panels, and make `Advanced tools` verification-only without changing the underlying math behavior.

**Architecture:** Extend the existing top-level tab system with one new `Tutorial` panel, then refactor the current advanced-panel assembly so calculator modules only expose checking content. Reuse existing example-loading and tab-switching paths for tutorial actions, and keep all numerical logic intact by routing tutorial actions through the same state setters already used by built-in examples and imports.

**Tech Stack:** Static HTML, vanilla JavaScript, CSS, existing tab/runtime logic in `index.html`, `app.js`, and `styles.css`, Playwright MCP for browser validation, Node syntax check.

---

### Task 1: Add the new Tutorial tab shell to the main navigation

**Files:**
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\index.html`
- Inspect: `C:\Users\Emmy Lou\Downloads\New folder (16)\app.js`

**Step 1: Add a new top-level tab button**

Add a fourth tab button alongside the existing three module tabs.

Target shape:

```html
<button id="tab-btn-tutorial" class="tab-button" role="tab" ...>
  <span class="tab-icon">?</span>
  <span class="tab-text">
    <span class="tab-kicker">Guide</span>
    <span class="tab-title">Tutorial</span>
  </span>
</button>
```

**Step 2: Add the matching tab panel container**

Create a new `tabpanel` section with a module shell that fits the current app structure.

Target shape:

```html
<section id="tab-tutorial" class="panel" role="tabpanel" aria-labelledby="tab-btn-tutorial" tabindex="0" hidden>
  ...tutorial content shell...
</section>
```

**Step 3: Keep the existing tab semantics intact**

Match the current ARIA, hidden-state, and keyboard navigation pattern already used by the other module tabs.

**Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add tutorial tab shell"
```

### Task 2: Build the Tutorial tab content and actions

**Files:**
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\index.html`
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\styles.css`
- Inspect: `C:\Users\Emmy Lou\Downloads\New folder (16)\app.js`

**Step 1: Add three tutorial topic sections**

Create topic blocks for:
- `Machine arithmetic basics`
- `Error analysis basics`
- `Polynomial method comparison`

Each block should include:
- short explanation copy
- worked example summary
- short checklist
- one action button

**Step 2: Add `Send this example to calculator` buttons**

Add one button per topic with stable IDs, for example:
- `tutorial-send-basic`
- `tutorial-send-error`
- `tutorial-send-poly`

**Step 3: Keep tutorial content lightweight**

Do not add nested accordions or dense utility controls here. Keep it readable and student-facing.

**Step 4: Add tutorial layout styling**

Add a focused CSS block for the tutorial panel so the sections feel distinct from the calculator controls while still matching the site.

**Step 5: Verify responsive behavior in CSS**

Ensure the tutorial sections stack cleanly on mobile and do not introduce horizontal overflow.

**Step 6: Commit**

```bash
git add index.html styles.css
git commit -m "feat: add tutorial tab content"
```

### Task 3: Wire tutorial actions into existing calculator flows

**Files:**
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\app.js`
- Inspect: `C:\Users\Emmy Lou\Downloads\New folder (16)\index.html`

**Step 1: Identify reusable example-loading paths**

Locate the current helpers or event handlers that already load starter examples into Module I and Module III, and the current state setters used by Module II.

**Step 2: Add tutorial action handlers**

Wire each tutorial button so it:
- fills the relevant calculator inputs
- applies the intended sample settings
- switches to the correct calculator tab
- updates any existing status message if appropriate

**Step 3: Reuse existing logic instead of duplicating math setup**

If Module I or III already has a loader for the same example, call that path directly instead of recreating it.

**Step 4: Keep the actions non-destructive**

Tutorial actions should populate sample data, not auto-calculate unless the existing example flow already does so.

**Step 5: Run syntax check**

Run:

```bash
node --check "C:\Users\Emmy Lou\Downloads\New folder (16)\app.js"
```

Expected: success with no output.

**Step 6: Commit**

```bash
git add app.js index.html
git commit -m "feat: wire tutorial examples into calculator tabs"
```

### Task 4: Remove practice content from calculator advanced panels

**Files:**
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\index.html`
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\app.js`
- Inspect: `C:\Users\Emmy Lou\Downloads\New folder (16)\styles.css`

**Step 1: Find the current practice-oriented content inside Module I advanced areas**

Identify the helper/examples sections that are currently being moved under Module I `Advanced tools`.

**Step 2: Stop moving practice content into Module I advanced tools**

Adjust the advanced-panel assembly so Module I `Advanced tools` only contains verification-oriented content.

**Step 3: Preserve useful verification sections**

Keep exact-value inspection and the machine trace available inside `Advanced tools`.

**Step 4: Remove orphaned references or empty wrappers**

If any helper wrapper becomes unused after the move, clean up the DOM assembly so no empty disclosure remains.

**Step 5: Commit**

```bash
git add app.js index.html
 git commit -m "refactor: keep module i advanced tools verification-only"
```

### Task 5: Rename and regroup advanced-panel sections around checking work

**Files:**
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\app.js`
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\index.html`

**Step 1: Update Module I advanced labels**

Change verification section labels to student-facing checking language, such as:
- `Check exact form`
- `Check machine trace`

**Step 2: Update Module II advanced labels**

Rename or regroup the deeper error-analysis sections toward:
- `Check error metrics`
- `Check imported source`

**Step 3: Update Module III advanced labels**

Rename or regroup the polynomial deep-dive sections toward:
- `Check method details`
- `Check machine trace`

**Step 4: Keep behavior unchanged**

Only change labels, grouping, and presentation. Do not change calculations or comparison logic.

**Step 5: Commit**

```bash
git add app.js index.html
git commit -m "refactor: relabel advanced tools for result checking"
```

### Task 6: Polish styling for the new information architecture

**Files:**
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\styles.css`
- Inspect: `C:\Users\Emmy Lou\Downloads\New folder (16)\index.html`

**Step 1: Add styles for the Tutorial tab content**

Style the tutorial blocks so they read as calm learning panels rather than calculator cards.

**Step 2: Tighten advanced-panel visual hierarchy**

Make checking sections easier to scan with better spacing and quieter supporting text.

**Step 3: Ensure the new fourth tab remains balanced**

Adjust tab layout if needed so the navigation still works on desktop and mobile.

**Step 4: Keep mobile layouts clean**

Confirm the tutorial sections, tabs, and advanced labels wrap cleanly at narrow widths.

**Step 5: Commit**

```bash
git add styles.css index.html
git commit -m "style: polish tutorial tab and advanced panel hierarchy"
```

### Task 7: Verify the full experience end-to-end

**Files:**
- Inspect: `C:\Users\Emmy Lou\Downloads\New folder (16)\index.html`
- Inspect: `C:\Users\Emmy Lou\Downloads\New folder (16)\app.js`
- Inspect: `C:\Users\Emmy Lou\Downloads\New folder (16)\styles.css`

**Step 1: Run syntax verification**

Run:

```bash
node --check "C:\Users\Emmy Lou\Downloads\New folder (16)\app.js"
```

Expected: success with no output.

**Step 2: Validate Tutorial actions in the browser**

Check that each tutorial button sends the correct example to the correct calculator tab.

**Step 3: Validate calculator advanced panels**

Check that:
- Module I advanced tools contains only checking content
- Module II advanced tools contains only checking content
- Module III advanced tools contains only checking content

**Step 4: Validate existing result workflows**

Re-run the recently improved result flows so the tutorial refactor does not regress them:
- Module I compute and next-step row
- Module II verdict after compute/import
- Module III verdict and next-step prompt

**Step 5: Run the built-in required test**

Use the current Module I verification flow and confirm the built-in checks still report `PASS`.

**Step 6: Inspect browser console**

Confirm there are no new console errors during tab switching or tutorial actions.

**Step 7: Commit**

```bash
git add index.html app.js styles.css
git commit -m "test: verify tutorial separation flow"
```
