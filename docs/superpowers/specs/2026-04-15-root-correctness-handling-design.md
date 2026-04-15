# Root Correctness Handling Design

Date: 2026-04-15
Project: Numerical Analysis Teaching Lab
Status: Draft for user review

## Summary

Run a bounded correctness contract sweep for the Root Finding Workbench. The goal is to make every root-method result mathematically honest and internally consistent before adding new teaching features or UI polish.

This design uses Option B: define the result semantics first, then fix the known correctness and teaching-integrity mismatches against that contract. The scope covers root-engine outputs, root UI labels/prose, and audit coverage. It does not add new solver methods or redesign the interface.

## Goals

- Make root results clearly distinguish exact/reference values, machine-stored values, iterates, residuals, error estimates, and guaranteed bounds.
- Ensure stop reasons describe the actual numerical condition that stopped the method.
- Keep bisection widths and bounds consistent with the interval arithmetic path used by the solver.
- Reduce avoidable plain JavaScript `Number` arithmetic inside False Position when project engine arithmetic can preserve the intended finite-precision semantics.
- Make hidden open-method safety limits visible in returned results and student-facing explanations.
- Add focused audit cases that lock down each corrected behavior.

## Non-Goals

- Add root-method presets, compare mode, graphing, bracket scanning, exports, or new solvers.
- Redesign the Root Finding Workbench layout.
- Split `root-ui.js` into smaller files.
- Change other modules except where shared helper behavior is directly required by root correctness.
- Replace the existing expression parser or machine-arithmetic engine.

## Correctness Contract

Each root run should expose a consistent result story:

- `approximation`: the method's final reported iterate or bracket point, or `null` when no valid approximation exists.
- `residual`: the final value of `f(approximation)` or `g(x_n) - x_n` where that value is meaningful.
- `residualBasis`: whether the residual is exact/reference, machine, or unavailable.
- `error`: the method-specific last-step estimate, such as `|x_{n+1} - x_n|`, or `null` when unavailable.
- `bound`: a mathematical guarantee only when the method actually provides one. For bisection, this is interval-width based. For open methods, it should not be presented as a guaranteed root error unless the method supports that claim.
- `stopReason`: a precise machine-readable reason that avoids calling machine-zero checks exact-zero checks.
- `stopDetail`: short explanatory text or metadata for cases like derivative-zero, denominator-zero, divergence, invalid bracket, tolerance reached, or iteration cap exhausted.
- `maxIterations`: visible when the solver uses an internal cap.

The UI should render these fields without implying stronger guarantees than the engine returned.

## Targeted Changes

### Bisection Bound Consistency

When bisection runs with `decisionBasis: "machine"`, the solver stores endpoints through the selected machine rule before iterating. Row-level widths and bounds should follow that same interval path. They should not be computed from the original exact input interval if the displayed and updated interval is machine-stored.

The audit should include a case where exact endpoints and machine-stored endpoints produce different widths, such as a chopped low-precision interval. The expected row bounds should match the machine interval actually used by the run.

### Stop-Reason Honesty

Current open-method checks can report `exact-zero` even when the checked value is the machine approximation of `f(x_n)`. Rename or remap those stop reasons so students see the difference between a mathematically exact root and a zero produced by selected finite-precision arithmetic.

Suggested stop reasons:

- `exact-zero`: reserved for a true exact/reference zero when the engine has actually established one.
- `machine-zero`: used when the machine-computed value is zero or close enough to the machine epsilon threshold.
- `tolerance-reached`: used when the configured tolerance condition is met.
- `iteration-cap`: used when epsilon mode exhausts the method's maximum iterations.
- `derivative-zero`, `stagnation`, `diverged`, and `invalid-starting-interval`: keep these, but ensure UI prose says what quantity caused the stop.

### False Position Arithmetic

False Position currently computes the interpolation point through JavaScript number arithmetic. The implementation should prefer existing project arithmetic helpers for subtraction, multiplication, division, and storage so the method follows the same finite-precision story as the rest of the root module.

If some cases still require numeric fallback, the fallback should be explicit and covered by tests. It should not silently downgrade exact-compatible inputs when the engine can preserve rational or calc values.

### Open-Method Iteration Caps

Newton, Secant, False Position epsilon mode, and Fixed Point use a safety cap to prevent infinite loops. The cap should be visible in the returned stopping metadata and in UI text when it matters.

The UI should distinguish:

- stopped because tolerance was reached;
- stopped because a requested fixed iteration count completed;
- stopped because the internal epsilon-mode cap was exhausted before tolerance was reached.

### Residual And Error Semantics

Each method should expose enough final diagnostic data for honest display:

- Bisection and False Position: final `f(c)` where available, interval width, and whether a bracket guarantee remains valid.
- Newton and Secant: final `f(x_n)`, last step size, and whether the derivative or denominator stopped the run.
- Fixed Point: final `g(x_n)`, last step size, and divergence/cap status.

The UI does not need a new diagnostics panel in this pass, but solution steps and summary labels should stop overstating guarantees.

## Implementation Notes

- Start by adding failing or characterization checks to `scripts/root-engine-audit.js`.
- Update `root-engine.js` return packages to include the new or clarified metadata.
- Update `root-ui.js` stop-reason labels, stopping details, and solution prose to consume the clarified metadata.
- Keep existing DOM element IDs stable.
- Avoid broad visual layout changes.
- Preserve existing passing root audit cases unless a test was explicitly checking the old incorrect wording.

## Verification Plan

Run the existing scripts after each meaningful change:

```powershell
node scripts/engine-correctness-audit.js
node scripts/root-engine-audit.js
node scripts/ieee754-audit.js
```

Add or update root audit cases for:

- bisection machine-decision row bounds with low-precision stored endpoints;
- Newton machine-zero stop reason;
- Secant machine-zero or stagnation stop reason;
- False Position interpolation under exact-compatible inputs;
- epsilon-mode iteration cap exhaustion;
- invalid bracket still returning no approximation.

Manual browser checks should confirm:

- stop reason labels are honest and readable;
- solution prose no longer says exact root when only machine arithmetic produced zero;
- bisection row bounds match displayed machine intervals;
- old valid examples still compute as before.

## Parked Backlog

After correctness handling is complete, return to these improvements:

- Root-method worked examples and presets.
- Compare Methods mode.
- Function graph with bisection midpoints, false-position chords, Newton tangents, secant lines, and fixed-point cobweb-style visuals.
- Bracket scanner and starting-point helper.
- Final diagnostics panel with residual, approximate relative error, last-step error, and guarantee text.
- Full report export as Markdown or CSV.
- Keyboard-accessible method tabs with proper ARIA tab behavior.
- Compact and full iteration table display modes.
- Split `root-ui.js` into smaller render, report, table, and graph helpers.
- Browser smoke tests for DOM behavior, stale state, responsive tables, and copy flows.
- README update so the root module description matches the current five-method workbench.

## Self-Review

- No incomplete markers remain.
- The scope is limited to root correctness and teaching integrity.
- The design separates guaranteed bounds from heuristic open-method errors.
- Stop reasons distinguish exact/reference zero from machine-zero behavior.
- The parked backlog is recorded but explicitly excluded from this pass.
