# Bisection Relative Tolerance Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Bisection-only `Tolerance type` choice so `Given tolerance ε` defaults to a lecture-aligned relative bound while keeping absolute tolerance as an explicit option.

**Architecture:** Keep the change localized to the Bisection path. The engine will carry a `toleranceType` field for Bisection epsilon runs, evaluate relative tolerance dynamically inside the Bisection loop, and preserve the current absolute-tolerance behavior as the alternate path. The UI will expose a Bisection-only selector plus lecture-oriented copy, and the result summary/solution steps will state which tolerance type was used.

**Tech Stack:** Static HTML, vanilla JavaScript, browser-side numerical engine, Node-based audit scripts

---

## File Map

- Modify: `C:/Users/Emmy Lou/Downloads/Numerical_Analysis_Final_ver-master/root-engine.js`
  - Add Bisection epsilon tolerance-type plumbing
  - Add relative-bound helper logic
  - Update Bisection stopping metadata and stop conditions
- Modify: `C:/Users/Emmy Lou/Downloads/Numerical_Analysis_Final_ver-master/root-ui.js`
  - Pass the new Bisection tolerance type into `runBisection()`
  - Show and hide the new control
  - Update Bisection summaries and solution-step wording
- Modify: `C:/Users/Emmy Lou/Downloads/Numerical_Analysis_Final_ver-master/index.html`
  - Add the Bisection-only `Tolerance type` control and lecture note
- Modify: `C:/Users/Emmy Lou/Downloads/Numerical_Analysis_Final_ver-master/styles.css`
  - Keep the extra Bisection control visually aligned with the current config grid
- Modify: `C:/Users/Emmy Lou/Downloads/Numerical_Analysis_Final_ver-master/scripts/root-engine-audit.js`
  - Add failing coverage for the professor example and tolerance-type reporting
- Optional verification reference: `C:/Users/Emmy Lou/Downloads/Numerical_Analysis_Final_ver-master/docs/superpowers/specs/2026-04-16-bisection-relative-tolerance-design.md`

### Task 1: Add Failing Engine Coverage For Relative vs Absolute Tolerance

**Files:**
- Modify: `C:/Users/Emmy Lou/Downloads/Numerical_Analysis_Final_ver-master/scripts/root-engine-audit.js`
- Test: `C:/Users/Emmy Lou/Downloads/Numerical_Analysis_Final_ver-master/scripts/root-engine-audit.js`

- [ ] **Step 1: Write the failing audit checks**

Add two new Bisection stress checks near the other Bisection stress cases so the first one fails before implementation:

```js
  {
    const run = R.runBisection({
      expression: "x^3 + 4*x^2 - 10",
      interval: { a: "1", b: "2" },
      machine: { k: 12, mode: "round" },
      stopping: { kind: "epsilon", value: "0.0001", toleranceType: "relative" },
      decisionBasis: "exact",
      signDisplay: "both",
      angleMode: "rad"
    });

    report.check(
      "Lecture-style relative tolerance uses 13 bisection rows",
      "Bisection stress",
      "13",
      String(run.rows.length),
      run.rows.length === 13,
      "The professor example stops after 13 iterations under the relative bound."
    );
  }

  {
    const run = R.runBisection({
      expression: "x^3 + 4*x^2 - 10",
      interval: { a: "1", b: "2" },
      machine: { k: 12, mode: "round" },
      stopping: { kind: "epsilon", value: "0.0001", toleranceType: "absolute" },
      decisionBasis: "exact",
      signDisplay: "both",
      angleMode: "rad"
    });

    report.check(
      "Absolute tolerance keeps the 14-iteration interpretation",
      "Bisection stress",
      "14",
      String(run.rows.length),
      run.rows.length === 14
    );
    report.check(
      "Bisection stopping metadata reports tolerance type",
      "Bisection stress",
      "absolute",
      run.stopping.toleranceType,
      run.stopping.toleranceType === "absolute"
    );
  }
```

- [ ] **Step 2: Run the audit to verify the new relative test fails**

Run:

```powershell
node scripts/root-engine-audit.js
```

Expected: FAIL on the new `relative` check because the current Bisection epsilon flow still behaves like the absolute path and returns 14 rows.

- [ ] **Step 3: Commit the failing test change**

```bash
git add scripts/root-engine-audit.js
git commit -m "test: cover bisection relative tolerance"
```

### Task 2: Implement Bisection Engine Support For Tolerance Type

**Files:**
- Modify: `C:/Users/Emmy Lou/Downloads/Numerical_Analysis_Final_ver-master/root-engine.js`
- Test: `C:/Users/Emmy Lou/Downloads/Numerical_Analysis_Final_ver-master/scripts/root-engine-audit.js`

- [ ] **Step 1: Extend Bisection stopping metadata to carry `toleranceType`**

Update the Bisection stopping-builder path so epsilon mode stores a normalized tolerance type:

```js
  function normalizeBisectionToleranceType(stopping) {
    return stopping && stopping.toleranceType === "absolute" ? "absolute" : "relative";
  }

  function buildStopping(options, left, right) {
    if (options.stopping.kind === "epsilon") {
      const epsilonValue = parseScalarInput(options.stopping.value, "Tolerance epsilon");
      const toleranceType = options.method === "bisection"
        ? normalizeBisectionToleranceType(options.stopping)
        : "absolute";

      return {
        kind: "epsilon",
        input: String(options.stopping.value),
        toleranceType,
        plannedIterations: toleranceType === "absolute"
          ? iterationsFromTolerance(left, right, epsilonValue)
          : null,
        actualIterations: 0,
        iterationsRequired: toleranceType === "absolute"
          ? iterationsFromTolerance(left, right, epsilonValue)
          : null,
        epsilonBound: realNumber(epsilonValue, "Tolerance epsilon"),
        maxIterations: MAX_OPEN_ITER
      };
    }
```

Also make sure `runBisection()` passes `method: "bisection"` into the stopping-builder call or equivalent local branch logic so non-Bisection methods stay unchanged.

- [ ] **Step 2: Add a Bisection relative-bound helper**

Add a single-purpose helper for the professor-style bound:

```js
  function bisectionRelativeBound(left, right) {
    const leftMag = absNumber(left);
    const rightMag = absNumber(right);
    const denom = Math.min(leftMag, rightMag);
    if (!(denom > 0)) {
      throw new Error("Relative tolerance needs a bracket whose endpoints stay away from 0.");
    }
    return distanceNumber(right, left, "Relative tolerance width") / denom;
  }
```

Keep this helper Bisection-specific. Do not reuse it across Newton, Secant, False Position, or Fixed Point in this task.

- [ ] **Step 3: Split Bisection epsilon handling into absolute vs relative paths**

Inside `runBisection()`, preserve the current precomputed-iteration behavior for `absolute`, but evaluate `relative` dynamically in the loop:

```js
      const relativeMode = stopping.kind === "epsilon" && stopping.toleranceType === "relative";
      const absoluteMode = stopping.kind === "epsilon" && stopping.toleranceType === "absolute";
      const loopLimit = relativeMode ? stopping.maxIterations : stopping.iterationsRequired;

      for (let iteration = 1; iteration <= loopLimit; iteration += 1) {
        // existing midpoint work

        const bound = relativeMode
          ? bisectionRelativeBound(left, right)
          : toleranceFromIterations(initialLeft, initialRight, iteration);

        rows.push({
          iteration,
          // existing row fields
          bound
        });

        if (midSign === 0) {
          // existing exact-root exit
        }

        if (relativeMode && bound < stopping.epsilonBound) {
          return bisectionResult(
            options,
            ast,
            machine,
            leftPoint,
            rightPoint,
            Object.assign({}, stopping, {
              iterationsRequired: iteration,
              epsilonBound: stopping.epsilonBound
            }),
            summaryPackage(midpoint, "valid-bracket", "tolerance-reached", {
              residual: residualData.residual,
              residualBasis: residualData.residualBasis,
              error,
              bound
            }),
            rows,
            warnings
          );
        }
      }
```

Key rule: do not silently fall back from `relative` to `absolute`. If the relative bound cannot be evaluated safely, return a Bisection-specific error path instead of changing semantics.

- [ ] **Step 4: Re-run the root audit**

Run:

```powershell
node scripts/root-engine-audit.js
```

Expected: PASS, including `13` rows for the lecture example in relative mode and `14` rows in absolute mode.

- [ ] **Step 5: Commit the engine change**

```bash
git add root-engine.js scripts/root-engine-audit.js
git commit -m "feat: add bisection relative tolerance mode"
```

### Task 3: Add The Bisection UI Control And Lecture Note

**Files:**
- Modify: `C:/Users/Emmy Lou/Downloads/Numerical_Analysis_Final_ver-master/index.html`
- Modify: `C:/Users/Emmy Lou/Downloads/Numerical_Analysis_Final_ver-master/root-ui.js`
- Modify: `C:/Users/Emmy Lou/Downloads/Numerical_Analysis_Final_ver-master/styles.css`

- [ ] **Step 1: Add the new Bisection-only markup**

Insert a tolerance-type select beside the existing Bisection stop controls and keep it hidden unless epsilon mode is active:

```html
<label id="root-bis-tolerance-type-wrap" hidden>
  Tolerance type
  <select id="root-bis-tolerance-type">
    <option value="relative" selected>Relative tolerance</option>
    <option value="absolute">Absolute tolerance</option>
  </select>
</label>
```

Add a short note immediately below the Bisection config grid:

```html
<p id="root-bis-tolerance-note" class="root-textbook-note focus-note" hidden>
  Relative tolerance is the default for Bisection because it matches the lecture-style stopping rule.
</p>
```

- [ ] **Step 2: Wire the new control into the Bisection run payload**

Update `computeBisection()` and the Bisection field lists:

```js
      fieldIds: [
        "root-bis-expression",
        "root-bis-a",
        "root-bis-b",
        "root-bis-k",
        "root-bis-mode",
        "root-bis-stop-kind",
        "root-bis-stop-value",
        "root-bis-tolerance-type"
      ],
```

and:

```js
      stopping: {
        kind: byId("root-bis-stop-kind").value,
        value: byId("root-bis-stop-value").value,
        toleranceType: byId("root-bis-tolerance-type").value
      },
```

Add a small UI sync helper:

```js
  function syncBisectionToleranceControls() {
    const epsilonMode = byId("root-bis-stop-kind").value === "epsilon";
    setHidden("root-bis-tolerance-type-wrap", !epsilonMode);
    setHidden("root-bis-tolerance-note", !epsilonMode);
  }
```

Call it on init, on reset, and on `root-bis-stop-kind` change.

- [ ] **Step 3: Keep the layout aligned**

Add only the minimal styling needed for the extra Bisection control to fit the existing grid:

```css
#root-bis-tolerance-type-wrap[hidden],
#root-bis-tolerance-note[hidden] {
  display: none !important;
}
```

If the config grid needs an extra breakpoint tweak, keep it localized to the Bisection controls instead of changing the global layout rules.

- [ ] **Step 4: Run a browser smoke check**

Open `index.html` and verify:

- Bisection shows `Tolerance type` only when epsilon mode is selected
- `Relative tolerance` is selected by default
- Non-Bisection methods do not show the new control

Expected: Bisection-only UI change, no layout break, no new control leakage into other methods.

- [ ] **Step 5: Commit the UI control change**

```bash
git add index.html root-ui.js styles.css
git commit -m "feat: add bisection tolerance type control"
```

### Task 4: Update Bisection Reporting Text And Final Verification

**Files:**
- Modify: `C:/Users/Emmy Lou/Downloads/Numerical_Analysis_Final_ver-master/root-ui.js`
- Modify: `C:/Users/Emmy Lou/Downloads/Numerical_Analysis_Final_ver-master/scripts/root-engine-audit.js`
- Test: `C:/Users/Emmy Lou/Downloads/Numerical_Analysis_Final_ver-master/scripts/root-engine-audit.js`

- [ ] **Step 1: Update summary text to name the tolerance type**

Adjust the Bisection epsilon summary formatter so it renders explicit wording:

```js
    if (run.stopping.kind === "epsilon" && run.method === "bisection") {
      const label = run.stopping.toleranceType === "absolute"
        ? "Absolute tolerance"
        : "Relative tolerance";
      return label + " ε = " + run.stopping.input + iterationNote;
    }
```

Do not change Newton, Secant, False Position, or Fixed Point wording in this task.

- [ ] **Step 2: Update Bisection solution steps**

Change the Bisection explanation builder so it uses lecture-style wording for relative mode and direct absolute wording for absolute mode:

```js
      if (run.stopping.kind === "epsilon") {
        if (run.stopping.toleranceType === "relative") {
          steps.push(
            "For relative tolerance ε = " + run.stopping.input +
            ", stop when the current bracket gives a relative error bound below ε."
          );
        } else {
          steps.push(
            "For absolute tolerance ε = " + run.stopping.input +
            ", stop when the current Bisection bound is below ε."
          );
        }
      }
```

Also make sure exact endpoint and midpoint exits still mention the selected tolerance type without implying the tolerance rule caused the stop.

- [ ] **Step 3: Add one reporting-focused audit check**

Add an audit assertion to ensure the engine exposes the chosen type cleanly:

```js
    report.check(
      "Relative tolerance metadata is exposed for reporting",
      "Bisection stress",
      "relative",
      run.stopping.toleranceType,
      run.stopping.toleranceType === "relative"
    );
```

- [ ] **Step 4: Run full verification**

Run:

```powershell
node scripts/engine-correctness-audit.js
node scripts/root-engine-audit.js
```

Expected:

- `engine-correctness-audit.js` still passes
- `root-engine-audit.js` passes with the new relative/absolute Bisection checks

Then manually verify the professor example in the browser:

- `f(x) = x^3 + 4x^2 - 10`
- interval `[1, 2]`
- epsilon `0.0001`
- relative mode should support the lecture-style `13` iteration explanation
- absolute mode should retain the `14` iteration interpretation

- [ ] **Step 5: Commit the reporting polish**

```bash
git add root-ui.js scripts/root-engine-audit.js
git commit -m "feat: clarify bisection tolerance reporting"
```
