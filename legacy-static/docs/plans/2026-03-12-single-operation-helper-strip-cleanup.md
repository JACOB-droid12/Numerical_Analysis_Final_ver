# Single Operation Helper Strip Cleanup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Remove the inline operand preview chips from the tutorial `Single operation helper` so the top row reads as a clean operand-operator-operand expression strip.

**Architecture:** Keep the helper's existing ids, calculations, and result rendering intact, then adjust the math-preview mounting logic so the tutorial helper operands no longer render inline preview chips. Use CSS or minimal markup cleanup only if the helper still needs a small layout adjustment after the preview removal.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, PowerShell

---

### Task 1: Stop rendering inline previews for helper operands

**Files:**
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\app.js`
- Modify if needed: `C:\Users\Emmy Lou\Downloads\New folder (16)\index.html`

**Step 1: Write the failing test**

Identify that `basic-a` and `basic-b` are included in the global preview configuration, causing preview chips to be mounted into the helper layout.

**Step 2: Run test to verify it fails**

Run: `rg -n "basic-a-preview|basic-b-preview|PREVIEW_FIELDS|renderMathPreview|ensureMathPreviewMount" app.js`
Expected: the helper operands are still wired into the preview system

**Step 3: Write minimal implementation**

- remove or bypass preview rendering for `basic-a` and `basic-b`
- preserve preview behavior for other modules unless the same helper-specific issue exists there
- keep helper input ids and compute flow unchanged

**Step 4: Run test to verify it passes**

Run: `rg -n "basic-a-preview|basic-b-preview|PREVIEW_FIELDS" app.js`
Expected: helper operands no longer participate in the inline preview rendering path

**Step 5: Commit**

```bash
git add app.js index.html
git commit -m "fix: remove helper operand preview chips"
```

### Task 2: Tighten helper strip layout after preview removal

**Files:**
- Modify if needed: `C:\Users\Emmy Lou\Downloads\New folder (16)\styles.css`
- Modify if needed: `C:\Users\Emmy Lou\Downloads\New folder (16)\index.html`

**Step 1: Write the failing test**

Record the remaining layout expectation:

- the top row should contain only operand, operator, operand
- the second row should contain only settings and calculate

**Step 2: Run test to verify it fails**

Run: `rg -n "single-helper-expression|single-helper-settings|math-preview-inline" styles.css index.html`
Expected: current helper layout may still carry unnecessary spacing after preview removal

**Step 3: Write minimal implementation**

- make only the smallest layout adjustment needed after preview removal
- keep the expression row clean and centered
- avoid any broad tutorial redesign

**Step 4: Run test to verify it passes**

Run: `rg -n "single-helper-expression|single-helper-settings" styles.css index.html`
Expected: helper strip and settings rows remain clearly separated and stable

**Step 5: Commit**

```bash
git add styles.css index.html
git commit -m "style: tighten helper strip after preview removal"
```

### Task 3: Verify helper behavior and final layout

**Files:**
- Verify: `C:\Users\Emmy Lou\Downloads\New folder (16)\app.js`
- Verify: `C:\Users\Emmy Lou\Downloads\New folder (16)\styles.css`
- Verify if touched: `C:\Users\Emmy Lou\Downloads\New folder (16)\index.html`

**Step 1: Write the failing test**

Define the expected result:

- no duplicate mini preview chips in the helper
- expression row reads cleanly
- helper still computes normally

**Step 2: Run test to verify it fails**

Inspect current helper behavior and note the preview chips under the operands.

**Step 3: Write minimal implementation**

No additional code unless verification reveals one final layout issue.

**Step 4: Run test to verify it passes**

Run:
- `node --check app.js`
- `git diff --check -- app.js styles.css index.html`
- confirm the helper no longer renders operand preview chips
- run one helper calculation and confirm results still update

Expected:
- no JavaScript syntax errors
- clean diff formatting
- no helper preview chips
- helper compute flow remains intact

**Step 5: Commit**

```bash
git add app.js styles.css index.html
git commit -m "test: verify cleaned helper strip"
```
