# Roots React Workbench Stabilization Design

## Context

The active migrated Roots Workbench should live in `new-migration/roots-react-workbench/`, but the real React/Vite source currently lives in `roots-react/`. The documented target folder contains build artifacts and dependencies rather than source. This creates a release risk because agents, CI, Vercel, and local scripts can point at different copies of the app.

The first improvement pass will use a migration-first stabilization approach: copy the working source into the declared source-of-truth folder before fixing visible behavior. The scope is immediate plus selected short-term UX fixes.

## Goals

- Make `new-migration/roots-react-workbench/` the active React/Vite source of truth.
- Keep `roots-react/` temporarily intact as transitional reference and rollback material.
- Restore a green release gate.
- Ensure browser-loaded legacy engine copies match canonical engine sources.
- Prevent invalid or empty calculations from looking successful.
- Remove visible no-op controls from the first pass.
- Implement the short-term UI fixes that protect trust, accessibility, and method-specific correctness.

## Non-Goals

- Do not restructure into `apps/` and `packages/` in this pass.
- Do not extract the legacy engines into typed ESM modules yet.
- Do not add Vitest or Playwright infrastructure yet.
- Do not build Help, Quick Command, CSV export, compare methods, saved sessions, reports, or instructor feature expansion in this pass.
- Do not remove `roots-react/` until the migrated source and release path are proven.

## Source Boundary Design

`new-migration/roots-react-workbench/` becomes the active source tree. The implementation will copy the real app from `roots-react/` into this folder, replacing the current artifact-only contents with the full source structure:

- `src/`
- `public/legacy/`
- `scripts/`
- `package.json`
- `package-lock.json`
- TypeScript config
- Vite config
- README
- `vercel.json`

After the copy, all active tooling and documentation will target `new-migration/roots-react-workbench/`:

- root release gate script
- GitHub Actions workflow paths
- Vercel metadata and deployment docs
- README, AGENTS, and workspace docs
- legacy engine sync script
- developer commands

`roots-react/` remains available as transitional reference, but docs and tooling must stop presenting it as the deployment target.

## Release And Engine Correctness Design

The root audit failure around the bisection bound must be resolved by making the contract explicit. The intended contract for engine math is to preserve the exact bisection bound; display formatting can round for presentation, but the audit should not force the engine to lose precision.

The implementation should update the failing audit expectation to match the exact bound contract unless deeper inspection proves the test is specifically checking an eight-significant-digit display path.

Legacy engine sync must become part of the migrated release path. After running sync, `new-migration/roots-react-workbench/public/legacy/root-engine.js` must match the canonical `root-engine.js`. The release check should run:

```powershell
npm run sync:legacy
git diff --quiet -- new-migration/roots-react-workbench/public/legacy
npm run typecheck
npm run build
```

The full root release gate should also continue to run the engine correctness and root engine audits before building the migrated app.

## Invalid Run Design

Invalid input must not render as a successful calculation. If the engine returns an invalid result package or a result without a valid approximation, the workbench should treat it as an error-like outcome.

Required behavior:

- Empty required fields show an error status near the run controls.
- The result console does not show `N/A` as a current approximate root.
- Copy answer is disabled when no valid approximation exists.
- Confidence bars do not appear for invalid runs.
- Evidence workspace does not render for invalid runs.
- Valid successful runs still store `lastRun` and preserve stale/current behavior.

This keeps the app honest: incomplete or invalid calculations cannot look equivalent to successful numerical results.

## Short-Term UI Fix Design

The first pass removes these visible no-op controls instead of implementing them:

- Help
- Quick Command
- Download CSV

The first pass implements these fixes:

- `⌫` deletes the selected text or previous character in the active expression field.
- `SolutionSteps` renders a method-specific formula for bisection, false position, secant, fixed point, and Newton.
- `ConvergenceGraph` derives its caption from method and stop reason instead of always claiming quadratic convergence.
- `ConfidenceSummary` derives confidence from warnings, stale state, stop reason, residual/error, and invalid input.
- Expression inputs get proper accessible names.
- The digit precision middle value becomes non-clickable display or a real editable numeric control.
- Valid examples are seeded by default so the first run succeeds without requiring a preset menu.

## Testing And Verification

Required verification for this pass:

- `node scripts/engine-correctness-audit.js`
- `node scripts/root-engine-audit.js`
- migrated legacy sync leaves no diff in `new-migration/roots-react-workbench/public/legacy`
- migrated TypeScript typecheck
- migrated production build
- browser smoke confirms:
  - default run succeeds
  - empty or invalid run shows an error and no fake result
  - stale state still works after changing inputs
  - method formulas and graph captions change when switching methods
  - expression input is accessible by name
  - `⌫` edits the expression field

## Cleanup

Remove unused components and state only when they are clearly dead after the revised UI shape. Documentation should point readers to `new-migration/roots-react-workbench/` for active React, Vercel, staging, production, and migrated Roots UI work.

## Risks

- Copy-first migration touches several tooling paths at once, so verification must include both source inspection and release commands.
- Keeping `roots-react/` temporarily can confuse future work unless docs clearly mark it transitional.
- The bisection audit expectation must be changed in the direction of the intended numerical contract, not merely to silence the test.
