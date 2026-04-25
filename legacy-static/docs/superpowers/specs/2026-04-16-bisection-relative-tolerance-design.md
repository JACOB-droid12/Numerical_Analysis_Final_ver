# Bisection Relative Tolerance Design

Date: 2026-04-16
Project: Numerical Analysis Teaching Lab
Status: Draft for user review

## Summary

This design adds a tolerance-type choice to the Bisection method only.

When the student selects `Given tolerance ε`, the Bisection tab will expose a second control named `Tolerance type` with two options:

- `Relative tolerance` (default)
- `Absolute tolerance`

The default must follow the professor's lecture style. That means Bisection should default to a relative-error-oriented stopping rule based on the current bracket, not a successive-midpoint-difference rule. Absolute tolerance remains available as an option for users who want the more direct interval-size interpretation.

## Goals

- Align the default Bisection tolerance behavior with the lecture examples.
- Make the distinction between relative and absolute tolerance explicit in the UI.
- Preserve the current absolute-tolerance path as an option instead of replacing it.
- Keep the change scoped to Bisection first.
- Make result summaries and solution steps state clearly which tolerance type was used.

## Non-Goals

- No tolerance-type change for Newton-Raphson, Secant, False Position, or Fixed Point in this phase.
- No redesign of the overall root-finding layout.
- No silent reinterpretation of the existing epsilon input.
- No change to iteration-mode behavior.

## Current Problem

The current Bisection UI exposes only `Given tolerance ε`, which is ambiguous. In practice, this creates a mismatch between:

- the calculator's present epsilon behavior
- textbook and lecture examples that use a relative bound
- student expectations when they compare calculator output to classroom solutions

The `x^3 + 4x^2 - 10` example on `[1,2]` makes the mismatch visible. The lecture stops after 13 iterations using a relative bound, while the current calculator interpretation leads students to expect 14 iterations under an absolute-style reading of epsilon.

## Decision

Use a hybrid stopping design for Bisection:

1. Keep the existing `Stopping mode` control with:
   - `Given iterations n`
   - `Given tolerance ε`
2. When `Given tolerance ε` is selected, show a new `Tolerance type` control.
3. Default `Tolerance type` to `Relative tolerance`.
4. Keep `Absolute tolerance` as the alternate choice.

This is the agreed design because it matches the professor's lecture while keeping the mathematically common absolute interpretation available.

## User Experience

### Bisection controls

The Bisection tab should behave as follows:

- If `Given iterations n` is selected:
  - hide `Tolerance type`
  - keep current iteration behavior unchanged
- If `Given tolerance ε` is selected:
  - show `Tolerance type`
  - preselect `Relative tolerance`

### Labels

Use explicit labels:

- `Stopping mode`
- `Stopping value (n or ε)`
- `Tolerance type`

Tolerance-type options:

- `Relative tolerance`
- `Absolute tolerance`

### Helper note

Show a brief note near the Bisection tolerance controls when epsilon mode is active:

`Relative tolerance is the default for Bisection because it matches the lecture-style stopping rule.`

This note should be short, visible, and non-modal.

## Numerical Behavior

### Relative tolerance

For Bisection, relative tolerance should use a bracket-based relative bound consistent with the lecture style.

The implementation should use the current bracket endpoints and report a relative bound derived from the interval containing the root, rather than relying on:

- only `|p_n - p_(n-1)|`
- only `|f(p_n)|`

This keeps the stopping rule aligned with the lecture's justification style and with the theory of Bisection as an interval-halving method.

### Absolute tolerance

Absolute tolerance should preserve the current direct epsilon-style stopping path for Bisection so existing absolute-tolerance use cases remain available.

## Result Reporting

The result summary and steps must explicitly name the tolerance type used.

Examples:

- `Relative tolerance ε = 0.0001`
- `Absolute tolerance ε = 0.0001`

The solution steps should explain the stopping rule in matching language:

- relative mode should describe the relative bound used for the bracket
- absolute mode should describe the absolute bound or interval-size interpretation used

This avoids the current ambiguity where students see an epsilon value but cannot tell which accuracy notion the calculator applied.

## State And Defaults

- The new tolerance-type control belongs to the Bisection tab only.
- The default selection for new Bisection epsilon runs is `Relative tolerance`.
- The setting should remain stable while the student stays on the tab unless they change it.
- Presets and future diagnostics should be able to read and display this value.

## Error Handling

- If relative tolerance cannot be evaluated safely for a given bracket presentation, the UI should show a clear Bisection-specific message rather than silently falling back to absolute tolerance.
- If the method exits early because of an exact endpoint or midpoint root, the summary should still show the chosen tolerance type while making it clear that the exact root was found before the tolerance rule mattered.

## Testing Expectations

The following checks should pass after implementation:

- The professor's `x^3 + 4x^2 - 10` example on `[1,2]` with epsilon `10^-4` can be justified using the relative-tolerance path and matches the lecture-style stopping explanation.
- The same problem still supports absolute tolerance as an explicit alternate choice.
- Existing iteration-mode Bisection behavior does not change.
- Existing non-Bisection methods do not gain this new control in this phase.
- Result summaries and solution steps clearly identify relative vs absolute tolerance.

## Implementation Notes

This design does not prescribe the exact code structure, but the implementation should keep tolerance-type handling localized to the Bisection flow so the later expansion to other methods remains optional rather than forced.

The key product rule is:

- Bisection defaults to relative tolerance
- Bisection still offers absolute tolerance
- the UI must say which one is in effect
