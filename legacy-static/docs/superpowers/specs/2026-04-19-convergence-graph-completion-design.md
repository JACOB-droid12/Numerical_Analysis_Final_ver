# Convergence Graph Completion — Design

**Date:** 2026-04-19
**Module:** IV — Root Workbench (`root-ui.js`, `styles.css`, `index.html`)
**Scope:** A + B from the brainstorm options — add an f(x) plot with iterate markers, plus a polish pass on the existing log|error| plot. Method-specific visualisations (bisection brackets, Newton tangents, fixed-point cobweb) are out of scope.

---

## 1. Problem

Module IV already renders a log₁₀|error| vs iteration line plot. The CSS scaffolding exists, the renderer is working, and convergence data flows through. What it does not do: show the function itself. A student running bisection on `x² − 2` sees the error shrink but cannot see the iterates walk along the curve toward the root. The pedagogical value of "watch the method find the zero" is missing.

This design completes the graph by adding a second, primary plot — f(x) with iterate markers — and finishing the existing error plot with theming, accessibility, and interactivity it never received.

## 2. User-facing behaviour

After any successful run in Module IV:

1. A tab strip appears inside the existing `#root-convergence-graph` container with two tabs: **Function f(x)** (default) and **Convergence rate**.
2. The **Function** tab shows an SVG plot of f(x) over an auto-fit x-window, with a horizontal zero line, a bracket-shaded region for bracket methods, the iterate trail as faded-to-opaque dots, and a highlighted final-root marker.
3. The **Convergence rate** tab shows today's log₁₀|error| vs iteration plot, now with hover tooltips and accessible title/description.
4. Hovering or keyboard-focusing any iterate dot (either plot) shows a tooltip: `Iteration n: xₙ = 1.234567` (formatted via the current significant-figure setting).
5. Singularities inside the x-window render as breaks in the curve, not vertical spikes. Iterate dots are unaffected.
6. Dark-mode, reduced-motion, and high-contrast preferences are respected.

Nothing else in Module IV moves or changes. The iteration table, stopping summary, and convergence-rate text block stay exactly where they are.

## 3. Architecture

### Container (existing, unchanged mount point)

```
#root-convergence-graph
  .root-graph-tabs            role="tablist"
    button.root-graph-tab     role="tab", data-panel="function"
    button.root-graph-tab     role="tab", data-panel="error"
  .root-graph-panel           role="tabpanel", data-panel="function"
    svg.root-function-svg     ← renderFunctionPlot
  .root-graph-panel           role="tabpanel", data-panel="error", hidden
    svg.root-convergence-svg  ← renderErrorPlot
```

### Module split in `root-ui.js`

Three new functions; one existing function renamed and relocated:

- `renderGraphTabs(run)` — new top-level. Builds the shell, wires ARIA tab semantics + keyboard (Left/Right/Home/End cycle; auto-activation), mounts both panels.
- `renderFunctionPlot(run, panelEl)` — new. Emits f(x) SVG.
- `renderErrorPlot(run, panelEl)` — today's `renderConvergenceGraph` body, lifted verbatim into its own function, then patched for tooltips + title/desc. Zero behavioural change at first commit.
- Existing `renderConvergenceGraph(run)` call site is replaced by `renderGraphTabs(run)`. The old function is deleted.

No new globals. No new `*.js` file. Everything stays in the `root-ui.js` IIFE, matching the existing renderer pattern (`renderSolutionSteps`, `renderTable`, etc.).

## 4. Data flow

`renderFunctionPlot` consumes fields already present on `run`:

| Field | Used for |
|---|---|
| `run.method` | Branch for fixed-point (plot `g(x) − x`) and bracket shading |
| `run.expression` | Re-parsed via `ExpressionEngine.parseExpression(…, { allowVariable: true })` |
| `run.rows[*]` | Iterate coordinates (see extractor below — field names vary by method) |
| `run.initial.left.x`, `run.initial.right.x` | Bracket shading + window seed (bracket methods) |
| `run.initial.x0` | Window seed (open methods) |
| `run.summary.approximation` | Final root marker |

Sampling uses `ExpressionEngine.evaluateValue(ast, { x })` (the existing public entry point, used in `app.js`) wrapped in a local try/catch that returns `null` on any thrown or non-finite result. One sample per 120-point grid; parse once per render. The wrapper is kept inside `root-ui.js` — we do not touch `expression-engine.js`.

### Iterate coordinate extractor

Engine rows differ by method. A single `extractIteratePoint(row, method)` helper returns `{ iteration, x, y }`:

| Method | x from | y from |
|---|---|---|
| `newton`, `secant` | `row.xn` | `row.fxn` |
| `bisection`, `falsePosition` | `row.c` (midpoint) | `row.fc.approx` (point object → `.approx`) |
| `fixedPoint` | `row.xn` | `row.gxn − row.xn` (derived residual) |

Any row whose extracted `x` or `y` is null/non-finite is dropped from the iterate set (but the run is still plotted).

### Window computation

```
xs = [ …iterate x-values, summary.approximation, initial.left?.x, initial.right?.x, initial.x0 ]
     .filter(Number.isFinite)
span = max(xs) − min(xs)
floor = max(1e-6, 0.01 · |median(xs)|)
span = max(span, floor)
xMin = min(xs) − 0.2 · span
xMax = max(xs) + 0.2 · span
```

If `xMin === xMax` post-padding, expand to `[x − 0.5, x + 0.5]`.

### Y-window and singularity handling

```
yIterates = rows.map(extractIteratePoint).map(p => p.y).filter(Number.isFinite)
yMax = max(1, max(|yIterates|) · 1.25)
yMin = −yMax
```

Each curve sample with `y === null`, `!Number.isFinite(y)`, or `|y| > yMax` is treated as a break: the renderer splits the curve into multiple `<polyline>` segments. Iterate dots are clamped to the window with `data-offscreen="true"` if they fall outside.

### Fixed-point branch

When `run.method === "fixedPoint"`, the plotted function is `g(x) − x` (so the root of the displayed function corresponds to the fixed point). Engine rows store `gxn` (the output of g), not the residual, so the extractor derives `y = gxn − xn`. The curve sampler also subtracts: `y = evaluateValue(ast, { x }) − x`. Both transformations live in one place — the extractor for iterates and a one-line branch in the sampler — and both are gated on `run.method === "fixedPoint"`.

## 5. Components

### 5.1 Tab switcher

- Two `<button class="root-graph-tab">` with `role="tab"`, `aria-selected`, `aria-controls`, `tabindex` managed (0 active, −1 inactive).
- Keyboard: Left/Right cycle with auto-activation; Home/End jump to first/last.
- Default selected tab on each render: **Function f(x)**. No persistence across runs.
- Reuses `.root-method-tab` visual treatment — matching pills keep the workbench coherent.

### 5.2 Function plot layers (back to front)

1. `<rect class="root-graph-bg">` — plot background.
2. Grid — 4–6 horizontal + vertical gridlines on "nice numbers" via `niceStep(range, 5)` (1·10^k, 2·10^k, 5·10^k).
3. Zero line `y = 0` — stroked heavier than grid, class `.root-graph-axis`, labelled "f = 0".
4. Bracket shading (bracket methods only) — faint `<rect class="root-graph-bracket">` from `initial.left.x` to `initial.right.x`.
5. Curve — 120 samples, split into `<polyline class="root-graph-line">` segments at every break.
6. Iterate trail — one `<circle class="root-graph-iterate" style="--recency:{0.3..1.0}">` per iterate. Early iterates faint, later opaque. `tabindex="0"`, `data-i`, `data-x`.
7. Final root marker — one `<circle class="root-graph-root-marker">` at `(summary.approximation, 0)`, radius 5, contrasting stroke.
8. Axis ticks + titles — x axis below, y axis left. Title: "x" and "f(x)" (or "g(x) − x" for fixed-point).
9. `<title>` + `<desc>` for screen readers.

### 5.3 Tooltip

Single `<div class="root-graph-tooltip" hidden>` per panel. One delegated listener per SVG handles `mouseover`, `mouseout`, `focusin`, `focusout`. Reads `data-i` and `data-x`, formats via `fmtRunVal(x, run, 10)`, positions above the dot with a small offset, keeps inside the SVG viewport.

### 5.4 Error plot polish

- Body relocated from `renderConvergenceGraph` into `renderErrorPlot(run, panelEl)` — verbatim at first commit.
- Add same tooltip machinery as 5.3.
- Add `<title>Convergence rate</title>` and `<desc>log base 10 of the absolute error on each iteration.</desc>`.
- Wrap any entry animation in `@media (prefers-reduced-motion: no-preference)`.

### 5.5 CSS additions

Placed beside the existing `.root-graph-*` block in `styles.css`:

```
.root-graph-tabs          — flex row, small gap, border-bottom divider
.root-graph-tab           — pill button, reuses --accent tokens, focus-visible ring
.root-graph-tab[aria-selected="true"] — uses var(--accent) background
.root-graph-panel         — padding, min-height (prevents layout jump on tab change)
.root-graph-iterate       — fill var(--accent), fill-opacity var(--recency, 1)
.root-graph-root-marker   — fill var(--accent), stroke 2px var(--surface)
.root-graph-bracket       — fill var(--accent-soft), 1px dashed border
.root-graph-tooltip       — absolute, tinted background, small arrow via ::after
.root-function-svg        — display:block, width 100%, max-width 560px
```

No new colour values invented — everything uses existing tokens.

## 6. Error handling and edge cases

| Case | Behaviour |
|---|---|
| `run.rows.length === 0` | Both panels show `<p class="focus-note">Not enough data to plot.</p>`. Tabs still render. |
| `run.rows.length === 1` | Function panel renders curve + single iterate + root marker. Error panel shows existing "Not enough iterations" copy. |
| Parse of `run.expression` fails | Function panel shows `<p class="focus-note">Could not re-parse expression for plot.</p>`. Error panel renders normally. Parse error logged once via `console.warn`. |
| All extracted iterate y-values non-finite | Iterates placed on the `y = 0` line. Footer note: "Iterate y-values unavailable." |
| Window collapses (`xMin === xMax`) | Expand to `[x − 0.5, x + 0.5]` before sampling. |
| Singularity in window | Curve breaks into multiple polyline segments at every null/out-of-y-range sample. |
| Iterate x outside window | Clamped to window edge, rendered with reduced opacity, `data-offscreen="true"`. Tooltip shows real value. |
| `summary.approximation` null/non-finite | Root marker skipped; rest renders. |
| Fixed-point with non-parseable `gExpression` | Same as parse-fails case. |
| `evaluateValue` throws | Local try/catch returns `null`. Sample becomes a curve break; no unhandled exception reaches the UI. |

**Listener hygiene:** `innerHTML` replacement on the container removes old elements and their listeners. Tooltip listeners live on each SVG, recreated per render. No leaks across runs. No module-level state — everything lives on DOM attributes.

## 7. Testing

**Manual visual audit** (checklist to run before shipping):

1. Bisection `f = x² − 2` on `[1, 2]`, tol 1e-6 — curve crosses zero once; ~20 iterates fade toward ~1.414.
2. Newton `f = cos(x) − x` from `x₀ = 0.5` — fast convergence; window wide enough to show curvature.
3. Fixed-point `g = (x + 2/x)/2` from `x₀ = 1` — plot shows `g(x) − x`, iterates converge to ~1.414.
4. Cap-hit run (tight tol + slow method) — 50+ iterates, recency fade keeps dots legible.
5. Singularity: `f = 1/(x − 1.5)` bracket `[1, 2]` — curve breaks at the pole, no vertical spike.
6. Invalid bracket (no sign change) — function tab still renders; message hero explains the stop.
7. Dark-mode toggle on an active run — grid, curve, tabs read correctly; no hardcoded `#fff` bleeding through.
8. Keyboard only — Tab into graph, arrow between tabs, Tab through iterate dots, tooltip follows focus.
9. `prefers-reduced-motion: reduce` — no fade-in; recency opacity still applies (state, not animation).
10. Narrow viewport (360px wide) — tabs wrap/shrink cleanly; SVG viewBox scales.

**Automated:**

- Extend `scripts/battery-validation.js` and `scripts/root-ui-precision-audit.js` with a headless check that `#root-convergence-graph` contains an `<svg>` after each preset completes. Catches "renderer threw and ate the panel" regressions.

**Regression guard:**

- Before/after screenshot of the existing error plot on one preset — verify the relocation into `renderErrorPlot` is visually identical at the first commit, before the polish changes land.

## 8. Out of scope

- Method-specific visualisations (bisection bracket shrinking animation, Newton tangent lines, fixed-point cobweb). Kept as a future direction; architecture leaves room for a third `renderMethodPlot` without restructuring.
- Zoom / pan interactions.
- Persisting the selected tab across runs or sessions.
- Exporting the plot (PNG/SVG download).
- Comparison overlays (multiple methods on one axis).

## 9. Success criteria

- Running any Module IV method produces a visible f(x) plot with iterate markers on first render, with the function tab selected by default.
- Tab switch works via mouse, keyboard, and touch.
- Tooltip appears on hover and on keyboard focus, with correct iteration number and x-value.
- All ten items in the manual audit pass.
- No regression in the existing error plot rendering.
- Dark mode, reduced motion, and keyboard-only users get equivalent functionality.
- No unhandled exceptions in the console on any of the brutal-test battery inputs.
