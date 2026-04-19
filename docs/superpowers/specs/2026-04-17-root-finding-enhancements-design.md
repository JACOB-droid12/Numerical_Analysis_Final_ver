# Root-Finding Module Enhancements: Calculator-First Lecture Presets, Notes, Comparison & Robustness

**Date:** 2026-04-17
**Module:** IV - Root Finding Workbench
**Scope:** Calculator-first enhancements based on the professor's lecture notes for Fixed-Point Iteration, Newton's Method, Secant Method, False Position, and Bisection.

## Context

The calculator already supports all five root-finding methods with method-specific forms, iteration tables, convergence graphs, and solution steps. The goal of this enhancement is not to turn Module IV into a lesson page. The goal is to keep it fast as a calculator while making it easier to:

1. load lecture-style examples into the live solver
2. verify hand-worked classroom tables against the calculator's output
3. understand why a method converged, diverged, or failed
4. compare methods only when the student explicitly asks for it

**Primary use case:** exam and quiz support. Students should still be able to type values and press `=` immediately without extra friction.

## Product Principles

### Calculator First

The current method tabs remain the primary workflow. A student should still be able to:

1. choose a method
2. type values
3. press `=`
4. read the answer quickly

Any lecture support must stay secondary to that flow.

### Lecture Support Is Optional

Lecture examples, theory notes, and comparison tools should help students when they want support, but they should not make the form busier than necessary.

### The Live Solver Stays In Charge

Worked examples are preset loaders, not pre-solved demos. Loading an example fills the inputs only. The student must still press `=` so the normal calculator engine produces the result, table, graph, and notes.

## 1. UI Behavior

### Main Method Tabs

The existing five method tabs remain unchanged as the main entry point:

- `Bisection`
- `Newton-Raphson`
- `Secant`
- `False Position`
- `Fixed Point`

The existing result table, convergence graph, and solution steps remain the main output.

### Additions To Each Method Tab

Each tab gets two small additions near the existing controls:

1. a compact `Worked example` dropdown
2. a `Load example` button

Each tab also gets one one-line method hint. These hints are intentionally short and should not become mini lectures.

Examples:

- `Bisection: needs an interval where f(a) and f(b) have opposite signs.`
- `Newton: needs f(x), f'(x), and a good starting point x0.`
- `Secant: needs two starting values and can fail if the secant slope becomes zero.`
- `False Position: keeps a valid bracket while using linear interpolation.`
- `Fixed Point: converges best when |g'(x)| is less than 1 near the fixed point.`

### Post-Result Actions

After a run finishes, the result area may show:

1. the normal method result
2. supplementary theory notes inside the existing solution steps area
3. a compact `Compare methods` button

This button appears only after a result. It does not add a new permanent section to the form.

## 2. Lecture Example Presets

### Implementation Pattern

Each method tab gets a `Worked example` dropdown and `Load example` button, matching the established preset-loader pattern used elsewhere in the app.

Loading a preset:

- fills the current tab's inputs only
- does not auto-compute
- leaves the inputs editable
- lets the student press `=` to run the actual calculator

Loaded values should include everything required to reproduce the lecture setup:

- expression or derivative
- interval or starting values
- stopping mode and stopping value
- significant digits and chopping or rounding rule when applicable

### Preset Labeling

Preset labels should help students scan quickly. Each label should indicate purpose where useful, such as:

- `table match`
- `converges`
- `diverges`
- `undefined`
- `fast`

### Fixed Point - 8 Presets

| # | Label | g(x) | x0 | Stop | Notes |
|---|-------|------|----|------|-------|
| 1 | Fixed points of x^2 - 2 | `x^2 - 2` | 0.5 | 10 iters | Fixed points at x = 2 and x = -1 |
| 2 | Unique FP of (x^2 - 1)/3 | `(x^2 - 1)/3` | 0.5 | 10 iters | |g'(x)| < 2/3 on [-1, 1] |
| 3 | g(x) = 3^(-x) | `3^(-x)` | 0.5 | 10 iters | Cannot solve p = g(p) analytically |
| 4 | x^3 + 4x^2 - 10: g1 diverges | `x - x^3 - 4*x^2 + 10` | 1.5 | 10 iters | Diverges |
| 5 | x^3 + 4x^2 - 10: g2 undefined | `sqrt(10/x - 4*x)` | 1.5 | 10 iters | Becomes undefined |
| 6 | x^3 + 4x^2 - 10: g3 converges | `(1/2)*(10 - x^3)^(1/2)` | 1.5 | 10 iters | Good convergence |
| 7 | x^3 + 4x^2 - 10: g4 fast | `(10/(4 + x))^(1/2)` | 1.5 | 10 iters | Faster convergence |
| 8 | x^3 + 4x^2 - 10: g5 Newton-like | `x - (x^3 + 4*x^2 - 10)/(3*x^2 + 8*x)` | 1.5 | 10 iters | Newton-like rearrangement |

### Newton-Raphson - 4 Presets

| # | Label | f(x) | f'(x) | x0 | Stop |
|---|-------|------|--------|----|------|
| 1 | sqrt(2) table match | `x^2 - 2` | `2*x` | 1 | 3 iters |
| 2 | 2x^3 + x^2 - x + 1 | `2*x^3 + x^2 - x + 1` | `6*x^2 + 2*x - 1` | -1.2 | epsilon < 0.0001 |
| 3 | x^(1/3) divergence | `x^(1/3)` | `(1/3)*x^(-2/3)` | 0.1 | 5 iters |
| 4 | cos(x) - x | `cos(x) - x` | `-sin(x) - 1` | 0.785398 | 10 iters |

### Secant - 1 Preset

| # | Label | f(x) | x0 | x1 | Stop |
|---|-------|------|----|----|------|
| 1 | cos(x) - x | `cos(x) - x` | 0.5 | 0.785398 | 10 iters |

### False Position - 1 Preset

| # | Label | f(x) | a | b | Stop |
|---|-------|------|---|---|------|
| 1 | cos(x) - x | `cos(x) - x` | 0 | 1.570796 | 10 iters |

### Bisection - 1 Preset

| # | Label | f(x) | a | b | Stop |
|---|-------|------|---|---|------|
| 1 | x^3 + 4x^2 - 10 on [1, 2] | `x^3 + 4*x^2 - 10` | 1 | 2 | 27 iters |

## 3. Supplementary Theory Notes

Theory notes should appear inside the existing `Solution steps` area. No new lecture panel should be added.

These notes are supplementary. The primary result should still be the computed approximation, status, and iteration data.

### Fixed Point - g'(x) Interpretation

After a fixed-point run, append one extra note based on a numerical estimate of `g'(p)` at the approximate fixed point:

`g'(p) ~= (g(p + h) - g(p - h)) / (2h)`, where `h = max(|p| * 1e-7, 1e-10)`.

Messaging:

- If `|g'(p)| < 1`: explain that the estimate supports convergence under the Fixed Point Theorem.
- If `|g'(p)| >= 1`: explain that convergence is not guaranteed by the theorem.
- If the run diverged: explain that a different rearrangement may be needed where `|g'(x)| < 1` near the root.

### Newton Failure Notes

When Newton fails, use lecture-style explanations instead of engine phrasing.

Examples:

- `f'(x_n) = 0 at this iteration. Newton's method requires f'(x) != 0 at each step.`
- `The iteration moved into an unstable region, so Newton's method did not converge from this starting point.`

### Convergence Rate Labels

Keep the existing convergence-rate estimation, but present the interpretation more clearly:

- order < 1.2 -> `linear convergence`
- order 1.2 to 1.8 -> `superlinear convergence`
- order >= 1.8 -> `quadratic convergence`

These labels should remain secondary annotations, not the headline result.

## 4. Compare Methods

### Product Shape

Comparison is included because students may want to compare the same problem across methods, but it must remain optional.

This feature is a post-result action, not a new main tab and not a separate study workspace.

### Trigger

Show a small `Compare methods` button only after a result is available.

### Output

Clicking the button opens a compact comparison card below the main result. The card shows a lecture-style quick summary with rows such as:

- method
- status: converged, failed, diverged, skipped
- approximation
- iterations used
- stopping reason
- a small note or badge such as `fastest`, `bracketed`, or `needs derivative`

### Safe Reuse Rules

The comparison view should reuse the student's existing problem setup where possible:

- if the current method is bracketed, reuse the current interval for `Bisection` and `False Position`
- if the current method is open, reuse the current starting value or starting pair where appropriate
- if a method requires missing information, skip it with a short explanation

Examples:

- `Newton skipped: derivative required.`
- `Bisection skipped: no valid bracket available.`
- `Fixed Point skipped: no g(x) form available.`

### Scope Boundary

This comparison card is informative, not authoritative. It helps students inspect differences quickly, but the primary method run remains the main answer.

## 5. Robustness Fixes

### x^(1/3) Newton Divergence

The lecture example `f(x) = x^(1/3)` can fail when a later iterate becomes negative and JavaScript produces `NaN` for that power path.

Preferred handling order:

1. catch the invalid numeric case in `root-engine.js` and report divergence gracefully
2. change `expression-engine.js` only if root-level handling is not sufficient

The calculator should never crash because of this lecture example.

### Fixed-Point First-Iteration Epsilon Guard

The current engine intentionally rejects a nonzero first-iteration epsilon stop unless the point is an exact fixed point. This protects against pseudo-convergence cases such as `g(x) = x + 1e-8`, where the first step can be smaller than epsilon even though the sequence drifts forever.

Keep this guard in place:

- if `g(x_n)` equals `x_n` exactly, stop as an exact fixed point
- if the first nonzero step is below epsilon, continue until the step trend gives convergence evidence
- require shrinking behavior from iteration 2 onward before reporting `tolerance-reached`
- keep the existing `g(x) = x + 1e-8` audit green

### Lecture-Style Failure Messages

Replace generic engine text with classroom-friendly explanations.

Examples:

- `f'(x_n) = 0 at this iteration. Newton's method requires f'(x) != 0 at each step.`
- `f(x_n) ~= f(x_(n-1)), so the secant slope is zero and a new approximation cannot be computed.`
- `This fixed-point rearrangement became undefined before it could converge.`

## 6. Files Touched

| File | Changes |
|------|---------|
| `index.html` | Add preset dropdowns, load buttons, small method hints, and post-result compare trigger |
| `root-ui.js` | Preset data, load handlers, compare card wiring, note text, and convergence-rate labels |
| `root-engine.js` | Fixed-point derivative estimate helper and divergence/error handling while preserving the first-iteration pseudo-convergence guard |
| `expression-engine.js` | Only if required for odd-root-of-negative behavior |
| `styles.css` | Minimal styling for preset controls, short hints, and compact compare card |

## 7. What Does Not Change

- No new root-finding workspace
- No heavy lecture panel inside the form
- No auto-running presets
- No changes to Modules I-III or the Tutorial tab
- No replacement of the current method-specific results with compare-first output
- No breaking changes to the current root-solving engines

## 8. Verification

1. Load each preset and confirm it fills inputs without auto-computing.
2. Check that pressing `=` on a loaded preset runs the normal solver and produces the normal method output.
3. Verify the Newton sqrt(2) example matches the lecture table: `1.0 -> 1.5 -> 1.416667 -> 1.414216`.
4. Verify the fixed-point `g1` to `g5` examples produce the expected mix of divergence, undefined behavior, and convergence.
5. Verify the Newton `x^(1/3)` example reports divergence or failure cleanly instead of crashing.
6. Verify fixed-point first-iteration pseudo-convergence remains rejected for `g(x) = x + 1e-8`, `x0 = 0`, and `epsilon = 1e-7`.
7. Verify the `Compare methods` button stays hidden until a result exists.
8. Verify comparison stays compact and skips unsupported methods with clear messages.
9. Run the existing root stress and correctness checks to confirm no regressions.
