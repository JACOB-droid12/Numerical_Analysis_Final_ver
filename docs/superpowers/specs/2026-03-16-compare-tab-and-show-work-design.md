# Compare Tab & Show Work Panels — Design Spec

**Date:** 2026-03-16
**Status:** Approved
**Audience:** Classroom use (professor-led demos and student exploration)

## Overview

Two complementary features for the Machine Arithmetic Teaching Lab:

1. **Show Work panels** — expandable step-by-step explanations on every result in Modules I–III, with notation and narrative modes
2. **Compare tab (Module IV)** — a dedicated tab where students build a table comparing expressions across different precision/rounding settings

## Feature 1: Show Work Panels

### Behavior

Every result that shows a rounded value gets an expandable "Show Work" link beneath it. Collapsed by default. Expands inline, pushing content down.

### Two Modes (Toggle)

**Notation mode (default):**

```
fl(2.1892 × 3.7008)
  = fl(8.1017913616)
  = 8.10179          [chop to k=6]
```

Each step shows the operation, exact intermediate result, and the rounding applied. For stepwise evaluation, each intermediate `fl()` call is shown in sequence.

**Narrative mode:**

> "The exact product of 2.1892 and 3.7008 is 8.1017913616. With k=6 significant digits and chopping, we discard everything after the 6th significant digit, giving 8.10179. This introduces an absolute error of 0.0000013616."

### Placement

- **Module I:** Under the stepwise result, under the final-only result, and under each sensitivity sandbox result
- **Module II:** Under the error metrics (explaining how each metric was computed)
- **Module III:** Under each Horner and Direct result, showing the per-step rounding chain

### Module II Show Work Example

Module II explanations cover error metric derivation rather than `fl()` rounding chains. Example for relative error:

**Notation mode:**
```
rel(p, p*) = |p - p*| / |p|
           = |0.333333 - 0.333333| / |0.333333|
           = 0 / 0.333333
           = 0
```

**Narrative mode:**
> "The relative error measures how large the error is compared to the true value. We compute |0.333333 − 0.333333| = 0, then divide by |0.333333| = 0.333333, giving a relative error of 0. The number of significant digits is ∞ (exact match)."

The explanation engine produces a `metricExplanation` variant for Module II (see Explanation Engine section).

### Toggle UI

The notation/narrative toggle is a segmented control ("Notation | Narrative") placed:
- Inside each Show Work panel header (controls that panel, but changes propagate app-wide)
- Inside the Compare tab header area (controls Compare tab cells)

All toggles reflect the same shared state. Clicking any toggle updates all open panels.

### UI Details

- Toggle state persists per session (stored at `state.explanationMode`, top-level alongside angle mode, display format)
- Panel uses the same math rendering as existing results (via `math-display.js`)
- Mode is shared app-wide — one toggle state for all Show Work panels and the Compare tab

### Edge Cases

- Expressions with one operation where stepwise and final-only produce the same result: narrative explains why ("No intermediate rounding occurred because this expression has only one operation")
- Division by zero, overflow: Show Work shows the error at the step where it occurs

## Feature 2: Compare Tab (Module IV)

### Layout

A table where rows are expressions and columns are parameter sets (k + rounding rule).

```
┌─────────────────────────────────────────────────────────────┐
│  Compare                                                     │
│                                                              │
│  [+ Add Expression]     [+ Add Parameter Set]                │
│                                                              │
│  ┌───────────────┬──────────────┬──────────────┬───────────┐ │
│  │               │ k=6, chop    │ k=6, round   │ k=3, chop │ │
│  ├───────────────┼──────────────┼──────────────┼───────────┤ │
│  │ 2.1892*3.7008 │ 8.10179  ▸   │ 8.10179  ▸   │ 8.10  ▸   │ │
│  │               │ rel: 1.7e-7  │ rel: 1.7e-7  │ rel: 2e-4 │ │
│  ├───────────────┼──────────────┼──────────────┼───────────┤ │
│  │ 1/3 + 1/3     │ 0.666666 ▸   │ 0.666667 ▸   │ 0.666 ▸   │ │
│  │               │ rel: 5e-7    │ rel: 5e-7    │ rel: 1e-3 │ │
│  └───────────────┴──────────────┴──────────────┴───────────┘ │
│                                                              │
│  ▸ = click to expand Show Work panel                         │
└─────────────────────────────────────────────────────────────┘
```

### Cell Contents

- Stepwise approximation (primary value)
- Relative error beneath (secondary, smaller text)
- `▸` indicator that expands the Show Work panel for that cell

### Adding Expressions

- Text input at the top — same parser as Module I
- Supports the full expression syntax (fractions, trig, sqrt, complex, etc.)
- Expressions can be removed with an `×` button on the row

### Adding Parameter Sets

- Click "+ Add Parameter Set" to add a column
- Each column header has inline controls for `k` and rounding rule
- Columns can be removed with an `×` button on the header
- Default first column: snapshot of current global k and mode at time of creation (does not update if global settings change later)

### Interaction

- Expanding Show Work on a cell opens inline below that row, spanning all columns, with the specific cell's computation highlighted. Only one cell can be expanded at a time in the Compare tab (clicking another `▸` closes the previous). This differs from Modules I–III where multiple Show Work panels can be open simultaneously — the Compare tab constraint avoids layout chaos in the grid.
- Table is horizontally scrollable if many columns are added
- Cells recompute live when a column's parameters are edited
- Empty state: "Add an expression and a parameter set to start comparing"

### Classroom Features

- Table state persists while navigating between tabs (stored in app state)
- "Clear table" button to reset for the next problem

### Scope Boundaries

- Expressions only — no polynomial evaluation with variables (message: "Use Module III for polynomial evaluation")
- No persistence beyond the session (no localStorage, no URL encoding)
- No "send to compare" buttons from other modules — the Compare tab is self-contained

## Architecture: Explanation Engine

### New Module: `explanation-engine.js`

Takes engine result packages and produces structured explanation objects.

**Input:** A result package from `expression-engine.evaluateComparison()` or `poly-engine.evaluateComparison()`.

#### Mapping from Engine Step Shapes

The engines produce steps with this shape (both expression and poly engines):

```javascript
// expression-engine step (from recordStep):
{ index, kind, description, exact, approx, scientific, expression }

// poly-engine step (from recordStep):
{ index, description, exact, approx, scientific }
```

The explanation engine reads these step arrays directly. It does NOT need `left`/`right` operand decomposition — instead, it uses the `description` field (which contains human-readable labels like "Multiply accumulator by x*", "Add coefficient a_2") and the `exact`/`approx` pair to show what happened at each rounding event.

#### Expression Comparison Explanation Output

```javascript
{
  notation: [
    {
      stepIndex: 1,
      description: "2.1892 × 3.7008",   // from step.description or step.expression
      exact: "8.1017913616",              // formatted from step.exact
      rounded: "8.10179",                 // from step.approx
      scientific: "8.10179×10⁰",          // from step.scientific
      rule: "chop",                       // from comparison package config
      k: 6
    }
    // one entry per step in the steps array
  ],
  narrative: [
    "Step 1: 2.1892 × 3.7008. The exact result is 8.1017913616. With k=6 significant digits and chopping, this rounds to 8.10179.",
    "This introduces an absolute error of 0.0000013616."
  ],
  summary: {
    totalOps: 1,                          // from comparison package opCount
    totalRoundingEvents: 1,               // count of steps
    maxIntermediateError: "1.68e-7"        // max |exact - approx| across steps
  }
}
```

#### Polynomial Comparison Explanation Output

The poly comparison package has a different shape: `{ horner: { step: { steps, ... } }, direct: { step: { steps, ... } } }`. The explanation engine handles both method sub-packages. Each produces its own explanation object. The steps array within `horner.step.steps` and `direct.step.steps` uses the same `{ index, description, exact, approx, scientific }` shape as above.

#### Module II (Error Metrics) Explanation Output

For error analysis results, the explanation engine produces a `metricExplanation` variant:

```javascript
{
  notation: [
    { metric: "absolute", formula: "|p - p*|", substitution: "|0.333333 - 0.333333|", result: "0" },
    { metric: "relative", formula: "|p - p*| / |p|", substitution: "0 / 0.333333", result: "0" },
    { metric: "sigDigits", formula: "-log₁₀(rel)", substitution: "-log₁₀(0)", result: "∞" }
  ],
  narrative: [
    "The absolute error is |0.333333 − 0.333333| = 0.",
    "The relative error is 0 / 0.333333 = 0.",
    "The number of significant digits is ∞ (exact match)."
  ]
}
```

### Scope Boundaries

- `explanation-engine.js` reads result package shapes but does NOT call any math engine functions
- `math-display.js` renders explanations but does NOT generate them
- `app.js` wires the toggle state and calls the explanation engine when Show Work is expanded (lazy — not pre-computed for every result)

### Rendering Extension

`math-display.js` gets a small extension to render explanation objects — iterating over notation steps to produce `fl()` chains, or over narrative entries to produce paragraph text.

## Navigation

### Sidebar

New "Compare" entry as the 4th tab:

1. Machine Arithmetic (existing)
2. Error Analysis (existing)
3. Polynomial Methods (existing)
4. **Compare** (new)
5. Tutorial & Settings (existing)

Icon style consistent with existing sidebar entries. Same tab switching behavior.

### HTML Structure

Follows existing tab patterns in `index.html`:

**Sidebar button** (added between poly and tutorial buttons):
```html
<button id="tab-btn-compare" type="button" class="sidebar-nav-item" data-tab="compare"
        role="tab" aria-selected="false" aria-controls="tab-compare"
        aria-label="Compare" tabindex="-1">
  <span class="sidebar-icon">⇔</span>
  <span class="sidebar-label">Compare</span>
</button>
```

**Tab panel** (added between `tab-poly` and `tab-tutorial` sections):
```html
<section id="tab-compare" class="panel" role="tabpanel"
         aria-labelledby="tab-btn-compare" tabindex="0" hidden>
  <div class="module-shell module-compare">
    <!-- Compare tab content generated by app.js -->
  </div>
</section>
```

The tab panel has a minimal HTML skeleton. The comparison table, expression inputs, and parameter controls are generated dynamically by `app.js`, since the number of rows/columns is user-driven. This differs from Modules I–III which have full HTML skeletons — the Compare tab is inherently dynamic.

CSS classes follow existing conventions: `module-compare`, `compare-table`, `compare-cell`, `compare-header`, `compare-expr-input`, `compare-param-controls`.

## State Management

### New State

```javascript
// Top-level — shared across all modules
state.explanationMode = 'notation';  // 'notation' | 'narrative'

// Compare tab state
state.compare = {
  expressions: [],        // [{ id, raw, ast }]
  paramSets: [],          // [{ id, k, mode }]
  results: {},            // { `${exprId}-${paramId}`: comparisonPackage }
  expandedCell: null      // `${exprId}-${paramId}` or null
};

// Show Work state for Modules I–III (multiple panels can be open)
state.showWork = {
  expanded: new Set()     // set of result panel IDs
};
```

### Compare Tab Computation Sequence

1. User adds an expression → parse via `E.parse(raw)` → store `{ id, raw, ast }` in `state.compare.expressions`. Parse once, reuse AST for all parameter columns.
2. User adds a parameter set → store `{ id, k, mode }` in `state.compare.paramSets`.
3. For each `(expression, paramSet)` pair, call `E.evaluateComparison(ast, { k: paramSet.k, mode: paramSet.mode }, { angleMode: state.angleMode })` → store result in `state.compare.results[exprId-paramId]`.
4. Cells inherit the global `state.angleMode`. If the user changes angle mode on another tab and returns, existing results are NOT recomputed (they reflect the angle mode at computation time). The user can click "Clear table" and re-enter if needed.

### Recomputation Triggers

- Expression added/removed → compute all cells in that row
- Parameter set added/edited/removed → compute all cells in that column
- No full-table recompute unless necessary

## Error Handling

- Invalid expression: inline error in expression cell, result cells greyed out, row remains editable
- Polynomial expressions (containing `x`): message "Use Module III for polynomial evaluation"
- No hard limit on rows or columns; horizontal scroll past ~4 columns. Soft warning at 8+ columns or 10+ rows: "Large tables may slow computation"
- Division by zero / overflow: Show Work shows the error at the step where it occurs

## Dependency Graph

```
expression-engine.js  ─┐
                       ├─(data flows to)─→  explanation-engine.js  ─(data flows to)─→  math-display.js
poly-engine.js        ─┘                                                                ↑
                                                                                        app.js (wiring)
```

**Important:** The arrows represent data flow, not runtime dependencies. `explanation-engine.js` does NOT reference `ExpressionEngine` or `PolyEngine` globals — it only receives their output objects as arguments. However, it must load after them in `<script>` order so that it can be called from `app.js` after engine results are available.

**Script load order in `index.html`:**
`math-engine.js` → `calc-engine.js` → `expression-engine.js` → `poly-engine.js` → `math-display.js` → `explanation-engine.js` → `app.js`
