# Symbol Popover Cleanup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the always-visible symbol rows with one icon-only symbol popover so the calculator input stays clean while symbols remain easy to insert.

**Architecture:** Keep the current parsing and insertion behavior, but move symbol access behind a shared compact popover component. Reuse the existing utility-popover language and track the last active input so symbol insertion still works naturally in Module I and Module III without cluttering the main input surface.

**Tech Stack:** Static HTML/CSS/JS, existing browser-side input insertion logic, utility popover styling, Playwright/browser smoke tests.

---

### Task 1: Lock the scope and current symbol entrypoints

**Files:**
- Inspect: `C:/Users/Emmy Lou/Downloads/New folder (16)/index.html`
- Inspect: `C:/Users/Emmy Lou/Downloads/New folder (16)/app.js`
- Inspect: `C:/Users/Emmy Lou/Downloads/New folder (16)/styles.css`

**Step 1: Locate the current symbol rows**
Identify the currently visible symbol strips in:
- Module I main expression controls
- Module III polynomial controls
- Module III `x` row if present

**Step 2: Lock the supported symbol set**
The popover must expose exactly:
- `π`
- `e`
- `i`
- `√(`
- `∠`

**Step 3: Confirm insertion behavior source**
Locate the existing symbol-button insertion logic in `app.js`, including:
- active input tracking
- cursor insertion behavior
- any helper like `insertTokenAtCursor`

**Step 4: Confirm popover scope**
Apply the new symbol popover to:
- Module I main expression input
- Module III polynomial input
- Module III `x` input only if it currently has symbol support and that support is worth preserving

**Step 5: Commit**
```bash
git add -N "C:/Users/Emmy Lou/Downloads/New folder (16)/index.html" "C:/Users/Emmy Lou/Downloads/New folder (16)/app.js" "C:/Users/Emmy Lou/Downloads/New folder (16)/styles.css"
git commit --allow-empty -m "chore: lock symbol popover scope"
```

### Task 2: Replace inline symbol rows with icon-only triggers

**Files:**
- Modify: `C:/Users/Emmy Lou/Downloads/New folder (16)/index.html`

**Step 1: Remove the always-visible symbol rows from the main input surface**
Delete the inline symbol strips from the main calculator-band layouts.

**Step 2: Add one icon-only trigger per supported input band**
Add a compact icon-only button to the right side of the input band for:
- Module I expression input
- Module III polynomial input
- Module III `x` input if retained

Each trigger must:
- have a clean accessible label like `Open symbols`
- visually match the calculator tool language
- not read like a settings button

**Step 3: Add the shared symbol popover markup**
Create one shared popover structure in the page, not one copy per input.
It should contain the five symbol buttons and be positioned relative to the last-opened trigger.

**Step 4: Keep the rest of the calculator structure unchanged**
Do not move other controls, result areas, or utility menus in this pass.

**Step 5: Commit**
```bash
git add "C:/Users/Emmy Lou/Downloads/New folder (16)/index.html"
git commit -m "feat: replace inline symbol rows with icon triggers"
```

### Task 3: Implement shared symbol popover behavior

**Files:**
- Modify: `C:/Users/Emmy Lou/Downloads/New folder (16)/app.js`

**Step 1: Track the last active compatible input**
Keep or improve active-input tracking so symbol insertion goes to the field the user was editing most recently.

**Step 2: Open the shared popover from any symbol trigger**
Implement a small controller that:
- opens the popover when a trigger is clicked
- positions it relative to the clicked trigger
- remembers the associated input target
- closes any previously open symbol popover state

**Step 3: Insert symbols on click**
Clicking a symbol must:
- insert the matching plain-text token into the active input at the cursor position
- keep the input parseable
- restore focus to the input after insertion

Recommended insertion mapping:
- `π` -> `pi`
- `e` -> `e`
- `i` -> `i`
- `√(` -> `sqrt(`
- `∠` -> `∠`

**Step 4: Add close behavior**
The popover should close on:
- outside click
- `Escape`
- optional auto-close after insertion if that feels clearly better in testing

**Step 5: Do not break existing utility popovers**
Keep the symbol popover independent from `Settings` and `Catalog`, but compatible with their existing mutually exclusive behavior if needed.

**Step 6: Run syntax check**
Run:
```bash
node --check "C:/Users/Emmy Lou/Downloads/New folder (16)/app.js"
```
Expected:
- success with no output

**Step 7: Commit**
```bash
git add "C:/Users/Emmy Lou/Downloads/New folder (16)/app.js"
git commit -m "feat: add shared symbol popover behavior"
```

### Task 4: Style the popover and clean the input band

**Files:**
- Modify: `C:/Users/Emmy Lou/Downloads/New folder (16)/styles.css`

**Step 1: Add one canonical symbol-trigger style**
Create a compact calculator-style trigger that:
- fits the current input band
- is visually quieter than the main `=` action
- reads as a tool, not a primary action

**Step 2: Add one canonical symbol-popover style**
The popover should:
- feel related to `Settings` / `Catalog`
- be smaller and tighter than content panels
- support 5 symbol buttons cleanly
- remain usable on touch screens

**Step 3: Remove layout debt from the old inline rows**
Delete or neutralize CSS tied only to the old always-visible symbol strips if it is no longer used.

**Step 4: Keep the main input row cleaner**
Ensure the input band now reads as:
- input
- icon-only symbol trigger
- calculate button
with no leftover spacing artifacts from the removed symbol row.

**Step 5: Commit**
```bash
git add "C:/Users/Emmy Lou/Downloads/New folder (16)/styles.css"
git commit -m "style: add compact symbol popover and cleaner input bands"
```

### Task 5: Verify behavior and regression

**Files:**
- Test live app at: `http://192.168.1.9:4173/index.html`
- Test: `C:/Users/Emmy Lou/Downloads/New folder (16)/app.js`
- Test: `C:/Users/Emmy Lou/Downloads/New folder (16)/index.html`
- Test: `C:/Users/Emmy Lou/Downloads/New folder (16)/styles.css`

**Step 1: Browser interaction checks**
Verify:
- clicking the icon opens the symbol popover
- clicking a symbol inserts into the correct input
- focus returns to the input
- outside click closes the popover
- `Escape` closes the popover

**Step 2: Module-specific checks**
- Module I:
  - insert `pi`, `sqrt(`, and `∠` into the main expression field
- Module III:
  - insert `x`-adjacent symbols into the polynomial field
  - if supported, verify the `x` input also receives inserted symbols correctly

**Step 3: Visual checks**
Confirm:
- the main input interface is visibly less cluttered
- the popover feels like part of the calculator, not a separate panel
- the trigger is discoverable but not dominant

**Step 4: Regression checks**
Verify that:
- existing calculations still run
- no answer-selection wording changes
- `Settings` and `Catalog` still behave correctly
- the `x` field keeps a clean accessible name
- no new console errors are introduced

**Step 5: Final commit**
```bash
git add "C:/Users/Emmy Lou/Downloads/New folder (16)/index.html" "C:/Users/Emmy Lou/Downloads/New folder (16)/app.js" "C:/Users/Emmy Lou/Downloads/New folder (16)/styles.css"
git commit -m "feat: declutter inputs with shared symbol popover"
```

## Important interface changes
- The always-visible symbol rows are removed from the main input surface.
- Symbol insertion stays available through one icon-only trigger and a shared popover.
- No parsing, arithmetic, or answer logic changes.

## Test cases and scenarios
- Open and close the symbol popover from Module I
- Insert `pi`, `e`, `i`, `sqrt(`, and `∠`
- Repeat in Module III
- Confirm calculations still work after inserted symbols
- Confirm the input row is visibly cleaner than before

## Assumptions
- We are implementing the approved design: **icon-only shared symbol popover**.
- The symbol popover remains on the same calculator surface, not hidden in `Tools`.
- Plain-text tokens remain the parser source of truth.
- The goal is to reduce clutter without making symbols hard to reach.
