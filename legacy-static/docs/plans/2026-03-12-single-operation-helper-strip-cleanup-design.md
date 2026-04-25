# Single Operation Helper Strip Cleanup Design

## Summary

This pass fixes the tutorial `Single operation helper` by enforcing a true expression-strip layout. The current row still feels broken because the helper injects inline parsed preview chips for `basic-a` and `basic-b`, which interrupts the visual relationship between the two operands and the operator.

The fix is to keep the helper's top row visually strict and remove those operand preview chips from the helper entirely.

## Problem

The current helper still feels visually wrong because:

- the top row is supposed to read as one binary operation
- inline parsed preview chips are appearing under the operand fields
- those chips break the operand-operator-operand rhythm
- the student sees extra mini boxes before understanding the actual operation

This makes the helper feel cluttered and broken even though the machine-arithmetic logic is correct.

## Goals

- Make the top row read cleanly as `[ operand ] [ operator ] [ operand ]`.
- Remove visual clutter that interrupts the helper expression strip.
- Keep the second row focused on machine settings and action.
- Preserve all helper computation behavior.

## Non-Goals

- No changes to helper math logic.
- No redesign of the result section.
- No new preview system.
- No broader tutorial-tab changes.

## Chosen Approach

### Remove helper operand preview chips

Disable the inline parsed previews for `basic-a` and `basic-b` in the tutorial helper so the top row contains only the expression controls themselves.

This was chosen because it directly addresses the actual layout break shown in the screenshot. The helper does not need those extra chips to be usable, and keeping them forces the expression row to compete with nonessential elements.

## Layout Design

### Expression row

The first row should contain only:

- left operand field
- operator control
- right operand field

No extra preview elements should appear under or between those fields.

### Settings row

The second row should continue to contain:

- significant digits `(k)`
- machine rule
- calculate

This row remains secondary and should not interfere with the readability of the top expression strip.

## Files Affected

- `C:\Users\Emmy Lou\Downloads\New folder (16)\app.js`
- `C:\Users\Emmy Lou\Downloads\New folder (16)\styles.css`
- `C:\Users\Emmy Lou\Downloads\New folder (16)\index.html` only if a small hook or helper wrapper adjustment is still needed

## Verification

Before calling this complete:

- confirm no operand preview chips appear in the tutorial helper
- confirm the top row reads as one expression strip
- confirm the settings row still aligns below it
- confirm the helper still calculates normally
