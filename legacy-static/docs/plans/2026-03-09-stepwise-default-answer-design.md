# Stepwise Default Answer Design

## Summary

This pass removes ambiguity around `Stepwise` versus `Final-only` results. Based on the lesson content, students should treat the stepwise machine result as the default answer for computer-arithmetic work, while the final-only result should be presented as a special-case comparison used only when the instruction explicitly says to round or chop once at the end.

## Lesson Basis

Relevant lesson points from `On Round off Error and Computer Arithmetic .pdf`:
- the computational world uses fixed, finite-digit representations
- floating-point form is produced by chopping or rounding to the machine digit limit
- round-off error comes from using these approximate representations in computation

Inference for the product design:
- when a problem is about machine arithmetic, the machine rule is usually understood to affect intermediate stored values during the computation
- therefore the `Stepwise` result should be the default student-facing answer
- the `Final-only` result is still useful, but mainly as a comparison or for special instructions

## Goals

- Make it obvious which answer a student should use by default.
- Reduce hesitation after a calculation.
- Preserve both values for teaching and comparison.
- Apply the same teaching rule consistently across modules.

## Non-Goals

- No changes to numerical logic.
- No removal of the final-only calculation.
- No redesign of the whole result layout.
- No new tutorial system beyond wording and hierarchy updates.

## Chosen Approach

### Strong default recommendation

Make `Stepwise` the clearly preferred answer and position `Final-only` as a secondary comparison answer.

This was chosen because it best matches the lesson model and addresses the student confusion directly. A neutral explanation still forces the student to decide. A strong default removes that burden.

## Design Principles

### The interface should answer the student's question

If a student wonders, `Which one should I submit?`, the UI should already answer that question without requiring interpretation.

### Teach the exception, not just the rule

The main rule should be:
- use `Stepwise`

The exception should be:
- use `Final-only` only when the problem explicitly says `round/chop once at the end` or `compute exactly first, then round/chop`

### Keep both values visible when helpful

The app should not hide the final-only value. It still teaches an important contrast. But visual hierarchy and wording should make its status secondary.

## Module I Design

### Current problem

Students see two answers:
- `Stepwise p*`
- `Final-only p*`

Even with explanation text, the result still feels like two equally valid outputs.

### Planned change

Reframe the result area so the primary answer reads like:
- `Main machine answer p*`
- helper text: `Use this for most computer arithmetic exercises`

Reframe the secondary answer like:
- `Final-only comparison`
- helper text: `Use only if your instructor says round/chop once at the end`

Add one compact rule near the result area:
- `Submit the Stepwise result unless the problem explicitly says apply the rule once at the end.`

## Module III Design

### Current problem

Students compare stepwise Horner/direct values against a shared final-only value, but the app does not strongly teach which family of answers is the one they should normally use.

### Planned change

Keep the current method comparison, but make the interpretation rule more explicit:
- the stepwise method result is the main machine answer
- the shared final-only value is a comparison value for the special case of one-time rounding/chopping

Verdict copy should continue pointing students to the better stepwise method when the rule is applied at every operation.

## Module II Design

### Current problem

Module II imports both stepwise and final-only values, but the import labels do not reinforce that one is usually the default source value.

### Planned change

Keep all current import actions, but adjust wording so the stepwise imports read as the normal machine-arithmetic path and the final-only imports read as comparison/special-case imports.

## Content Strategy

### Default statement

Use one short repeated rule in the app:
- `Use Stepwise unless the instruction says round/chop only once at the end.`

### Special-case statement

Use one short exception statement:
- `Final-only is for exact-first, round-once/chop-once instructions.`

### Tone

The wording should be direct and student-facing, not neutral or overly technical.

## Interaction and Hierarchy

- `Stepwise` result should appear visually stronger than `Final-only` in Module I.
- `Final-only` should still remain visible, but with quieter framing.
- Import buttons and next-step labels should reflect the same priority.
- Module III verdicts should continue recommending the stronger stepwise method.

## Accessibility

- The default-choice message should not depend on color alone.
- The distinction should be readable through labels, order, and helper text.
- Any updated result wording should remain concise enough for screen readers and narrow screens.

## Validation

### Functional

- No result values change.
- Existing import/send flows still work.
- Module I, II, and III calculations remain unchanged.

### UX

- A student should understand which answer to use without asking.
- The UI should clearly communicate that `Stepwise` is the usual answer.
- `Final-only` should read as a secondary/special-case result rather than an equal default.

## Notes for Implementation

- Prefer wording and hierarchy changes over structural bloat.
- Reuse the existing result-guidance areas introduced in the previous pass.
- Keep the lesson-derived rule consistent across Module I, II, and III.
