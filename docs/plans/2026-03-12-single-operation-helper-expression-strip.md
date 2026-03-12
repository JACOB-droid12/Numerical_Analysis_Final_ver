# Single Operation Helper Expression Strip Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the tutorial `Single operation helper` read as a real operand-operator-operand expression strip, with machine settings and action controls kept on a clearly secondary row.

**Architecture:** Keep the existing helper logic and ids intact, then refine the helper markup and CSS so the top row behaves as one visual expression instead of three disconnected blocks. Focus only on layout cohesion for the helper rather than broader tutorial redesign.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, PowerShell

---

### Task 1: Refine helper markup hooks for a true expression strip

**Files:**
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\index.html`
- Modify if needed: `C:\Users\Emmy Lou\Downloads\New folder (16)\app.js`

**Step 1: Write the failing test**

Inspect the current helper structure and note that the operands and operator still do not form one visually cohesive strip.

**Step 2: Run test to verify it fails**

Run: `rg -n "single-helper-expression|single-helper-operand|single-helper-operator|symbol-trigger-mini|field-shell" index.html`
Expected: the helper has basic grouping but not enough structure to guarantee one clean expression strip

**Step 3: Write minimal implementation**

- adjust the helper wrappers or field-shell structure in `index.html` so the operand/operator row can be laid out as one expression strip
- keep `basic-a`, `basic-op`, `basic-b`, `basic-k`, `basic-mode`, and `basic-compute` ids unchanged
- update `app.js` only if a moved node requires a tiny selector-safe adjustment

**Step 4: Run test to verify it passes**

Run: `rg -n "single-helper-expression|single-helper-operand|single-helper-operator|basic-a|basic-op|basic-b" index.html`
Expected: the helper markup clearly supports an operand-operator-operand row

**Step 5: Commit**

```bash
git add index.html app.js
git commit -m "refactor: tighten helper expression strip structure"
```

### Task 2: Make the top row behave like one compact operation

**Files:**
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\styles.css`

**Step 1: Write the failing test**

Record the current issues:

- operator appears detached from the operands
- operand utilities interrupt the row
- the top row does not read as a single operation

**Step 2: Run test to verify it fails**

Run: `rg -n "single-helper-expression|single-helper-operand|single-helper-operator|single-helper-settings" styles.css`
Expected: existing styles do not yet fully enforce a real expression-strip relationship

**Step 3: Write minimal implementation**

- adjust the helper layout so the first row behaves as one expression strip
- make the operand fields equal in weight
- keep the operator narrower and visually centered
- ensure the symbol buttons remain attached to the operand fields without breaking row alignment
- keep the settings row distinct and secondary
- preserve clean stacking on smaller widths

**Step 4: Run test to verify it passes**

Run: `rg -n "single-helper-expression|single-helper-operand|single-helper-operator|single-helper-settings" styles.css`
Expected: helper-specific strip layout rules are present and the settings row remains separate

**Step 5: Commit**

```bash
git add styles.css
git commit -m "style: make helper read as one expression strip"
```

### Task 3: Verify helper behavior and layout coherence

**Files:**
- Verify: `C:\Users\Emmy Lou\Downloads\New folder (16)\index.html`
- Verify: `C:\Users\Emmy Lou\Downloads\New folder (16)\styles.css`
- Verify if touched: `C:\Users\Emmy Lou\Downloads\New folder (16)\app.js`

**Step 1: Write the failing test**

Define the expected result:

- the helper reads as `[ operand ] [ operator ] [ operand ]`
- the settings row stays underneath as setup/action
- the helper logic still works

**Step 2: Run test to verify it fails**

Inspect the current helper and note the disconnected visual relationship before the fix.

**Step 3: Write minimal implementation**

No extra code unless verification reveals a final layout edge case.

**Step 4: Run test to verify it passes**

Run:
- `node --check app.js`
- `git diff --check -- index.html styles.css`
- inspect the helper in the browser and confirm the expression strip reads cleanly
- perform one helper calculation and confirm results still render

Expected:
- no JavaScript syntax errors
- no malformed markup diff issues
- top row reads as a single operation
- helper calculations still work

**Step 5: Commit**

```bash
git add index.html styles.css app.js
git commit -m "test: verify helper expression strip layout"
```
