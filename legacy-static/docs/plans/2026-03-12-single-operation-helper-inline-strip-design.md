# Single Operation Helper Inline Strip Design

## Summary

This pass fixes the remaining layout problem in the tutorial `Single operation helper` by turning the top row into a true inline strip. The operand symbol buttons and the operator control are still dropping out of alignment because the helper currently relies on generic stacked field-shell behavior.

The fix is to give the helper a dedicated inline field layout so the operands, operator, and symbol buttons stay on one visual line.

## Problem

The current top row still looks broken because:

- the operand symbol buttons drop below the operand fields
- the operator control does not stay aligned with the operand controls
- the helper row behaves like stacked form fragments instead of one expression strip
- the student does not see one clear binary operation at first glance

## Goals

- Keep the full top row inline on desktop widths.
- Make each operand and its `∑` button behave as one horizontal unit.
- Keep the operator centered and vertically aligned with the operand controls.
- Preserve the existing helper logic and second-row settings layout.

## Non-Goals

- No changes to machine arithmetic logic.
- No changes to result rendering.
- No redesign of the tutorial card outside the helper strip.
- No changes to other modules unless a shared helper class must be safely reused.

## Chosen Approach

### Dedicated helper inline strip

Give the helper-specific operand shells and operator block their own inline layout rules.

The top row should read as:

`[ 2.1892  ∑ ]   [ * ]   [ 3.7008  ∑ ]`

This was chosen because it directly addresses the row-break problem without requiring a larger component rewrite.

## Layout Design

### Operand units

Each operand unit should:

- keep the input and `∑` button on the same line
- align to the same bottom edge as the operator
- remain the widest controls in the row

### Operator unit

The operator should:

- remain narrow
- sit centered between the operands
- align to the same baseline as the operand units
- avoid dropping below the row unless the viewport is truly narrow

### Responsive behavior

On narrow widths, the row may stack, but it should only do so intentionally through helper-specific breakpoints, not because the field shells are naturally dropping elements.

## Files Affected

- `C:\Users\Emmy Lou\Downloads\New folder (16)\styles.css`
- `C:\Users\Emmy Lou\Downloads\New folder (16)\index.html` only if a helper-specific wrapper class is still needed

`app.js` should not need changes for this pass.

## Verification

Before calling this complete:

- confirm the `∑` buttons stay inline with the operand fields
- confirm the operator remains inline and centered
- confirm the top row reads as one clean expression strip
- confirm the settings row still aligns below normally
