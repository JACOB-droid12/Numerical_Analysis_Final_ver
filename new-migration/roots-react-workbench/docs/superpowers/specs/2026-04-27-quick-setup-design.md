# Quick Setup Design

## Goal

Add an exam-safe Quick Setup mode to the Roots React Workbench so allowed calculator use is faster without making the app look like an auto-solver.

Quick Setup is calculator-style. It does not parse full problem statements.

## Scope

Quick Setup is manual-input only. It must not include OCR, PDF import, paste-question solving, prompt parsing, or a "Professor Problem Solver" surface. It must not make Modern beta the default and must not change numerical algorithms.

The implementation must not modify:

- `root-engine.js`
- `expression-engine.js`
- `public/legacy/`
- the modern numerical method algorithms

## Placement

Quick Setup will be added inside the `Equation Studio` area as a compact manual panel. This follows the approved approach: the feature is visible while entering equations, but it does not replace the full method form.

The existing toolbar `Quick command` preset UI can be renamed or reduced if needed, but the main requested behavior is the in-studio Quick Setup panel.

## Supported Methods

Quick Setup supports these compact forms:

- Bisection: `f(x)`, `a`, `b`, stop by tolerance or iterations, `Run Table`
- Newton-Raphson: `f(x)`, `x0`, derivative mode auto/provided, optional derivative expression when provided, stop by tolerance or iterations, `Run Table`
- Fixed Point: `g(x)`, `p0`, stop by tolerance or iterations, `Run Table`

For Bisection, Quick Setup uses manual bracket input and disables auto bracket scan for that run. For Newton-Raphson, Quick Setup uses manual `x0` and does not infer an initial value from a pasted prompt or interval.

## Data Flow

Quick Setup writes values into the existing method form state, selects the requested method, and invokes the existing run path. It does not call engines directly and does not add a new solver layer.

The existing run path remains responsible for:

- sign or evaluation checks where applicable
- iteration and tolerance helpers
- professor-style solution steps and table
- final approximation
- graph
- CSV export through the existing iteration table

## UI Behavior

Quick Setup presents method selection and compact fields only. It includes the note:

> Quick Setup is calculator-style. It does not parse full problem statements.

The primary action label is `Run Table`.

Existing full method controls remain available for advanced or less common options. Modern beta remains opt-in through the existing engine toggle.

## Error Handling

Validation remains engine-driven. Missing or invalid fields should surface through the existing status and result error messaging. Quick Setup may prevent a run only when the selected compact form is clearly missing its required expression.

## Testing

Update tests to verify:

- the `Quick Setup` label appears
- no paste-question UI appears
- Bisection lecture example works after manual input
- Newton example works after manual input
- existing Legacy and Modern beta tests still pass

Required verification commands:

- `npm run test:unit`
- `npm run typecheck`
- `npm run test:e2e`
- `npm run test:e2e:comparison`
- `$env:VITE_ROOT_ENGINE='modern'; $env:CI='1'; npx playwright test tests/modern-engine-smoke.spec.ts`

## Handoff

The final report should include files changed, Quick Setup behavior, tests updated, verification results, current branch, commit SHA if committed, and whether `legacy-static/` stayed untouched.
