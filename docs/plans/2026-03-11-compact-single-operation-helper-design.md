# Compact Single Operation Helper Design

## Summary

This pass cleans up the `Single operation helper` inside the `Tutorial` tab so it reads like a compact machine-arithmetic exercise instead of a loose form. The current helper works, but its controls are visually disconnected: the operation selector feels detached from the operands, the settings compete with the math inputs, and the `Calculate` button sits too far away from the action.

The new design keeps the same helper logic and result content, but reorganizes the controls into a tighter two-row sequence that matches how a student thinks through the task.

## Problem

The helper currently looks messy because:

- the two operands and operator do not read as one expression
- the machine settings sit on the same visual plane as the expression itself
- the `Calculate` button feels stranded
- the result area begins too abruptly after the controls

For a tutorial utility, this creates unnecessary visual friction and makes the helper feel harder than it is.

## Goals

- Make the helper feel compact and intentional.
- Make the expression itself the first thing a student understands.
- Keep the machine settings visible without overpowering the operation row.
- Preserve the existing calculator logic, values, and result content.

## Non-Goals

- No changes to the numerical analysis calculations.
- No new tutorial copy or worked-example content.
- No redesign of the rest of the tutorial tab.
- No removal of the symbol buttons or helper result details.

## Chosen Approach

### Inline math row plus utility row

The helper will be reorganized into two compact rows:

- Row 1: left operand, operation, right operand
- Row 2: significant digits, machine rule, calculate

This was chosen because it best matches the student's mental model:

1. choose the numbers
2. choose the operation
3. choose the machine settings
4. calculate

Compared with a dense one-row toolbar, this stays compact without becoming cramped. Compared with splitting the helper into multiple cards, it keeps the expression visually central.

## Layout Design

### Expression row

The top row should behave like a math line:

- the left and right operand inputs are the widest controls
- the operation selector is narrower and centered between them
- the symbol buttons remain attached to the operand fields, but they should no longer distort the row spacing

The expression row should feel like one operation, not five separate form controls.

### Settings row

The second row should contain the helper settings and action:

- `Significant digits (k)`
- `Machine rule`
- `Calculate`

These controls should be visually shorter and secondary to the operand row. The `Calculate` button should align with the settings row so it feels like the final step in the sequence, not an orphaned button below the form.

### Result spacing

The result section should stay immediately below the controls, but with cleaner separation so it reads as the output of the exercise. The layout should avoid the current feeling that the form and the result card are colliding.

## Responsive Behavior

On narrower widths:

- the expression row should stack cleanly without overlap
- the settings row should stack independently of the expression row
- the result area should remain below both rows with stable spacing

The compact design should still feel intentional on tablet and mobile sizes, not just on desktop.

## Files Affected

- `C:\Users\Emmy Lou\Downloads\New folder (16)\index.html`
- `C:\Users\Emmy Lou\Downloads\New folder (16)\styles.css`

`app.js` should only need updates if class hooks or wrapper structure must be adjusted. No numerical logic changes are planned.

## Verification

Before calling this complete:

- confirm the helper reads as a compact two-row control group in the `Tutorial` tab
- confirm the operand row no longer feels detached
- confirm the `Calculate` button aligns with the settings row
- confirm the helper still works normally after calculation
- confirm the layout remains stable on desktop and mobile widths
