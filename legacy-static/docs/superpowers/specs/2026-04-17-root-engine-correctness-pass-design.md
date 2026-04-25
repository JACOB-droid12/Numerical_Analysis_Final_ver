# Root-Engine Correctness Pass Design

Date: 2026-04-17
Project: Numerical Analysis Teaching Lab
Status: Draft for user review

## Summary

A hardening and convergence-guard pass across every root-finding method in
`root-engine.js` (Bisection, Newton, Secant, False Position, Fixed Point). The
pass converts in-loop evaluator crashes into structured stop reasons, rejects
invalid inputs before iteration begins, and adds targeted convergence guards
that prevent three documented quality defects: Newton claiming convergence
after a wild step, False Position stagnating at the iteration cap, and Fixed
Point cycling without reporting the cycle.

The UI layer is not changed. All new behavior rides on the existing
stop-reason channel that Bisection and Fixed Point already use for structured
outcomes such as `invalid-bracket` and `diverged`.

## Goals

- Remove every unexpected crash surfaced by the 255-case battery that is
  attributable to a root method. Replace each crash with a structured stop
  reason that preserves the iteration rows produced before the failure.
- Reject invalid stopping parameters (`epsilon <= 0`, `iterations < 1`,
  non-finite starting scalars) with an explicit result, not an exception.
- Stop Newton from reporting convergence after a step that blows up without a
  matching drop in residual.
- Stop False Position from burning the iteration cap on classic
  retained-endpoint stagnation cases.
- Report Fixed Point short-period cycles as `cycle-detected`, not as a vague
  pseudo-convergence note.
- Preserve all behavior that the 2026-04-16 bisection relative-tolerance
  design locks in.

## Non-Goals

- No change to ExpressionEngine implicit-multiplication gaps (1.21, 1.22).
- No change to Math/Calc precision behavior (2.1, 2.14, 2.15, 3.15 through
  3.18).
- No change to PolyEngine cancellation drift (9.3, 9.5, 9.7, 9.16, 12.12).
- No change to IEEE754 negative-zero sign loss (10.2) or the 10.18 error
  message wording.
- No change to Bisection's relative-tolerance default or to the design locked
  in by `2026-04-16-bisection-relative-tolerance-design.md`. Cross-module tests
  12.7 and 12.9 are treated as test-expectation drift, not engine defects.
- No change to Secant's k=2 chopped-arithmetic behavior for case 12.13. Coarse
  precision produces coarse roots; the test expectation is reframed.
- No UI-visible changes other than new stop-reason strings rendered through
  the existing channel.

## Current Problem

The 255-case battery documents four crash-style failures and a cluster of
convergence-quality problems:

- Bisection accepts `epsilon <= 0` and `iterations = 0` (cases 4.22, 4.23,
  4.24).
- False Position crashes with "Division by zero" when an iteration lands on a
  discontinuity (cases 7.8, S11).
- Fixed Point crashes with "Value is not finite" or "Division by zero" when
  the iterate steps through a singularity (cases 8.9, 8.15).
- Newton throws "error must be finite" on supplemental case S1.
- Secant throws "Division by zero" on NaN-like starting input (case S6).
- Newton reports convergence after jumping to roughly 272244 (case 5.12).
- False Position stalls at the iteration cap on classic starvation cases (7.3,
  7.12).
- Fixed Point stops with an unsatisfying note on cycle and pseudo-convergence
  cases (8.2, 8.13, S9).

The root cause in every crash case is the same: evaluator throws from inside
the iteration loop propagate past the method's result builder and reach the
UI. The root cause of the convergence-quality failures is that each method
declares convergence on step-size alone without a corresponding sanity check.

## Decision

Apply a two-layer fix:

1. A mechanical hardening layer that wraps in-loop evaluator calls in a single
   helper and lifts input validation above each method's loop.
2. A targeted convergence-guard layer with one dedicated guard per affected
   method. Each guard has a named constant for its threshold so later tuning
   is a one-line change.

Both layers reuse the existing stop-reason channel. No new UI wiring is
required.

## Architecture

### Helpers (new, private to the root-engine IIFE)

- `safeEvaluate(evalFn, x, ...rest)` returns either
  `{ ok: true, point }` on success or
  `{ ok: false, reason, x, message }` on a caught throw or a non-finite
  result. The `reason` field is one of the new stop-reason strings below.
- `validateEpsilonStopping(stopping)` returns a rejection descriptor if
  `epsilon <= 0` or if parsing produces a non-finite epsilon. A rejection
  becomes an `invalid-input` result with no rows.
- `validateIterationStopping(stopping)` returns a rejection descriptor if the
  parsed iterations value is not an integer `>= 1`.
- `validateStartingScalar(value, label)` returns a rejection descriptor if the
  parsed scalar is NaN or non-finite.

Each per-method entry point runs the applicable validators before entering its
iteration loop. A rejection is returned immediately, wrapped in the same shape
as a normal result so the UI can render it.

### New stop reasons

- `invalid-input` with a `message` field naming the specific rejected input.
- `singularity-encountered` when the evaluator throws inside f(x) or g(x) or
  f'(x) during iteration. Carries the offending x-value and the rows produced
  so far.
- `non-finite-evaluation` when the evaluator returns NaN or Infinity without
  throwing. Same payload shape.
- `diverged-step` (Newton) when a Newton step fails the blow-up guard.
- `step-small-residual-large` (Newton) when step-size convergence is met but
  the residual check fails.
- `retained-endpoint-stagnation` (False Position) when the retained-endpoint
  guard trips. This name is deliberately distinct from the existing
  `stagnation` reason in `root-ui.js` (used for denominator near zero) so the
  two causes do not collide in the UI map.
- `cycle-detected` (Fixed Point) with a `period` field for the detected cycle
  length.

### Per-method wiring

| Method         | Input validation                       | In-loop catch wrapping                   | Convergence guard                          |
|----------------|----------------------------------------|------------------------------------------|--------------------------------------------|
| Bisection      | epsilon and iterations                 | not required (continuity detection does the job) | none new                        |
| Newton         | starting x_0, epsilon                  | around f and f' evaluations              | diverged-step plus residual check          |
| Secant         | starting x_0, x_1, epsilon             | around both evaluations                  | none new                                   |
| False Position | bracket endpoints, epsilon             | around a, b, c evaluations               | retained-endpoint stagnation               |
| Fixed Point    | starting x_0, epsilon                  | around g evaluation                      | short-period cycle detection               |

## Convergence Guards

### Newton diverged-step and residual check

After each Newton step, evaluate two conditions before accepting a converged
result:

1. Step blow-up: if a previous `|delta_x|` exists and the new
   `|delta_x| > NEWTON_STEP_BLOWUP_RATIO * |previous delta_x|`, stop with
   `diverged-step`. Payload includes the jumped-to x-value and
   `|f(x_new)|`.
2. Residual check: when the step-size convergence test succeeds, also require
   `|f(x_new)| <= |f(x_old)|` OR
   `|f(x_new)| <= NEWTON_RESIDUAL_BOUND * max(1, |x_new|)`. If neither holds,
   stop with `step-small-residual-large`.

Named constants at the top of the IIFE:
`NEWTON_STEP_BLOWUP_RATIO = 10`, `NEWTON_RESIDUAL_BOUND = 1e-10`. The
residual bound is scaled by `max(1, |x_new|)` so roots at large magnitudes
are not penalized. Both values are tunable by a one-line change.

### False Position retained-endpoint stagnation

Track the most recently retained endpoint and a counter. On each iteration,
if the retained endpoint is the same as on the previous iteration, increment
the counter; if the retained side flips, reset the counter to zero. When the
counter reaches `FP_STAGNATION_WINDOW = 20` and the normal tolerance rule
has not yet fired, stop with `retained-endpoint-stagnation`. The last row
is still emitted normally. This guard fires only when the method is crawling
in one direction for an extended window without satisfying tolerance; a
brief retention during normal convergence (counter resets before the window
fills) does not trigger it.

### Fixed Point short-period cycle detection

After each iteration, for `k` in {2, 3, 4}, if `x_n` is within
`max(epsilon, machine_eps * |x_n|)` of `x_{n-k}`, stop with `cycle-detected`
and populate the `period` field with `k`. This runs in addition to the
existing pseudo-convergence note, whose wording is polished for consistency
but whose logic is unchanged.

## Test Alignment

Existing battery cases that currently assert thrown exceptions are rewritten
to assert the new stop-reason strings:

- 8.9, 8.15 expect `non-finite-evaluation` or `singularity-encountered` as
  appropriate to the underlying cause.
- 7.8, S11 expect `singularity-encountered` in False Position.
- S1 expects `non-finite-evaluation` in Newton.
- S6 expects `invalid-input` in Secant (NaN starting value rejected).
- 12.7, 12.9 are rewritten to assert the current engine behavior for a
  bracket-touching-zero case under relative tolerance. The implementation
  plan will read the exact stop-reason string produced by the current
  engine (no engine change) and the rewritten tests will match that string
  verbatim.
- 12.13 is reframed to accept the coarse Secant result under k=2 chopped
  arithmetic as valid convergence. The assertion requires only that the
  reported root lies within the precision that k=2 can resolve.

## New Tests

Added to the existing battery structure in `scripts/`:

- For each method that accepts `epsilon`: a case with `epsilon = 0`, a case
  with `epsilon = -1`. Both expect `invalid-input`.
- For each method that accepts `iterations`: a case with `iterations = 0`.
  Expects `invalid-input`.
- For Newton, Secant, Fixed Point: a case with NaN starting value. Expects
  `invalid-input`.
- Newton on `x^3 - 2x + 2` from `x_0 = 0`. Expects `diverged-step` rather
  than a false convergence claim.
- Fixed Point on `g(x) = 1 - x` from `x_0 = 0.5`. Expects `cycle-detected`
  with `period = 2`.
- False Position on a constructed stagnation case (one endpoint retained for
  at least 20 iterations without meaningful progress). Expects
  `retained-endpoint-stagnation`.

## Error Handling

- Invalid inputs yield an `invalid-input` result. The message field names the
  failing input so the UI can echo it back.
- In-loop evaluation failures yield `singularity-encountered` or
  `non-finite-evaluation`. Rows produced before the failure are preserved and
  returned with the result.
- Convergence-guard stops (`diverged-step`, `step-small-residual-large`,
  `stagnated`, `cycle-detected`) preserve all rows produced up to and
  including the detection iteration.

## Verification Gate

The pass is considered complete when:

- The 255-case battery reports zero unexpected crashes. The previously
  observed 25 printed exceptions drop to the subset that genuinely belongs to
  out-of-scope engines (ExpressionEngine, IEEE754 input parsing, etc.). No
  root-method case produces a bare throw.
- Every previously-passing test continues to pass, including all tests locked
  in by `2026-04-16-bisection-relative-tolerance-design.md`.
- `node scripts/engine-correctness-audit.js` passes.
- `node scripts/root-engine-audit.js` passes.

## Implementation Notes

- All named constants (`NEWTON_STEP_BLOWUP_RATIO`, `FP_STAGNATION_WINDOW`,
  cycle-check `k` set, residual bound) live at the top of the root-engine
  IIFE with short comments explaining their role.
- Input validation is centralized in the three validators listed in the
  Architecture section. Each method's entry point calls only the validators
  it needs.
- The `safeEvaluate` helper is the single chokepoint for translating
  evaluator throws into stop reasons. No per-method try/catch logic is
  duplicated.
- No changes to the method signatures that `root-ui.js` and `app.js` already
  call. The new stop-reason strings are appended to the `formatStopReason`
  map in `root-ui.js` (currently at lines 264-280). Each new string gets a
  short student-facing label in that map. Unmapped stop reasons fall through
  to the map's default branch, which echoes the raw string, so adding the
  map entries is a requirement for a clean UX but not a correctness gate.
