# Tutorial Tab and Advanced Tools Separation Design

## Summary

This pass separates solving from learning. The calculator tabs should stay focused on entering values, reading results, and checking work, while tutorials and guided practice move into a dedicated top-level destination.

## Goals

- Keep `Advanced tools` focused on result verification.
- Move learning and worked-example content out of the calculator workflow.
- Add a dedicated `Tutorial` tab that supports practice without cluttering the calculator tabs.
- Preserve the current result workflow and numerical behavior.

## Non-Goals

- No new math engine or numerical-analysis features.
- No major visual redesign of the whole application.
- No changes to parsing, arithmetic, imports, or result correctness except small tutorial hookups.
- No onboarding overlay layered on top of the calculator.

## Chosen Approach

### Results-first advanced panel with a separate Tutorial tab

Keep Module I, II, and III as solve-and-check surfaces. Restrict `Advanced tools` to verification content only, and move worked examples, practice helpers, and topic teaching into a new top-level `Tutorial` tab.

This was chosen because it gives students a clearer mental model:
- calculator tabs are for completing exam-style tasks
- advanced panels are for checking how the answer was produced
- tutorial content is for learning and practice in its own place

## Information Architecture

### Core tabs

The main tab row becomes:
- `Machine Arithmetic`
- `Error Analysis`
- `Polynomial Methods`
- `Tutorial`

The first three tabs remain calculator-first. The new `Tutorial` tab is a companion learning space rather than a fourth calculator.

### Advanced tools role

`Advanced tools` should become verification-only content.

Inside calculator modules, the content should read like:
- `Check exact form`
- `Check machine trace`
- `Check error metrics`
- `Check imported source`
- `Check method details`

It should no longer contain practice helpers, examples, or learning-oriented mini tools.

## Tutorial Tab Design

### Structure

The `Tutorial` tab should contain three topic areas:
- `Machine arithmetic basics`
- `Error analysis basics`
- `Polynomial method comparison`

Each topic area should include:
- one short plain-English explanation
- one worked example
- one small checklist of what to notice
- one `Send this example to calculator` action

### Experience goals

The tutorial area should feel like a calm companion space:
- simpler and more explanatory than the calculator tabs
- action-oriented, but not dense
- easy to move from learning into the real calculator workflow

### Tutorial actions

Tutorial actions should populate the appropriate calculator tab with a relevant example and then switch the user there.

Examples:
- Machine arithmetic tutorial sends an expression and machine settings into Module I
- Error tutorial sends true value and approximation into Module II
- Polynomial tutorial sends a polynomial example into Module III

These actions should reuse existing example-loading or state-setting paths where possible.

## Module-by-Module Cleanup

### Module I

Current issue:
- `Advanced tools` still contains practice/helper content mixed with checking content.

Planned change:
- keep verification-oriented sections such as exact details and machine trace inside `Advanced tools`
- remove worked examples and practice tooling from the advanced area
- rename headings so students understand they are checking results, not learning a lesson there

Target labels:
- `Check exact form`
- `Check machine trace`

### Module II

Current issue:
- the deeper content is useful, but labels can still sound more technical than necessary.

Planned change:
- keep deeper metrics and source/import context in `Advanced tools`
- rename or regroup them around verification tasks

Target labels:
- `Check error metrics`
- `Check imported source`

### Module III

Current issue:
- the comparison logic is useful, but the advanced area can be easier to scan if it is framed strictly as verification.

Planned change:
- keep method breakdowns and trace content in `Advanced tools`
- present them as result-checking sections rather than exploratory tools

Target labels:
- `Check method details`
- `Check machine trace`

## Content Strategy

### Calculator tabs

Calculator tabs should answer:
- What is the result?
- Is it good enough?
- What should I do next?

### Tutorial tab

Tutorial content should answer:
- What is this topic about?
- What should I notice in this example?
- How do I try it in the calculator?

This keeps explanation and execution separate.

## Interaction Design

- `Advanced tools` stays collapsed by default.
- Opening `Advanced tools` should reveal only result-checking sections.
- `Tutorial` content should be scannable as cards or stacked topic panels.
- `Send this example to calculator` should switch to the appropriate tab automatically.
- Existing result imports and cross-module actions should remain unchanged.

## Accessibility

- The new `Tutorial` tab must be part of the same accessible tab system as the existing modules.
- Verification labels should be clear without relying on color alone.
- Tutorial actions should remain keyboard reachable and announce the destination state through the existing status messaging patterns where possible.

## Validation

### Functional

- Existing Module I, II, and III calculations remain unchanged.
- Existing imports and send actions remain unchanged.
- Tutorial actions populate the correct module inputs and select the correct tab.
- Advanced tools still open and show the expected verification content.

### UX

- Students can tell that `Advanced tools` is for checking results.
- Students can find practice content without opening calculator disclosures.
- The main calculator flow remains calmer than before.

## Notes for Implementation

- Reuse current example-loading helpers if they can be cleanly called from tutorial actions.
- Prefer small label and structure changes over large rewrites.
- Keep the tutorial tab lightweight and content-driven rather than turning it into another utility dashboard.
