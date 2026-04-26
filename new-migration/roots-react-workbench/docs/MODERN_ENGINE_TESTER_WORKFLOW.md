# Modern Engine Tester Workflow

This guide explains how to test Modern beta, interpret failures, and separate real regressions from expected numerical-method limits.

## Purpose

Modern beta is a TypeScript + math.js root-method engine being tested before any default-switch discussion. It is checked against:

- Legacy engine behavior.
- Playwright UI comparison tests.
- mpmath high-precision golden fixtures.
- Method-specific edge and failure tests.

Modern beta is still a comparison engine. Legacy remains the stable default.

## Engine Modes

The app supports two engine modes:

- Legacy: default and stable production path.
- Modern beta: opt-in TypeScript + math.js engine for comparison and migration testing.

The runtime `Engine: Legacy | Modern beta` toggle lets testers compare behavior without losing current form values. Switching engines clears existing results so stale output is not mistaken for a result from the newly selected engine.

The `VITE_ROOT_ENGINE` environment flag can start the app in either mode:

- `VITE_ROOT_ENGINE=legacy`: start in Legacy.
- `VITE_ROOT_ENGINE=modern`: start in Modern beta.
- Missing or unknown value: start in Legacy.

## How To Run Tests

Run the normal unit and type checks:

```powershell
npm run test:unit
npm run typecheck
```

Run default Legacy E2E coverage:

```powershell
npm run test:e2e
```

Run Legacy vs Modern beta UI comparison coverage:

```powershell
npm run test:e2e:comparison
```

Regenerate high-precision golden fixtures only when fixture updates are intended:

```powershell
npm run generate:golden
```

Run the Modern beta UI smoke suite from Windows PowerShell:

```powershell
$env:VITE_ROOT_ENGINE='modern'; $env:CI='1'; npx playwright test tests/modern-engine-smoke.spec.ts
```

Clear those PowerShell environment variables after testing:

```powershell
Remove-Item Env:VITE_ROOT_ENGINE
Remove-Item Env:CI
```

## When To Run Each Test

- `npm run test:unit`: run for engine, evaluator, adapter, golden fixture, and failure-path correctness.
- `npm run typecheck`: run for TypeScript API and integration safety.
- `npm run test:e2e`: run for default Legacy app behavior.
- `npm run test:e2e:comparison`: run when behavior compatibility between Legacy and Modern beta matters.
- `npm run generate:golden`: run only when adding or correcting oracle fixtures.
- Modern smoke command: run when checking the Modern beta UI path directly.

## Interpreting Golden Oracle Failures

A golden oracle failure may mean:

- A real bug in a modern method.
- A tolerance is too strict for a hard case.
- The method is unsuitable for the function or starting values.
- The expected root fixture became stale after generator changes.
- Expression semantics changed.
- The evaluator legacy-compatible mode regressed.

When a golden test fails, check:

- Does the mpmath `expectedRoot` still make mathematical sense?
- Is the method appropriate for the function?
- Is the bracket or starting value valid?
- Is the residual small even if the root difference is noisy?
- Does Legacy agree or differ?
- Does the failure occur only in UI tests, or also in unit tests?

Do not update fixtures just to hide a regression.

## Expected Method Limitations

Some failures are expected numerical-method limits rather than app bugs:

- Bisection requires a sign-changing bracket.
- False Position can stagnate on retained endpoints.
- Secant can fail when the denominator collapses or starting points are poor.
- Fixed Point can diverge or enter a cycle.
- Newton-Raphson can fail on zero or near-zero derivatives.
- Newton numeric derivative can fail near discontinuities or non-finite samples.
- Symbolic derivative support is deferred.
- Degree-mode trig symbolic derivatives are deferred because derivative scaling needs careful handling.

Generated golden fixtures should include method-appropriate cases. Unsuitable cases belong in failure-path tests or documented exclusions.

## Legacy Vs Modern Differences

Expected differences include:

- Stop reason names may differ.
- Iteration counts may differ.
- Failure wording may differ.
- Legacy may show an alert while Modern beta may show a result-panel failure, or vice versa.
- Modern rejects complex and non-finite values in root-method mode.
- Modern calculator/evaluator mode and legacy-compatible mode differ for `log`, complex values, and non-finite results.
- UI comparison tests compare high-level behavior, not exact object shapes.

Comparison tests should require no crash, matching high-level success or failure for normal cases, and close root approximations when both engines converge.

## When To Update Golden Fixtures

Update `src/lib/methods/golden/root-method-cases.json` only when:

- Adding new valid cases.
- Correcting an oracle case.
- Changing method tolerance intentionally.
- Changing evaluator semantics intentionally.

After updating the generator or fixture, run:

```powershell
npm run generate:golden
npm run test:unit
npm run typecheck
```

Review the JSON diff. It should show the intended fixture changes only.

## Triage Checklist

When a Modern beta test fails:

- Re-run `npm run generate:golden`.
- Re-run `npm run test:unit`.
- Check the `root-method-cases.json` diff.
- Check whether the failure is method-specific.
- Compare Legacy vs Modern UI behavior if relevant.
- Check residual and tolerance.
- Check documented exclusions.
- Decide whether the issue is a bug, expected limitation, fixture issue, or tolerance issue.

## Tester Manual Matrix

| Area | Manual case |
| --- | --- |
| Bisection | `x^3 - x - 1` on `[1, 2]` |
| False Position | `x^2 - 4` on `[0, 3]` |
| Secant | `x^3 - x - 1`, `x0=1`, `x1=2` |
| Fixed Point | `g(x)=cos(x)`, `x0=1` |
| Newton auto derivative | `x^3 - x - 1`, `x0=1.5`, derivative `auto` |
| Newton provided derivative | `x^2 - 4`, derivative `2*x`, `x0=3` |
| Bad bracket | `x^2 + 1` on `[-1, 1]` |
| Degree mode | `cos(x)` on `[0, 180]` in degrees |

For each case, confirm the app does not crash, results are clearly associated with the selected engine, and failures are visible to the user.

## Default-Switch Criteria

Modern beta should not become the default until:

- Unit tests pass.
- Typecheck passes.
- Legacy E2E passes.
- Modern smoke passes.
- Comparison E2E passes.
- Golden oracle cases pass.
- The release checklist is complete.
- Known blockers are resolved or explicitly accepted.

## Rollback Guidance

Keep Legacy as the default. If Modern beta breaks:

- Switch the runtime toggle back to Legacy.
- If the app was started with Modern beta, remove `VITE_ROOT_ENGINE` or set it to `legacy`.
- Keep `public/legacy`, `root-engine.js`, `ExpressionEngine`, and the legacy loader intact.

Legacy files should not be deleted until after a separate default-switch and deprecation plan is approved.
