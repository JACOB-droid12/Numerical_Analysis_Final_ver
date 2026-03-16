# Engine Result Package Cleanup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Introduce cleaner result-package contracts for Module I and Module III so `app.js` can consume structured engine outputs instead of manually assembling as much result meaning itself.

**Architecture:** Extend the expression and polynomial engine layers with stable result-package helpers, then update `app.js` to use those helpers while preserving all current mathematical behavior. Use the 36-case engine audit harness as the refactor safety rail throughout the pass.

**Tech Stack:** Static JavaScript engines, Node.js, vanilla JavaScript, PowerShell, ripgrep

---

### Task 1: Add a structured expression result-package helper

**Files:**
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\expression-engine.js`
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\scripts\engine-correctness-audit.js`

**Step 1: Write the failing test**

Define the missing contract: Module I currently relies on `app.js` and local helper code to assemble a full comparison package from multiple raw engine calls.

**Step 2: Run test to verify it fails**

Run: `rg -n "result package|comparison package|evaluateComparison|buildExpressionComparison" expression-engine.js app.js`
Expected: no engine-owned structured expression result-package helper exists yet

**Step 3: Write minimal implementation**

- add one expression-engine helper that returns a structured comparison/result package
- include canonical expression, path type, exact/reference value, stepwise package, and final-only package
- update the audit harness if needed to exercise the new helper directly

**Step 4: Run test to verify it passes**

Run: `node "scripts/engine-correctness-audit.js"`
Expected: the full harness still passes after the new helper exists

**Step 5: Commit**

```bash
git add expression-engine.js scripts/engine-correctness-audit.js
git commit -m "refactor: add expression result package helper"
```

### Task 2: Update Module I app flow to consume the expression package

**Files:**
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\app.js`
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\scripts\engine-correctness-audit.js`

**Step 1: Write the failing test**

Define the current problem: `computeExpressionModule` still assembles and stores a lot of expression result structure locally in `app.js`.

**Step 2: Run test to verify it fails**

Run: `rg -n "state\.expressionComparison = \{|buildExpressionComparison\(|step: \{|final: \{" app.js`
Expected: `app.js` still performs substantial expression result assembly

**Step 3: Write minimal implementation**

- update Module I flow to consume the engine-provided package
- keep sandbox behavior and imports working
- reduce duplicated result-shaping in `app.js`

**Step 4: Run test to verify it passes**

Run:
- `node "scripts/engine-correctness-audit.js"`
- `node --check app.js`
Expected: harness stays green and `app.js` parses cleanly

**Step 5: Commit**

```bash
git add app.js scripts/engine-correctness-audit.js expression-engine.js
git commit -m "refactor: use expression result package in app"
```

### Task 3: Add a structured polynomial comparison package helper

**Files:**
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\poly-engine.js`
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\scripts\engine-correctness-audit.js`

**Step 1: Write the failing test**

Define the missing contract: Module III still relies on `app.js` to assemble a large comparison object from separate engine calls.

**Step 2: Run test to verify it fails**

Run: `rg -n "evaluateApproxFinal|evaluateApprox\(|comparison package|polyComparison" poly-engine.js app.js`
Expected: no engine-owned structured polynomial comparison package exists yet

**Step 3: Write minimal implementation**

- add one polynomial-engine helper that returns the comparison package
- include canonical polynomial, path type, exact/reference value, final-only package, Horner package, and Direct package
- keep the current method outputs intact inside the package

**Step 4: Run test to verify it passes**

Run: `node "scripts/engine-correctness-audit.js"`
Expected: the full harness still passes after the helper exists

**Step 5: Commit**

```bash
git add poly-engine.js scripts/engine-correctness-audit.js
git commit -m "refactor: add polynomial comparison package helper"
```

### Task 4: Update Module III app flow to consume the polynomial package

**Files:**
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\app.js`

**Step 1: Write the failing test**

Define the current problem: `computePolynomialModule` still builds most of the comparison structure directly in `app.js`.

**Step 2: Run test to verify it fails**

Run: `rg -n "state\.polyComparison = \{|P\.evaluateExact\(|P\.evaluateApproxFinal\(|P\.evaluateApprox\(" app.js`
Expected: Module III still assembles the comparison shape locally

**Step 3: Write minimal implementation**

- update Module III flow to consume the engine-provided comparison package
- keep rendering, method selection, and imports working
- reduce duplicated comparison assembly in `app.js`

**Step 4: Run test to verify it passes**

Run:
- `node "scripts/engine-correctness-audit.js"`
- `node --check app.js`
Expected: the harness stays green and `app.js` parses cleanly

**Step 5: Commit**

```bash
git add app.js poly-engine.js
git commit -m "refactor: use polynomial result package in app"
```

### Task 5: Refresh findings and verify the boundary cleanup

**Files:**
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\docs\plans\2026-03-15-engine-correctness-audit-findings.md`
- Verify: `C:\Users\Emmy Lou\Downloads\New folder (16)\scripts\engine-correctness-audit.js`
- Verify: `C:\Users\Emmy Lou\Downloads\New folder (16)\app.js`

**Step 1: Write the failing test**

Define the completion bar:

- the 36-case harness still passes
- findings note that the engine boundary is cleaner
- `app.js` result-shaping is reduced for Module I and Module III

**Step 2: Run test to verify it fails**

Run:
- `node "scripts/engine-correctness-audit.js"`
- `git diff --check -- expression-engine.js poly-engine.js app.js scripts/engine-correctness-audit.js docs/plans/2026-03-15-engine-correctness-audit-findings.md`
Expected: at least one required cleanup step is still missing before the pass is complete

**Step 3: Write minimal implementation**

- update the findings doc summary for the new boundary state
- make only any final minimal cleanup required by verification

**Step 4: Run test to verify it passes**

Run:
- `node "scripts/engine-correctness-audit.js"`
- `node --check app.js`
- `git diff --check -- expression-engine.js poly-engine.js app.js scripts/engine-correctness-audit.js docs/plans/2026-03-15-engine-correctness-audit-findings.md`

Expected:
- the full harness still passes
- `app.js` parses cleanly
- diff formatting is clean
- the findings doc reflects the successful contract cleanup

**Step 5: Commit**

```bash
git add expression-engine.js poly-engine.js app.js scripts/engine-correctness-audit.js docs/plans/2026-03-15-engine-correctness-audit-findings.md
git commit -m "refactor: clean up engine result package boundaries"
```
