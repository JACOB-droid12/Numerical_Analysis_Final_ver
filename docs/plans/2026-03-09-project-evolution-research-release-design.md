# Project Evolution Research Release Design

## Summary

This design reframes the standalone explorer as a dark-mode AI-lab release microsite that compares the older modular Numerical Analysis app in `DO NOT OPEN UNLESS SPECIFIED TO DO SO!\Num_analysis - Copy (2)` with the newer root-level teaching-lab build. The page should feel like a premium model launch: restrained shell, cinematic motion, one disciplined accent, and a live comparison engine that proves the product evolution rather than merely listing files.

## Goals

- Build a standalone comparison app that is visually separate from the calculator.
- Present the project evolution with the feel of a modern AI model release page.
- Keep the experience grounded in real comparison data for added, removed, modified, refactored, and expanded areas.
- Use dark mode as the native presentation, with premium contrast and motion instead of generic neon effects.
- Make the comparison engine the signature interactive element while preserving a usable technical explorer.

## Non-Goals

- No reuse of the calculator app's visual system, layout language, or color identity.
- No full source diff viewer or AST parser.
- No migration to React or a new build system for this feature.
- No implementation changes to the calculator itself as part of this redesign.

## Chosen Approach

### Research Release

Create a standalone dark-mode launch page that combines:
- a model-release style hero with a live comparison engine
- a proof band of benchmark-like change modules
- a deep interactive change explorer
- narrative capability stories that explain the evolution
- a persistent evidence drawer for exact file-level proof

This approach was chosen because it best matches current AI lab release pages while still supporting real exploration of project changes.

## Inspiration Context

The approved direction draws from official AI lab release and model pages reviewed on March 9, 2026:
- OpenAI's March 5, 2026 GPT-5.4 page for launch confidence, modular proof blocks, and restrained chrome
- Anthropic's Opus model page for editorial calm and hierarchy
- Google's February 19, 2026 Gemini 3.1 Pro pages for demo energy and systems framing

Shared qualities to preserve:
- large but controlled left-aligned typography
- heavy use of negative space
- one accent color
- premium dark surfaces instead of pure black
- one central "proof" area that feels alive

## Design Controls

Use the approved `design-taste-frontend` overrides as the governing visual rules for this redesign:
- `DESIGN_VARIANCE: 9`
- `MOTION_INTENSITY: 9`
- `VISUAL_DENSITY: 4`

Implications:
- aggressive asymmetry on desktop with strict mobile collapse
- high choreography, but concentrated in meaningful sections
- low-to-medium density so the page reads like a release microsite rather than a cockpit

## Visual Direction

### Tone

Dark-mode AI research launch at midnight: precise, confident, and cinematic without looking like a gaming dashboard.

### Palette

- deep graphite and layered near-black surfaces
- softened warm-white text and steel-gray metadata
- one restrained accent, likely mineral cyan or muted acid-lime

Rules:
- no pure black
- no purple or blue-glow AI cliches
- no rainbow gradients
- no over-saturated neon

### Typography

- premium sans-serif for display and interface text
- mono numerics and file evidence for technical credibility
- oversized but disciplined headlines, always left aligned

### Material Language

- long slabs and inset panels instead of equal cards
- hairline separators and inner borders for depth
- subtle tinted shadows and refraction-style edges rather than outer glows

## Experience Shape

The page should feel like a product release first, then unfold into a technical explorer. The first screen establishes the launch framing and active comparison engine. Lower sections transition from proof modules into explorer interactions, then into narrative capability stories and a more analytical architecture lens.

The core emotional arc should be:
- announcement
- proof
- inspection
- interpretation

## Information Architecture

### Launch Hero

Purpose:
- announce the project evolution like a new model release
- summarize the shift from the older modular app to the expanded root-level version
- anchor the page with the animated comparison engine

Structure:
- left: release framing, thesis, summary text, compact metric lead-in
- right: comparison engine with moving rails, connected nodes, animated deltas, and layered panes

### Proof Band

Purpose:
- present core change dimensions like benchmark modules
- surface the most important counts and claims immediately below the hero

Candidate modules:
- added systems
- removed paths
- rewired structure
- expanded teaching surface

### Interactive Change Explorer

Purpose:
- let users filter the dataset by change type or theme
- reveal detailed evidence rows with exact paths and short summaries
- sync all exploration states with the evidence drawer

### Capability Stories

Purpose:
- explain what the changes mean in product terms
- translate file evolution into changes in scope, workflow, maturity, and teaching support

### Architecture Lens

Purpose:
- visualize the relationship between the older modular structure and the newer flatter root-level structure
- slow the pace slightly and provide a more technical reading mode

### Persistent Evidence Drawer

Purpose:
- keep exact file evidence visible and trustworthy
- follow the user's current focus without forcing them into a separate page

## Motion Strategy

The motion system should feel choreographed like an AI release page, not decorative. It should rely on transforms and opacity, with one signature animated centerpiece: the hero comparison engine.

### Hero Motion

- drifting nodes and active signal rails
- deltas and counters easing into place
- connection lines brightening as focus changes
- layered reveal sequence on load

### Section Motion

- proof modules slide and resolve like benchmark slabs entering a stage
- explorer filters trigger smooth re-layout and focus locking
- evidence rows expand with shared continuity
- architecture lines progressively illuminate as the user scrolls

### Mobile And Reduced Motion

- collapse asymmetry to a single column on small screens
- reduce or remove ambient perpetual motion
- preserve clarity with opacity transitions and static hierarchy for reduced-motion users

## Interaction Model

### Filters And Selection

- type filters should feel like precise mode switches, not standard pill buttons
- active states need stronger contrast, subtle compression, and directional feedback
- changing filters should update counts, visible evidence, and the drawer context

### Evidence Rows

- rows expand inline with attached motion rather than detached overlays
- each row should expose old path, new path if present, change type, and concise interpretation

### Drawer Behavior

- the drawer should remain anchored and update as focus moves
- direct section interactions should be able to open or retarget it
- keyboard access and dismissibility remain mandatory

## Data Model

Use a curated JavaScript dataset as the source of truth. Each comparison record should include:
- `id`
- `type`
- `theme`
- `oldPath`
- `newPath`
- `title`
- `summary`
- `storyTags`
- optional `metrics` or `signals` for proof-band rendering

Derived views should power:
- headline counters
- proof modules
- explorer lists
- capability stories
- drawer contents
- architecture highlights

## States

### Loading

Stage the first render with structured placeholders and delayed activation of the engine.

### Empty

If a filter yields no results, show a designed empty state such as "No matching mutations in this slice."

### Focus

When a record or story is active, unrelated elements should quiet down while the active cluster brightens and the drawer updates.

### Fallback

Missing comparison data should collapse sections gracefully instead of leaving dead containers.

## Accessibility

- maintain strong contrast in dark mode
- do not rely on accent color alone to communicate meaning
- support keyboard navigation across filters, rows, and drawer actions
- honor `prefers-reduced-motion`
- keep file paths and summaries screen-reader readable

## Responsiveness

- desktop uses the full asymmetric launch-page composition
- tablet compresses the hero while preserving the proof band
- mobile collapses into a strict single-column release narrative with a compact engine
- no horizontal scrolling for primary content

## Technical Approach

### Stack

- HTML
- CSS
- vanilla JavaScript

### Deliverables

- `project-evolution-explorer.html`
- `project-evolution-explorer.css`
- `project-evolution-explorer.js`
- `scripts/check-project-evolution-explorer.ps1`

### Implementation Boundaries

- keep the explorer standalone in the workspace root
- avoid third-party animation libraries unless a later plan explicitly justifies them
- keep the comparison data curated and local

## Validation

### Functional

- the standalone page loads locally
- proof metrics match the curated dataset
- filtering, story focus, and drawer updates stay in sync
- the architecture lens reflects the mapped old-to-new groupings

### Experiential

- the page feels clearly separate from the calculator's design
- the hero reads like an AI model release page
- motion feels premium and intentional rather than noisy
- mobile and reduced-motion modes remain polished
