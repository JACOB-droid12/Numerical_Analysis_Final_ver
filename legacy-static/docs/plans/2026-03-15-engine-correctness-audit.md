# Engine Correctness Audit Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Audit the numerical engine's highest-risk correctness behaviors, document verified findings, and produce grounded recommendations for later engine cleanup.

**Architecture:** Treat this as a targeted QA and analysis pass rather than a refactor. Build a small reproducible audit harness around the existing static JavaScript engines, compare current behavior against independently reasoned expectations, and record findings before proposing any structural engine changes.

**Tech Stack:** Static HTML, vanilla JavaScript, Node.js, PowerShell, ripgrep

---

### Task 1: Map the current engine responsibilities and audit targets

**Files:**
- Read: `C:\Users\Emmy Lou\Downloads\New folder (16)\math-engine.js`
- Read: `C:\Users\Emmy Lou\Downloads\New folder (16)\calc-engine.js`
- Read: `C:\Users\Emmy Lou\Downloads\New folder (16)\expression-engine.js`
- Read: `C:\Users\Emmy Lou\Downloads\New folder (16)\poly-engine.js`
- Create: `C:\Users\Emmy Lou\Downloads\New folder (16)\docs\plans\2026-03-15-engine-correctness-audit-findings.md`

**Step 1: Write the failing test**

Define the missing artifact: there is currently no engine audit findings document describing the mathematical assumptions and high-risk checks.

**Step 2: Run test to verify it fails**

Run: `rg -n "assumption|machine approximation|exact-path|calc-path|polynomial consistency" "docs/plans/2026-03-15-engine-correctness-audit-findings.md"`
Expected: file does not exist yet or contains no audit map

**Step 3: Write minimal implementation**

- inspect the four engine files
- record a short responsibility map for each engine
- identify the first batch of high-risk numerical behaviors to test
- write those targets into the findings document as the audit baseline

**Step 4: Run test to verify it passes**

Run: `rg -n "Machine approximation|Expression stepwise|Exact-path vs calc-path|Polynomial consistency" "docs/plans/2026-03-15-engine-correctness-audit-findings.md"`
Expected: the findings document contains the audit target sections

**Step 5: Commit**

```bash
git add docs/plans/2026-03-15-engine-correctness-audit-findings.md
git commit -m "docs: map engine audit targets"
```

### Task 2: Build a reproducible Node audit harness for targeted cases

**Files:**
- Create: `C:\Users\Emmy Lou\Downloads\New folder (16)\scripts\engine-correctness-audit.js`
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\docs\plans\2026-03-15-engine-correctness-audit-findings.md`

**Step 1: Write the failing test**

Define the first audit checks before writing the harness:

- machine approximation carry case
- chop vs round boundary case
- stepwise vs final-only divergence case
- polynomial method consistency case

**Step 2: Run test to verify it fails**

Run: `node "scripts/engine-correctness-audit.js"`
Expected: file not found or script not implemented yet

**Step 3: Write minimal implementation**

- load the existing engine files into a Node VM context
- add a small audit runner that executes named cases
- print each case, expected behavior, actual behavior, and pass/fail state
- keep the harness deterministic and easy to expand

**Step 4: Run test to verify it passes**

Run: `node "scripts/engine-correctness-audit.js"`
Expected: the script runs and prints structured named audit cases

**Step 5: Commit**

```bash
git add scripts/engine-correctness-audit.js docs/plans/2026-03-15-engine-correctness-audit-findings.md
git commit -m "test: add engine correctness audit harness"
```

### Task 3: Audit machine approximation edge cases

**Files:**
- Verify: `C:\Users\Emmy Lou\Downloads\New folder (16)\math-engine.js`
- Verify: `C:\Users\Emmy Lou\Downloads\New folder (16)\calc-engine.js`
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\scripts\engine-correctness-audit.js`
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\docs\plans\2026-03-15-engine-correctness-audit-findings.md`

**Step 1: Write the failing test**

Add explicit expected checks for:

- rounding carry across mantissa digits
- chopping at the same boundary
- zero normalization
- consistency between scalar and calculator-style storage for comparable real values

**Step 2: Run test to verify it fails**

Run: `node "scripts/engine-correctness-audit.js"`
Expected: at least one machine-approximation audit case is missing or marked unverified

**Step 3: Write minimal implementation**

- add the machine-approximation cases to the harness
- derive expected outputs independently and record them in the findings doc
- note whether each case passes, fails, or remains ambiguous

**Step 4: Run test to verify it passes**

Run: `node "scripts/engine-correctness-audit.js"`
Expected: machine-approximation cases all report explicit outcomes

**Step 5: Commit**

```bash
git add scripts/engine-correctness-audit.js docs/plans/2026-03-15-engine-correctness-audit-findings.md
git commit -m "test: audit machine approximation edge cases"
```

### Task 4: Audit expression stepwise and exact/calc-path behavior

**Files:**
- Verify: `C:\Users\Emmy Lou\Downloads\New folder (16)\expression-engine.js`
- Verify: `C:\Users\Emmy Lou\Downloads\New folder (16)\calc-engine.js`
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\scripts\engine-correctness-audit.js`
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\docs\plans\2026-03-15-engine-correctness-audit-findings.md`

**Step 1: Write the failing test**

Define expected cases showing:

- stepwise storage can diverge from final-only when intermediate storage matters
- exact-compatible expressions stay on the exact path
- calc-only expressions or special-function cases fall back consistently

**Step 2: Run test to verify it fails**

Run: `node "scripts/engine-correctness-audit.js"`
Expected: expression-path cases are missing or incomplete

**Step 3: Write minimal implementation**

- add targeted Module I expression cases
- capture exact path, calc path, and stepwise trace behavior
- document whether the switch between exact and calc paths is predictable

**Step 4: Run test to verify it passes**

Run: `node "scripts/engine-correctness-audit.js"`
Expected: expression audit cases report clear expected and actual behavior

**Step 5: Commit**

```bash
git add scripts/engine-correctness-audit.js docs/plans/2026-03-15-engine-correctness-audit-findings.md
git commit -m "test: audit expression engine correctness paths"
```

### Task 5: Audit polynomial consistency and shared machine-rule behavior

**Files:**
- Verify: `C:\Users\Emmy Lou\Downloads\New folder (16)\poly-engine.js`
- Verify: `C:\Users\Emmy Lou\Downloads\New folder (16)\math-engine.js`
- Verify: `C:\Users\Emmy Lou\Downloads\New folder (16)\calc-engine.js`
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\scripts\engine-correctness-audit.js`
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\docs\plans\2026-03-15-engine-correctness-audit-findings.md`

**Step 1: Write the failing test**

Define expected polynomial checks for:

- Horner and Direct sharing the same machine-rule semantics
- intentional divergence between stepwise methods and final-only
- consistency of stored-step logic with Module I machine arithmetic

**Step 2: Run test to verify it fails**

Run: `node "scripts/engine-correctness-audit.js"`
Expected: polynomial audit cases are missing or incomplete

**Step 3: Write minimal implementation**

- add polynomial comparison cases to the harness
- record where divergence is expected and where inconsistency would be a bug
- summarize any mismatch between polynomial and expression machine semantics

**Step 4: Run test to verify it passes**

Run: `node "scripts/engine-correctness-audit.js"`
Expected: polynomial audit cases print clear outcomes

**Step 5: Commit**

```bash
git add scripts/engine-correctness-audit.js docs/plans/2026-03-15-engine-correctness-audit-findings.md
git commit -m "test: audit polynomial engine consistency"
```

### Task 6: Summarize findings and propose the next maintainability pass

**Files:**
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\docs\plans\2026-03-15-engine-correctness-audit-findings.md`

**Step 1: Write the failing test**

Define the missing end state: the audit document does not yet separate immediate fixes, intended behaviors, and later refactor targets.

**Step 2: Run test to verify it fails**

Run: `rg -n "Fix now|Document as intended|Refactor later|Recommended engine boundaries" "docs/plans/2026-03-15-engine-correctness-audit-findings.md"`
Expected: summary sections are missing or incomplete

**Step 3: Write minimal implementation**

- classify all findings
- recommend which issues should be fixed first
- identify the engine boundaries that should be cleaned up in the next architecture pass

**Step 4: Run test to verify it passes**

Run: `rg -n "Fix now|Document as intended|Refactor later|Recommended engine boundaries" "docs/plans/2026-03-15-engine-correctness-audit-findings.md"`
Expected: the findings document ends with actionable next-step recommendations

**Step 5: Commit**

```bash
git add docs/plans/2026-03-15-engine-correctness-audit-findings.md
git commit -m "docs: summarize engine audit findings"
```

### Task 7: Final verification of the audit artifacts

**Files:**
- Verify: `C:\Users\Emmy Lou\Downloads\New folder (16)\scripts\engine-correctness-audit.js`
- Verify: `C:\Users\Emmy Lou\Downloads\New folder (16)\docs\plans\2026-03-15-engine-correctness-audit-findings.md`

**Step 1: Write the failing test**

Define the complete audit bar:

- the harness runs cleanly
- the findings document records expectations and results
- the follow-up recommendations are concrete enough to drive a refactor plan

**Step 2: Run test to verify it fails**

Run:
- `node "scripts/engine-correctness-audit.js"`
- `git diff --check -- scripts/engine-correctness-audit.js docs/plans/2026-03-15-engine-correctness-audit-findings.md`

Expected: at least one required artifact is missing before completion

**Step 3: Write minimal implementation**

No additional code unless verification reveals a gap in the harness or findings summary.

**Step 4: Run test to verify it passes**

Run:
- `node "scripts/engine-correctness-audit.js"`
- `git diff --check -- scripts/engine-correctness-audit.js docs/plans/2026-03-15-engine-correctness-audit-findings.md`

Expected:
- the audit harness runs successfully
- diff formatting is clean
- the audit artifacts are ready to drive the next engine pass

**Step 5: Commit**

```bash
git add scripts/engine-correctness-audit.js docs/plans/2026-03-15-engine-correctness-audit-findings.md
git commit -m "test: verify engine correctness audit artifacts"
```
