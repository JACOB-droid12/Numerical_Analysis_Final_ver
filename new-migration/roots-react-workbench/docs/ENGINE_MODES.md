# Engine Modes

The Roots React Workbench currently supports two root-method engines:

- Legacy
- Modern beta

Legacy remains the default and stable engine. Modern beta is opt-in and exists for local testing, comparison, and migration validation.

For tester workflow guidance, golden-oracle triage, and expected numerical-method limitations, see [Modern Engine Tester Workflow](./MODERN_ENGINE_TESTER_WORKFLOW.md).

## Default Behavior

When no engine is configured, the app starts in Legacy mode.

Unknown engine flag values also fall back to Legacy. Modern beta must be selected explicitly through the environment flag or the runtime UI toggle.

## Environment Flag

The app reads `VITE_ROOT_ENGINE` at startup.

```powershell
$env:VITE_ROOT_ENGINE='legacy'; npm run dev
$env:VITE_ROOT_ENGINE='modern'; npm run dev
```

Supported values:

- `VITE_ROOT_ENGINE=legacy`: start in Legacy mode.
- `VITE_ROOT_ENGINE=modern`: start in Modern beta mode.
- Missing or unknown value: start in Legacy mode.

## Runtime Toggle

The app includes a visible engine selector:

```text
Engine: Legacy | Modern beta
```

Runtime behavior:

- Switching engines affects future runs.
- Current form values are preserved.
- Existing results are cleared on switch so users do not mistake one engine's output for the other.
- Switching from Modern beta to Legacy safely lazy-loads the legacy scripts if they were not loaded at startup.
- The selected engine is visible near the top utility controls.

## Current Architecture

Legacy path:

```text
UI -> rootEngineSelector -> rootEngineAdapter -> window.RootEngine -> public/legacy
```

Modern beta path:

```text
UI -> rootEngineSelector -> modernRootEngineAdapter -> modernRootEngine -> isolated TypeScript methods -> evaluator.ts -> math.js
```

The UI should not call `window.RootEngine` directly and should not call the isolated modern methods directly. `rootEngineSelector.ts` is the engine selection layer.

## Supported Modern Methods

Modern beta currently supports:

- Bisection
- False Position / Regula Falsi
- Secant
- Fixed Point Iteration
- Newton-Raphson with a provided derivative
- Newton-Raphson with numeric derivative when the UI derivative field is `auto`

Numeric Newton derivatives use central difference through the shared evaluator. Symbolic differentiation is deferred.

## Known Differences

Expected differences between Legacy and Modern beta:

- Stop reason names may differ.
- Iteration counts may differ.
- Iteration table shape and column labels may differ.
- Display formatting may differ.
- Legacy has machine/chopping/rounding behavior that is not fully replicated in Modern beta.
- Modern beta uses the math.js-backed evaluator in legacy-compatible real-valued mode.
- Symbolic derivative generation is deferred.
- Failure rows can be partial when a method stops before producing a full iteration row.
- Some failure cases appear as alerts, while others appear as result-panel failure states with no finite root.
- Failure wording may differ; for example, Legacy can surface direct messages such as division-by-zero text while Modern beta normalizes through its adapter.
- Fixed-point divergence or cycle cases can differ as hard failures versus safe stopped results; compare these as safety behavior rather than identical success/failure status.

These differences should be documented and tested rather than hidden.

## Testing Commands

Run the normal local checks:

```powershell
npm run test:unit
npm run typecheck
npm run test:e2e
npm run test:e2e:comparison
```

Run the Modern beta smoke test from Windows PowerShell:

```powershell
$env:VITE_ROOT_ENGINE='modern'; $env:CI='1'; npx playwright test tests/modern-engine-smoke.spec.ts
```

Equivalent shell form for environments that support inline environment variables:

```sh
VITE_ROOT_ENGINE=modern CI=1 npx playwright test tests/modern-engine-smoke.spec.ts
```

## Golden Oracle Generation

Python is used only for generating checked-in test fixtures. It is not part of the browser runtime.

The golden fixture generator uses `mpmath` for high-precision expected roots.

Install generator dependencies:

```powershell
pip install -r scripts/requirements-golden.txt
```

Regenerate fixtures:

```powershell
npm run generate:golden
```

After regenerating fixtures, run:

```powershell
npm run test:unit
npm run typecheck
```
