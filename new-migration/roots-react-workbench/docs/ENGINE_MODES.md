# Engine Modes

The Roots React Workbench currently supports two root-method engines:

- Modern engine
- Legacy compatibility fallback

Modern engine is now the default. Legacy compatibility fallback is retained for strict legacy machine-arithmetic behavior and compatibility checks.

For tester workflow guidance, golden-oracle triage, and expected numerical-method limitations, see [Modern Engine Tester Workflow](./MODERN_ENGINE_TESTER_WORKFLOW.md).

## Default Behavior

When no engine is configured, the app starts in Modern engine mode.

Unknown engine flag values also fall back to Modern engine mode.

## Environment Flag

The app reads `VITE_ROOT_ENGINE` at startup.

```powershell
$env:VITE_ROOT_ENGINE='legacy'; npm run dev
$env:VITE_ROOT_ENGINE='modern'; npm run dev
```

Supported values:

- `VITE_ROOT_ENGINE=legacy`: start in Legacy compatibility fallback mode.
- `VITE_ROOT_ENGINE=modern`: start in Modern engine mode.
- Missing or unknown value: start in Modern engine mode.

## Runtime Toggle

Advanced/testing includes a runtime engine selector:

```text
Engine mode: Modern engine | Legacy compatibility fallback
```

Runtime behavior:

- Switching engines affects future runs.
- Current form values are preserved.
- Existing results are cleared on switch so users do not mistake one engine's output for the other.
- Switching from Modern engine to Legacy compatibility fallback safely lazy-loads the legacy scripts if they were not loaded at startup.
- The main UI does not require students to choose an engine.

## Current Architecture

Legacy compatibility fallback path:

```text
UI -> rootEngineSelector -> rootEngineAdapter -> window.RootEngine -> public/legacy
```

Modern engine path:

```text
UI -> rootEngineSelector -> modernRootEngineAdapter -> modernRootEngine -> isolated TypeScript methods -> evaluator.ts -> math.js
```

The UI should not call `window.RootEngine` directly and should not call the isolated modern methods directly. `rootEngineSelector.ts` is the engine selection layer.

## Supported Modern Methods

Modern engine currently supports:

- Bisection
- False Position / Regula Falsi
- Secant
- Fixed Point Iteration
- Newton-Raphson with a provided derivative
- Newton-Raphson with numeric derivative when the UI derivative field is `auto`

Numeric Newton derivatives use central difference through the shared evaluator. Modern Newton supports explicit `x0` and interval-derived starts, including interval midpoint and the existing endpoint/best-of-three strategies. Symbolic differentiation is deferred; `auto` maps to numeric central difference in Modern engine mode.

Modern Bisection includes the current P0 parity surface for bracket scanning, absolute/relative/residual/interval tolerance modes, configurable exact versus machine sign-decision basis, and the visible exact/machine/both sign-display control. Modern False Position supports the same visible sign-display and exact versus machine decision-basis controls, including sign-disagreement notes, while both Modern bracket methods keep their main numeric table columns unchanged.

Modern Fixed Point supports the single-formula iteration path, the manual Fixed Point Comparison UI, and the advanced visible controls for extra seeds, batch `g(x)` formulas, and seed scan. Extra seeds and batch formulas are exposed as ranked workflow candidates; empty batch formulas are ignored. Seed scan adds deterministic sampled seeds to that same candidate ranking, and the best-ranked candidate supplies the main Modern Fixed Point table, matching the Legacy candidate-selection workflow rather than silently hiding the alternatives.

## Known Differences

Expected differences between Legacy compatibility fallback and Modern engine:

- Stop reason names may differ.
- Iteration counts may differ.
- Iteration table shape and column labels may differ.
- Display formatting may differ.
- Legacy compatibility fallback has strict stepwise machine/chopping/rounding behavior that is not fully replicated in Modern engine mode.
- Modern engine uses the math.js-backed evaluator in legacy-compatible real-valued mode.
- Symbolic derivative generation is deferred.
- Failure rows can be partial when a method stops before producing a full iteration row.
- Some failure cases appear as alerts, while others appear as result-panel failure states with no finite root.
- Failure wording may differ; for example, Legacy compatibility fallback can surface direct messages such as division-by-zero text while Modern engine normalizes through its adapter.
- Fixed-point divergence or cycle cases can differ as hard failures versus safe stopped results; compare these as safety behavior rather than identical success/failure status.

These differences should be documented and tested rather than hidden.

## Calculation Precision Policy

Legacy compatibility fallback bracket methods use stepwise machine arithmetic through the Legacy expression-evaluation path. In strict Legacy compatibility fallback mode, the selected digits and round/chop rule can affect intermediate expression operations, not only the method-level endpoint or iteration values.

Modern engine has an explicit precision policy surface:

- `standard`: no machine simulation; current high-precision Modern internals are preserved.
- `display-only`: visible final/table/CSV formatting only; method internals are preserved.
- `calculation-level`: optional Modern method-boundary machine simulation for methods that have been wired to it.

Modern calculation-level precision is currently boundary-level method precision. It applies round/chop at selected method operation boundaries and after whole-expression evaluation. It does not yet reproduce full Legacy stepwise expression behavior unless that is explicitly implemented in the Modern evaluator or a method later.

This distinction is visible in False Position for `x^2 - 4` on `[0, 3]` with `k=5` and five fixed iterations: Legacy chopping finishes at `1.9987`, while Modern boundary-level calculation precision finishes at `1.9988`. Bisection's current characterization case matches the Legacy final approximation because its sign-only bracket updates are less sensitive to the expression-magnitude mismatch.

Modern bracket decision controls select whether exact whole-expression signs or Modern boundary-level machine signs drive the `sgn(f(a_n))sgn(f(p_n)) < 0` bracket decision. Their sign-display controls expose `sgn_exact(...)`, `sgn_machine(...)`, or both in the professor-style setup/evidence text. Strict stepwise Legacy machine arithmetic remains the fallback when exact Legacy round/chop parity is required.

Modern Newton does not yet port Legacy calculation-level machine arithmetic. Strict Legacy Newton machine-arithmetic behavior, including symbolic auto-derivative behavior where Legacy can generate it, remains a Legacy fallback requirement for now.

Modern Fixed Point calculation-level machine arithmetic is also not ported yet. Use Legacy compatibility fallback for strict round/chop Fixed Point iterate storage and exact Legacy stepwise arithmetic behavior.

Use Legacy compatibility fallback whenever strict Legacy machine-arithmetic compatibility is required.

UI computation settings copy:

- Modern engine: "Digits and Rule format displayed final root, table, and CSV values. Some Modern methods support method-level precision behavior, but strict stepwise Legacy arithmetic remains available through Legacy compatibility fallback."
- Legacy compatibility fallback: "Digits and Rule affect legacy calculation behavior. This fallback is retained for strict stepwise machine-arithmetic compatibility."

## Rollback Options

Use either rollback path without deleting Legacy files:

- Set `VITE_ROOT_ENGINE=legacy`.
- Choose Legacy compatibility fallback in Advanced/testing.

Legacy should not be removed until a separate removal task explicitly approves it. Keep `public/legacy`, `root-engine.js`, `ExpressionEngine`, `math-engine.js`, and `calc-engine.js` available.

## Testing Commands

Run the normal local checks:

```powershell
npm run test:unit
npm run typecheck
npm run test:e2e
npm run test:e2e:comparison
```

Run the Modern engine smoke test from Windows PowerShell:

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
