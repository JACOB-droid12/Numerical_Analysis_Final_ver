# Root Math Preview Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Roots function input refresh the existing parsed math preview while typing.

**Architecture:** `root-expression` is already registered in `PREVIEW_FIELDS`, so only the Roots reset flow in `app.js` needs to call the shared preview sync. No HTML, CSS, or root-engine changes are required unless verification reveals a placement issue.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, existing math-display preview system, existing Node audit scripts.

---

### Task 1: Refresh Root Math Preview

**Files:**
- Modify: `C:\Users\Emmy Lou\Downloads\Numerical_Analysis_Final_ver-master\app.js`
- Test: `C:\Users\Emmy Lou\Downloads\Numerical_Analysis_Final_ver-master\scripts\engine-correctness-audit.js`
- Test: `C:\Users\Emmy Lou\Downloads\Numerical_Analysis_Final_ver-master\scripts\root-engine-audit.js`

- [ ] **Step 1: Update root reset flow**

Inside `debouncedRootReset`, after `updateRootReasoningNote();`, add:

```js
syncMathPreviews();
```

- [ ] **Step 2: Run expression audit**

Run: `node scripts\engine-correctness-audit.js`

Expected: `Summary: 44/44 passed`

- [ ] **Step 3: Run root audit**

Run: `node scripts\root-engine-audit.js`

Expected: `Summary: 8/8 passed`

- [ ] **Step 4: Source-check**

Run:

```powershell
Select-String -Path 'app.js' -Pattern 'debouncedRootReset|syncMathPreviews'
```

Expected: `syncMathPreviews()` appears in the root reset flow.

## Self-Review

- Spec coverage: The plan refreshes the already-registered root preview while typing.
- Placeholder scan: No placeholders remain.
- Type consistency: The plan uses existing `syncMathPreviews()` and existing `root-expression` preview config.
