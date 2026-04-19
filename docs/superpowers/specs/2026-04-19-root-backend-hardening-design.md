# Root Backend Hardening Design

Date: 2026-04-19
Project: Numerical Analysis Teaching Lab
Status: Draft for user review

## Summary

Harden the backend for bracketed root methods, extreme numeric inputs, and the
255-case battery without turning this pass into a broad refactor. The pass adds
a shared continuity-screening contract for Bisection and False Position,
converts non-finite numeric breakdowns into structured solver results, places
hard caps around scientific-notation parsing and machine precision inputs, and
modernizes the battery so printed output is no longer mistaken for passing
tests.

This pass is backend-first. It keeps the public stop-reason vocabulary small,
reuses the current result shapes, and avoids unrelated UI or persistence work.

## Goals

- Stop Bisection and False Position from accepting asymptotes or
  discontinuities as if they were valid brackets.
- Ensure extreme numeric paths return structured solver outcomes instead of raw
  thrown exceptions.
- Add hard limits for numeric input length, exponent magnitude, and machine
  precision `k` to prevent freeze or memory-growth paths such as `1e10000000`.
- Convert the exploratory battery path into assertive suites that fail loudly
  locally and in CI.
- Preserve the current calculator architecture and result objects so the UI can
  keep using the same rendering flow.

## Non-Goals

- No ExpressionEngine security redesign beyond the numeric-parser hardening
  described here.
- No `math-display.js` sanitization pass in this cycle.
- No `localStorage` persistence in this cycle.
- No broad refactor of every solver into a new abstraction layer.
- No migration to Node's built-in `node:test` runner in this cycle.

## Current Problems

The current backend still has four critical gaps:

1. Bracketed methods can be deceived by discontinuities. For example,
   `tan(x)` on `[1, 2]` currently enters a valid-bracket flow and can walk
   toward `pi/2`, which is an asymptote rather than a root.
2. Some extreme numeric paths still throw directly from inside solver loops.
   Examples include Newton hitting a non-finite step/error and Bisection
   attempting to compute a non-finite interval width.
3. `math-engine.js` accepts hostile scientific-notation inputs without a hard
   ceiling, and `pow10(...)` can grow its cache indefinitely.
4. `scripts/run-all-255.js` mainly trusts counted `TEST` labels, so suites can
   print exception-shaped output and still appear healthy.

## Decision

Use a shared guardrail layer plus targeted method hooks:

1. Add one small continuity-screening helper for bracketed methods.
2. Add one small numeric-failure adapter for risky finite-metric calculations.
3. Add parser-level numeric caps in `math-engine.js`.
4. Keep the existing battery scripts, but make them assertive and CI-friendly.

This is intentionally smaller than a full architecture pass and safer than
isolated solver-by-solver patches.

## Design

### Shared Solver Guardrails

Add three private helpers inside `root-engine.js`:

- `screenBracketContinuity(...)`
- `safeFiniteMetric(...)`
- `structuredStop(...)`

These helpers keep the current solver entry points intact while giving
Bisection and False Position a common contract for continuity and numeric
failures.

### Bracket Continuity Contract

`screenBracketContinuity(...)` runs in two places for both Bisection and False
Position:

1. Before the initial interval is accepted as a valid bracket.
2. After each interval update, before the next iteration is allowed to proceed.

The helper samples the current interval using a fixed interior lattice derived
from the existing sampling approach in `root-engine.js`. It treats the interval
as unsafe when any sampled point shows one of these conditions:

- the evaluation throws;
- the evaluation returns a non-finite machine/reference value;
- sampled signs show an asymptote-like flip pattern that indicates a
  discontinuity risk rather than a trustworthy root bracket.

When the screen fails, the solver returns the shared continuity contract:

- `summary.intervalStatus = "invalid-continuity"`
- `summary.stopReason = "discontinuity-detected"`
- `summary.stopDetail` contains a concrete explanation of the failed sample or
  evaluation

This contract applies equally to Bisection and False Position.

The continuity screen is a hard stop, not a warning. Once the interval is
flagged as unsafe, the method must not continue narrowing toward the suspected
singularity.

### Structured Numeric Failure Contract

`safeFiniteMetric(...)` wraps risky numeric conversions such as:

- midpoint error calculations;
- interval width calculations;
- Newton step size/error calculations;
- any other `realNumber(...)` or finite-distance path that can currently throw
  because the intermediate value is not finite.

If the metric is finite, the helper returns the numeric result. If it is not
finite, the helper returns a structured failure descriptor instead of letting
the throw escape the solver.

`structuredStop(...)` translates those descriptors into the existing result
shape with a deliberately small public vocabulary:

- `invalid-input` for rejected inputs or hard-limit violations;
- `discontinuity-detected` with `invalid-continuity` interval status for
  bracket continuity failures;
- `non-finite-evaluation` for in-loop non-finite numeric breakdowns;
- existing specific reasons such as `derivative-zero` and
  `retained-endpoint-stagnation` remain unchanged.

This means cases like:

- Newton with a vanishing derivative that makes the step/error non-finite;
- Bisection on `[-1e308, 1e308]` where width/error math becomes non-finite;

stop cleanly with structured summaries and user-facing details instead of raw
exceptions.

### Method-Specific Behavior

#### Bisection

- Run continuity screening on the starting interval before accepting a sign
  change.
- Re-run continuity screening after each retained half-interval is chosen.
- Use `safeFiniteMetric(...)` for width and error calculations that can become
  non-finite.
- Preserve existing endpoint-root and tolerance behavior when the interval is
  continuous and numerically safe.

#### False Position

- Run the same upfront continuity screen before accepting the starting bracket.
- Re-run continuity screening after each interval update.
- Use `safeFiniteMetric(...)` for width and error calculations.
- Keep the current retained-endpoint stagnation guard and stop reason.

#### Newton-Raphson

- Keep current derivative-specific guard behavior.
- Convert non-finite Newton error/step paths into a structured
  `non-finite-evaluation` stop with a concrete `stopDetail`.

Other open methods are not the focus of the continuity work in this cycle, but
they should continue benefitting from the smaller shared numeric-failure
adapter where it cleanly applies.

## Numeric Input Hardening

Add explicit constants near the top of `math-engine.js`:

- `MAX_NUMERIC_INPUT_LENGTH = 2048`
- `MAX_ABS_EXPONENT = 100000`
- `MAX_MACHINE_K = 1024`

These values are intentionally large enough for normal teaching and stress-test
inputs, but finite enough to block hostile or accidental freeze paths.

### Parser Rules

Apply the caps at the earliest safe choke points:

- Reject raw numeric strings longer than `MAX_NUMERIC_INPUT_LENGTH` before
  heavy regex or `BigInt` work.
- Reject scientific-notation exponents whose absolute value exceeds
  `MAX_ABS_EXPONENT` before calling `pow10(...)`.
- Reject machine precision `k` above `MAX_MACHINE_K` before digit extraction,
  normalization, or cached power growth begins.

Do not silently clamp oversized values. Inputs beyond the ceiling are rejected
explicitly.

### Bounded Power Cache

`pow10(...)` must never extend `POW10_CACHE` beyond `MAX_ABS_EXPONENT`.
Requests outside the cap fail immediately with a stable validation error.

### Result Contract

`MathEngine` should throw stable, user-readable validation messages for:

- oversized raw numeric input;
- oversized scientific exponents;
- oversized machine precision `k`.

Solver entry points then convert those messages into structured
`invalid-input` results with the message preserved in `summary.stopDetail`.
Non-solver modules see the same stable validation text instead of hangs or
misleading low-level errors.

## Assertive Battery And CI Path

Keep the existing battery scripts in `scripts/`, but stop using printed log
shape as the main proof of success.

### Shared Test Harness

Add a small helper module such as `scripts/test-harness.js` that provides:

- engine loading once per suite;
- consistent case registration and failure counting;
- `must not crash`, `expect stop reason`, and `expect value/property` helpers;
- guaranteed non-zero process exit when a suite fails.

The existing `TEST <id>` logging style should stay for readability, but each
case must also assert an outcome.

### Suite Conversion

Convert the currently exploratory suites that mainly print output, especially:

- `scripts/battery-cat2-3.js`
- `scripts/battery-cat9-10.js`
- `scripts/convergence-tests.js`

and any neighboring suite that still allows exception-like output to scroll by
without failing the process.

Each case must assert one of these:

- an exact expected value;
- an expected stop reason or interval-status family;
- a required invariant such as "must not crash";
- a bounded property such as "approximation stays null after invalid
  continuity."

### `run-all-255.js`

Update `scripts/run-all-255.js` so it:

- spawns each suite;
- fails when any suite exits non-zero;
- reports suite success from process status, not counted `TEST` strings.

Printed output remains useful for diagnosis, but it is no longer the source of
truth.

### CI Workflow

Add a minimal GitHub Actions workflow under `.github/workflows/` that runs the
same verification path used locally. The workflow should execute:

```powershell
node scripts/engine-correctness-audit.js
node scripts/root-engine-audit.js
node scripts/run-all-255.js
```

This keeps local verification and CI aligned.

## Test-First Rollout

Implementation order for the follow-up plan:

1. Add failing regression tests for:
   - `tan(x)` on `[1, 2]` and equivalent false-position asymptote traps;
   - extreme-width bracket paths that currently throw;
   - Newton tiny-derivative/non-finite step paths;
   - oversized numeric inputs such as `1e10000000`;
   - oversized `k` inputs.
2. Add the shared helper layer in `root-engine.js`.
3. Add parser and machine-config caps in `math-engine.js`.
4. Convert the exploratory battery suites to assertive suites.
5. Update `scripts/run-all-255.js` and add CI wiring.

No production-code change in the implementation phase should happen before the
relevant failing regression test exists.

## Acceptance Criteria

This pass is complete when all of the following are true:

- Bisection and False Position reject continuity/asymptote traps using the
  shared `invalid-continuity` / `discontinuity-detected` contract.
- Pathological numeric inputs no longer crash the solver layer with uncaught
  exceptions.
- Oversized scientific notation and precision inputs fail quickly with stable
  validation errors.
- `scripts/run-all-255.js` fails loudly on assertion drift instead of log-count
  drift.
- A minimal CI workflow runs the same backend verification path as local
  development.

## Deferred Follow-Up

The next cycle can safely focus on:

- ExpressionEngine security review outside the parser caps;
- `math-display.js` sanitization review;
- per-module persistent state via `localStorage`;
- broader UI copy polish for diagnostics.
