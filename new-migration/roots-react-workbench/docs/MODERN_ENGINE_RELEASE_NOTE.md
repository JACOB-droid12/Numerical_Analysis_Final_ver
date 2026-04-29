# Modern Engine Release Note

The Roots React Workbench now uses Modern engine as the default root-method engine. Legacy compatibility fallback is retained for strict legacy machine-arithmetic behavior and compatibility checks.

## What Changed

- Promoted the Modern engine path built with TypeScript and math.js to the default.
- Updated the runtime engine toggle: `Engine mode: Modern engine | Legacy compatibility fallback`.
- Added `VITE_ROOT_ENGINE=legacy` and `VITE_ROOT_ENGINE=modern` startup selection.
- Added modern implementations for Bisection, False Position, Secant, Fixed Point, and Newton-Raphson.
- Added Newton-Raphson numeric derivative support for the UI `auto` derivative path.
- Added method-aware Modern engine iteration table formatting.
- Added Legacy compatibility fallback vs Modern engine Playwright comparison coverage.
- Added Python/mpmath-generated golden oracle fixtures for high-precision numerical validation.

TODO: add a Fixed Point comparison table mode for quiz-style ranking prompts, using columns like `n | (a) | (b) | (c) | (d)` for candidate formulas such as 21^(1/3).

## Engine Modes

Legacy path:

```text
UI -> rootEngineSelector -> rootEngineAdapter -> window.RootEngine -> public/legacy
```

Modern engine path:

```text
UI -> rootEngineSelector -> modernRootEngineAdapter -> modernRootEngine -> isolated TypeScript methods -> evaluator.ts -> math.js
```

Missing or unknown `VITE_ROOT_ENGINE` values start Modern engine. Set `VITE_ROOT_ENGINE=legacy` to start Legacy compatibility fallback.

## Supported Modern Engine Methods

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
- Modern engine Playwright smoke tests across all supported methods.
- Side-by-side Legacy compatibility fallback vs Modern engine UI comparison tests.

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
- Modern engine rejects complex and non-finite values in root-method mode.
- Legacy machine/chopping/rounding behavior is not fully replicated in Modern engine.

These differences are documented through tests and workflow docs.

## Rollback

Rollback remains simple:

- Choose Legacy compatibility fallback in Advanced/testing.
- Set `VITE_ROOT_ENGINE=legacy`.

The legacy runtime, `public/legacy`, `root-engine.js`, `ExpressionEngine`, `math-engine.js`, and `calc-engine.js` remain intact.

## Default Engine Guardrails

For Modern engine to remain the default:

- Unit tests pass.
- Typecheck passes.
- Legacy compatibility fallback E2E passes.
- Modern smoke tests pass.
- Legacy compatibility fallback vs Modern comparison tests pass.
- Golden oracle cases pass.
- Known differences are documented or accepted.
- Machine/chopping/rounding parity has a product decision.
- Symbolic derivative support is implemented or explicitly deferred.
- UI copy no longer uses beta language.
- Legacy compatibility fallback rollback remains available.

Legacy should not be removed until a separate removal task explicitly approves it.
