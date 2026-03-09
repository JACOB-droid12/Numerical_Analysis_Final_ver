# Result Workflow Guidance Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Improve the result experience in all three modules by adding plain-language interpretation and clearer next-step guidance without changing any numerical behavior or re-densifying the interface.

**Architecture:** Reuse the current result sections and computed state in `app.js` to populate lightweight interpretation and action guidance directly in the main workflow. Keep detailed explanations in the existing `Advanced tools` disclosures, and limit structural changes to a few new small DOM targets in `index.html` plus a focused result-guidance styling block in `styles.css`.

**Tech Stack:** Static HTML, vanilla JavaScript, CSS, existing runtime modules (`index.html`, `app.js`, `styles.css`), Playwright MCP for browser validation, Node syntax check.

---

### Task 1: Add explicit guidance targets to the main result areas

**Files:**
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\index.html`
- Inspect: `C:\Users\Emmy Lou\Downloads\New folder (16)\app.js`

**Step 1: Add a dedicated next-step row to Module I results**

Keep the existing send buttons, but group them with one lightweight explanatory label so the row reads like a next-step area rather than detached actions.

Target structure example:

```html
<div id="basic-next-steps" class="result-next-steps" hidden>
  <p class="result-label">Next step</p>
  <div class="control-actions control-actions-secondary">
    ...existing buttons...
    <button id="basic-open-trace" type="button" class="ghost">Open machine trace</button>
  </div>
</div>
```

**Step 2: Add a student-facing verdict slot to Module II**

Insert one new text slot near the top of `#error-result-stage`, for example:

```html
<p id="error-verdict" class="result-verdict is-empty">Ready to calculate</p>
```

Keep it in the main result area, not inside `Advanced tools`.

**Step 3: Add a next-step prompt to Module III**

Add one compact guidance row near the verdict/comparison area, for example:

```html
<p id="poly-next-step" class="result-next-step is-empty" hidden>Ready to calculate</p>
```

Optionally add one lightweight action button only if it can reuse an existing disclosure cleanly.

**Step 4: Keep changes minimal**

Do not introduce heavy new cards, banners, or additional accordions. Add only the smallest new DOM needed for result interpretation and next-step guidance.

**Step 5: Commit**

```bash
git add index.html
git commit -m "feat: add result-guidance targets to module outputs"
```

### Task 2: Drive Module I guidance and next-step behavior from existing state

**Files:**
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\app.js`
- Inspect: `C:\Users\Emmy Lou\Downloads\New folder (16)\index.html`

**Step 1: Add Module I guidance IDs to the managed state/reset flow**

Update the relevant reset/show-hide logic so the new Module I next-step area hides when no expression result exists.

**Step 2: Replace the old answer-guide message with clearer computed guidance**

Use a plain-language sentence such as:
- `Use the stepwise machine answer for machine-arithmetic exercises.`
- `Use the final-only machine answer only when the whole exact expression is rounded or chopped once at the end.`

If needed, generate the second sentence dynamically based on the selected rule.

**Step 3: Wire the new `Open machine trace` action**

Add a click handler that opens the Module I `Machine trace` disclosure and focuses it if possible.

Expected behavior:
- button appears only when expression results exist
- clicking it opens the existing trace panel
- no duplicate trace content is created

**Step 4: Keep the existing send actions intact**

Ensure `Send stepwise p* to Errors` and `Send final-only p* to Errors` still work exactly as before.

**Step 5: Run syntax check**

Run:

```bash
node --check "C:\Users\Emmy Lou\Downloads\New folder (16)\app.js"
```

Expected: success with no output.

**Step 6: Commit**

```bash
git add app.js index.html
git commit -m "feat: clarify module i results and next steps"
```

### Task 3: Add a plain-language quality verdict to Module II

**Files:**
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\app.js`
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\index.html`

**Step 1: Define a small verdict helper in `app.js`**

Create one focused helper that converts existing error metrics into student-facing language using current computed values.

Target bands (or similar):
- exact / essentially exact
- strong approximation
- acceptable but losing precision
- poor approximation

Base the judgment on existing relative error / significant digits data. Do not add a new math model.

**Step 2: Populate `#error-verdict` during error computation**

Use the helper after the current metrics are computed so the verdict stays in sync with the numeric result.

**Step 3: Handle special cases explicitly**

Cover:
- exact match
- `p = 0` where relative error is undefined
- complex-value note using current magnitude-based logic

The verdict should remain plain and non-blaming.

**Step 4: Reset the verdict cleanly**

When Module II inputs change or results are cleared, return the verdict slot to the empty state.

**Step 5: Commit**

```bash
git add app.js index.html
git commit -m "feat: add plain-language error verdicts"
```

### Task 4: Simplify the Module III conclusion and next-step language

**Files:**
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\app.js`
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\index.html`

**Step 1: Rewrite the first-line polynomial verdict output**

Update the existing `poly-accuracy-winner` content generation so the first sentence is simpler and more student-facing.

Examples of the intended tone:
- `Horner keeps more useful digits for this input.`
- `Both methods are effectively tied for this case.`
- `Direct evaluation loses more precision here.`

**Step 2: Keep technical support text secondary**

Retain the existing `poly-operation-winner` and `poly-sensitivity-note`, but ensure they read as supporting explanation rather than the headline conclusion.

**Step 3: Populate the next-step prompt**

Use the new Module III next-step slot to guide students toward `Advanced tools` when they want the why behind the verdict.

Target message example:
- `Open Advanced tools to inspect the method details and machine trace.`

**Step 4: Reset the prompt cleanly**

When Module III is cleared, the next-step prompt should hide or return to its empty state.

**Step 5: Commit**

```bash
git add app.js index.html
 git commit -m "feat: simplify polynomial verdict guidance"
```

### Task 5: Style result guidance so it supports, not competes

**Files:**
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\styles.css`

**Step 1: Add a focused result-guidance styling block**

Style these new/updated elements together:
- `.result-verdict`
- `.result-next-steps`
- `.result-next-step`
- updated `.answer-guide`

Target:
- more visible than muted body text
- quieter than the main numeric answer
- clearly grouped with the result area

**Step 2: Keep action hierarchy clean**

Ensure the next-step row reads as a compact continuation of the result, not as a new heavy section.

**Step 3: Verify mobile readability**

At narrow widths, the guidance text and action row should wrap cleanly and avoid turning into dense button stacks unless necessary.

**Step 4: Keep final values in the latest active CSS block**

As with the prior pass, place the final intended styles in the last active override area so the cascade is predictable.

**Step 5: Commit**

```bash
git add styles.css
 git commit -m "style: add lightweight result guidance presentation"
```

### Task 6: Verify comprehension flow and regression behavior

**Files:**
- Test: `C:\Users\Emmy Lou\Downloads\New folder (16)\index.html`
- Test: `C:\Users\Emmy Lou\Downloads\New folder (16)\app.js`
- Test: `C:\Users\Emmy Lou\Downloads\New folder (16)\styles.css`

**Step 1: Run syntax verification**

Run:

```bash
node --check "C:\Users\Emmy Lou\Downloads\New folder (16)\app.js"
```

Expected: success with no output.

**Step 2: Verify Module I workflow**

Use:
- `((1/3 + 6/5) + 0.948854) - (5/30 + 6/59)`
- `k = 8`
- `Chopping`

Confirm:
- result cards still show the same values
- answer guide uses simpler language
- next-step row appears
- `Send stepwise p* to Errors` still works
- `Open machine trace` opens the existing trace disclosure

**Step 3: Verify Module II workflow**

Import the Module I stepwise result.

Confirm:
- the new verdict appears
- it matches the existing numerical metrics
- advanced metric explanations still exist inside `Advanced tools`

**Step 4: Verify Module III workflow**

Use:
- `2x - x^3/3 + x^5/60`
- `x = 3.14159/3`
- `k = 8`
- `Rounding`

Confirm:
- the verdict reads more simply than before
- the next-step prompt appears
- detailed method info remains available in `Advanced tools`

**Step 5: Run the built-in verification check**

Open Module I `Advanced tools` → `Operation helper` → `Examples`, then run `Run required test`.

Expected output includes:
- `Exact check: PASS`
- `k=8 chop check: PASS`
- `k=8 round check: PASS`

**Step 6: Capture comparison screenshots**

Save updated screenshots for:
- Module I with results and next steps
- Module II with verdict
- Module III with simplified conclusion
- one mobile result state

Expected: the main result meaning is more obvious without making the screen busier.

**Step 7: Commit**

```bash
git add index.html app.js styles.css
 git commit -m "test: verify result workflow guidance"
```

## Important constraints

- Do not change `math-engine.js`, `calc-engine.js`, `expression-engine.js`, `poly-engine.js`, or `math-display.js`.
- Do not change numerical outputs or import semantics.
- Reuse existing state and computed metrics in `app.js`; do not create duplicate calculation paths.
- Keep `Advanced tools` as the home for detailed interpretation and traces.

## Test scenarios

- Students can tell which result to use in Module I without reading technical labels alone.
- Module II communicates approximation quality before students parse all metrics.
- Module III communicates the main winner before students inspect detailed reasoning.
- The UI remains cleaner than the pre-simplification version while being more self-explanatory.
