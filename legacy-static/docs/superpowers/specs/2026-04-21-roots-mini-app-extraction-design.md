# Roots Mini-App Extraction Design

Date: 2026-04-21

## Summary

Extract the current Root Finding tab into a standalone mini-app inside the same repository so future work on Roots can stay inside a small, focused surface instead of repeatedly touching the calculator shell. Version 1 prioritizes behavioral parity and AI locality over redesign: the mini-app should reproduce the current Roots feature closely enough to replace it confidently, while also making future AI-assisted edits faster and cheaper by shrinking the set of files that usually need to be read.

The selected approach is a modular static mini-app:

- keep plain HTML/CSS/JS
- keep the existing numerical core shared
- add a thin mini-app boundary around the Roots UI
- keep a framework/tooling migration explicitly out of scope for v1

## Goals

- Preserve the current Roots feature behavior closely enough to replace the existing tab with confidence.
- Reduce future AI context cost so most Roots tasks can be handled by reading only mini-app files plus the shared engine path.
- Keep maintenance overhead low by avoiding a second repository and avoiding early duplication of the numerical core.
- Create a clean boundary that can support a larger UX/UI rebuild later without forcing that redesign into v1.

## Non-Goals

- No framework migration in v1.
- No algorithm changes, numerical-correctness changes, or deliberate output reinterpretation in v1.
- No feature reduction in v1; all current Roots capabilities ship in the mini-app.
- No immediate UX rethink in v1 beyond changes needed to support extraction and parity.
- No forking of `root-engine.js` in v1.

## Context

The current Roots feature already has a natural boundary:

- `root-engine.js` holds the method logic
- `root-ui.js` holds most Roots-specific interaction and rendering logic
- the Roots markup is concentrated in the Root Finding panel inside `index.html`
- most Roots styling is clustered in the Root Finding section of `styles.css`

That shape is good enough to support extraction, but the user-facing feature still lives inside large shared files. This makes future AI sessions pay repeated context cost when changing Roots UI, structure, or presentation.

The design should solve that locality problem without paying the larger migration cost of a new repo or framework-based rewrite.

## Selected Approach

### Approach Chosen

Use **Extraction With Modular Cleanup** for v1:

- standalone Roots mini-app inside the current repo
- plain static web stack
- shared engine path through a thin adapter
- cautious rollout with the old tab kept intact until parity is verified

### Why This Approach

This is the best balance of the user's priorities:

1. do not mess up current Roots behavior
2. speed up future AI-assisted edits
3. reduce usage burn from repeated rereads
4. keep maintenance overhead low

### Deferred Approach

Framework/tooling migration remains a possible **phase 2** option after:

- the mini-app exists
- parity is proven
- the main app has switched to the lightweight link/bridge
- future Roots-only UX ambition justifies the migration tax

## Information Architecture

Version 1 introduces a standalone Roots surface inside the repo. The preferred shape is a `roots/` directory with a dedicated entry point and focused supporting files.

Target structure:

- `roots/index.html`
- `roots/roots-app.js`
- `roots/roots-state.js`
- `roots/roots-render.js`
- `roots/roots-engine-adapter.js`
- `roots/roots.css`
- `docs/roots-context.md`

The main calculator remains in place during development. The existing full Roots tab stays active until the mini-app has been verified. After signoff, the calculator's Roots tab becomes a small bridge that links to the standalone mini-app instead of carrying the full Roots UI.

## Component Responsibilities

### `roots/index.html`

- standalone Roots UI shell
- full v1 feature set, including all current methods and output areas
- contains only Roots-specific markup for the mini-app

### `roots/roots-app.js`

- app bootstrap
- startup wiring
- DOM event binding
- method switching
- compute triggers
- top-level coordination between state, adapter, and renderer

### `roots/roots-state.js`

- active method
- current runs by method
- transient UI state
- reset/recompute decisions

### `roots/roots-render.js`

- summary cards
- diagnostics
- iteration tables
- convergence graph
- solution steps
- copy-solution status
- any Roots-only DOM painting logic

### `roots/roots-engine-adapter.js`

- thin wrapper around `root-engine.js`
- method-specific input assembly
- normalized outputs for the renderer/state layer
- angle-mode hookup and other shared-engine integration details

### `roots/roots.css`

- mini-app-specific styling
- extracted Roots styles that no longer need to live in the main global stylesheet

### `docs/roots-context.md`

This file is for future AI sessions, not end users. It should document:

- the mini-app file map
- where to change UI versus behavior
- shared dependencies
- parity constraints
- rules like "edit here, not there"

## Functional Scope

Version 1 carries over the full current Roots feature set:

- Bisection
- Newton-Raphson
- Secant
- False Position
- Fixed Point
- method-specific forms
- stopping modes
- tolerance options
- sign display and decision-basis controls
- iteration tables
- diagnostics
- convergence graph
- solution steps
- copy-solution behavior

No current Roots capability should be intentionally dropped for the sake of extraction.

## Data Flow

The mini-app flow stays simple and explicit:

1. user changes method or inputs
2. `roots-app.js` routes the event
3. `roots-state.js` updates local UI state
4. `roots-engine-adapter.js` builds the correct request for `root-engine.js`
5. `root-engine.js` returns the run result
6. `roots-render.js` paints the summaries, diagnostics, tables, graphs, and steps

The adapter exists to stop raw engine assumptions from leaking across the entire UI. That keeps the mini-app easier to reason about now and creates a cleaner seam for any later phase-2 framework migration.

## Shared Dependencies

The numerical core remains shared in v1. At minimum, the mini-app should continue using the current shared calculation stack where needed, including:

- `root-engine.js`
- `calc-engine.js`
- `math-engine.js`
- `expression-engine.js`

Other shared files may remain shared only if they materially reduce duplication without dragging the mini-app back into the large calculator shell.

The design rule is:

- share the numerical core
- isolate the Roots surface

## Parity Rules

Version 1 is parity-first. The mini-app should preserve the current Roots behavior closely enough that the old tab can be retired after verification.

That includes:

- same method availability
- same required and advanced inputs
- same stopping-mode behavior
- same edge-case handling
- same approximate root and stopping outputs
- same table and graph meaning
- same diagnostic intent

Minor copy cleanup is acceptable only if it does not obscure or reinterpret existing numerical behavior.

## Error Handling

Correctness and trust are more important than polish in v1. The mini-app should preserve current error handling coverage, including cases such as:

- invalid expressions
- bad brackets
- continuity/discontinuity failures
- derivative-zero cases
- secant denominator or stagnation failures
- fixed-point divergence
- tolerance requests that are too small for the browser path
- machine-precision edge cases

Messages may be made clearer if needed, but the extraction should not silently change the underlying behavior that produced them.

## Verification Strategy

Verification should happen at two levels.

### 1. Engine and shared-core confidence

Reuse the current audit path around `root-engine.js` so the extraction does not weaken existing confidence in the numerical engine.

### 2. Mini-app parity confidence

Compare the mini-app against the current Roots tab using the same representative inputs across all five methods.

Minimum signoff coverage:

- one normal case per method
- Bisection and False Position sign-handling coverage
- continuity/discontinuity coverage for bracketed methods
- Newton derivative-zero or unstable-start coverage
- Secant denominator/stagnation coverage
- Fixed Point convergence and divergence coverage
- one or two representative graph/table comparisons

## Rollout Plan

The rollout is intentionally conservative.

### During development

- keep the current full Roots tab in the main calculator
- build the mini-app in parallel
- do not switch the existing tab to a link until parity is verified

### Cutover

After verification:

- replace the main calculator's full Roots tab with a small bridge/link
- keep the main calculator lean
- direct real Roots work to the standalone mini-app

This rollout avoids forcing the new surface into production before it earns trust.

## Success Criteria

Version 1 succeeds only if both conditions are true:

1. the mini-app matches the current Roots feature closely enough to replace it with confidence
2. future AI work on Roots usually stays inside the mini-app files plus the shared engine path

The project is not successful if it preserves behavior but still forces routine Roots work back into the giant shared calculator files. It is also not successful if it shrinks context but introduces meaningful parity regressions.

## Phase 2 Boundary

Framework/tooling migration is allowed later, but only as a separate follow-on project after v1 is stable.

Phase 2 becomes reasonable when one or more of these are true:

- Roots is receiving frequent UX/UI iteration beyond basic maintenance
- the modular static mini-app starts feeling cramped
- the product needs richer stateful interactions
- the team wants component-driven UI work that clearly justifies the tooling cost

If phase 2 happens, it should migrate the mini-app surface, not re-argue the numerical core. The v1 adapter boundary is what makes that future move safer.

## Risks and Mitigations

### Risk: extraction preserves too much existing UI tangle

Mitigation:
- split responsibilities early across app, state, renderer, and adapter files
- keep v1 parity-first without lifting the entire old file structure unchanged

### Risk: parity gaps appear late

Mitigation:
- keep the existing full Roots tab active during development
- define explicit parity scenarios up front
- switch the main tab only after signoff

### Risk: AI locality degrades over time

Mitigation:
- keep a Roots-only file map
- add `docs/roots-context.md`
- use the mini-app boundary as the default place for future Roots UI work

### Risk: pressure to do the framework migration too early

Mitigation:
- keep framework migration explicitly out of scope for v1
- evaluate it only after the mini-app has already delivered parity and locality

## Open Decisions Resolved In This Design

- Keep the main calculator tab after extraction: **yes, as a tiny bridge/link only**
- Match current Roots behavior in v1: **yes**
- Share or copy the engine in v1: **share now through a mini-app adapter**
- Bring over all current Roots functionality in v1: **yes**
- Stack choice for v1: **plain web tech with modular cleanup**
- Rollout style: **keep the old full tab during development, switch only after parity verification**
- v1 success definition: **parity plus AI locality, not one without the other**
