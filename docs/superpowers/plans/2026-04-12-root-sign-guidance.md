# Root Sign Guidance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the root solver's sign controls explain exact versus machine signs before asking the user to choose settings.

**Architecture:** This is a copy and markup refinement only. The bisection engine and dropdown values stay unchanged; `index.html` provides the static instructional text and `app.js` keeps the dynamic recommendation note in plain student-facing language.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, existing Node audit scripts.

---

### Task 1: Rewrite the Root Sign Guidance Copy

**Files:**
- Modify: `C:\Users\Emmy Lou\Downloads\Numerical_Analysis_Final_ver-master\index.html:881-887`
- Modify: `C:\Users\Emmy Lou\Downloads\Numerical_Analysis_Final_ver-master\app.js:2806-2821`
- Test: `C:\Users\Emmy Lou\Downloads\Numerical_Analysis_Final_ver-master\scripts\root-engine-audit.js`
- Test: `C:\Users\Emmy Lou\Downloads\Numerical_Analysis_Final_ver-master\scripts\engine-correctness-audit.js`

- [ ] **Step 1: Update the static panel explanation**

Replace the current advanced sign panel copy with:

```html
<details class="root-advanced-options disclosure disclosure-secondary">
  <summary>How should signs be handled?</summary>
  <p class="root-sign-guide focus-note">Bisection checks the signs of <code>f(a)</code>, <code>f(b)</code>, and <code>f(c)</code> to decide which half of the interval keeps the root. Exact signs use the real mathematical value. Machine signs use the chopped or rounded value from your selected digit rule.</p>
  <div class="root-advanced-grid">
    <label>Signs shown in the table<select id="root-sign-display"><option value="both" selected>Exact and machine signs</option><option value="machine">Machine signs only</option><option value="exact">Exact signs only</option></select></label>
    <label>Signs used to choose the next interval<select id="root-decision-basis"><option value="machine">Machine signs decide</option><option value="exact" selected>Exact signs decide</option></select></label>
  </div>
  <p id="root-reasoning-note" class="focus-note">Recommended for most textbook solutions: show both signs, but let exact signs choose the interval. Choose machine signs only if your professor asks every bisection decision to follow chopping or rounding.</p>
</details>
```

- [ ] **Step 2: Update the dynamic recommendation text**

Replace `updateRootReasoningNote()` with:

```js
function updateRootReasoningNote() {
  const signDisplay = byId("root-sign-display").value;
  const decisionBasis = byId("root-decision-basis").value;
  const basisNote = decisionBasis === "machine"
    ? "Machine signs will choose the next interval, so each bisection decision follows the selected chopping or rounding rule."
    : "Exact signs will choose the next interval, which matches the usual textbook bisection path.";
  let displayNote = " Showing both exact and machine signs is the clearest option because the table can show whether finite precision changes a sign.";
  if (signDisplay === "machine") {
    displayNote = " Showing machine signs only is useful when the solution must follow finite-digit arithmetic at every sign check.";
  } else if (signDisplay === "exact") {
    displayNote = " Showing exact signs only is useful when the solution should focus on the mathematical bisection path.";
  }
  setContent("root-reasoning-note", basisNote + displayNote, false);
}
```

- [ ] **Step 3: Add spacing for the new explanatory paragraph**

Add this CSS near the existing `.module-root` rules:

```css
.module-root .root-sign-guide {
  margin: 0;
  padding: var(--space-3) var(--space-3) 0;
}
```

- [ ] **Step 4: Run the expression audit**

Run: `node scripts\engine-correctness-audit.js`

Expected: `Summary: 44/44 passed`

- [ ] **Step 5: Run the root audit**

Run: `node scripts\root-engine-audit.js`

Expected: `Summary: 8/8 passed`

- [ ] **Step 6: Source-review the final wording**

Run:

```powershell
Select-String -Path 'index.html','app.js','styles.css' -Pattern 'How should signs be handled|root-sign-guide|Machine signs will choose|Exact signs will choose|Signs shown in the table|Signs used to choose the next interval'
```

Expected: each new phrase appears in the intended file and there are no old labels `Advanced sign behavior`, `Show signs as`, or `Use signs for interval decision` in the root panel.

## Self-Review

- Spec coverage: The plan changes the panel title, adds a guided explanation, renames both dropdown labels, preserves dropdown values, updates the dynamic note, and runs both existing audits.
- Placeholder scan: No TBD/TODO/fill-in placeholders remain.
- Type consistency: The plan keeps existing element IDs and option values, so existing event listeners and root-engine behavior remain compatible.
