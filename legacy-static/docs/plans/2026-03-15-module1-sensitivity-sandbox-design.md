# Module I Sensitivity Sandbox Design

## Summary

This pass adds a compact sensitivity sandbox to Module I. After a student computes an expression, the app should let them try a different `k` or machine rule and instantly compare how the machine result changes without overwriting the main result.

The sandbox is meant to answer one learning question clearly: `How sensitive is this expression to the machine settings?`

## Problem

Right now, students can compute a machine result, but they do not have a lightweight way to test how much that result depends on the chosen precision or rule.

That makes it harder to build intuition for:

- how smaller `k` changes a result
- how chopping and rounding can diverge
- whether an expression is stable or sensitive under machine arithmetic

## Goals

- Add a simple Module I sandbox after results appear.
- Let students compare the current result to one alternate setting.
- Keep the main result unchanged and authoritative.
- Reuse the existing Module I calculation logic.

## Non-Goals

- No new math engine.
- No always-visible simulator on the main screen before calculation.
- No large parameter sweep or charting system in this first pass.
- No changes to Module II or Module III yet.

## Chosen Approach

### Inline post-result sandbox

Show a compact sensitivity panel directly under the Module I result area only after a calculation exists.

The sandbox will reuse the current expression and let the student vary:

- alternate `k`
- alternate machine rule

It will then show:

- the current main machine answer
- the sandbox comparison answer
- a short plain-language note describing whether the result changed noticeably

This was chosen because it keeps the experiment tightly connected to the exact result the student just saw.

## UI Design

### Placement

Place the sandbox directly below Module I results and before deeper advanced details.

### Inputs

The sandbox should show:

- current expression reference
- current settings summary
- alternate `k`
- alternate rule
- a `Compare sensitivity` action

### Output

The sandbox result should show:

- current machine answer
- sandbox machine answer
- short change note such as:
  - `Changing k from 8 to 4 changed p* noticeably.`
  - `Switching from chopping to rounding did not change p* for this expression.`

## Behavior

- The sandbox should only appear after Module I has a valid computed result.
- It should not replace or overwrite the main Module I result.
- It should reuse the existing Module I expression and exact computation path.
- If the alternate settings match the current settings, the note should say that no comparison change was requested.

## Files Affected

- `C:\Users\Emmy Lou\Downloads\New folder (16)\index.html`
- `C:\Users\Emmy Lou\Downloads\New folder (16)\app.js`
- `C:\Users\Emmy Lou\Downloads\New folder (16)\styles.css`

## Verification

Before calling this complete:

- confirm the sandbox appears only after Module I calculation
- confirm changing `k` or rule produces a comparison result
- confirm the main Module I result does not change
- confirm the sandbox language stays simple and student-friendly
