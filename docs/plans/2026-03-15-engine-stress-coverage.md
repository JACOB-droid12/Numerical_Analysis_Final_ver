# Engine Stress Coverage Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Expand the engine audit harness with higher-risk deterministic stress cases so the numerical engine has stronger regression coverage before any architecture cleanup.

**Architecture:** Keep the current engine correctness audit as the base and extend it with additional oracle-backed case groups. Reuse the existing Node VM harness, add new named checks by category, and fold the results into the existing findings document rather than scattering audit notes across multiple places.

**Tech Stack:** Static JavaScript engines, Node.js, PowerShell, ripgrep

---

### Task 1: Add repeating-decimal stress cases

**Files:**
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\scripts\engine-correctness-audit.js`
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\docs\plans\2026-03-15-engine-correctness-audit-findings.md`

**Step 1: Write the failing test**

Define the missing checks:

- `1/3` chop storage
- `1/3` round storage
- normalized-form consistency for those stored values

**Step 2: Run test to verify it fails**

Run: `node "scripts/engine-correctness-audit.js"`
Expected: the harness has no named repeating-decimal checks yet

**Step 3: Write minimal implementation**

- add a repeating-decimal case group
- record expected stored outputs explicitly
- update the findings doc with the result summary

**Step 4: Run test to verify it passes**

Run: `node "scripts/engine-correctness-audit.js"`
Expected: repeating-decimal checks appear with explicit outcomes

**Step 5: Commit**

```bash
git add scripts/engine-correctness-audit.js docs/plans/2026-03-15-engine-correctness-audit-findings.md
git commit -m "test: add repeating-decimal engine audit cases"
```

### Task 2: Add negative-value and exponent-shift cases

**Files:**
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\scripts\engine-correctness-audit.js`
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\docs\plans\2026-03-15-engine-correctness-audit-findings.md`

**Step 1: Write the failing test**

Define the missing checks:

- one negative multiply or divide case
- one strong exponent-shift case
- explicit expected sign and normalization behavior

**Step 2: Run test to verify it fails**

Run: `node "scripts/engine-correctness-audit.js"`
Expected: those named cases do not exist yet

**Step 3: Write minimal implementation**

- add negative-value stress checks
- add exponent-shift stress checks
- record whether chop and round stay mathematically consistent
- update the findings doc with the outcomes

**Step 4: Run test to verify it passes**

Run: `node "scripts/engine-correctness-audit.js"`
Expected: negative-value and exponent-shift checks are present and classified

**Step 5: Commit**

```bash
git add scripts/engine-correctness-audit.js docs/plans/2026-03-15-engine-correctness-audit-findings.md
git commit -m "test: add negative and exponent-shift engine cases"
```

### Task 3: Add scalar-vs-calc parity checks

**Files:**
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\scripts\engine-correctness-audit.js`
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\docs\plans\2026-03-15-engine-correctness-audit-findings.md`

**Step 1: Write the failing test**

Define parity expectations for real-valued cases that should match across `MathEngine` and `CalcEngine`.

**Step 2: Run test to verify it fails**

Run: `node "scripts/engine-correctness-audit.js"`
Expected: the harness has no explicit scalar-vs-calc parity section yet

**Step 3: Write minimal implementation**

- add parity checks comparing scalar storage and calculator-style real storage
- compare stored decimal outputs and normalized structures where meaningful
- record any mismatch clearly as numerical mismatch or intended difference

**Step 4: Run test to verify it passes**

Run: `node "scripts/engine-correctness-audit.js"`
Expected: parity checks print explicit pass/fail outcomes

**Step 5: Commit**

```bash
git add scripts/engine-correctness-audit.js docs/plans/2026-03-15-engine-correctness-audit-findings.md
git commit -m "test: add scalar and calc parity checks"
```

### Task 4: Add harder polynomial sensitivity cases

**Files:**
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\scripts\engine-correctness-audit.js`
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\docs\plans\2026-03-15-engine-correctness-audit-findings.md`

**Step 1: Write the failing test**

Define the missing checks:

- one near-root polynomial sensitivity case
- one cancellation-heavy polynomial case
- expected relationship among Horner, Direct, and final-only results

**Step 2: Run test to verify it fails**

Run: `node "scripts/engine-correctness-audit.js"`
Expected: the current polynomial section does not cover these harder cases yet

**Step 3: Write minimal implementation**

- add the two harder polynomial cases
- classify agreement or divergence carefully
- update the findings doc with what the cases prove

**Step 4: Run test to verify it passes**

Run: `node "scripts/engine-correctness-audit.js"`
Expected: the new polynomial sensitivity cases appear with explicit outcomes

**Step 5: Commit**

```bash
git add scripts/engine-correctness-audit.js docs/plans/2026-03-15-engine-correctness-audit-findings.md
git commit -m "test: add harder polynomial sensitivity cases"
```

### Task 5: Refresh findings and next-step recommendations

**Files:**
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\docs\plans\2026-03-15-engine-correctness-audit-findings.md`

**Step 1: Write the failing test**

Define the missing summary state: the findings doc should reflect the expanded coverage and reprioritize next steps based on the new results.

**Step 2: Run test to verify it fails**

Run: `rg -n "repeating|negative|parity|near-root|cancellation-heavy" "docs/plans/2026-03-15-engine-correctness-audit-findings.md"`
Expected: the expanded stress-case coverage is missing or incomplete

**Step 3: Write minimal implementation**

- add the new hard-problem results
- update the top 5 improvements
- update residual risks based on what remains untested

**Step 4: Run test to verify it passes**

Run: `rg -n "repeating|negative|parity|near-root|cancellation-heavy" "docs/plans/2026-03-15-engine-correctness-audit-findings.md"`
Expected: the findings doc reflects the new stress coverage

**Step 5: Commit**

```bash
git add docs/plans/2026-03-15-engine-correctness-audit-findings.md
git commit -m "docs: refresh engine stress audit findings"
```

### Task 6: Final verification of the expanded harness

**Files:**
- Verify: `C:\Users\Emmy Lou\Downloads\New folder (16)\scripts\engine-correctness-audit.js`
- Verify: `C:\Users\Emmy Lou\Downloads\New folder (16)\docs\plans\2026-03-15-engine-correctness-audit-findings.md`

**Step 1: Write the failing test**

Define the completion bar:

- expanded stress cases run successfully
- findings doc matches the expanded harness output
- remaining risks are clearly called out

**Step 2: Run test to verify it fails**

Run:
- `node "scripts/engine-correctness-audit.js"`
- `git diff --check -- scripts/engine-correctness-audit.js docs/plans/2026-03-15-engine-correctness-audit-findings.md`

Expected: at least one required addition is missing before the pass is complete

**Step 3: Write minimal implementation**

No additional code unless verification reveals a gap in the harness or findings document.

**Step 4: Run test to verify it passes**

Run:
- `node "scripts/engine-correctness-audit.js"`
- `git diff --check -- scripts/engine-correctness-audit.js docs/plans/2026-03-15-engine-correctness-audit-findings.md`

Expected:
- the expanded harness runs successfully
- diff formatting is clean
- the findings doc reflects the new stress coverage accurately

**Step 5: Commit**

```bash
git add scripts/engine-correctness-audit.js docs/plans/2026-03-15-engine-correctness-audit-findings.md
git commit -m "test: verify expanded engine stress coverage"
```
