# Bisection Stress Hardening Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix the bisection stress-test failures by separating display cleanup from solver decisions, adding shared `tan()` and `ln()` support, and surfacing compact inline diagnostics in the existing Roots layout.

**Architecture:** Keep the standalone browser architecture. `calc-engine.js` and `expression-engine.js` own shared expression semantics; `root-engine.js` owns bisection truth and metadata; `root-ui.js` renders facts returned by the engine. The UI keeps the current layout and adds one compact diagnostics strip.

**Tech Stack:** Plain HTML/CSS/JavaScript, Node.js audit scripts, no build step, no package install.

---

## File Map

- Modify `scripts/root-engine-audit.js`: add bisection stress regression checks.
- Modify `scripts/engine-correctness-audit.js`: add shared-expression checks for `tan()`, `ln()`, and exact negative integer powers.
- Modify `calc-engine.js`: preserve tiny arithmetic values, add display-only cleanup, add `tanValue()`, `lnValue()`, and exact rational negative integer powers.
- Modify `expression-engine.js`: route `tan()` and `ln()`, and align `isExactCompatible()` with real power evaluator behavior.
- Modify `root-engine.js`: add strict bisection sign decisions, exact-safe epsilon counts, planned/actual iteration metadata, discontinuity results, and warning metadata.
- Modify `index.html`, `root-ui.js`, `styles.css`: render inline diagnostics and clearer teaching copy.

## Task 1: Add Failing Stress Audits

**Files:**
- Modify: `scripts/root-engine-audit.js`
- Modify: `scripts/engine-correctness-audit.js`

- [ ] **Step 1: Add root audit helpers and engine access**

In `scripts/root-engine-audit.js`, return `E: context.ExpressionEngine` from `loadEngines()`, then destructure `const { C, E, R } = loadEngines();`.

Add after `makeReporter()`:

```js
function captureRun(fn) {
  try {
    return { run: fn(), error: null };
  } catch (error) {
    return { run: null, error };
  }
}

function realOrMessage(C, value, label) {
  try {
    return C.requireRealNumber(value, label);
  } catch (error) {
    return error.message;
  }
}
```

- [ ] **Step 2: Add bisection stress cases**

Insert before `report.finish();` in `scripts/root-engine-audit.js`:

```js
  const stressCases = [
    {
      name: "Tiny constant is not endpoint root",
      run: () => R.runBisection({ expression: "x^3 - 10^(-18)", interval: { a: "0", b: "10^(-4)" }, machine: { k: 16, mode: "round" }, stopping: { kind: "epsilon", value: "10^(-8)" }, decisionBasis: "exact", signDisplay: "both", angleMode: "rad" }),
      check: (result) => result.run && result.run.summary.intervalStatus !== "root-at-a",
      expected: "not root-at-a",
      actual: (result) => result.run ? result.run.summary.intervalStatus : result.error.message
    },
    {
      name: "Tiny exponential target converges near true root",
      run: () => R.runBisection({ expression: "e^(-1000x) - 10^(-12)", interval: { a: "0", b: "0.1" }, machine: { k: 16, mode: "round" }, stopping: { kind: "epsilon", value: "10^(-6)" }, decisionBasis: "machine", signDisplay: "both", angleMode: "rad" }),
      check: (result) => {
        const approx = result.run ? realOrMessage(C, result.run.summary.approximation, "Approximation") : result.error.message;
        return typeof approx === "number" && Math.abs(approx - 0.02763102111592855) <= 0.000001;
      },
      expected: "0.02763102111592855 +/- 0.000001",
      actual: (result) => String(result.run ? realOrMessage(C, result.run.summary.approximation, "Approximation") : result.error.message)
    },
    {
      name: "Epsilon metadata separates actual and planned iterations",
      run: () => R.runBisection({ expression: "x^3 - 8", interval: { a: "0", b: "4" }, machine: { k: 12, mode: "round" }, stopping: { kind: "epsilon", value: "0.001" }, decisionBasis: "exact", signDisplay: "both", angleMode: "rad" }),
      check: (result) => result.run && result.run.stopping.actualIterations === 1 && result.run.stopping.plannedIterations === 12,
      expected: "actual 1, planned 12",
      actual: (result) => result.run ? "actual " + result.run.stopping.actualIterations + ", planned " + result.run.stopping.plannedIterations : result.error.message
    },
    {
      name: "Positive subnormal epsilon is not rejected as zero",
      run: () => R.runBisection({ expression: "x", interval: { a: "-10^(-300)", b: "10^(-300)" }, machine: { k: 16, mode: "round" }, stopping: { kind: "epsilon", value: "10^(-320)" }, decisionBasis: "exact", signDisplay: "both", angleMode: "rad" }),
      check: (result) => result.run && result.run.summary.intervalStatus === "root-at-midpoint",
      expected: "root-at-midpoint",
      actual: (result) => result.run ? result.run.summary.intervalStatus : result.error.message
    },
    {
      name: "Singular midpoint returns continuity result",
      run: () => R.runBisection({ expression: "1/x", interval: { a: "-1", b: "1" }, machine: { k: 12, mode: "round" }, stopping: { kind: "iterations", value: "4" }, decisionBasis: "exact", signDisplay: "both", angleMode: "rad" }),
      check: (result) => result.run && result.run.summary.intervalStatus === "invalid-continuity" && result.run.summary.stopReason === "discontinuity-detected",
      expected: "invalid-continuity / discontinuity-detected",
      actual: (result) => result.run ? result.run.summary.intervalStatus + " / " + result.run.summary.stopReason : result.error.message
    }
  ];

  for (const test of stressCases) {
    const result = captureRun(test.run);
    report.check(test.name, "Bisection stress", test.expected, test.actual(result), test.check(result));
  }
```

- [ ] **Step 3: Add shared expression stress cases**

Insert before `report.finish();` in `scripts/engine-correctness-audit.js`:

```js
  {
    const tanReal = C.requireRealNumber(E.evaluateValue(E.parseExpression("tan(pi / 4)", { allowVariable: false }), { angleMode: "rad" }), "tan(pi / 4)");
    report.check("tan() evaluates in shared engine", "Expression engine", "1", C.formatReal(tanReal, 12), Math.abs(tanReal - 1) < 1e-12);
  }

  {
    const lnReal = C.requireRealNumber(E.evaluateValue(E.parseExpression("ln(e)", { allowVariable: false }), { angleMode: "rad" }), "ln(e)");
    report.check("ln() evaluates in shared engine", "Expression engine", "1", C.formatReal(lnReal, 12), Math.abs(lnReal - 1) < 1e-12);
  }

  {
    const ast = E.parseExpression("x^3 - 10^(-18)", { allowVariable: true });
    const value = E.evaluateValue(ast, { x: M.ZERO, angleMode: "rad" });
    const compatible = E.isExactCompatible(ast, { x: M.ZERO, angleMode: "rad" });
    report.check("Negative integer powers stay exact when supported", "Expression engine", "exact-compatible nonzero rational", String(compatible) + " / " + rationalFraction(M, value), compatible && C.isRationalValue(value) && !M.isZero(value));
  }
```

- [ ] **Step 4: Confirm the new checks fail first**

Run:

```powershell
node scripts/root-engine-audit.js
node scripts/engine-correctness-audit.js
```

Expected: both commands exit nonzero because the new checks describe behavior not implemented yet.

## Task 2: Fix Shared Calculator And Expression Semantics

**Files:**
- Modify: `calc-engine.js`
- Modify: `expression-engine.js`
- Test: `scripts/engine-correctness-audit.js`
- Test: `scripts/root-engine-audit.js`

- [ ] **Step 1: Preserve tiny values during arithmetic**

Replace `cleanNumber()` in `calc-engine.js`:

```js
  function cleanNumber(value) {
    if (!Number.isFinite(value)) {
      return value;
    }
    return Object.is(value, -0) ? 0 : value;
  }
```

Add display cleanup beside it:

```js
  function displayNumber(value) {
    if (!Number.isFinite(value)) {
      return value;
    }
    if (Math.abs(value) < EPS) {
      return 0;
    }
    return Object.is(value, -0) ? 0 : value;
  }
```

Use `displayNumber()` only inside text-formatting paths such as `rectString()` and `machineDecimalString()` when deciding whether to print a component as visible zero.

- [ ] **Step 2: Add exact rational negative integer powers**

Add near the existing power helpers in `calc-engine.js`:

```js
  function isIntegerRational(value) {
    return isRationalValue(value) && value.den === 1n;
  }

  function powRationalInteger(base, exponent) {
    if (!isRationalValue(base) || !isIntegerRational(exponent)) {
      throw new Error("Expected a rational base and integer exponent.");
    }
    if (M.isZero(base) && exponent.sign < 0) {
      throw new Error("Zero cannot be raised to a negative exponent.");
    }
    const n = Number(exponent.num);
    if (!Number.isSafeInteger(n)) {
      throw new Error("Exponent is too large to evaluate safely.");
    }
    const powered = M.powRational(base, n);
    return exponent.sign >= 0 ? powered : M.div(M.ONE, powered);
  }
```

Start `powValue()` with:

```js
  function powValue(base, exponent) {
    if (isRationalValue(base) && isIntegerRational(exponent)) {
      return powRationalInteger(base, exponent);
    }
```

- [ ] **Step 3: Add `tanValue()` and `lnValue()`**

Add after `cosValue()` in `calc-engine.js` and export both:

```js
  function tanValue(value, angleMode) {
    const theta = toRadians(requireRealNumber(value, "Tangent input"), angleMode);
    const cos = Math.cos(theta);
    if (Math.abs(cos) < EPS) {
      throw new Error("Tangent is undefined at this angle.");
    }
    return makeCalc(Math.tan(theta), 0);
  }

  function lnValue(value) {
    const real = requireRealNumber(value, "Natural logarithm input");
    if (!(real > 0)) {
      throw new Error("Natural logarithm input must be greater than 0.");
    }
    return makeCalc(Math.log(real), 0);
  }
```

- [ ] **Step 4: Align expression power exactness**

Add before `isExactCompatible()` in `expression-engine.js`:

```js
  function integerLiteralValue(ast) {
    if (ast.kind === "number") {
      const value = M.parseRational(ast.value);
      return value.den === 1n ? value : null;
    }
    if (ast.kind === "unary" && ast.op === "-") {
      const inner = integerLiteralValue(ast.expr);
      return inner ? M.negate(inner) : null;
    }
    if (ast.kind === "unary" && ast.op === "+") {
      return integerLiteralValue(ast.expr);
    }
    return null;
  }

  function exactCompatiblePower(ast, env) {
    const exponent = integerLiteralValue(ast.right);
    if (!exponent || !isExactCompatible(ast.left, env)) {
      return false;
    }
    if (exponent.sign < 0) {
      const base = evaluateExact(ast.left, env);
      return !M.isZero(base);
    }
    return true;
  }
```

In the `binary` branch of `isExactCompatible()`, special-case `^` through `exactCompatiblePower(ast, env)`.

- [ ] **Step 5: Route `tan()` and `ln()`**

In `evaluateValue()`, add `tan` and `ln` call branches using `C.tanValue(...)` and `C.lnValue(...)`. In `evaluateStepwise()`, add matching branches beside `sin`, `cos`, and `exp`.

Run:

```powershell
node scripts/engine-correctness-audit.js
```

Expected: shared `tan()`, `ln()`, and exact negative-power checks pass.

## Task 3: Fix Bisection Engine Semantics

**Files:**
- Modify: `root-engine.js`
- Test: `scripts/root-engine-audit.js`
- Test: `scripts/engine-correctness-audit.js`

- [ ] **Step 1: Add strict signs and warnings**

Add after `zeroStopReasonForPoint()` in `root-engine.js`:

```js
  function strictSign(value, label) {
    if (C.isRationalValue(value)) {
      if (M.isZero(value)) {
        return 0;
      }
      return value.sign < 0 ? -1 : 1;
    }
    const real = realNumber(value, label);
    return real === 0 ? 0 : (real < 0 ? -1 : 1);
  }

  function expressionUsesTrig(expression) {
    return /\b(?:sin|cos|tan)\s*\(/i.test(String(expression || ""));
  }

  function addWarning(warnings, code, message) {
    warnings.push({ code, message });
  }
```

Use `strictSign(...)` for `exactSign` and `machineSign` in `evaluatePoint()`.

- [ ] **Step 2: Replace tolerance iteration counting**

Add rational helpers `absValue(value)`, `assertPositive(value, label)`, `bitLength(n)`, and `ceilLog2PositiveRational(value)` near `iterationsFromTolerance()`. Replace `iterationsFromTolerance()` so rational widths and rational epsilons use `ceilLog2PositiveRational(M.div(widthValue, epsilonValue))`, and JS-number fallback throws this message when epsilon underflows:

```js
throw new Error("Tolerance epsilon is positive but too small for this browser number path. Use a larger epsilon or an iteration count.");
```

- [ ] **Step 3: Split planned and actual iteration metadata**

In `buildStopping()`, epsilon mode should set `plannedIterations`, `actualIterations: 0`, and `iterationsRequired: plannedIterations`. Iteration mode should set `plannedIterations: iterations` and `actualIterations: 0`.

Add:

```js
  function withActualIterations(stopping, rows) {
    return Object.assign({}, stopping, {
      actualIterations: rows.length,
      iterationsRequired: stopping.plannedIterations != null ? stopping.plannedIterations : stopping.iterationsRequired
    });
  }
```

- [ ] **Step 4: Return bisection warnings and continuity failures**

Add `bisectionResult(...)` that wraps `resultPackage(...)`, applies `withActualIterations(stopping, rows)`, and attaches `warnings`.

Add `continuityFailure(...)` that returns `summaryPackage(null, "invalid-continuity", "discontinuity-detected", { stopDetail: message, residualBasis: "unavailable" })`.

In `runBisection()`, create `warnings = []`, add an `angle-mode` warning when `expressionUsesTrig(options.expression)` is true, add an `invalid-bracket` warning in the same-sign branch, and wrap midpoint `evaluatePoint(...)` in `try/catch` returning `continuityFailure(...)` on error.

- [ ] **Step 5: Add advisory multi-root sampling**

Add `sampleSignChanges(ast, left, right, machine, angleMode)` that samples 16 evenly spaced points, counts sign changes, and returns `{ changes, failed }`. Before the bisection loop, add a `possible-multiple-roots` warning when `changes > 1`.

- [ ] **Step 6: Verify bisection engine**

Run:

```powershell
node scripts/root-engine-audit.js
node scripts/engine-correctness-audit.js
```

Expected: both scripts pass.

## Task 4: Add Inline Diagnostics And Root UI Copy

**Files:**
- Modify: `index.html`
- Modify: `root-ui.js`
- Modify: `styles.css`

- [ ] **Step 1: Add diagnostics markup and styles**

Insert after the `root-summary-grid` block in `index.html`:

```html
          <div id="root-diagnostics" class="root-diagnostics" role="status" aria-live="polite" hidden></div>
```

Add root diagnostic styles in `styles.css`:

```css
.module-root .root-diagnostics { display: grid; gap: var(--space-2); }
.module-root .root-diagnostic { border: 1px solid var(--line); border-left: 0.25rem solid var(--accent); border-radius: var(--radius); background: var(--surface-raised); color: var(--text); padding: var(--space-2) var(--space-3); font-size: 0.92rem; line-height: 1.45; }
.module-root .root-diagnostic-warning { border-left-color: var(--warning, #b7791f); }
```

- [ ] **Step 2: Render diagnostics in `root-ui.js`**

Add `diagnosticTitle(code)`, `collectDiagnostics(run)`, and `renderDiagnostics(run)` before `renderRun()`. `collectDiagnostics(run)` should include `run.warnings` plus an `early-exit` message when `plannedIterations !== actualIterations`. Call `renderDiagnostics(run)` inside `renderRun()` after the stopping summary is set, and clear `root-diagnostics` in `resetResults()`.

- [ ] **Step 3: Normalize root errors and labels**

Add `formatRootError(error)` after `formatBracketValue()` in `root-ui.js`, mapping raw divide-by-zero, logarithm-domain, tangent-asymptote, and tiny-epsilon precision messages to student-facing text. Use it in the `runCompute()` catch block:

```js
showError("root-error-msg", formatRootError(err));
```

Update labels:

```js
"invalid-bracket": "Not a valid bisection bracket"
"invalid-continuity": "Continuity requirement failed"
"discontinuity-detected": "Stopped at a discontinuity or singularity"
```

- [ ] **Step 4: Update bisection copy**

In `formatStoppingDetails(run)`, show both `actualIterations` and `plannedIterations` when they differ. In `buildBisectionSteps(run)`, invalid brackets must say same-sign endpoints do not prove no root exists. Add an `invalid-continuity` branch that prints `run.summary.stopDetail`.

- [ ] **Step 5: Verify after UI changes**

Run:

```powershell
node scripts/root-engine-audit.js
node scripts/engine-correctness-audit.js
```

Expected: both scripts pass.

## Task 5: Full Verification Sweep

**Files:**
- Run: `scripts/root-engine-audit.js`
- Run: `scripts/engine-correctness-audit.js`
- Read: `README.md`

- [ ] **Step 1: Run automated audits**

Run:

```powershell
node scripts/root-engine-audit.js
node scripts/engine-correctness-audit.js
```

Expected: both commands exit `0` with passing summaries.

- [ ] **Step 2: Check optional IEEE audit**

Run:

```powershell
Test-Path scripts\ieee754-audit.js
```

Expected: `True` or `False`. If `True`, run `node scripts/ieee754-audit.js` and expect a passing summary. If `False`, record that no IEEE audit script exists.

- [ ] **Step 3: Manual browser smoke list**

Open `index.html` in a browser and verify:

```text
x^2 - 3 on [1, 2], epsilon 1e-4, RAD: still produces 14 rows.
x^3 - 8 on [0, 4], epsilon 0.001: shows actual 1 and planned 12.
x^3 - 10^(-18) on [0, 10^(-4)], epsilon 1e-8: does not report root at a = 0.
e^(-1000x) - 10^(-12) on [0, 0.1], epsilon 1e-6: converges near 0.02763102111592855.
1/x on [-1, 1], iterations 4: shows continuity diagnostic.
sin(x) on [3, 4] in DEG and RAD: shows angle-mode diagnostic.
tan(x) on [1, 2], RAD: parses and evaluates.
ln(x) on [0.5, 2], RAD: parses and evaluates.
ln(x) on [-1, 2], RAD: shows logarithm-domain message.
sin(50x) on [0.01, 1], epsilon 1e-8, RAD: warns about possible multiple roots.
```

- [ ] **Step 4: Confirm no raw targeted root errors leak**

Run:

```powershell
Select-String -Path root-ui.js,app.js -Pattern 'Unsupported function: tan|Unsupported function: ln|Division by zero\\.' -CaseSensitive:$false
```

Expected: remaining matches are generic translation branches or non-root modules that already translate the raw message.

- [ ] **Step 5: Final local checkpoint**

Run:

```powershell
Test-Path .git
```

Expected: `False`. Summarize changed files and verification results instead of committing.

## Self-Review

- Spec coverage: Tasks 1-5 cover tiny-value false roots, early `machine-zero`, subnormal epsilon, discontinuity traps, exact-compatibility alignment, shared `tan()` and `ln()`, invalid-bracket copy, angle diagnostics, multi-root diagnostics, and verification.
- Red-flag scan: The plan uses exact file paths, commands, expected outcomes, and concrete snippets for each code-changing step.
- Type consistency: The plan consistently uses `run.stopping.plannedIterations`, `run.stopping.actualIterations`, `run.warnings`, `summary.intervalStatus = "invalid-continuity"`, and `summary.stopReason = "discontinuity-detected"`.
