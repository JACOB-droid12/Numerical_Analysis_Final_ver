# Root Math Preview Design

## Context

The app already has a shared math-preview system for expression fields. The `root-expression` field is already registered in `PREVIEW_FIELDS`, but the Roots input reset flow does not refresh previews while the user edits the root expression. This makes the Roots module feel inconsistent with the other modules.

## Goal

Make the Roots function input show the same parsed math display behavior as the Machine Arithmetic and Polynomial expression inputs.

## Proposed Change

Reuse the existing preview system. When root inputs change and the root result is reset, call `syncMathPreviews()` so the already-registered `root-expression` preview is refreshed.

No new renderer, parser, or root-engine behavior is needed.

## Testing

Run:

- `node scripts\engine-correctness-audit.js`
- `node scripts\root-engine-audit.js`

Source-check that `debouncedRootReset` now refreshes math previews.

## Self-Review

- No placeholders remain.
- The change reuses existing app infrastructure.
- The scope is limited to the Roots input preview refresh.
