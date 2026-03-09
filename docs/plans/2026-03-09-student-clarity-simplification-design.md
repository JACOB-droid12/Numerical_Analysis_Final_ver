# Student Clarity Simplification Design

## Summary

This design keeps the calculator's distinctive visual identity and exam-tool depth while making the first-use experience calmer, clearer, and more student-friendly. The main strategy is progressive disclosure: show the essential "enter, calculate, understand the result" workflow first, and move advanced analysis tools into clearly labeled collapsed sections.

## Goals

- Help first-time students succeed in Module I without scanning the whole interface first.
- Reduce duplicate guidance, repeated labels, and competing controls.
- Preserve advanced exam features for power users without making them the default experience.
- Fix mobile control issues that undermine clarity, especially around stacked inputs and selects.

## Non-Goals

- No calculator-engine, parsing, or arithmetic changes.
- No redesign into a completely different visual language.
- No split into separate beginner and expert applications.
- No removal of existing advanced functionality; the change is about presentation and hierarchy.

## Current Problems

### Cognitive overload on first view

The hero, quick guide, status strip, settings, catalog, tabs, module intro, input hint, empty state, and advanced disclosures all compete for attention before the student completes a first calculation.

### Repeated guidance

The interface explains the same ideas in several places: hero subtitle, quick guide, module copy, input hint, and empty states. This creates noise instead of reassurance.

### Advanced tools feel first-class

`Exact details`, `Operation helper`, `Expression trace`, `Import tools`, and method details are all useful, but their current presence makes the app feel heavier than it needs to for a first-time student.

### Mobile friction

The mobile layout reveals a control-styling bug in the `Machine rule` select and makes the main input area feel cramped relative to the amount of support copy surrounding it.

## Users

### Primary

Students opening the calculator for the first time and trying to complete a class activity or exam-style problem quickly.

### Secondary

Students and instructors who want exact-value inspection, step traces, and method comparisons after the first result is on screen.

## Design Principles

### One obvious next action

Every module should foreground the smallest useful workflow:
- Module I: enter expression, choose digits/rule, calculate
- Module II: compare two values or import one
- Module III: enter polynomial and x-value, calculate

### Teach after success

Instead of front-loading every explanation, the interface should explain the result once the student has something concrete to look at.

### Power stays available, not dominant

Advanced analysis remains available via a single `Advanced tools` disclosure pattern per module.

### Reduce duplication, not personality

The visual style can stay distinctive; the cleanup should remove redundant words and competing controls rather than flattening the design.

## Proposed Information Architecture

### Global shell

- Shorten the hero so it acts as orientation, not a landing-page essay.
- Keep the status chips, but demote their visual prominence.
- Keep `Settings` and `Catalog`, but make them feel secondary.
- Remove the standalone `Hide guide` / `Show guide` button pair.
- Keep the quick guide as a collapsible panel that remembers open/closed preference.

### Module I

- Keep Module I as the primary default view.
- Preserve the expression calculator as the first visible interaction.
- Keep the empty state, but rewrite it to point directly to either the starter example or user input.
- Keep result cards visible after calculation, followed by one short "How to read this result" explanation.
- Move `Exact details`, `Single operation helper`, and `Machine trace` into one collapsed `Advanced tools` container.
- Keep `Send stepwise p*` and `Send final-only p*`, but only surface them after results exist.

### Module II

- Keep the two-field compare flow visible by default.
- Keep one primary import action near `Calculate error`.
- Move extra imports into `Advanced tools`.
- Keep the result summary visible by default.
- Keep the metric interpretation content, but treat it as a post-result teaching block instead of a competing pre-result section.

### Module III

- Keep the polynomial and x-value inputs as the first interaction.
- Move worked examples into `Advanced tools` or make them a quieter secondary panel.
- Keep the verdict and main comparison visible after calculation.
- Move `Exact details`, method-detail metrics, and `Machine trace` under the same advanced disclosure pattern.

## Copy Changes

### Hero

Current hero copy should become shorter and more practical: one sentence that says what the lab helps students do.

### Labels

Retain `p` and `p*`, but pair them with clearer language in supporting text. For example:
- `Exact value p`
- `Stepwise machine answer p*`
- `Final-only machine answer p*`

### Empty states

Empty states should guide action without repeating the module header. They should answer:
- What should I do first?
- Is there a sample I can try?
- What happens next?

## Interaction and State Changes

### Onboarding

- The quick guide remains available but does not need its own separate hide/show buttons.
- The first successful calculation should continue marking onboarding complete.
- The guide should not disappear in a way that feels irreversible; it should remain available through its own disclosure.

### Advanced tools

- Each module uses one collapsed `Advanced tools` disclosure by default.
- Related secondary sections live inside that disclosure as nested groups or stacked subsections.
- Result-dependent advanced panels stay hidden until relevant results exist.

### Post-result next steps

After a successful calculation, the interface should clearly offer the next logical step:
- send result to Module II
- inspect exact details
- inspect machine trace
- compare methods in Module III

## Error Handling

- Validation and computational error behavior stays as-is.
- Any moved or collapsed sections must keep their current `aria-live`, `role`, and hidden-state behavior.
- Empty-state and import messaging should remain explicit when a prerequisite result is missing.

## Accessibility and Responsiveness

- Preserve tab semantics and disclosure semantics already in place.
- Ensure the simplified layout still exposes all controls to keyboard users.
- Fix the mobile select styling so only one affordance is shown and stacked controls remain legible.
- Keep the main calculate action prominent on small screens.

## Validation

### Functional

- Existing Module I, II, and III calculations must remain unchanged.
- Import flows between modules must still work.
- Onboarding state persistence must still work.

### UX

- First-time users should be able to identify the first action in under a few seconds.
- The first visible module should read as the main task, not as one item among many competing panels.
- Advanced tools should be discoverable without dominating the default layout.

### Mobile

- The main calculator bar, selects, and action buttons should remain usable and visually stable at narrow widths.

## Notes for Implementation

- Prefer reusing the existing `applyExamModeLayout()` disclosure-movement logic in `app.js` instead of introducing a second reorganization system.
- Consolidate advanced panels by restructuring current disclosure creation rather than duplicating panels in HTML.
- Keep CSS changes concentrated in the latest active tuning blocks so the final visual outcome stays predictable.
