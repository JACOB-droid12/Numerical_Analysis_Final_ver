# Fast Path Rebalance Design

Date: 2026-04-20

## Summary

Rebalance the Calculation and Root Finding modules so the default experience prioritizes fast assignment checking over secondary teaching surfaces. The redesign keeps the current calculators, explanations, graphs, and helper panels, but changes their default visibility, visual weight, and sequencing so the first thing a student sees is the shortest path to a trustworthy answer.

This pass directly resolves the critique findings around buried fast paths, excessive up-front decisions in Root Finding, flat answer hierarchy, and AI-leaning accent stripe styling.

## Goals

- Make the default Calculation flow read as input -> authoritative answer -> next step.
- Make the default Root Finding flow read as method choice -> minimum required setup -> first successful run -> deeper explanation.
- Preserve teaching material and advanced inspection tools without letting them crowd the primary lane.
- Make the authoritative answer visually obvious without forcing the user to read explanatory copy first.
- Replace accent-stripe panel styling with calmer grouping that fits the academic workbench tone.

## Non-Goals

- No algorithm or numerical-correctness changes.
- No rewrite of module architecture or state ownership.
- No new multi-step wizard or dedicated Learn/Solve mode in this pass.
- No content rewrite of every tutorial or explanation block.
- No changes to Error, Polynomial, IEEE-754, or Tutorial beyond any shared styling needed to remove accent stripes safely.

## Critique Issues Addressed

### P1 Fast-path calculation is buried by secondary teaching surfaces

Address with `distill` behavior:

- collapse Quick start after the user has already had a successful run
- collapse the sensitivity sandbox by default
- move the single-operation helper behind a clearly secondary disclosure
- keep the default Calculation screen visually centered on expression entry, stepwise `p*`, and next actions

### P1 Root finding asks for too many decisions before the first win

Address with `clarify` behavior:

- keep method tabs visible, but defer advanced sign controls until explicitly opened
- visually distinguish required inputs from advanced instructional controls
- keep the first successful run close to the top of the module
- avoid presenting secondary interpretation tools before the user has a result

### P2 Primary answer hierarchy is too flat

Address with `layout` behavior:

- make the authoritative stepwise machine answer the most visually prominent answer card in Calculation
- demote exact and final-only comparison cards to supporting roles
- in Root Finding, lead with the approximate root and stopping outcome before graphs, tables, and prose
- preserve the current data but reduce equal-weight card repetition

### P2 Accent-stripe borders weaken the visual language

Address with `quieter` behavior:

- remove thick side-border accents from answer cards and disclosures
- rely on spacing, contrast, surface tone, and type scale for emphasis instead
- keep the overall palette restrained and academic rather than decorative

## User Experience

### Calculation module

### Default state

The default Calculation view should contain:

1. Expression input and machine settings
2. The authoritative result stage
3. Immediate next actions
4. Secondary teaching panels below the main path

Quick start may remain available near the top, but once the student has successfully computed a result it should stop reopening as a competing primary block. It becomes reference help rather than the main screen narrative.

### Result hierarchy

The result stage should clearly answer one question first: "What result should I use?"

- `Main machine answer p*` becomes the dominant card.
- `Exact value p` remains visible but visually secondary.
- `Final-only comparison` remains visible but explicitly reads as comparison, not a co-equal answer.
- The "Use the Stepwise result..." guidance stays, but the layout should make that conclusion obvious even before the user reads the sentence.

### Secondary surfaces

The following remain available but secondary:

- sensitivity sandbox
- single-operation helper
- machine notes and neighborhood
- worked examples

These should not appear as part of the default fast lane once a user is already solving a problem.

### Root Finding module

### Default state

The Root Finding module should still open with method tabs, but the user should not feel asked to process every advanced option before first success.

The default flow becomes:

1. Choose a method
2. Fill only the required visible inputs
3. Run the method
4. Read the result summary
5. Open advanced sign logic and deeper explanation only if needed

### Required versus advanced controls

Required controls stay visible:

- method tabs
- function input
- core interval or seed values
- significant digits
- machine rule
- stopping mode and stopping value

Advanced controls stay collapsed and demoted:

- finite-precision sign display choices
- decision-basis controls

These controls should remain discoverable for instructor-directed use, but should not visually compete with the main run path.

### Post-run ordering

After a successful root run, the content order should be:

1. approximate root
2. stopping result and stopping parameters
3. interval/sign summary when relevant
4. graph and convergence summary
5. classroom-style explanation
6. full iteration table

This preserves the teaching value while keeping the first answer and its confidence cues near the top.

## Interaction and State Rules

### Quick start persistence

For both Calculation and Root Finding:

- before first successful run, the quick guide should follow the current onboarding behavior
- after first successful run, it should default to collapsed
- user choice still wins if they manually reopen it

### Disclosure defaults

Calculation:

- `Sensitivity sandbox` collapsed by default
- `Single operation helper` collapsed by default
- nested helper disclosures remain collapsed by default

Root Finding:

- `Finite-precision sign options (advanced)` collapsed by default
- all result-area explanatory sections remain visible only after the first run populates them

### Existing keyboard behavior

Keep current efficient behaviors intact:

- Enter-to-compute for inputs
- existing module tab keyboard shortcuts
- current copy actions

This redesign should reduce clutter without slowing down repeat users.

## Visual and Layout Direction

### Emphasis model

Use emphasis in this order:

1. position in flow
2. type size and weight
3. spacing and grouping
4. subtle surface contrast

Do not use thick left borders as the main emphasis device.

### Calculation card treatment

- enlarge or otherwise strengthen the stepwise result card relative to the exact and final-only cards
- reduce the visual assertiveness of comparison/support cards
- keep next-step actions immediately beneath the authoritative answer region

### Root result treatment

- keep the summary cards compact and clearly scannable
- ensure the approximate root card reads as the headline result
- visually separate "answer summary" from "teaching details"

### Styling cleanup

Replace side-border accents in cards and disclosures with:

- neutral borders
- subtle module-tinted backgrounds only where helpful
- better spacing and stronger heading hierarchy

The page should feel calmer and less template-like when many sections are open.

## Architecture

This is an in-place UI restructuring pass. It should follow existing ownership:

- `index.html` for markup order and disclosure defaults
- `styles.css` for hierarchy, spacing, emphasis, and accent cleanup
- `app.js` for Calculation-related open/closed behavior and onboarding-driven disclosure defaults
- `root-ui.js` only if Root Finding disclosure or post-run state behavior needs small wiring updates

No new module or framework layer is needed.

## Implementation Approach

### Approach A: Fast-path by default, teaching on demand

Recommended.

Rebalance defaults, disclosure states, and hierarchy while preserving the current information architecture. This solves the critique with the least behavioral risk and keeps the app recognizable.

### Approach B: Separate Solve and Learn modes

Not recommended for this pass.

This would give very clean separation but adds a new top-level decision and larger state complexity.

### Approach C: Full staged stepper flow

Not recommended for this pass.

This would reduce cognitive load further, but it is too invasive for the current goal and could frustrate repeat-use workflows.

## Testing

Verify the following:

1. Calculation opens with the fast lane visible and secondary teaching surfaces collapsed by default.
2. After a successful Calculation run, stepwise `p*` is visually dominant over exact and final-only comparison.
3. Quick start does not keep reclaiming the main lane after a successful Calculation run.
4. Root Finding opens with method tabs and required controls visible, while advanced sign controls stay collapsed.
5. A first successful root run keeps the approximate root and stopping summary near the top without burying them under explanatory content.
6. Mobile Root Finding still keeps required controls accessible without introducing a longer pre-answer path.
7. Existing keyboard shortcuts and Enter-to-run behaviors still work.
8. Copy actions, graph switching, and table rendering still work after the layout changes.
9. Removing accent stripes does not create ambiguous grouping or reduce accessibility contrast.
10. No disclosure defaults trap users or hide critical required functionality.

## Risks

- Over-collapsing teaching surfaces could make the app feel less helpful for first-time students.
- Changing visual emphasis without changing content order may not be strong enough on its own if card weights remain too similar.
- Root Finding can easily regress into a long pre-answer form on mobile if required and advanced controls are not clearly separated.
- Shared card-style changes may unintentionally affect other modules if selectors are too broad.

## Recommendation

Implement a focused fast-path rebalance for Calculation and Root Finding using the current architecture. Apply `distill` to remove default clutter, `clarify` to reduce up-front Root Finding decisions, `layout` to make authoritative answers unmistakable, and `quieter` to remove side-border styling that makes the interface feel more templated than taught.
