# Project Evolution Diff Explorer Design

## Summary

This design proposes a standalone HTML showcase in the workspace root that compares the older modular Numerical Analysis app in `DO NOT OPEN UNLESS SPECIFIED TO DO SO!\Num_analysis - Copy (2)` with the newer root-level teaching lab. The experience should work both as an interactive technical diff explorer and as a polished visual showcase of how the project expanded, consolidated, and changed direction.

## Goals

- Build a standalone comparison site that runs locally with no build step.
- Show what was added, removed, modified, refactored, or expanded between the two app versions.
- Make the comparison feel lively and memorable through layered motion and tactile interactions.
- Keep the experience grounded in real file evidence rather than abstract marketing copy.
- Present the newer app as an evolution in scope and teaching workflow, not just a file listing.

## Non-Goals

- No changes to the calculator applications themselves during this feature.
- No automated AST or git diff parsing engine.
- No React, build pipeline, or third-party animation dependency unless later proven necessary.
- No attempt to turn the explorer into a full source-code viewer.

## Chosen Approach

### Forensics Desk

Create a single-page technical editorial experience that combines:
- a dramatic hero and animated change summary
- a structured diff explorer with filters
- a showcase layer that tells the story of the project’s evolution
- an evidence drawer with specific file comparisons

This approach was chosen because it best balances utility and visual impact:
- it supports real exploration of change categories
- it creates strong presentation moments for animation and storytelling
- it fits the repo’s current plain HTML, CSS, and JavaScript setup

## Source Context

### Older app shape

The older version is a modular app rooted at `DO NOT OPEN UNLESS SPECIFIED TO DO SO!\Num_analysis - Copy (2)` with:
- `index.html`
- a `css/` folder split into `variables.css`, `base.css`, `animations.css`, `layout.css`, and `components.css`
- a `js/modules/` folder for calculator, error analysis, polynomial, IEEE-754, and state logic
- a `js/ui/` folder for UI rendering and utilities

### Newer app shape

The newer version lives in the workspace root and is centered around:
- `index.html`
- `styles.css`
- `app.js`
- supporting engine files such as `calc-engine.js`, `expression-engine.js`, `math-engine.js`, `math-display.js`, and `poly-engine.js`

### High-level evolution themes

- The modular folder structure was consolidated into a flatter root-level app shell.
- The newer version appears broader in teaching scope and exam workflow support.
- The visual language shifted from the older `Spatial Quasar` presentation to a lighter teaching-lab identity.
- Supporting outputs, screenshots, docs, and helper scripts now exist around the main app, indicating a more mature project workflow.

## Design Principles

### Show evidence, then style it

Every high-level claim should be supported by a concrete file comparison or grouped change summary.

### Make technical structure feel readable

The explorer should help users scan project evolution quickly without reading raw diffs.

### Motion should clarify state

Animations should reveal hierarchy, focus, and progression rather than act as decoration alone.

### Avoid generic dashboard patterns

The page should use an asymmetrical, editorial technical layout instead of repeating equal cards or bland metric blocks.

## Visual Direction

### Tone

Technical editorial with strong motion and a premium, forensic feel.

### Palette

- warm off-white background
- charcoal and tinted neutral text
- one restrained moss-green accent inspired by the newer project identity

### Typography

- distinctive sans-serif pairing suited to technical UI
- strong left-aligned hierarchy
- monospace reserved for paths, counts, and file evidence

### Layout

- asymmetrical hero
- mixed-width grid sections
- pronounced negative space on desktop
- strict single-column collapse on mobile

## Information Architecture

### Hero / Diff Console

Purpose:
- establish the transformation narrative
- show animated totals for `Added`, `Removed`, `Modified`, `Refactored`, and `Expanded Scope`
- provide a scrub or toggle between old and new structure emphasis

### Change Explorer

Purpose:
- let users filter change records by category
- reveal grouped file evidence on selection
- connect summary metrics to detailed entries

Core categories:
- Added
- Removed
- Modified
- Refactored
- Expanded Scope

### Evolution Stories

Purpose:
- explain why the project changed, not only what changed
- turn file movement into understandable shifts in design, teaching workflow, and architecture

Planned stories:
- shell and navigation evolution
- module and workflow expansion
- architecture consolidation
- project-maturity signals such as docs, screenshots, and scripts

### Architecture Lens

Purpose:
- visualize how the older `css/`, `js/modules/`, and `js/ui/` system relates to the newer flatter root app
- communicate consolidation and redirection of responsibilities

### Evidence Drawer

Purpose:
- keep exact paths and mapped comparisons accessible without cluttering the main layout
- provide a trustworthy “show me the proof” panel for each highlighted change

## Interaction Model

### Hero interactions

- staggered reveal of summary text and counters
- animated structure map with pulse or connector-line highlights
- hover and focus states that spotlight associated file groups

### Explorer interactions

- category chips or segmented controls filter the comparison dataset
- rows expand inline with a short explanation
- selected records sync with the evidence drawer

### Story interactions

- scroll-triggered reveals for evolution narratives
- layered transitions between old and new interface themes
- subtle parallax or drift on supporting visual elements

### Drawer interactions

- opens from an explicit button or record selection
- keyboard reachable and dismissible
- preserves context by showing change type, old path, new path if present, and explanation

## Data Model

Use a curated JavaScript data structure rather than generated diffs.

Each entry should include:
- stable id
- change type
- category
- old path
- new path when applicable
- short title
- explanation
- optional story tags such as `layout`, `workflow`, `architecture`, or `supporting-assets`

This gives enough structure for:
- animated counters
- filtered explorer lists
- story highlights
- evidence drawer population

## States

### Loading

Use skeleton blocks and staged reveal timing during initial page load.

### Empty

If a filter has no matching records, show a polished empty state with guidance to reset or choose another category.

### Focused selection

Selected categories and records should visibly lock in with stronger contrast, motion pause on unrelated items, and synchronized evidence details.

### Fallback

If a dataset group is missing, render a compact inline notice rather than breaking layout.

## Accessibility

- Preserve strong color contrast for all counts and filters.
- Ensure every interactive control is keyboard reachable.
- Do not rely on color alone for change types; pair labels with text and shape.
- Respect reduced-motion preferences by simplifying or disabling non-essential animation loops.
- Keep the evidence drawer and expanded rows usable with screen readers.

## Responsiveness

- Desktop uses the full asymmetrical composition.
- Tablet simplifies the hero layout and stacks supporting panels.
- Mobile collapses to a strict one-column rhythm with preserved filtering and drawer access.
- No horizontal scrolling for core content.

## Technical Approach

### Stack

- HTML
- CSS
- vanilla JavaScript

### File strategy

Create a standalone comparison site in the workspace root with dedicated assets rather than mixing the feature into the calculator app files.

Preferred deliverables:
- `project-evolution-explorer.html`
- `project-evolution-explorer.css`
- `project-evolution-explorer.js`

### Animation strategy

- CSS keyframes and transitions for most motion
- lightweight JavaScript for counters, filtering, synchronized highlights, and drawer state
- no unnecessary libraries

## Validation

### Functional

- The explorer page loads locally as a standalone HTML artifact.
- Category filtering updates metrics and visible records correctly.
- The evidence drawer opens with the correct mapped data.
- All change summaries correspond to the curated dataset.

### UX

- Users can understand the overall project evolution within a few seconds.
- Users can inspect specific added, removed, modified, or refactored items without confusion.
- The experience feels both technically credible and visually memorable.

### Responsive

- The page remains readable and interactive on mobile widths.
- Motion and layout stay stable during resize and orientation changes.

## Notes For Implementation

- Keep the dataset intentionally small and curated; do not dump every file in the repository.
- Favor grouped comparisons and story-worthy changes over noisy one-file trivia.
- Reuse the approved `Forensics Desk` direction consistently across layout, copy, and motion.
- Keep the site separate from the calculator runtime so it is easy to open, review, and share.
