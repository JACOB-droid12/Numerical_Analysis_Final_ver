# Module I Sensitivity Sandbox Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a post-result sensitivity sandbox to Module I so students can compare the current machine result against one alternate `k` and rule setting without changing the main answer.

**Architecture:** Reuse the existing Module I expression computation flow and store one additional comparison result for the sandbox. Render the sandbox only when a normal Module I result exists, and keep the sandbox state visually secondary so the main result remains the primary answer.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, PowerShell

---

### Task 1: Add sandbox UI structure to Module I

**Files:**
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\index.html`

**Step 1: Write the failing test**

Inspect Module I result markup and confirm there is currently no dedicated sensitivity sandbox section.

**Step 2: Run test to verify it fails**

Run: `rg -n "sensitivity|sandbox|basic-sandbox|Compare sensitivity" index.html`
Expected: no Module I sandbox section exists yet

**Step 3: Write minimal implementation**

- add a hidden post-result sandbox section in Module I
- include alternate `k`, alternate rule, compare action, and result placeholders
- place it below the main Module I results and before deeper details

**Step 4: Run test to verify it passes**

Run: `rg -n "basic-sandbox|Compare sensitivity|alternate k|alternate rule" index.html`
Expected: the sandbox markup exists with the expected hooks

**Step 5: Commit**

```bash
git add index.html
git commit -m "feat: add module i sensitivity sandbox ui"
```

### Task 2: Wire sandbox state and comparison logic

**Files:**
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\app.js`

**Step 1: Write the failing test**

Identify that Module I currently stores only the main result and has no separate sandbox comparison state.

**Step 2: Run test to verify it fails**

Run: `rg -n "expressionComparison|basic-sandbox|sensitivity|Compare sensitivity" app.js`
Expected: no sandbox-specific state or compare handler exists yet

**Step 3: Write minimal implementation**

- add sandbox state for one alternate comparison result
- reuse the existing Module I expression computation path with alternate `k` and rule
- render current answer, sandbox answer, and a simple change note
- keep the main Module I result unchanged
- show the sandbox only when Module I has a valid result

**Step 4: Run test to verify it passes**

Run: `rg -n "basic-sandbox|compareSensitivity|sandbox" app.js`
Expected: sandbox state, compute handler, and rendering hooks exist

**Step 5: Commit**

```bash
git add app.js
git commit -m "feat: wire module i sensitivity sandbox"
```

### Task 3: Style the sandbox as a compact secondary learning panel

**Files:**
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\styles.css`

**Step 1: Write the failing test**

Record the expected visual role: the sandbox should be easy to use but visually secondary to the main result.

**Step 2: Run test to verify it fails**

Run: `rg -n "basic-sandbox|sensitivity sandbox|sandbox" styles.css`
Expected: no sandbox-specific styles exist yet

**Step 3: Write minimal implementation**

- style the sandbox as a compact post-result panel
- make the controls easy to scan
- keep the sandbox visually subordinate to the main result area
- support clean stacking on smaller widths

**Step 4: Run test to verify it passes**

Run: `rg -n "basic-sandbox|sandbox" styles.css`
Expected: sandbox-specific layout and responsive styles exist

**Step 5: Commit**

```bash
git add styles.css
git commit -m "style: add module i sensitivity sandbox"
```

### Task 4: Verify sandbox behavior and result stability

**Files:**
- Verify: `C:\Users\Emmy Lou\Downloads\New folder (16)\index.html`
- Verify: `C:\Users\Emmy Lou\Downloads\New folder (16)\app.js`
- Verify: `C:\Users\Emmy Lou\Downloads\New folder (16)\styles.css`

**Step 1: Write the failing test**

Define the expected behavior:

- sandbox appears only after Module I calculation
- alternate `k` or rule gives a comparison result
- main Module I result remains unchanged

**Step 2: Run test to verify it fails**

Inspect the current app and note that no post-result sandbox exists.

**Step 3: Write minimal implementation**

No additional code unless verification reveals a missing state/render edge case.

**Step 4: Run test to verify it passes**

Run:
- `node --check app.js`
- `git diff --check -- index.html app.js styles.css`
- manually verify the sandbox appears after a Module I calculation
- verify sandbox comparison does not overwrite the main result

Expected:
- no syntax errors
- clean diff formatting
- sandbox behaves as a secondary comparison tool
- main Module I answer remains authoritative

**Step 5: Commit**

```bash
git add index.html app.js styles.css
git commit -m "test: verify module i sensitivity sandbox"
```
