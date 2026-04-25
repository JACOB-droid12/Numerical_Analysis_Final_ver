# Result Workflow Guidance Design

## Summary

This pass improves what students see immediately after calculating. The interface is already calmer after the simplification pass; the next opportunity is making the results easier to interpret and act on without forcing students into advanced views.

## Goals

- Help students understand what the current result means in plain language.
- Make the next best action obvious after each successful calculation.
- Keep result interpretation on the main screen and reserve deeper explanation for `Advanced tools`.
- Preserve the cleaner, student-first layout from the simplification pass.

## Non-Goals

- No new numerical-analysis features.
- No changes to parsing, arithmetic, or result computation.
- No major layout rearchitecture.
- No tutorial overlay or checklist flow.

## Chosen Approach

### Minimal guidance overlay

Add concise interpretation text and one clear next-step row to each module while reusing the existing result areas.

This was chosen because it has the best clarity-to-risk ratio:
- it improves comprehension immediately
- it does not re-densify the UI
- it avoids disrupting the current, working module structure

## Design Principles

### Explain the result where it appears

Students should not need to open another panel just to learn what the main answer is for.

### One next move, not many

Each module should suggest one or two obvious next actions rather than presenting several equivalent choices.

### Keep advanced content supportive

Detailed traces, metric breakdowns, and exact-form inspection remain useful, but they should support the main answer rather than compete with it.

## Module-by-Module Design

### Module I

Current state:
- The result cards are present and correct.
- The current answer guide still uses internal terminology more than student language.
- The send actions appear, but the interface could be clearer about when to use them.

Planned change:
- Replace the current answer guide with a plain-language interpretation sentence.
- Add a lightweight next-step row below the primary answer area.
- Suggested actions:
  - `Send stepwise p* to Errors`
  - `Open machine trace`

Intent:
- Students should immediately understand that the stepwise value is the main machine-arithmetic answer for exam-style problems.
- The next step should either continue the workflow into Module II or open evidence for how the result was produced.

### Module II

Current state:
- The module shows metrics correctly.
- Students still need to infer whether the approximation is “good” from the numbers.

Planned change:
- Add a short result verdict above or alongside the main metrics.
- The verdict should use plain language such as:
  - strong approximation
  - acceptable but losing precision
  - poor approximation
- Keep detailed metric interpretation inside `Advanced tools`.

Intent:
- Students should get an immediate qualitative read before parsing relative error and significant digits.

### Module III

Current state:
- The verdict exists, but it still leans technical.
- The result area can do more to tell students what the comparison means.

Planned change:
- Rewrite the verdict block so the first sentence is simpler and more student-facing.
- Keep method comparison details available, but subordinate them to the headline conclusion.
- Add a next-step prompt such as opening `Advanced tools` to inspect why one method performed better.

Intent:
- Students should first learn which method is better for this case, then optionally inspect the reasoning.

## Content Strategy

### Plain-language interpretation

Use short sentences that answer:
- Which answer should I use?
- Is this approximation good enough?
- What is the main conclusion?

### Next-step prompts

Use one compact row per module with action-forward wording.

Examples:
- `Send stepwise p* to Errors`
- `Open machine trace`
- `Check the detailed metrics`
- `See why Horner won`

## Interaction Design

- Next-step prompts should appear only when results exist.
- They should visually read as secondary to the result, but stronger than deep technical disclosures.
- They should reuse existing controls where possible instead of creating duplicate actions.

## Accessibility

- New guidance text should remain readable and not depend on color alone.
- New next-step controls should stay keyboard reachable and keep existing semantics.
- Any new result verdicts should be updated along with the existing result state, not via detached decorative text.

## Validation

### Functional

- Module I, II, and III calculations must remain unchanged.
- Existing import/send flows must still work.
- Advanced tools must still open and show the same detailed content.

### UX

- Students should understand the meaning of the main result faster than before.
- The primary follow-up action should be visible without reading deep copy.
- The screen should remain cleaner than the pre-simplification version.

## Notes for Implementation

- Prefer populating new interpretation text from existing computed state in `app.js` rather than duplicating result logic.
- Reuse existing action buttons where possible and only add one new lightweight action if it materially improves flow.
- Keep the new guidance visually integrated with existing result sections instead of creating additional heavy panels.
