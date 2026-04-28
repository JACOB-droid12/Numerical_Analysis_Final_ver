# Modern Engine Release Checklist

This checklist applies before any change that expands Modern beta exposure or proposes making it the default root-method engine.

Legacy remains the default until every default-switch requirement below is satisfied and explicitly accepted.

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
- No browser console errors appear in Legacy mode.
- No browser console errors appear in Modern beta mode.
- The Legacy engine still loads through the legacy loader.
- The runtime engine toggle still preserves form values and clears stale results.

## Manual Test Matrix

Run the following in both Legacy and Modern beta:

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
- Runtime engine switching from Legacy to Modern beta.
- Runtime engine switching from Modern beta to Legacy.

Record any differences in:

- root approximation,
- stop reason wording,
- iteration count,
- table columns,
- failure message wording,
- whether a failure appears as an alert or a result-panel failure state,
- CSV output shape.

## Default-Switch Requirements

Before Modern beta can become the default:

- All unit tests pass.
- All type checks pass.
- All Legacy E2E tests pass.
- All Modern beta E2E tests pass.
- All legacy-vs-modern comparison tests pass.
- Modern E2E covers all root methods.
- Known behavior differences are documented.
- Machine/chopping/rounding parity has an explicit product decision.
- Modern bracket sign-display controls visibly expose exact and/or machine sign evidence without changing compact table columns.
- Symbolic derivative support is implemented or explicitly deferred.
- Modern iteration tables are acceptable for tester and classroom workflows.
- UI copy is updated from beta language to stable language.
- A rollback path to Legacy remains available.
- `public/legacy` and the legacy loader remain intact unless a separate removal plan is approved.

## Known Blockers And Open Questions

- Symbolic derivative generation is deferred.
- Machine arithmetic parity is incomplete.
- Exact/rational display parity is incomplete.
- Failure rows can still be partial when the method stops before a complete row exists.
- The engine toggle does not persist across reloads.
- Modern beta may not support every legacy preset exactly.
- Legacy and Modern beta may use different stop reason names and iteration counts even when roots agree.
- Legacy and Modern beta may display equivalent failures in different UI surfaces.
- Fixed-point divergence and cycle checks may differ as hard failures versus safe stopped result-panel states.
- Some Legacy-specific bracket scan output details may still differ in Modern beta.

## Rollback Plan

Use any of these rollback paths:

- Set `VITE_ROOT_ENGINE=legacy`.
- Use the runtime toggle and select `Legacy`.
- Keep `public/legacy` and the legacy loader intact.
- Keep `root-engine.js` and `ExpressionEngine` available for the current production path.

Do not remove the legacy runtime until a separate deprecation and rollback plan is approved.
