# Professor-Aligned Roots Calculator Design

Date: 2026-04-24

## Purpose

Build the Roots calculator around the professor's actual equation-solving workflow, not copied lecture text. The app should help with quizzes and exams by using the same numerical setup style: root form, method formulas, tabular iteration records, stopping checks, and final conclusions.

The anchor lecture problem is the population birth-rate equation:

```text
1564000 = 1000000e^x + (435000/x)(e^x - 1)
```

The calculator should use the root form:

```text
f(x) = 1000000*e^x + (435000/x)*(e^x - 1) - 1564000
```

Here `x` represents the birth-rate parameter. The root is near `0.1009979297`, so presets should avoid `x = 0` and use safe starting values near the sign change.

## Current Codebase Findings

The current app is still a static vanilla JavaScript app at the repository root. There is no root `package.json`, `vercel.json`, or `.vercel/` directory in this checkout. That is acceptable for a Vercel static deployment if the project settings point at the repository root and serve `index.html`, but it leaves routing and build behavior implicit.

The Roots mini-app is already separated correctly:

- `roots/index.html` is the standalone Roots shell.
- `roots/roots-app.js` handles DOM events and orchestration.
- `roots/roots-state.js` holds active method, cached runs, and angle mode.
- `roots/roots-render.js` renders answers, diagnostics, graphs, steps, and tables.
- `roots/roots-engine-adapter.js` maps UI fields into `RootEngine`.
- `root-engine.js` contains the numerical methods.

Current audits show the engine base is not fundamentally broken:

- `scripts/engine-correctness-audit.js`: 47/47 passed.
- `scripts/battery-validation.js`: 18/18 passed.
- `scripts/ieee754-audit.js`: 7/7 passed.
- `scripts/roots-mini-app-static-audit.js`: passed.
- `scripts/roots-fast-lane-audit.js`: passed.

Two issues need attention before expanding features:

- `scripts/root-engine-audit.js` currently reports 46/47. The failing check expects `0.00097656`, while the engine returns the exact numeric value `0.0009765625` for `1 / 2^10`. This appears to be an audit expectation/display-precision issue, not a numerical solver defect.
- `scripts/roots-mini-app-ui-audit.js` fails because the test expects the first angle toggle click to produce `RAD`, but `roots-state.js` starts with `angleMode: "rad"` while `roots/index.html` initially displays `DEG`. The initial DOM and state disagree.

The working tree already contains uncommitted changes in `root-engine.js` and `scripts/root-engine-audit.js`. The `root-engine.js` diff includes the safer bisection midpoint form `a + (b - a)/2`, which matches the lecture recommendation.

## Feature Scope

### 1. Professor Mode Presets

Add a Professor / Quiz preset selector inside the Roots mini-app. Presets should fill the active method fields and use original calculator labels, not lecture copy.

Preset groups:

- Population birth-rate model
- Quiz bisection problem
- Quiz Newton problems
- Fixed-point ranking problem

The selector should not hide normal custom input. A student should be able to load a preset, adjust values, then run the method.

### 2. Population Equation Setup

For the population equation, method defaults should be:

- Bisection:
  - `f(x) = 1000000*e^x + (435000/x)*(e^x - 1) - 1564000`
  - `a = 0.1`
  - `b = 0.15`
- False Position:
  - same `f(x)`, `a`, and `b`
- Newton:
  - same `f(x)`
  - derivative:
    ```text
    1000000*e^x + 435000*(x*e^x - (e^x - 1))/x^2
    ```
  - `x0 = 0.1` or `0.12`
- Secant:
  - same `f(x)`
  - `x0 = 0.1`
  - `x1 = 0.15`
- Fixed Point:
  - derived fixed-point form:
    ```text
    g(x) = log((1564000*x + 435000)/(1000000*x + 435000))
    ```
  - `x0 = 0.1`

The preset should warn when a selected method or starting value would evaluate at `x = 0`, because the direct equation contains division by `x`.

### 3. Quiz Presets

Add quiz-derived presets:

Bisection:

```text
f(x) = x^3 - 7x^2 + 14x + 6
target accuracy = 10^-2
```

Newton:

```text
x^3 - 2x^2 - 5 = 0, [1, 4]
x^3 + 3x^2 - 1 = 0, [-3, -2]
x - cos(x) = 0, [0, pi/2]
x - 0.8 - 0.2sin(x) = 0, [0, pi/2]
stopping rule: |x_(n+1) - x_n| < 0.0001
```

For Newton presets, the app should include the derivative field. The interval should be treated as a starting-value guide, not as a bracket guarantee for Newton.

Fixed-point ranking:

```text
target = 21^(1/3)
p0 = 1

a. p_n = (20p_(n-1) + 21/p_(n-1)^2) / 21
b. p_n = p_(n-1) - (p_(n-1)^3 - 21) / (3p_(n-1)^2)
c. p_n = p_(n-1) - (p_(n-1)^4 - 21p_(n-1)) / (p_(n-1)^2 - 21)
d. p_n = sqrt(21 / p_(n-1))
```

The comparison should rank the formulas by apparent speed and classify formulas that diverge, stall, cycle, or become undefined.

### 4. Exam Table Format

Add a display mode for professor-style calculation records. The current answer-first UI can stay, but the full-work section should provide table formats that line up with class expectations.

Method table shapes:

- Bisection: `n`, `a_n`, `b_n`, `p_n`, `f(p_n)`, signs, kept interval, bound/error.
- False Position: `n`, `a_n`, `b_n`, `p_n`, `f(p_n)`, signs, retained interval, error.
- Newton: `n`, `x_n`, `f(x_n)`, `f'(x_n)`, correction term, `x_(n+1)`, error.
- Secant: `n`, `x_(n-1)`, `x_n`, `f(x_(n-1))`, `f(x_n)`, `x_(n+1)`, error.
- Fixed Point: `n`, `p_n`, `g(p_n)`, `|p_n - p_(n-1)|`, note.

The table should show enough precision for grading, but the final answer formatter should respect the requested tolerance or iteration count.

### 5. Stopping Check Panel

Add a compact stopping check below the table. It should explicitly state why the run stopped:

- requested iterations completed
- tolerance reached
- invalid bracket
- endpoint root
- derivative zero
- singularity or non-finite value
- divergence
- cycle detected
- retained endpoint stagnation for false position

For bisection, distinguish:

- guaranteed interval/error bound
- successive-midpoint error
- residual `|f(p_n)|`

### 6. Final Answer Formatter

Add a one-click exam/lab answer formatter. It should generate original wording such as:

```text
Using the bisection method, the approximate solution is x = ...
The stopping condition was satisfied because ...
```

This formatter should use the active equation and computed result, not canned text.

### 7. Fixed-Point Ranking Tool

The existing fixed-point engine runs one `g(x)` at a time. Add a comparison runner for the quiz-style task:

- accepts multiple `g(x)` formulas
- runs each from the same `p0`
- compares final error/step size and iteration count
- ranks convergent formulas
- marks divergent, undefined, stalled, or cyclic formulas

This can be implemented in the Roots UI layer by calling the existing engine multiple times. No new numerical method is required unless result metadata is missing.

## Engine Hardening Requirements

The engine is already reasonably guarded, but professor-aligned use needs stronger regression coverage around the exact classroom cases.

Required checks:

- Population equation converges near `0.1009979297` for bisection, false position, Newton, secant, and the derived fixed-point form when valid starting values are used.
- Population equation rejects or warns on `x = 0` starts because direct evaluation is singular.
- Bisection iteration bound for `[1,2]` and `10^-3` returns `10`.
- Bisection bound display separates exact numeric value `0.0009765625` from rounded presentation `0.00097656`.
- Newton quiz problems stop when `|x_(n+1) - x_n| < 0.0001`.
- Fixed-point `21^(1/3)` formulas rank consistently.
- Trig examples should default to radians for numerical-analysis convention unless the user explicitly changes angle mode.

The current uncommitted midpoint hardening should be kept if it passes the final audit. The audit expectation should be corrected to avoid treating exact precision as a failure.

## Vercel Readiness

Because the project is a static app, Vercel can serve it without a build step. To make deployment less fragile, add an explicit deployment note or config in a later implementation step:

- Root directory: repository root.
- Build command: none.
- Output directory: repository root.
- Main route: `index.html`.
- Roots route: `roots/index.html`.

If Vercel needs clean deep links, add a minimal `vercel.json` rewrite strategy. Otherwise, avoid adding unnecessary build tooling.

## Non-Goals

- Do not copy lecture paragraphs into the UI.
- Do not convert the app to React as part of this work.
- Do not add a backend.
- Do not replace the existing engines with an external CAS.
- Do not edit the main calculator shell unless a route/bridge problem requires it.

## File Targets

Likely files:

- `roots/index.html`: preset selector, comparison entry point, report controls.
- `roots/roots-state.js`: preset definitions and comparison state.
- `roots/roots-app.js`: preset loading and comparison orchestration.
- `roots/roots-render.js`: exam table format, stopping check, final answer text.
- `roots/roots-engine-adapter.js`: helper request builders if comparison calls need reusable packaging.
- `root-engine.js`: only for missing method metadata or numerical hardening.
- `scripts/root-engine-audit.js`: professor-equation and quiz regression tests.
- `scripts/roots-mini-app-ui-audit.js`: preset and report UI checks.
- `README.md` or `vercel.json`: Vercel static deployment clarity if needed.

## Acceptance Criteria

- The app can load the population equation preset and solve it with every current Roots method where valid.
- The app can load quiz-derived bisection and Newton presets.
- The fixed-point ranking tool compares the four `21^(1/3)` formulas from the quiz.
- The full-work output has method-specific exam table columns.
- The final answer formatter uses the current equation, current method, and actual stopping result.
- All deterministic audits pass:
  - `node scripts/engine-correctness-audit.js`
  - `node scripts/root-engine-audit.js`
  - `node scripts/roots-mini-app-static-audit.js`
  - `node scripts/roots-mini-app-ui-audit.js`
  - `node scripts/roots-fast-lane-audit.js`
- No new framework or build system is required for the static app.

## Self-Review

No placeholders remain. Scope is focused on Roots calculator behavior, output format, engine confidence, and static deployment clarity. The feature set is large but still a single Roots mini-app implementation plan because all work centers on one existing engine/UI boundary.
