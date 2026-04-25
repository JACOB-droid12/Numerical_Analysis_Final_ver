# Simple Bisection Sign Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the bisection sign controls textbook-first by showing a simple default note and hiding exact/machine sign controls behind an advanced disclosure.

**Architecture:** This is a copy and hierarchy change only. `index.html` changes the visible panel text, `app.js` keeps the dynamic advanced note concise, and `styles.css` adjusts spacing for the simplified note while preserving existing IDs and option values.

**Tech Stack:** Static HTML, CSS, vanilla JavaScript, existing Node audit scripts.

---

### Task 1: Simplify the Sign Controls

**Files:**
- Modify: `C:\Users\Emmy Lou\Downloads\Numerical_Analysis_Final_ver-master\index.html:881-888`
- Modify: `C:\Users\Emmy Lou\Downloads\Numerical_Analysis_Final_ver-master\app.js:2807-2820`
- Modify: `C:\Users\Emmy Lou\Downloads\Numerical_Analysis_Final_ver-master\styles.css:3096-3104`
- Test: `C:\Users\Emmy Lou\Downloads\Numerical_Analysis_Final_ver-master\scripts\engine-correctness-audit.js`
- Test: `C:\Users\Emmy Lou\Downloads\Numerical_Analysis_Final_ver-master\scripts\root-engine-audit.js`

- [ ] **Step 1: Rewrite the root sign panel markup**

Replace the current sign guidance panel with this markup:

```html
<p class="root-textbook-note focus-note">Textbook default: the next interval is chosen using the usual sign-change rule. The table shows the function signs so you can check each bisection step.</p>

<details class="root-advanced-options disclosure disclosure-secondary">
  <summary>Finite-precision sign options (advanced)</summary>
  <p class="root-sign-guide focus-note">Only change these if your professor asks bisection decisions to follow chopped or rounded signs. Otherwise, keep the textbook default.</p>
  <div class="root-advanced-grid">
    <label>Signs shown in the table<select id="root-sign-display"><option value="both" selected>Exact and machine signs</option><option value="machine">Machine signs only</option><option value="exact">Exact signs only</option></select></label>
    <label>Signs used to choose the next interval<select id="root-decision-basis"><option value="machine">Machine signs decide</option><option value="exact" selected>Exact signs decide</option></select></label>
  </div>
  <p id="root-reasoning-note" class="focus-note">Textbook default is selected: show both sign checks, then choose the next interval using the usual mathematical sign-change rule.</p>
</details>
```

- [ ] **Step 2: Update dynamic advanced note text**

Replace `updateRootReasoningNote()` with:

```js
function updateRootReasoningNote() {
  const signDisplay = byId("root-sign-display").value;
  const decisionBasis = byId("root-decision-basis").value;
  const basisNote = decisionBasis === "machine"
    ? "Advanced mode: machine signs choose the next interval after chopping or rounding."
    : "Textbook default: exact signs choose the next interval using the usual sign-change rule.";
  let displayNote = " The table shows both exact and machine signs for comparison.";
  if (signDisplay === "machine") {
    displayNote = " The table shows machine signs only.";
  } else if (signDisplay === "exact") {
    displayNote = " The table shows exact signs only.";
  }
  setContent("root-reasoning-note", basisNote + displayNote, false);
}
```

- [ ] **Step 3: Update CSS for the simplified note**

Replace the `.module-root .root-sign-guide` selector with:

```css
.module-root .root-textbook-note,
.module-root .root-sign-guide {
  margin: 0;
  padding: var(--space-3) var(--space-3) 0;
}
```

- [ ] **Step 4: Run expression audit**

Run: `node scripts\engine-correctness-audit.js`

Expected: `Summary: 44/44 passed`

- [ ] **Step 5: Run root audit**

Run: `node scripts\root-engine-audit.js`

Expected: `Summary: 8/8 passed`

- [ ] **Step 6: Source-check copy**

Run:

```powershell
Select-String -Path 'index.html','app.js','styles.css' -Pattern 'Textbook default|Finite-precision sign options|How should signs be handled|Bisection checks the signs'
```

Expected: `Textbook default` and `Finite-precision sign options` appear. The old guided-panel title `How should signs be handled?` and the long visible explanation `Bisection checks the signs...` do not remain in `index.html`.

## Self-Review

- Spec coverage: The plan adds a simple visible textbook note, moves exact/machine choices behind an advanced disclosure, preserves IDs/values, and verifies with both audits.
- Placeholder scan: No placeholders remain.
- Type consistency: Existing IDs `root-sign-display`, `root-decision-basis`, and `root-reasoning-note` remain unchanged.
