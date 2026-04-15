# Root Presets And Diagnostics Design

Date: 2026-04-15
Project: Numerical Analysis Teaching Lab
Status: Draft for user review

## Summary

This design defines the first feature-addition phase for the Root Finding Workbench: shared and method-specific presets plus richer final diagnostics.

The goal is to make the root module feel more like a guided teaching workbench without changing its existing tabbed structure. Students should be able to load standard examples quickly, see method-specific edge cases, and read more meaningful end-of-run diagnostics without opening the iteration table first.

This phase is intentionally the foundation for later work. It prepares shared preset data and summary formatting that later phases can reuse for visual tools and side-by-side method comparison.

## Phase Order

The agreed feature roadmap is:

1. Presets plus richer diagnostics
2. Visuals plus helper tools
3. Compare Methods

This document covers only phase 1.

## Goals

- Add worked-example presets to the root module without disrupting the current tabbed workflow.
- Support both shared problem presets and method-specific teaching presets.
- Keep the top result area compact while exposing more useful summary values.
- Add a fuller diagnostics panel that explains what the numerical results do and do not guarantee.
- Preserve mathematically honest wording, especially for open methods where the last-step error is not a proof of true root error.
- Build the preset and diagnostics structure in a way that later phases can reuse.

## Non-Goals

- No side-by-side Compare Methods screen in this phase.
- No function geometry plots, tangents, chords, cobweb diagrams, or bracket-scanning tools in this phase.
- No redesign of the root module into a problem-first or scenario-first interface.
- No major layout rewrite of the existing result table, convergence graph, or method tabs.
- No new solver methods.

## Current Context

The current root module already has:

- five method tabs: Bisection, Newton-Raphson, Secant, False Position, and Fixed Point
- a tab-specific input area per method
- a result stage with three summary cards
- a bracket-status area for bracket methods
- a convergence graph
- solution-step text
- an iteration table

The current UI is method-driven and stable enough that this phase should layer on teaching aids rather than reshape the flow.

## Decisions Made

The following decisions were validated during brainstorming:

- Presets should include both shared problem presets and method-specific presets.
- Preset application should use hybrid behavior:
  - first use applies the canonical worked-example setup
  - later reuse preserves the student's current machine and stopping settings
- Richer diagnostics should use a split presentation:
  - key values always visible at the top
  - fuller interpretation in a diagnostics panel below
- Guarantee wording should be strict and method-aware.
- The preset UI should use visible chips plus a More affordance rather than a large dedicated panel.
- Preset execution should use hybrid behavior:
  - common demo presets auto-run
  - failure-case presets fill fields only
- Presets should use name plus short tag text.
- Shared presets should live above the method tabs, with method-local presets inside each tab.
- The overall implementation approach should be a structured teaching layer rather than a minimal patch or large interface rewrite.
- The two always-visible extra summary values should be Final residual and Last-step error.

## Feature Scope

### 1. Shared Problem Presets

Add a global preset strip above the method tabs.

These presets represent reusable root-finding problems that are meaningful across compatible methods. Initial shared examples:

- `sqrt(2)` with a short tag such as `classic`
- `e^(-x)-x` with a short tag such as `transcendental`
- `sin(x)-x/2` with a short tag such as `oscillatory`

Behavior:

- Shared presets may populate Bisection, Newton-Raphson, Secant, and False Position.
- Shared presets do not apply to Fixed Point unless a separate `g(x)` form is explicitly defined for that preset.
- Selecting a shared preset should populate the currently active compatible method tab.
- If the active tab is incompatible, the UI should either disable that preset visually or show it as unavailable for that tab; it should not try to guess a transformation.

### 2. Method-Specific Presets

Add a smaller preset strip inside each method tab near the existing input hint and configuration area.

Initial method-specific examples:

- Newton-Raphson: `bad starting point`
- Secant: `stagnation`
- False Position: `slow convergence`
- Fixed Point: `diverges`

Behavior:

- These presets are local to their method tab and do not appear globally.
- They are designed to teach failure modes or non-ideal behavior.
- They default to fill-only interaction so students can inspect the setup before running it.

### 3. Preset Registry

Presets should not be hardcoded directly into button click handlers. Instead, define a small preset registry in UI-owned data.

Each preset entry should contain:

- `id`
- `label`
- `tag`
- `scope`: `shared` or `method`
- `methods`: compatible method list
- `runMode`: `autorun` or `fill`
- `payload`:
  - `expression` for `f(x)` methods
  - `dfExpression` for Newton when needed
  - `gExpression` for Fixed Point when needed
  - interval values or starting values
  - canonical machine settings
  - canonical stopping settings
  - advanced sign settings when relevant

This registry becomes the single source of truth for:

- chip rendering
- compatibility filtering
- preset descriptions/tags
- field population behavior

## Preset Application Rules

Preset application uses the agreed hybrid behavior.

### First use

When a preset is used for the first time in the current UI session, apply its full canonical setup:

- expression or `g(x)`
- derivative when needed
- interval or starting values
- machine rule
- significant digits
- stopping kind and value
- advanced sign options when relevant

This makes the preset behave like a true worked example.

### Reuse

When a preset is used again after the student has already been working in the module, preserve the student's current numerical settings:

- machine rule
- significant digits
- stopping kind
- stopping value
- advanced sign options when relevant

The preset should still replace the problem definition itself:

- expression or `g(x)`
- derivative when needed
- interval or starting values

This keeps presets helpful without repeatedly overwriting the student's current precision experiment.

### Autorun vs fill-only

- Demo presets use `autorun`.
- Failure-case presets use `fill`.

This distinction is part of the preset data, not inferred from naming alone.

## Diagnostics Design

### Top summary cards

Expand the result-stage summary from three cards to five:

- Approximate root
- Stopping result
- Stopping parameters
- Final residual
- Last-step error

Definitions:

- For Bisection, Newton-Raphson, Secant, and False Position, Final residual means `|f(x*)|`.
- For Fixed Point, Final residual means `|g(x*) - x*|`.
- Last-step error means the absolute successive-difference value from the final iteration.

These values should remain concise, always visible, and readable without opening the lower panels.

### Final diagnostics panel

Add a new diagnostics panel below the summary area and above the solution steps.

This panel should include:

- Final residual
- Residual basis
- Approximate relative error
- Successive-difference error
- Bound or guarantee value when available
- What this guarantees

This panel is where the workbench becomes classroom-ready rather than calculator-only.

## Diagnostics Semantics

### Residual basis

Expose where the residual came from:

- `exact`
- `reference`
- `machine`
- `unavailable`

The UI should display the value and its basis together in a student-readable form.

### Approximate relative error

Show approximate relative error when the denominator is meaningful.

If the approximation is zero or too close to zero for a stable relative measure:

- display `—`
- include a short note that relative error is not reliable near zero

### Successive-difference error

Show the final successive-difference measure separately even when it matches the headline last-step error. The top card is for quick reading; the diagnostics panel is for interpretation and context.

### Bound or guarantee value

Only show a true guarantee when the method supports it.

- Bisection: show the bracket-width-derived bound.
- False Position: do not present the last-step change as a guaranteed root-error bound.
- Newton-Raphson: no guaranteed root-error bound from the final step alone.
- Secant: no guaranteed root-error bound from the final step alone.
- Fixed Point: no guaranteed convergence or root-error bound from the final step alone.

## Guarantee Text

The `What this guarantees` text must be strict and method-aware.

### Bisection

Explain that:

- the interval still brackets a root when the run remains valid
- the reported bound comes from the interval width
- the bracket guarantee is the core mathematical guarantee for this method

### False Position

Explain that:

- the method still uses bracket logic when the setup remains valid
- the final step size is not itself a guaranteed root-error bound
- the residual and step size are useful evidence, not a replacement for a proof-quality bound

### Newton-Raphson and Secant

Explain that:

- a small residual and small step size suggest convergence
- these values do not by themselves prove the true root error
- special stop conditions such as derivative-zero or stagnation limit what can be concluded

### Fixed Point

Explain that:

- a small step and small fixed-point residual may suggest settling
- convergence is not guaranteed unless contraction conditions hold near the fixed point
- divergence or safety-cap exhaustion means the current setup is not behaving like a successful contraction

## UI Placement

### Global preset strip

Place the shared preset chips above the method tabs so they read as problem-level examples.

This area should stay compact:

- 2 to 4 visible chips
- one `More` control for overflow

### Method-local preset strip

Place method-specific preset chips inside the active tab near the current input hint and configuration area.

This keeps edge-case examples close to the method they teach.

### Diagnostics panel placement

Place the new Final diagnostics panel:

- below the summary cards
- below the bracket-status panel when present
- above the convergence graph and solution steps, or directly above the solution steps depending on available space

Preferred order for this phase:

1. Summary cards
2. Bracket panel when relevant
3. Final diagnostics panel
4. Convergence graph
5. Rate summary
6. Solution steps
7. Iteration table

This keeps final interpretation visible before the student reaches the detailed table.

## Engine And UI Responsibilities

The engine should own numerical facts.

Expected engine-facing data for this phase:

- final residual value
- residual basis
- final successive-difference or last-step error
- approximate relative error when meaningful
- bound value when meaningful
- stop reason and stop metadata

The UI should own:

- preset registry
- chip rendering
- preset compatibility filtering
- first-use vs reuse behavior
- top-summary rendering
- diagnostics wording and formatting

The UI should not derive new numerical facts by re-solving the method in ad hoc ways.

## Error And Edge-Case Handling

- Invalid bracket runs should show diagnostics as unavailable rather than showing fake zeros.
- Diverged runs should show explanatory diagnostics, not misleading residual summaries.
- Stagnation and derivative-zero runs should preserve whatever final diagnostic values remain meaningful and clearly explain the stop.
- Fixed Point runs that hit the safety cap should explicitly say tolerance was not reached.
- Shared presets that do not apply to the active method should never silently mutate into another form.

## Testing Strategy

### Engine checks

Add or extend audit coverage only where summary fields change:

- residual output
- residual basis
- last-step error
- approximate relative error availability behavior
- guarantee or bound field behavior

### UI checks

Add focused checks for:

- shared preset application
- method-specific preset application
- autorun vs fill-only behavior
- first-use full setup behavior
- reuse preserves current numerical settings
- diagnostics panel visibility on:
  - successful run
  - invalid bracket
  - derivative-zero
  - stagnation
  - divergence
  - iteration-cap exhaustion

This phase does not require a large browser-automation suite, but it should have enough coverage to keep preset and diagnostics behavior stable.

## Implementation Boundaries

This phase should avoid leaking into later roadmap items.

Do not add in this implementation:

- side-by-side comparison tables or a Compare Methods screen
- function plots with bracket markers, chords, tangents, or cobwebs
- interval scanning or starting-point suggestion tools

Those belong to later phases and should build on the preset and diagnostics structures created here.

## Follow-On Phases

The design should leave clean hooks for the next two phases.

### Phase 2: Visuals plus helper tools

Planned scope:

- function graph overlays
- brackets and midpoints
- false-position chords
- Newton tangents
- secant lines
- fixed-point `y = g(x)` with `y = x`
- bracket scan and starting-point guidance

### Phase 3: Compare Methods

Planned scope:

- one shared problem setup
- compatible methods run side by side
- final approximation
- iterations
- final residual
- error trend
- stop reason

The preset registry and shared diagnostics contract from phase 1 should be reusable here.

## Self-Review

- No placeholders remain.
- Scope is limited to presets and richer diagnostics.
- The design keeps the current tabbed root module intact.
- Preset behavior, diagnostics layout, and guarantee wording are explicit.
- Later phases remain clearly separated rather than partially mixed into this one.
