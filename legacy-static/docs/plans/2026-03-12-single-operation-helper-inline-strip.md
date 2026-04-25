# Single Operation Helper Inline Strip Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Keep the tutorial `Single operation helper` top row fully inline so the operands, operator, and symbol buttons read as one coherent expression strip.

**Architecture:** Leave helper logic unchanged and solve this as a helper-specific layout problem. Override the generic stacked field-shell behavior with dedicated helper strip rules so operand units become horizontal controls and the operator stays aligned between them.

**Tech Stack:** Static HTML, CSS, PowerShell

---

### Task 1: Add helper-specific hooks only if needed for inline control grouping

**Files:**
- Modify if needed: `C:\Users\Emmy Lou\Downloads\New folder (16)\index.html`

**Step 1: Write the failing test**

Inspect the helper markup and confirm the operands and operator already have helper-specific classes, but the shells still rely on generic layout behavior.

**Step 2: Run test to verify it fails**

Run: `rg -n "single-helper-expression|single-helper-operand|single-helper-operator|field-shell|symbol-trigger-mini" index.html`
Expected: the helper still depends on generic field-shell structure for inline behavior

**Step 3: Write minimal implementation**

- add only any small helper-specific class hooks still needed for operand/input/button alignment
- keep helper ids and structure stable unless a tiny wrapper addition is necessary

**Step 4: Run test to verify it passes**

Run: `rg -n "single-helper-expression|single-helper-operand|single-helper-operator|single-helper-inline" index.html`
Expected: the markup has the helper-specific hooks needed for inline strip styling

**Step 5: Commit**

```bash
git add index.html
git commit -m "refactor: add helper inline strip hooks"
```

### Task 2: Override stacked shell behavior for the helper strip

**Files:**
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\styles.css`

**Step 1: Write the failing test**

Record the current issues:

- symbol buttons drop below operands
- operator drops out of line
- top row does not behave like one expression strip

**Step 2: Run test to verify it fails**

Run: `rg -n "single-helper-expression|single-helper-operand|single-helper-operator|field-shell|symbol-trigger-mini" styles.css`
Expected: helper-specific inline alignment rules are missing or incomplete

**Step 3: Write minimal implementation**

- make helper operand shells horizontal instead of stacked
- keep each operand input and `∑` button on one line
- keep the operator aligned to the same bottom edge
- preserve the current responsive fallback for narrow widths
- scope all changes to the helper so the rest of the app is unaffected

**Step 4: Run test to verify it passes**

Run: `rg -n "single-helper-expression|single-helper-operand|single-helper-operator|single-helper-inline" styles.css`
Expected: helper-specific inline strip rules are present

**Step 5: Commit**

```bash
git add styles.css
git commit -m "style: keep helper strip inline"
```

### Task 3: Verify final helper strip layout

**Files:**
- Verify: `C:\Users\Emmy Lou\Downloads\New folder (16)\styles.css`
- Verify if touched: `C:\Users\Emmy Lou\Downloads\New folder (16)\index.html`

**Step 1: Write the failing test**

Define the expected result:

- each operand and `∑` button stay inline
- operator stays inline and centered
- the top row reads as one expression strip

**Step 2: Run test to verify it fails**

Inspect the current helper and note the dropped button/operator behavior.

**Step 3: Write minimal implementation**

No extra code unless verification reveals a remaining helper-only alignment issue.

**Step 4: Run test to verify it passes**

Run:
- `git diff --check -- styles.css index.html`
- inspect helper strip layout after the CSS change
- confirm the second row still aligns normally

Expected:
- no malformed diff output
- no dropped symbol buttons
- no dropped operator block
- clean helper strip alignment

**Step 5: Commit**

```bash
git add styles.css index.html
git commit -m "test: verify helper inline strip layout"
```
