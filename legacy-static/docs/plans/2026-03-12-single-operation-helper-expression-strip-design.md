# Single Operation Helper Expression Strip Design

## Summary

This pass fixes the remaining layout problem in the tutorial `Single operation helper`. The helper should read like one compact math expression, but it still feels visually broken because the operator sits apart from the operands and the operand utilities disrupt the row.

The redesign keeps the helper compact, but it changes the layout emphasis from `form fields arranged near each other` to `one horizontal operation with settings underneath`.

## Problem

The current helper still feels wrong because:

- the operator does not visually belong to the two operands
- the operand controls do not read as one expression strip
- the layout still feels like three unrelated blocks rather than `x op y`
- the machine settings row is cleaner than before, but the top row still does not communicate the actual operation clearly

This creates hesitation before the student even uses the tool.

## Goals

- Make the top row read immediately as one binary operation.
- Keep the helper compact and horizontally structured.
- Keep the settings row separate and secondary.
- Preserve the helper logic and existing ids.

## Non-Goals

- No changes to the underlying machine arithmetic calculations.
- No broader redesign of the tutorial tab.
- No new helper features or explanatory content.
- No changes to advanced result panels.

## Chosen Approach

### Expression strip layout

Treat the first row as one true expression strip:

- left operand field
- centered narrow operator control
- right operand field

Treat the second row as setup and action only:

- significant digits `(k)`
- machine rule
- `Calculate`

This was chosen because it fixes the core comprehension problem. The student should see one operation first, then the machine settings that govern it.

## Layout Design

### Expression row

The top row should look like:

`[ operand A ] [ operator ] [ operand B ]`

Key behaviors:

- both operand fields have equal visual weight
- the operator is narrow and centered
- the symbol buttons stay attached to each operand field instead of floating as separate elements
- no helper sub-elements should break the visual continuity of this row

The expression row should feel like one line of math, not a collection of controls.

### Settings row

The second row remains compact and separate:

- significant digits `(k)`
- machine rule
- calculate button

This row should support the expression row without competing with it.

## Responsive Behavior

On smaller widths:

- the expression row may stack, but it should still preserve the order operand → operator → operand
- the settings row should stack independently below it
- the helper should still feel intentional, not fragmented

## Files Affected

- `C:\Users\Emmy Lou\Downloads\New folder (16)\index.html`
- `C:\Users\Emmy Lou\Downloads\New folder (16)\styles.css`

`app.js` should not need logic changes unless a layout hook requires a tiny selector adjustment.

## Verification

Before calling this complete:

- confirm the top row reads as one clear expression strip
- confirm the operator sits visually between the operands
- confirm the symbol buttons do not break the operand alignment
- confirm the settings row still aligns cleanly below
- confirm the helper still calculates normally
