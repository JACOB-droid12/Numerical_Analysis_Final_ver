# Engine Result Package Cleanup Design

## Summary

This pass improves the boundary between the numerical engine and the UI by introducing cleaner, more formal result packages for Module I and Module III. The goal is to reduce how much `app.js` has to interpret, reshape, and reassemble engine outputs while keeping the verified mathematics unchanged.

## Problem

The engine split is already reasonably strong, but `app.js` still performs a lot of meaning-making work after the engine runs:

- it assembles loose engine outputs into state objects
- it decides which values belong together as one result
- it stores derived metadata for later imports and UI behavior
- it mixes presentation concerns with result-shaping concerns

That creates two maintainability risks:

- subtle semantic bugs can appear even if the underlying math stays correct
- future features have to depend on `app.js` knowing too much about raw engine internals

## Goals

- Make Module I and Module III engine outputs more formally packaged
- Reduce result-shaping logic in `app.js`
- Preserve the current proven mathematical behavior
- Keep the 36-case audit harness green throughout the cleanup

## Non-Goals

- No changes to the numerical formulas or machine arithmetic rules
- No UI redesign
- No Module II rewrite in this pass
- No broad engine rewrite across every file

## Chosen Approach

### Result-package cleanup

Teach the engine side to return cleaner, more complete result packages for expression and polynomial evaluations, then update `app.js` to consume those packages directly.

This was chosen because it improves the boundary without forcing a risky rewrite. It also fits the current state of the codebase: the engines already do most of the hard math, but their outputs are still a bit too raw for the UI.

## Design Direction

### Module I contract

The expression path should move toward returning one structured result package that includes:

- canonical expression
- path type (`exact` or `calc`)
- exact or reference value
- stepwise result package
- final-only result package
- operation count and step trace

The stepwise package should own its own machine-ready details instead of requiring `app.js` to reconstruct them.

### Module III contract

The polynomial path should move toward returning one structured result package that includes:

- canonical polynomial string
- path type (`exact` or `calc`)
- exact or reference value
- final-only package
- Horner package
- Direct package
- method metrics or counts that naturally belong with those results

This should let `app.js` consume a clearer “comparison package” instead of assembling one manually.

### `app.js` responsibility after cleanup

After this pass, `app.js` should mainly:

- read packaged results
- render values and summaries
- store packaged results in state
- coordinate imports and announcements

It should do less ad hoc construction of result meaning.

## Files Expected To Change

- `C:\Users\Emmy Lou\Downloads\New folder (16)\expression-engine.js`
- `C:\Users\Emmy Lou\Downloads\New folder (16)\poly-engine.js`
- `C:\Users\Emmy Lou\Downloads\New folder (16)\app.js`
- `C:\Users\Emmy Lou\Downloads\New folder (16)\scripts\engine-correctness-audit.js`
- `C:\Users\Emmy Lou\Downloads\New folder (16)\docs\plans\2026-03-15-engine-correctness-audit-findings.md`

## Verification

Before calling this pass complete:

- confirm the 36-case engine audit harness still passes
- confirm Module I and Module III still render the same mathematical results
- confirm `app.js` now stores and consumes cleaner packaged result objects
- confirm no UI behavior was unintentionally changed by the contract cleanup
