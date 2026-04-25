# RootEngine Correctness Guardrails Design

Date: 2026-04-16

## Purpose

The stress-test audits found cases where the RootEngine can report success even when the numerical method has not actually converged to a trustworthy answer. This spec focuses on preventing false-positive convergence in iterative root and fixed-point methods.

The first implementation pass will prioritize mathematical correctness over convenience. If a method cannot confidently verify convergence, it should stop with a safe non-success reason rather than report `tolerance-reached` or `machine-zero`.

## Scope

This spec covers correctness guardrails for:

- Newton-Raphson false `machine-zero` exits on flat functions.
- Fixed Point false `tolerance-reached` exits on pseudo-convergent or drifting sequences.
- Exact-root preservation, so true exact roots still stop immediately.
- Regression tests that encode the known failure cases.

This spec does not implement crash/DoS hardening or large UX diagnostics work. Those are preserved in the follow-up backlog.

## Problem Summary

### Newton-Raphson Flat-Valley False Success

Current behavior:

- Newton checks `Math.abs(f(x_n)) < C.EPS`.
- If the machine-computed function value is tiny, the solver reports `machine-zero`.
- On very flat functions, `f(x_n)` can become tiny while `x_n` is still far from the actual root.

Example failure:

- Function: `(x - 1)^20`
- Starting point: near `1.5`
- Bad outcome: the engine can stop near a point noticeably far from `1` because `f(x_n)` underflows into a tiny machine value.

Desired behavior:

- Exact zero should still stop immediately.
- Machine-near-zero should only count as success when the Newton step is also small enough to support convergence.
- If the function value is tiny but the method is still taking a large step, the solver should continue or eventually end with a non-success stop reason.

### Fixed Point Pseudo-Convergence

Current behavior:

- Fixed Point checks only `|x_{n+1} - x_n| < epsilon`.
- A function like `g(x) = x + 1e-8` can pass a loose epsilon immediately even though it never approaches a fixed point.

Example failure:

- Function: `g(x) = x + 1e-8`
- Epsilon: `1e-7`
- Bad outcome: the engine reports `tolerance-reached` after one tiny step even though the sequence drifts forever.

Desired behavior:

- Exact fixed point should still stop immediately.
- Epsilon success should require evidence of convergence, not just one small move.
- A constant or growing step pattern should not be labeled as converged.

## Design

### Newton-Raphson Guardrail

Newton will distinguish exact-zero success from machine-near-zero success.

Exact-zero rule:

- If the reference evaluation is exactly zero, return `exact-zero` immediately.
- This keeps existing correct behavior for cases where the starting point or later iterate is truly a root.

Machine-near-zero rule:

- If the machine value of `f(x_n)` is near zero, compute the Newton step as usual.
- Only allow `machine-zero` when the step size also indicates stability.
- Use both absolute and relative step checks:
  - absolute step: `|x_{n+1} - x_n|`
  - relative step: `|x_{n+1} - x_n| / max(1, |x_{n+1}|)`
- If the residual is tiny but the step is still large, do not report success.

Stop behavior:

- Continue iterating if the iteration budget allows.
- If the run ends without verified convergence, use the existing `iteration-limit` or `iteration-cap` path.
- Add a row note when machine-near-zero is rejected because the Newton step is not stable.

### Fixed Point Guardrail

Fixed Point will treat `|x_{n+1} - x_n| < epsilon` as necessary but not always sufficient.

Exact fixed-point rule:

- If `g(x_n)` exactly equals `x_n`, stop immediately with an exact success reason.
- This preserves correct behavior for `g(x) = x` or other exact fixed-point hits.

Trend rule for epsilon success:

- Do not allow epsilon success on the first iteration unless the point is exactly fixed.
- Track recent step errors.
- Allow `tolerance-reached` only when the current step is below epsilon and the step trend is non-increasing compared with the prior step.
- If the current step repeats the same tiny nonzero movement, treat it as suspicious rather than converged.

Pseudo-convergence handling:

- If the method repeatedly takes a tiny but nonzero step without shrinking, continue until the iteration limit.
- Add a row note such as `step is small but not converging`.
- The final stop reason should be a non-success reason, likely `iteration-limit` for user-selected iterations or `iteration-cap` for capped epsilon runs.

## Stop Reason Policy

For this pass, avoid adding many new public statuses unless needed for clarity.

Use existing statuses when possible:

- `exact-zero` for true exact root/fixed-point hits.
- `machine-zero` only when residual and step evidence agree.
- `tolerance-reached` only when the convergence guard accepts it.
- `iteration-limit` or `iteration-cap` when convergence was not verified.

Optional implementation detail:

- A future diagnostics pass may introduce `convergence-suspect`, `cycle-detected`, or `pseudo-convergence` statuses. This correctness pass may use internal row notes first to avoid expanding UI copy too much at once.

## User-Facing Behavior

The UI should avoid claiming a root or fixed point was found when the guardrails reject convergence.

Newton messaging:

- If `machine-zero` is accepted, explain that the machine value was near zero and the Newton step was stable.
- If the run hits the iteration limit after rejected near-zero residuals, explain that the function value became small but the iteration did not verify convergence.

Fixed Point messaging:

- If `tolerance-reached` is accepted, explain that the step size satisfied epsilon and the iteration trend was stable.
- If the run reaches a limit, explain that the step size did not show reliable convergence.

## Acceptance Criteria

The implementation should pass these targeted checks:

- Newton on a normal convergent case, such as `x^2 - 2`, still reaches the expected approximation.
- Newton with an exact starting root still stops immediately.
- Newton on a flat-valley trap, such as `(x - 1)^20`, does not report `machine-zero` when the current approximation is still far from `1`.
- Fixed Point with an exact fixed point still stops immediately.
- Fixed Point on `g(x) = x + 1e-8` with epsilon larger than the step does not report `tolerance-reached` on the first iteration.
- Existing Bisection relative-tolerance behavior remains unchanged.
- Existing Secant and False Position behavior remains unchanged unless a shared helper requires a harmless status-label update.

## Follow-Up Backlog

### Crash/DoS Safety

These findings are important, but intentionally outside this correctness-first pass:

- Cap absurd machine precision `k` values before formatting or BigInt/string work can exhaust memory.
- Cap iteration counts before a user can request unbounded work.
- Add an exact-arithmetic growth limit for False Position with `decisionBasis: exact`.
- Convert infinite interval width errors into clean solver results instead of uncaught exceptions.
- Convert domain and singularity exceptions into method-specific stop statuses where feasible.

### Diagnostics and UX

These improvements should be revisited after correctness guardrails:

- Add public statuses such as `divergence-suspected`, `cycle-detected`, `unsafe-precision`, `domain-error`, and `exact-arithmetic-limit`.
- Add clearer row notes for rejected convergence.
- Add report text that distinguishes `method failed safely` from `method found a root`.
- Consider a test-report summary that marks each stress case with pass/fail and the stop reason.

## Open Implementation Notes

- Keep the guardrail thresholds tied to the user epsilon when epsilon mode is active.
- Avoid using `Number.EPSILON` as the only mathematical truth criterion.
- Prefer small helper functions in `root-engine.js` so Newton and Fixed Point logic remains readable.
- Add tests to the existing root audit scripts before changing solver logic.
