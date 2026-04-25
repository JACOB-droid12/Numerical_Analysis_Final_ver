# Roots React Launchpad Redesign Design

Date: 2026-04-23  
Status: Approved design, pending user review before implementation planning

## Purpose

Redesign the `roots-react/` pilot into a more modern, future-ready Roots workbench without changing the underlying numerical engine behavior. This phase is not a legacy visual-clone pass. It is a product and interaction redesign that keeps the current React architecture, preserves the answer-first solving flow, and makes room for future work such as method comparison.

The existing static calculator and `roots/` mini-app remain intact as backup. The redesign applies only to the isolated React pilot under `roots-react/`.

## Context

The current pilot already provides:

- isolated Vite + React + TypeScript + Tailwind setup
- typed adapter around the legacy `RootEngine`
- answer panel, evidence panel, graph, steps, and iteration table
- smoke-tested support for Bisection, Newton-Raphson, Secant, False Position, and Fixed Point
- angle mode support

What it does not yet provide is a deliberate product identity. It currently looks like a functional migration scaffold rather than a designed Roots workbench.

This redesign defines the next phase of the pilot so that the UI feels intentional, faster to use, and easier to extend.

## Approved Product Decisions

The following decisions were explicitly chosen during brainstorming:

- The redesign should favor **future growth**, not legacy visual parity.
- The chosen overall direction is **Approach 1: Balanced Launchpad**.
- The product should remain **fast-answer first**.
- After a successful run, the main next action should be **Copy answer**.
- A **compact confidence check** should sit directly beside the answer.
- Full evidence should appear as a **preview first**, then expand into full detail.
- The first future-growth feature to make room for is **method comparison**.
- Method comparison should begin as a **secondary action after a run**, not a permanent split-screen mode.
- The product should target a **mixed audience**:
  - quick-answer users
  - learners who may inspect the evidence
  - future deeper-study users
- Before first run, the main screen should feel **balanced**, not dominated by either the method selector or the expression form.

## Goals

- Make the React pilot feel like a real Roots product rather than a migration demo.
- Preserve the current answer-first workflow while making the answer region more useful and more trustworthy.
- Keep the solve flow visually calm before run and visually decisive after run.
- Separate fast-answer concerns from full-evidence concerns.
- Prepare the layout and state model for a future compare-methods feature.
- Keep the UI legible, predictable, and agent-friendly for future edits.

## Non-Goals

- Do not rewrite numerical logic.
- Do not replace the legacy engine adapter.
- Do not modify the legacy static calculator or `roots/` app.
- Do not implement full method comparison in this phase.
- Do not add GSAP, shadcn/ui, Vercel deployment work, or TypeScript conversion of the numerical engine in this design phase.
- Do not attempt a pixel-for-pixel recreation of `roots/roots.css`.

## Design Principles

1. **Balanced before run, decisive after run**  
   Before the first run, the screen should look prepared rather than empty. After a run, the answer should become the strongest visual anchor.

2. **Answer first, confidence second, evidence third**  
   The page should always make it obvious what the approximate answer is, how trustworthy it is in compact form, and where to expand into deeper evidence.

3. **Modern workbench, not marketing page**  
   The redesign should feel like a quiet numerical tool. Avoid hero-page patterns, oversized decorative surfaces, or ornamental layout tricks.

4. **Future-ready without future overload**  
   The redesign should make room for comparison and richer workflows later, without crowding the primary solve flow now.

5. **Clear state honesty**  
   When an answer is stale, partial, invalid, or unavailable, the UI must say so directly rather than silently implying the result is current.

## Screen Architecture

The redesign uses a **Balanced Launchpad** layout.

### Before Run

The main screen is composed of two primary regions:

- **Solve workspace**
  - method selection
  - expression and method-specific inputs
  - run action
- **Result-side region**
  - quiet answer placeholder
  - reserved confidence area
  - evidence preview placeholder
  - reserved comparison entry area

The answer region must already be visible before run so the user understands where the result will appear. However, it should not visually overpower the solve workspace before there is a result to show.

### After Run

After a successful run:

- the result-side region becomes the visual anchor
- the answer is large and easy to scan
- `Copy answer` becomes the most obvious next action
- a compact confidence cluster appears beside or immediately adjacent to the answer
- an evidence preview appears below
- a `Compare methods` entry action becomes available without dominating the page

### Mobile / Narrow Width Behavior

On smaller screens, the same model should hold in a vertical stack:

1. header / lightweight page controls
2. solve workspace
3. answer anchor
4. compact confidence summary
5. evidence preview
6. compare entry action

The mobile layout should preserve the same priority order rather than inventing a separate interaction model.

## Interaction Model

### Solve Flow

The normal user path is:

1. choose a method
2. enter or adjust the problem
3. run
4. read the answer
5. copy the answer
6. optionally inspect confidence
7. optionally inspect evidence
8. optionally branch into compare methods later

### Run Behavior

Run should remain a single explicit action. The app should not auto-run in response to form edits.

During execution:

- show a local loading state near the run control and status area
- avoid full-screen blocking transitions
- keep the rest of the screen stable

After success:

- promote the answer anchor visually
- keep confidence compact
- preview evidence instead of dumping all detail immediately

### Evidence Behavior

Evidence should have two layers:

- **preview layer**
  - small graph preview
  - one concise diagnostic summary or status row
- **detail layer**
  - full diagnostics
  - solution steps
  - iteration table

The detail layer should open intentionally through `Show full work` or equivalent language.

### Compare Entry Behavior

`Compare methods` should appear only after the user has a successful run. This avoids cluttering the default experience and makes comparison feel like a natural second-step action instead of a mandatory mode.

This phase only reserves the placement, wording, and state handoff for that action. It does not implement the full comparison workspace.

## Component and Responsibility Boundaries

The redesign should continue to use narrow, explicit component boundaries.

### Launchpad Shell

Responsibilities:

- overall page layout
- before-run vs after-run presentation emphasis
- responsive region placement

Should not own numerical logic.

### Solve Workspace

Responsibilities:

- method selector
- method-specific form
- run control
- stale-state messaging tied to edits

Should not own answer rendering.

### Answer Anchor

Responsibilities:

- approximate root display
- primary copy action
- compact answer status message
- immediate post-run trust cues

This is the visual anchor after a successful run.

### Confidence Summary

Responsibilities:

- stop reason
- residual / error / bound
- machine/exact or basis summary when relevant

This should remain compact and scannable rather than verbose.

### Evidence Preview

Responsibilities:

- small graph preview
- concise diagnostics preview
- `Show full work`

It should reassure the user that the result is supported without forcing a deep read.

### Evidence Detail

Responsibilities:

- complete diagnostics
- full solution steps
- iteration table

This layer can remain denser because it is explicitly requested.

### Comparison Entry

Responsibilities:

- expose the secondary `Compare methods` action
- carry enough normalized context to support a future comparison workspace

It should not yet introduce multi-run state complexity into the main screen.

### Legacy Engine Adapter

Responsibilities:

- continue to translate UI input into `window.RootEngine` calls
- remain the only path between React UI and legacy engine behavior

This redesign does not alter that contract.

## State Model and Data Flow

The current hook-based coordinator should remain the central orchestration layer, but the redesign should make result freshness more explicit.

### Required State Concepts

- **draft input state**: the currently visible form inputs
- **last successful run**: the most recent successful result object and its originating request snapshot
- **freshness state**:
  - `current`
  - `stale`
  - `loading`
  - `error`
- **evidence expansion state**
- **compare entry availability**

### Freshness Rules

If the user changes:

- a form input
- the active method
- angle mode

after a successful run, the displayed answer should become **stale**.

Stale means:

- the previous answer can remain visible for continuity
- the UI must clearly mark it as outdated
- rerun becomes the obvious required next action
- confidence and evidence should also visually reflect that stale status

The redesign should not silently present stale results as current.

### Request Snapshot

The UI should preserve the request that produced the last successful result. This is necessary for:

- trustworthy stale-state signaling
- future compare-method entry
- preserving the previous answer while edits are in progress

## Error Handling

Error behavior should be quiet, specific, and recoverable.

### Validation / Missing Input Errors

- keep the user in the solve workspace
- show the issue near the field or in a compact run status message
- do not destroy the last valid result just because the current draft is incomplete

### Engine / Loader Failure

- show a compact but explicit error in the answer/status region
- disable or hide misleading success actions like `Copy answer`
- keep the form visible so the app still feels recoverable

### Partial Evidence Availability

If a graph, steps, or table is unavailable for a given result:

- degrade that evidence slice gracefully
- keep the answer path complete
- avoid blank shells that look like broken UI

## Visual Direction

The redesign should look more deliberate and more modern than the current pilot, but it should still read as a utilitarian numerical tool.

### Desired Visual Character

- quiet and work-focused
- cleaner hierarchy than the current pilot
- stronger emphasis on the answer after run
- restrained use of accent color for actions and confidence states
- no landing-page framing, oversized banners, or decorative hero devices

### Visual Hierarchy

- before run: workspace and result region are balanced
- after run: answer anchor is strongest
- confidence summary is secondary but nearby
- evidence preview is tertiary
- full evidence is intentionally denser and lower in the hierarchy

## Verification Strategy

This redesign must be validated at both the engine and UI levels.

### Deterministic Validation

Run:

- `node scripts/engine-correctness-audit.js`
- `node scripts/root-engine-audit.js`

These confirm that the untouched legacy numerical behavior still passes its established checks.

### React Verification

Run in `roots-react/`:

- `npm run sync:legacy`
- `npm run typecheck`
- `npm run build`

### Browser Verification

Smoke-test:

- Bisection
- Newton-Raphson
- Secant
- False Position
- Fixed Point
- angle-mode rerun behavior

Also verify:

- `Copy answer` remains the primary post-run action
- compact confidence is visible beside the answer
- evidence preview appears before full evidence expansion
- stale-state signaling appears when inputs, method, or angle mode change after a run
- `Compare methods` entry appears only after a successful run

## Scope for the Next Implementation Plan

The next implementation plan should focus on:

- redesigning the main `roots-react` screen to match the Balanced Launchpad model
- updating the answer and confidence presentation
- converting evidence from full-detail-first to preview-then-expand
- making stale-state signaling explicit and trustworthy
- adding the comparison entry point as a secondary action after a successful run

It should not expand into:

- full compare-mode implementation
- legacy UI synchronization
- numerical engine refactors
- deployment work

## Summary

This phase turns the React pilot from a migration scaffold into a deliberate Roots product:

- balanced before run
- answer-anchored after run
- copy-first post-run behavior
- compact trust cues
- preview-first evidence
- future-ready comparison path

The numerical behavior remains rooted in the existing engine adapter. The redesign work is about product clarity, state honesty, and extensibility rather than mathematical rewrites.
