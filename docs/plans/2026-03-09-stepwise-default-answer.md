# Stepwise Default Answer Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make `Stepwise` the clearly preferred student answer across the app while preserving `Final-only` as a secondary comparison value for explicit round-once/chop-once instructions.

**Architecture:** Keep the existing numerical computations intact and update only labels, helper text, result hierarchy, and import wording in the current HTML/CSS/JS result surfaces. Reuse the existing result-guidance and verdict infrastructure so the app teaches one consistent rule: `Use Stepwise unless the problem explicitly says round/chop once at the end.`

**Tech Stack:** Static HTML, vanilla JavaScript, CSS, existing result rendering in `index.html`, `app.js`, and `styles.css`, Playwright MCP for browser validation, Node syntax check.

---

### Task 1: Reframe Module I so Stepwise reads as the main answer

**Files:**
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\index.html`
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\app.js`
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\styles.css`

**Step 1: Update the visible labels in Module I**

Adjust the Module I result labels so the stepwise answer is framed as the main machine result and the final-only value is framed as secondary.

Target direction:
- `Stepwise machine answer p*`
- `Final-only comparison`

**Step 2: Replace the current answer-guide sentence with a stronger default rule**

Use wording such as:

```text
Use the Stepwise result unless the problem explicitly says round/chop once at the end.
```

Add one short second sentence describing `Final-only` as the special case.

**Step 3: Ensure the final-only label still adapts to chop vs round mode**

Keep the current dynamic mode behavior, but make the instructional framing secondary.

**Step 4: Make the visual hierarchy match the wording**

Use existing styling hooks so the stepwise answer reads more primary than the final-only answer without hiding either.

**Step 5: Commit**

```bash
git add index.html app.js styles.css
git commit -m "feat: make stepwise the default module i answer"
```

### Task 2: Align Module II imports and supporting text with the same rule

**Files:**
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\index.html`
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\app.js`

**Step 1: Review the current import labels in Module II**

Identify the labels for:
- Module I stepwise import
- Module I final-only import
- Module III stepwise imports
- Module III final-only import

**Step 2: Reword the labels so Stepwise reads as the normal path**

Target direction:
- `Import Module I main machine p*`
- `Import Module I final-only comparison`
- similar wording for Module III where appropriate

**Step 3: Keep imported source text accurate**

When a value is imported, the source line should still identify exactly which result it came from, but the wording should reinforce that stepwise is the standard machine-arithmetic source.

**Step 4: Preserve all import behavior**

Do not change which value is imported or how Module II computes errors.

**Step 5: Commit**

```bash
git add index.html app.js
git commit -m "feat: align error-analysis imports with stepwise default"
```

### Task 3: Make Module III teach that stepwise method results are the default machine answers

**Files:**
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\index.html`
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\app.js`

**Step 1: Update the final-only wording in Module III**

Keep the final-only result visible, but label it clearly as a comparison or round-once/chop-once case.

**Step 2: Strengthen the verdict copy if needed**

Ensure the verdict continues to point students toward the better `stepwise` method result when appropriate.

**Step 3: Add or revise a short supporting line near the comparison area**

Use wording such as:

```text
Use the better Stepwise method result for most machine-arithmetic problems. Use Final-only only for one-time rounding/chopping instructions.
```

**Step 4: Keep the exact value and method details intact**

Do not change calculation outputs or the method comparison logic.

**Step 5: Commit**

```bash
git add index.html app.js
git commit -m "feat: clarify stepwise default in polynomial module"
```

### Task 4: Polish wording and hierarchy so the rule is consistent everywhere

**Files:**
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\styles.css`
- Inspect: `C:\Users\Emmy Lou\Downloads\New folder (16)\index.html`
- Inspect: `C:\Users\Emmy Lou\Downloads\New folder (16)\app.js`

**Step 1: Add any small styling adjustments needed for hierarchy**

Possible targets:
- slightly stronger emphasis for the stepwise answer card
- quieter caption treatment for final-only comparison copy
- clearer grouping between the default rule and the special-case note

**Step 2: Keep the interface calm**

Do not add banners, warning boxes, or large new cards. Keep this as a wording and hierarchy refinement pass.

**Step 3: Check narrow-screen readability**

Ensure the stronger default message remains clear on mobile.

**Step 4: Commit**

```bash
git add styles.css index.html
 git commit -m "style: reinforce stepwise answer hierarchy"
```

### Task 5: Verify the teaching rule end-to-end without changing math behavior

**Files:**
- Inspect: `C:\Users\Emmy Lou\Downloads\New folder (16)\index.html`
- Inspect: `C:\Users\Emmy Lou\Downloads\New folder (16)\app.js`
- Inspect: `C:\Users\Emmy Lou\Downloads\New folder (16)\styles.css`

**Step 1: Run syntax verification**

Run:

```bash
node --check "C:\Users\Emmy Lou\Downloads\New folder (16)\app.js"
```

Expected: success with no output.

**Step 2: Verify Module I in the browser**

Check that:
- stepwise is visually and textually the default answer
- final-only is still present but secondary
- next-step actions still work

**Step 3: Verify Module II in the browser**

Check that:
- import labels reflect the new rule
- imports still bring in the same values
- verdict and metrics remain unchanged numerically

**Step 4: Verify Module III in the browser**

Check that:
- verdict wording still points to the better stepwise method
- final-only reads as a comparison/special-case value
- advanced tools and method details still behave normally

**Step 5: Re-run the built-in required test**

Confirm the built-in verification still reports `PASS`.

**Step 6: Check browser console**

Confirm there are no new console errors.

**Step 7: Commit**

```bash
git add index.html app.js styles.css
git commit -m "test: verify stepwise default guidance"
```
