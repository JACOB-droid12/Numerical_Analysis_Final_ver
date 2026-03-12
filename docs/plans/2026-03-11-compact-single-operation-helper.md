# Compact Single Operation Helper Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rework the tutorial `Single operation helper` into a compact two-row layout that makes the math expression feel primary and keeps machine settings and action controls visually organized.

**Architecture:** Keep the helper's existing DOM, values, and calculator logic intact wherever possible, then add only the wrapper structure and CSS needed to split the controls into an expression row and a settings row. Treat this as a layout-only polish pass with responsive verification on desktop and mobile widths.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, PowerShell, Playwright

---

### Task 1: Restructure the helper control markup for compact grouping

**Files:**
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\index.html`
- Modify if needed: `C:\Users\Emmy Lou\Downloads\New folder (16)\app.js`

**Step 1: Write the failing test**

Identify the current helper structure and note that all five controls live in one grid, which causes the expression and settings to read as one flat form.

**Step 2: Run test to verify it fails**

Run: `rg -n "field-grid-basic|basic-compute|basic-a|basic-op|basic-b|basic-k|basic-mode" index.html`
Expected: the helper controls appear in one undifferentiated control block

**Step 3: Write minimal implementation**

- Add wrapper groups in `index.html` so the helper controls are split into:
  - one expression row for `basic-a`, `basic-op`, and `basic-b`
  - one settings row for `basic-k`, `basic-mode`, and `basic-compute`
- Preserve the existing element ids so the helper logic keeps working
- Update `app.js` only if any layout hook or moved node needs a selector adjustment

**Step 4: Run test to verify it passes**

Run: `rg -n "single-helper-expression|single-helper-settings|basic-a|basic-op|basic-b|basic-k|basic-mode|basic-compute" index.html`
Expected: the helper now has explicit grouping for the expression row and settings row

**Step 5: Commit**

```bash
git add index.html app.js
git commit -m "refactor: group tutorial single-operation helper controls"
```

### Task 2: Style the helper as a compact two-row exercise

**Files:**
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\styles.css`

**Step 1: Write the failing test**

Record the current layout issues in the tutorial helper:

- operands and operator do not read as one expression
- settings overpower the operation row
- calculate button sits too low and disconnected

**Step 2: Run test to verify it fails**

Run: `rg -n "tutorial-practice \\.standalone-helper|field-grid-basic|control-band-basic|symbol-trigger-mini" styles.css`
Expected: no helper-specific compact row styling exists for the tutorial version of the single-operation helper

**Step 3: Write minimal implementation**

- Add helper-specific layout styles for the new expression row and settings row
- Make operand inputs the widest controls
- Narrow the operation select
- Align the `Calculate` button with the settings row
- Add spacing between the controls and result block so the result reads as an output section
- Add responsive rules so the expression row and settings row stack cleanly on smaller widths

**Step 4: Run test to verify it passes**

Run: `rg -n "single-helper-expression|single-helper-settings|standalone-helper" styles.css`
Expected: helper-specific layout and responsive styles exist

**Step 5: Commit**

```bash
git add styles.css
git commit -m "style: compact tutorial single-operation helper"
```

### Task 3: Verify helper behavior and responsive stability

**Files:**
- Verify: `C:\Users\Emmy Lou\Downloads\New folder (16)\index.html`
- Verify: `C:\Users\Emmy Lou\Downloads\New folder (16)\styles.css`
- Verify if touched: `C:\Users\Emmy Lou\Downloads\New folder (16)\app.js`

**Step 1: Write the failing test**

Define the expected result:

- the helper reads as a compact expression-first exercise
- the settings row is clearly secondary
- the helper still calculates normally

**Step 2: Run test to verify it fails**

Open the tutorial tab and inspect the helper at desktop and mobile widths.
Expected: the current version still shows the looser, awkward layout

**Step 3: Write minimal implementation**

No additional code unless verification reveals a layout edge case that blocks the compact design.

**Step 4: Run test to verify it passes**

Run:
- `node --check app.js`
- open the app in Playwright and confirm the `Tutorial` tab helper layout on desktop
- repeat at a narrower width
- perform one helper calculation and confirm the result still renders normally

Expected:
- no JavaScript syntax errors
- compact two-row helper layout
- no overlap or stranded action button
- helper result still computes

**Step 5: Commit**

```bash
git add index.html styles.css app.js
git commit -m "test: verify compact tutorial helper layout"
```
