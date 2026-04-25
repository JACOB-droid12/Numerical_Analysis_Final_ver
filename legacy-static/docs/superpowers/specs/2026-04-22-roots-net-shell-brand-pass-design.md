# Roots NET Shell Brand Pass Design

## Goal

Reframe the standalone Roots mini app as a branded **NET+** product surface while keeping the current solver workflow intact.

This pass is about **branding, layout, and navigation framing**, not new product features. The page should feel like part of the NET product family, but every visible interaction must map to functionality that already exists in Roots today.

## Brand Direction

Use the provided NET brand kit as the primary reference.

Core identity signals to adopt:

- **NET+ brand block** in the shell
- editorial serif-forward hierarchy for titles and major headings
- dark forest green product shell surfaces
- parchment / ivory / sand content surfaces
- restrained gold or muted olive accents for borders, highlights, and secondary emphasis
- a polished academic-product tone rather than a generic calculator look

This should not become a literal reproduction of the brand board. The implementation should adapt the kit where necessary for usability, responsiveness, and the existing Roots interaction model.

## Selected Direction

Use a **Hybrid NET Shell**:

- the page gains a real left shell rail and stronger NET product identity
- the central solver workspace remains the focus
- product framing becomes stronger, but the page does not become a dense dashboard

This is intentionally not the heavier “full product shell” option. The rail should make the page feel like a real NET application, but without overwhelming the solver or introducing empty destinations.

## Scope

In scope:

- redesign the standalone Roots shell in `roots/index.html`
- restyle `roots/roots.css` to align more closely with the NET brand kit
- adjust Roots rendering/copy only if needed to support the new shell wording or navigation labels
- update Roots-specific audits if selectors or expectations change

Out of scope:

- new product features such as History, Notes, saved problems, dashboards, or user accounts
- numerical engine changes
- companion site changes
- main calculator shell redesign outside the Roots route

## Shell Structure

The page should use a **left rail + focused workspace** model.

### Left Rail

The left rail should contain:

- a **NET+ brand block** at the top
- the current module context for Roots
- functional in-page navigation for existing sections only:
  - **Methods**
  - **Problem Setup**
  - **Quiz Answer**
  - **Evidence**

The rail must not include links to features that do not yet exist.

### Shell Utilities

The current loose top-toolbar controls should be absorbed into the shell:

- `Back to calculator`
- `Angle`
- `Use radians` / `Use degrees`

These controls should live in the shell header / shell utility area so they stop cluttering the solver workspace. They should remain fully functional, but visually read as part of the NET shell rather than page chrome floating above the app.

## Navigation Behavior

The left rail should be **functional now**, but only for current Roots content.

Each rail item should map to a real section already present in the page:

- **Methods**: focuses or scrolls to the method selection / active method area
- **Problem Setup**: focuses or scrolls to the solver input section
- **Quiz Answer**: focuses or scrolls to the primary result card
- **Evidence**: focuses or scrolls to diagnostics, graph, solution steps, and iteration table

This should be implemented as existing-section navigation, not as a fake product shell. No new data models or pages should be introduced.

## Workspace Layout

The main workspace should stay solver-first.

The content order should remain:

1. page identity / workspace heading
2. problem setup
3. quiz-ready answer
4. evidence

The redesign should preserve the strong answer-first behavior from the previous pass:

- the approximate root remains visually dominant
- stopping result and stopping parameters remain immediately visible
- interpretation and next action remain visible without opening the evidence area
- diagnostics and proof content remain secondary but easy to reach

## Label Direction

Use the **mixed rail labels** that balance usability and product tone:

- **Methods**
- **Problem Setup**
- **Quiz Answer**
- **Evidence**

These are clearer than purely branded labels like “Guide” or “Trace,” while still feeling more productized than generic calculator labels.

## Visual System

The shell should feel more explicitly NET-branded than the current Academic Studio pass.

Required visual changes:

- stronger dark-green shell surfaces around the left rail and shell utility area
- clearer NET+ identity placement
- serif-led branding / workspace headings inspired by the brand kit
- cleaner separation between shell chrome and workspace content
- more explicit product-shell rhythm, spacing, and component polish

The solver workspace should still stay calm and legible:

- light paper-like backgrounds for content blocks
- answer area remains high contrast and visually dominant
- borders and accents should feel intentional and premium, not decorative

Avoid:

- turning the page into a fake dashboard with empty destinations
- using brand styling so aggressively that the solver becomes harder to scan
- adding ornamental elements that reduce information density or speed

## Interaction Rules

This pass must preserve all current Roots behavior:

- method switching
- angle toggling
- compute actions
- result rendering
- diagnostics
- convergence graph
- solution steps
- copy solution
- iteration table

The redesign may move controls into different shell regions, but it must not remove or weaken existing functionality.

## Accessibility

The shell redesign must preserve or improve:

- keyboard reachability of rail navigation and shell utilities
- tab semantics for method switching
- visible focus states
- clear heading hierarchy
- readable contrast for shell controls and workspace content
- `aria-live` behavior for status and error messaging

If the rail uses in-page navigation, target sections should have stable anchors and accessible names.

## Testing

Required verification:

```powershell
node scripts/roots-mini-app-static-audit.js
node scripts/roots-mini-app-ui-audit.js
node scripts/roots-fast-lane-audit.js
```

Live smoke test:

- open `roots/index.html` in a local static server
- confirm the rail navigation reaches the intended existing sections
- confirm shell-owned controls still work:
  - Back to calculator
  - Angle display
  - radians / degrees toggle
- run Bisection with `f(x) = x^2 - 2`, `a = 1`, `b = 2`, `n = 4`
- confirm the result still shows approximate root `1.4375`

Engine audits are only required if engine or request-packaging files change.

## Success Criteria

The redesign is successful when:

- Roots visibly reads as part of the NET product family
- the left rail feels real and useful, not decorative
- shell controls no longer clutter the solver workspace
- the solver remains fast for quiz use
- no new fake or empty features are introduced
- existing Roots behavior remains intact
- audits pass after selector updates

