# Modern Beta Engine Release Note

The Roots React Workbench now includes an opt-in Modern beta root-method engine alongside the existing Legacy engine. Legacy remains the default and stable production path.

## What Changed

- Added a Modern beta engine path built with TypeScript and math.js.
- Added a runtime engine toggle: `Engine: Legacy | Modern beta`.
- Added `VITE_ROOT_ENGINE=legacy` and `VITE_ROOT_ENGINE=modern` startup selection.
- Added modern implementations for Bisection, False Position, Secant, Fixed Point, and Newton-Raphson.
- Added Newton-Raphson numeric derivative support for the UI `auto` derivative path.
- Added method-aware Modern beta iteration table formatting.
- Added Legacy vs Modern beta Playwright comparison coverage.
- Added Python/mpmath-generated golden oracle fixtures for high-precision numerical validation.

TODO: add a Fixed Point comparison table mode for quiz-style ranking prompts, using columns like `n | (a) | (b) | (c) | (d)` for candidate formulas such as 21^(1/3).

## Engine Modes

Legacy path:

```text
UI -> rootEngineSelector -> rootEngineAdapter -> window.RootEngine -> public/legacy
```

Modern beta path:

```text
UI -> rootEngineSelector -> modernRootEngineAdapter -> modernRootEngine -> isolated TypeScript methods -> evaluator.ts -> math.js
```

Missing or unknown `VITE_ROOT_ENGINE` values fall back to Legacy.

## Supported Modern Beta Methods

- Bisection
- False Position / Regula Falsi
- Secant
- Fixed Point Iteration
- Newton-Raphson with provided derivative
- Newton-Raphson with numeric derivative for `auto`

Symbolic differentiation is intentionally deferred.

## Validation Coverage

The migration is covered by:

- Unit tests for evaluator behavior, compatibility mode, methods, facade, adapter, and selector.
- Golden oracle tests generated from mpmath high-precision roots.
- Edge/failure tests for bad brackets, non-finite values, complex values, denominator collapse, zero derivatives, fixed-point divergence, and cycles.
- Modern beta Playwright smoke tests across all supported methods.
- Side-by-side Legacy vs Modern beta UI comparison tests.

Recommended verification:

```powershell
npm run test:unit
npm run typecheck
npm run test:e2e
npm run test:e2e:comparison
$env:VITE_ROOT_ENGINE='modern'; $env:CI='1'; npx playwright test tests/modern-engine-smoke.spec.ts
```

Golden fixtures are regenerated only when intended:

```powershell
pip install -r scripts/requirements-golden.txt
npm run generate:golden
```

## Known Differences

- Stop reason names may differ.
- Iteration counts may differ.
- Iteration table columns and formatting may differ.
- Failure wording may differ.
- Some failures may appear as alerts, while others appear in the result panel.
- Modern beta rejects complex and non-finite values in root-method mode.
- Legacy machine/chopping/rounding behavior is not fully replicated in Modern beta.

These differences are expected during beta and are documented through tests and workflow docs.

## Rollback

Rollback remains simple:

- Use the runtime toggle and select `Legacy`.
- Set `VITE_ROOT_ENGINE=legacy`.
- Remove `VITE_ROOT_ENGINE` entirely to use the default Legacy mode.

The legacy runtime, `public/legacy`, `root-engine.js`, and `ExpressionEngine` remain intact.

## Before Making Modern Beta Default

Modern beta should not become the default until:

- Unit tests pass.
- Typecheck passes.
- Legacy E2E passes.
- Modern smoke tests pass.
- Legacy vs Modern comparison tests pass.
- Golden oracle cases pass.
- Known differences are documented or accepted.
- Machine/chopping/rounding parity has a product decision.
- Symbolic derivative support is implemented or explicitly deferred.
- Beta UI copy is updated for stable release.
- Legacy rollback remains available.
