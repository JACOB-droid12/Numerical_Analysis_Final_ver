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

### UI Details

- Toggle between notation/narrative persists per session (stored in app state alongside angle mode, display format)
- Panel uses the same math rendering as existing results (via `math-display.js`)
- Mode is shared app-wide — one toggle for all Show Work panels and the Compare tab

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
- Default first column: current global k and mode

### Interaction

- Expanding Show Work on a cell opens inline below that row, spanning all columns, with the specific cell's computation highlighted
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

**Output:**

```javascript
{
  notation: [
    {
      operation: "×",
      left: "2.1892",
      right: "3.7008",
      exact: "8.1017913616",
      rounded: "8.10179",
      rule: "chop",
      k: 6
    }
    // one entry per intermediate step
  ],
  narrative: [
    "The exact product of 2.1892 and 3.7008 is 8.1017913616.",
    "With k=6 significant digits and chopping, we discard everything after the 6th significant digit, giving 8.10179.",
    "This introduces an absolute error of 0.0000013616."
  ],
  summary: {
    totalOps: 1,
    totalRoundingEvents: 1,
    maxIntermediateError: "1.68e-7"
  }
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

## State Management

### New State

```javascript
state.compare = {
  expressions: [],        // [{ id, raw, ast }]
  paramSets: [],          // [{ id, k, mode }]
  results: {},            // { `${exprId}-${paramId}`: comparisonPackage }
  expandedCell: null,     // `${exprId}-${paramId}` or null
  explanationMode: 'notation'  // 'notation' | 'narrative'
};

state.showWork = {
  expanded: new Set(),    // set of result panel IDs
  // mode shared via state.compare.explanationMode
};
```

### Recomputation Triggers

- Expression added/removed → compute all cells in that row
- Parameter set added/edited/removed → compute all cells in that column
- No full-table recompute unless necessary

## Error Handling

- Invalid expression: inline error in expression cell, result cells greyed out, row remains editable
- Polynomial expressions (containing `x`): message "Use Module III for polynomial evaluation"
- No hard limit on rows or columns; horizontal scroll past ~4 columns
- Division by zero / overflow: Show Work shows the error at the step where it occurs

## Dependency Graph

```
expression-engine.js  ──→  explanation-engine.js  ──→  math-display.js
poly-engine.js        ──↗                              ↑
                                                       app.js (wiring)
```

`explanation-engine.js` loads after the math engines, before `app.js`.
