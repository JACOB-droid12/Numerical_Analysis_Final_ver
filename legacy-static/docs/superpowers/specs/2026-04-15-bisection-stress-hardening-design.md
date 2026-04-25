# Bisection Stress Hardening Design

Date: 2026-04-15
Project: Numerical Analysis Teaching Lab
Status: Draft for user review

## Summary

Harden the shared expression engine, the bisection solver, and the root-results UI so the app remains mathematically honest under the stress cases documented in the 2026-04-15 bisection failure report. The design keeps the current layout, fixes the blocker numerical issues first, expands shared function coverage to include `tan()` and `ln()` across the calculator, and adds inline diagnostics that make risky assumptions visible without turning this pass into a UI redesign.

This design follows the approved middle-path approach:

- fix solver correctness and stopping semantics before polishing messaging;
- add `tan()` and `ln()` as shared expression-engine functions everywhere they apply;
- keep the existing Roots layout but add compact inline warnings and clearer teaching copy in the current result surfaces.

## Goals

- Prevent tiny nonzero values from being silently treated as exact zeros in root-finding decisions.
- Make bisection stopping summaries distinguish planned iteration bounds from actual work performed.
- Preserve mathematically valid tiny tolerances longer and report machine-limit issues honestly when finite-precision conversion becomes unavoidable.
- Convert discontinuity and singularity traps into root-specific teaching messages instead of raw engine failures.
- Align exact-compatibility reporting with the evaluator that actually runs.
- Add `tan()` and `ln()` support across the shared expression engine so all modules can use them consistently.
- Make angle-mode dependence, invalid bisection assumptions, and possible multi-root intervals more visible in the current Roots result area.
- Expand audit coverage so each known stress-report failure is locked down by repeatable checks.

## Non-Goals

- Add new root-finding methods, graphing, compare mode, or export features.
- Redesign the page layout or add a brand-new diagnostics panel.
- Perform continuity analysis that guarantees detection of all discontinuities or all multi-root intervals.
- Replace the parser architecture or remove the current machine-arithmetic model.
- Generalize this pass into a whole-app visual refresh.

## Approved Scope

This pass covers three coupled areas:

1. Shared math semantics in `calc-engine.js` and `expression-engine.js`.
2. Bisection-specific stopping logic and root-result metadata in `root-engine.js`.
3. Inline diagnostics, error normalization, and teaching copy in `root-ui.js` and the shared UI error-formatting paths already used elsewhere in `app.js`.

The implementation should stay focused on trust, correctness, and teaching clarity for the stress-report scenarios. Broader UI modernization or new feature work stays parked.

## Design Principles

- Mathematical truth and display cleanup must be separate concerns.
- A root workflow should only claim what the engine actually established.
- Student-facing copy should explain method limitations, not just surface raw exceptions.
- Shared-expression behavior should be consistent across modules.
- Warnings should be visible enough to prevent misuse, but compact enough to fit the existing layout.

## Core Solver Contract

### Separate evaluation semantics from cosmetic zero cleanup

`CalcEngine` currently applies a global `1e-12` cleanup to calculator-number values. That cleanup is useful for display stability, but it is unsafe as a hidden mathematical decision rule for root finding. The design changes the contract so root-classification logic no longer depends on calculator-number cleanup that was meant for presentation.

The shared implementation direction is:

- keep formatting-friendly cleanup available where it serves display and stored calculator output;
- stop using that cleanup as the authority for exact root detection, sign classification, or convergence claims;
- introduce or route root-sensitive checks through stricter value inspection that preserves tiny nonzero magnitudes;
- reserve `machine-zero` as a real numerical-threshold outcome, not as a synonym for "value was cosmetically snapped to 0."

This applies directly to endpoint-root detection, midpoint-root detection, sign classification, and early stopping in the root solver.

### Align exact-compatibility with real evaluator behavior

`ExpressionEngine.isExactCompatible()` is currently syntactic and overstates exactness for expressions whose power operations fall through to calculator-number evaluation. The design changes that contract so exact-compatibility means "this expression can truly stay in the exact rational path under the current inputs," not "this expression looks exact from the AST shape."

Required behavior:

- powers remain exact-compatible only when the evaluator can keep them in the exact rational path;
- negative exponents no longer count as exact-compatible unless a genuine exact implementation is added;
- UI labels and root metadata should not imply exact reasoning when the evaluator actually used `Math.pow()` or another calculator-only path.

### Add shared `tan()` and `ln()` support everywhere

The expression engine will add first-class support for `tan()` and `ln()` in the shared evaluator rather than special-casing them only for Roots. This keeps behavior consistent across the calculator and removes the current "unsupported function" gap for ordinary textbook inputs.

Required behavior:

- `tan()` and `ln()` are available anywhere expressions are evaluated through the shared engine;
- domain and singularity behavior is explicit and student-facing through the caller's error translation layer;
- exact-compatibility remains false for these calls, matching current treatment of other transcendental functions.

## Bisection Semantics And Stop Logic

### Split planned iterations from actual iterations

In epsilon mode, bisection currently stores one iteration count that mixes the theoretical width-bound requirement with the iterations actually used before an early exit. The design separates these concepts.

Required returned metadata:

- `plannedIterations`: the width-bound count implied by the current interval and epsilon;
- `actualIterations`: the number of rows truly executed;
- existing stopping-kind input metadata;
- final stop reason and any bound/error data associated with the completed run.

UI copy should prefer `actualIterations` when describing what happened in the completed run, and mention `plannedIterations` only as a theoretical requirement or upper bound when that helps teaching.

### Make epsilon handling numerically honest

Subnormal tolerances such as `10^(-320)` are mathematically valid but currently underflow during conversion to JavaScript numbers. The design preserves exact or higher-fidelity handling longer and only falls back to plain `Number` where the formulas truly require it.

Required behavior:

- do not reject a positive epsilon merely because conversion underflow collapsed it to `0`;
- keep exact rational information long enough to determine whether the requested tolerance is mathematically positive;
- when the stopping formula cannot be evaluated faithfully within machine limits, surface a precision-limit message instead of "Enter a tolerance epsilon greater than 0.";
- keep ordinary finite tolerances behaving exactly as they do now.

### Tighten root and convergence decisions

Bisection should not stop early merely because the machine-computed function value became tiny enough to be cleaned to zero. The design makes the width contract primary and treats zero-based exits more carefully.

Required behavior:

- endpoint and midpoint root detection use strict value semantics that preserve tiny nonzero quantities;
- `machine-zero` is only used when the machine-computed value is genuinely zero or within an explicit numerical-threshold rule that is separate from cosmetic cleanup;
- width-based tolerance remains the primary convergence guarantee in epsilon mode;
- summaries and step text must describe whether the solver stopped because of a true root, a machine-threshold zero, or the requested interval-width tolerance.

### Convert discontinuity traps into root-specific results

Cases like `1/x` on `[-1, 1]` and `1/(x-1)` on `[0, 2]` currently surface raw divide-by-zero failures when the midpoint lands on a singularity. The design catches these evaluation failures within the root workflow and converts them into a method-specific explanation.

Required behavior:

- midpoint evaluation failures inside bisection are intercepted in the root flow;
- the returned result makes it clear that a sign change across a discontinuity is not a valid bisection guarantee;
- the UI wording explains continuity as a method assumption, not just a thrown arithmetic error;
- the run should not masquerade as a root or successful tolerance stop.

## Inline Diagnostics And Teaching Copy

### Keep the current layout, strengthen the current surfaces

The UI should remain recognizable and avoid structural redesign. Instead of a new diagnostics panel, the existing result area, stopping summary, interval-status text, and solution-step copy will carry compact callouts tied to the current run.

New inline diagnostics should cover:

- trig angle-mode dependence when the expression uses `sin`, `cos`, or `tan`;
- discontinuity or singularity warnings for failed midpoint evaluation or domain traps relevant to bisection assumptions;
- a stronger invalid-bracket explanation that says the interval is not valid for bisection, not that no root exists;
- early-exit clarification when `plannedIterations` and `actualIterations` differ;
- a heuristic advisory when the interval may contain multiple roots and the returned answer is only one admissible root.

### Normalize error wording across modules

The app already translates several raw numeric-expression errors into student-facing language in other modules. This pass extends that normalization so Roots and shared-expression callers do not expose internal error strings when a teaching-oriented explanation is available.

Required behavior:

- raw `Division by zero.` messages become contextual messages such as domain restriction, singularity, or continuity-assumption failures depending on where they occur;
- raw `Unsupported function: tan` and `Unsupported function: ln` disappear once those functions are implemented;
- unsupported or domain-limited inputs still fail clearly, but the message should explain what the student can correct.

### Clarify method limitations

The current bisection wording is correct at a narrow algorithmic level but too easy to overread. The design makes the method limitation explicit in three cases:

- same-sign endpoints mean the interval does not satisfy the bisection assumptions; they do not prove the equation has no root;
- discontinuity-driven sign changes do not guarantee a root without continuity;
- oscillatory or crowded-root intervals may admit multiple roots even though the solver returns one bracket-following answer.

These explanations belong in the inline result copy and the solution steps, not buried in documentation alone.

## Data And Metadata Changes

The root-run package should carry enough information for honest UI rendering without inferring missing facts.

For bisection, the returned structure should include:

- `plannedIterations`
- `actualIterations`
- refined stop reasons and stop details
- whether a discontinuity or singular midpoint invalidated the run
- any inline-warning flags needed by the UI, such as `angleModeSensitive` or `possibleMultipleRoots`

The design does not require a large new schema layer, but it does require the engine to return explicit metadata instead of forcing the UI to reconstruct meaning from sparse fields.

## Implementation Structure

### Phase 1: Blocker math and stop semantics

- isolate root-sensitive zero logic from cosmetic calculator cleanup;
- fix sign classification and root detection for tiny values;
- split planned-versus-actual iteration metadata;
- improve subnormal epsilon handling and precision-limit errors;
- convert discontinuity midpoint failures into root-specific results.

### Phase 2: Shared function coverage and error translation

- add `tan()` and `ln()` to the shared expression evaluator;
- align exact-compatibility with the actual evaluator path;
- normalize shared-expression and Roots error wording for domain, singularity, and support cases.

### Phase 3: Inline diagnostics and teaching copy

- add current-run callouts for angle mode, discontinuity, invalid bracket semantics, early-exit iteration differences, and possible multiple roots;
- update stopping summaries and solution steps so the method story matches the corrected engine metadata;
- keep the existing layout and IDs stable unless a small markup addition is required for inline callout placement.

## Verification Plan

### Automated checks

Expand `scripts/root-engine-audit.js` to include characterization coverage for:

- `x^3 - 10^(-18)` on `[0, 10^(-4)]` no longer reporting `root-at-a`;
- `e^(-1000x) - 10^(-12)` on `[0, 0.1]` no longer stopping early because of cosmetic zero cleanup;
- early-exit epsilon runs reporting different planned and actual iteration counts;
- subnormal epsilon handling surfacing a precision-limit message or a mathematically valid path rather than pretending epsilon is zero;
- discontinuity traps returning a root-specific invalidity result rather than raw divide-by-zero;
- negative-exponent exact-compatibility matching the evaluator path;
- `tan()` and `ln()` evaluating through the shared expression engine;
- existing passing textbook bisection cases staying stable.

Where helpful, add shared-engine audit coverage outside the root audit if the current audit layout makes that clearer.

### Manual browser checks

Run focused browser checks for:

- ordinary continuous bisection problems that should remain unchanged;
- exact endpoint and exact midpoint roots in epsilon mode;
- DEG versus RAD trig intervals, including a visible mode warning;
- discontinuity intervals such as `1/x` and `1/(x-1)`;
- `tan()` and `ln()` examples with valid and invalid domains;
- multi-root or oscillatory examples such as `sin(50x)` where the UI should warn without blocking the run.

## Risks And Guardrails

- Overcorrecting tiny-value handling could destabilize other calculator behaviors if the zero cleanup is removed too broadly. The fix should stay narrowly scoped to mathematical-decision paths.
- Heuristic multi-root warnings can create false positives. They should be advisory, not blocking.
- Shared `tan()` support must respect asymptotes and finite checks cleanly so the calculator does not convert one parser gap into a more confusing runtime failure.
- `ln()` domain errors should be translated clearly and consistently across the app.
- Existing DOM structure and stable IDs should be preserved as much as possible to reduce regression risk.

## Out Of Scope Backlog

- Full continuity analysis or interval scanning for guaranteed discontinuity detection.
- Automatic root counting inside an interval.
- New visualizations or a dedicated diagnostics dashboard.
- New solver methods or method-comparison workflows.
- Broader refactoring of the app shell or styling system.

## Workspace Note

This workspace is currently not a Git repository, so this spec can be written locally but not committed from the current environment. The normal brainstorming commit step is therefore blocked by repository state rather than by design scope.

## Self-Review Checklist

- No unfinished markers remain.
- The scope stays focused on the stress-report failures and the approved inline-diagnostics approach.
- The design explicitly separates mathematical evaluation from display cleanup.
- The design covers the approved expansion of `tan()` and `ln()` across the shared engine.
- The rollout order fixes trust-critical math issues before teaching-copy polish.
