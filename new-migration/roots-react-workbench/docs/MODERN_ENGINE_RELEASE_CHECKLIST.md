# Modern Engine Release Checklist

This checklist applies before any change that expands Modern engine exposure or changes the Modern/Legacy compatibility fallback boundary.

Modern engine is now the default root-method engine. Legacy compatibility fallback remains available for strict legacy machine-arithmetic behavior and compatibility checks.

For day-to-day tester workflow, golden-oracle failure triage, and expected method limitations, see [Modern Engine Tester Workflow](./MODERN_ENGINE_TESTER_WORKFLOW.md).

## Pre-Release Checks

Run and confirm:

- `npm run test:unit`
- `npm run typecheck`
- `npm run test:e2e`
- `npm run test:e2e:comparison`
- `$env:VITE_ROOT_ENGINE='modern'; $env:CI='1'; npx playwright test tests/modern-engine-smoke.spec.ts`

Also confirm:

- Golden fixtures are up to date.
- No unexpected high-precision oracle differences remain.
- Golden oracle coverage includes transcendental, logarithmic, polynomial, scale-stress, fixed-point, and Newton numeric derivative cases.
- No browser console errors appear in Legacy compatibility fallback mode.
- No browser console errors appear in Modern engine mode.
- The Legacy compatibility fallback still loads through the legacy loader.
- The runtime engine toggle still preserves form values and clears stale results.

## Manual Test Matrix

Run the following in both Legacy compatibility fallback and Modern engine:

- Bisection normal case: `x^3 - x - 1` on `[1, 2]`.
- False Position normal case: `x^2 - 4` on `[0, 3]`.
- Secant normal case: `x^3 - x - 1`, `x0=1`, `x1=2`.
- Fixed Point normal case: `g(x)=cos(x)`, `x0=1`.
- Newton auto derivative: `x^3 - x - 1`, `x0=1.5`, derivative field `auto`.
- Newton provided derivative: `x^2 - 4`, derivative `2*x`, `x0=3`.
- Bad bracket failure: `x^2 + 1` on `[-1, 1]`.
- Complex or non-finite failure, such as `sqrt(x)` with a negative starting value or `1 / (x - 1)` at a singular point.
- Degree mode case, such as a bracketed trigonometric root in degrees.
- CSV export from the iteration table.
- Table rendering for each method.
- Bracket Signs shown control in Modern engine for Bisection and False Position: exact, machine, and both should visibly change professor-style sign evidence.
- Runtime engine switching from Legacy compatibility fallback to Modern engine.
- Runtime engine switching from Modern engine to Legacy compatibility fallback.

Record any differences in:

- root approximation,
- stop reason wording,
- iteration count,
- table columns,
- failure message wording,
- whether a failure appears as an alert or a result-panel failure state,
- CSV output shape.

## Default Engine Requirements

For Modern engine to remain the default:

- All unit tests pass.
- All type checks pass.
- All Legacy compatibility fallback E2E tests pass.
- All Modern engine E2E tests pass.
- All legacy-vs-modern comparison tests pass.
- Modern E2E covers all root methods.
- Known behavior differences are documented.
- Machine/chopping/rounding parity has an explicit product decision.
- Symbolic derivative support is implemented or explicitly deferred.
- Modern iteration tables are acceptable for tester and classroom workflows.
- UI copy is updated from beta language to stable language.
- A rollback path to Legacy compatibility fallback remains available.
- `public/legacy` and the legacy loader remain intact unless a separate removal plan is approved.

## Known Blockers And Open Questions

- Symbolic derivative generation is deferred.
- Machine arithmetic parity is incomplete.
- Exact/rational display parity is incomplete.
- Failure rows can still be partial when the method stops before a complete row exists.
- The engine toggle does not persist across reloads.
- Modern engine may not support every legacy preset exactly.
- Legacy compatibility fallback and Modern engine may use different stop reason names and iteration counts even when roots agree.
- Legacy compatibility fallback and Modern engine may display equivalent failures in different UI surfaces.
- Fixed-point divergence and cycle checks may differ as hard failures versus safe stopped result-panel states.
- Strict Legacy stepwise expression-level machine arithmetic remains a Legacy fallback requirement.

## Rollback Plan

Use any of these rollback paths:

- Set `VITE_ROOT_ENGINE=legacy`.
- Choose Legacy compatibility fallback in Advanced/testing.
- Keep `public/legacy` and the legacy loader intact.
- Keep `root-engine.js` and `ExpressionEngine` available for the current production path.
- Keep `math-engine.js` and `calc-engine.js` available for the compatibility path.

Do not remove the legacy runtime until a separate removal task is approved.
