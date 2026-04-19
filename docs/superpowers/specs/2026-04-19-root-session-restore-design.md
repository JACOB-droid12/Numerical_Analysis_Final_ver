# Root Session Restore Design

Date: 2026-04-19

## Summary

Add root-module-only session recovery so students do not lose their current root-finding work after a refresh. The app should silently restore the last active root method on page load. If the saved state came from a successful computation, the app should automatically recompute that method so the result summary, diagnostics, graph, and table return. If the saved state was only an unfinished draft, the app should restore the draft fields without auto-running the method.

This feature is intentionally scoped to the Root module only. No persistence changes are included for Basic, Error, Polynomial, IEEE-754, or Tutorial.

## Goals

- Preserve unfinished root-method drafts across refreshes.
- Preserve the last successful root computation for the last active root method.
- Restore the same active root method tab on page load.
- Keep the restored experience quiet and immediate, with no confirmation modal.
- Clear saved root state when the user deliberately resets or clears the root module.

## Non-Goals

- App-wide persistence for other modules.
- Multi-method root workspace persistence.
- Persisting rendered HTML, iteration tables, or graph markup in storage.
- URL hash state, permalinks, or sharing support.
- Web Worker migration, PWA/offline work, or root-engine algorithm changes.

## User Experience

### Save behavior

The app autosaves the Root module session for the current active method only.

- Draft edits are saved as the student types or changes controls.
- A successful root computation updates the saved session to mark it as recomputable.
- Switching to a different root method replaces the saved session target so only the newly active method remains persisted.

### Restore behavior

On page load:

1. Read the saved root session from `localStorage`.
2. If the payload is valid, activate the saved method tab.
3. Restore that method's field values and method-specific controls.
4. If the session represents a successful run, automatically recompute it.
5. If the session represents only a draft, restore the draft without auto-running.

The restore should happen immediately on page load. No restore prompt or gate is shown.

### Status messaging

Use the existing root status live region for concise restore feedback.

- Successful run restored: `Restored previous Bisection session.`
- Draft restored: `Restored unfinished Newton draft.`

If auto-recompute fails, keep the restored fields visible, surface the current validation error, and treat the restored state as a draft going forward.

### Clear behavior

Any deliberate root reset or clear action must also delete the saved root session. After that, refreshing the page should not restore root state.

## Architecture

## Ownership

Primary ownership stays in `root-ui.js`, because that file already owns:

- active root method selection
- method-specific input wiring
- root compute dispatch
- root run rendering
- root recomputation

The persistence feature should be implemented as a small session layer inside `root-ui.js`, rather than adding more root-specific state logic to `app.js`.

`app.js` should remain unchanged unless a minimal hook is required to preserve the current initialization order.

## Proposed RootUI additions

Add internal helper functions in `root-ui.js`:

- `readRootSession()`
- `writeRootSession(session)`
- `clearRootSession()`
- `captureRootDraft()`
- `captureRootSuccess()`
- `restoreRootSession()`
- `collectFieldsForMethod(methodName)`
- `applyFieldsForMethod(methodName, fields)`

These helpers should stay private to `root-ui.js`.

## Storage Model

Persist one small, versioned object under a root-specific storage key.

Example shape:

```json
{
  "version": 1,
  "activeMethod": "newton",
  "fields": {
    "root-newton-expression": "x^3 - x - 1",
    "root-newton-df": "3x^2 - 1",
    "root-newton-x0": "1",
    "root-newton-k": "6",
    "root-newton-mode": "round",
    "root-newton-stop-kind": "iterations",
    "root-newton-stop-value": "4"
  },
  "hasSuccessfulRun": false,
  "savedAt": "2026-04-19T15:42:00.000Z"
}
```

### Storage rules

- Persist raw field strings exactly as entered.
- Include only the field set for the last active root method.
- Include method-specific controls that affect root behavior, such as tolerance type, decision basis, or sign-display, when they belong to the active method.
- Do not persist computed table rows, graph series, diagnostics markup, or copied solution text.

## Method Coverage

The session layer must support:

- `bisection`
- `newton`
- `secant`
- `falsePosition`
- `fixedPoint`

Only one method snapshot is stored at a time: the last active method.

## Restore Flow

During `RootUI.init()`:

1. Wire events normally.
2. Sync bisection tolerance controls.
3. Attempt `restoreRootSession()`.
4. If no valid session exists, fall back to the current default behavior of opening `bisection`.

### Draft restore

If `hasSuccessfulRun` is false:

- restore the saved method
- apply saved fields
- sync any dependent controls
- do not call compute
- announce that an unfinished draft was restored

### Successful restore

If `hasSuccessfulRun` is true:

- restore the saved method
- apply saved fields
- sync any dependent controls
- call the existing compute path for that method
- announce that the previous session was restored

Using the existing compute path is important so all current rendering stays authoritative:

- result summary
- diagnostics
- graph tabs
- convergence summary
- solution steps
- iteration table

## Validation And Failure Handling

### Invalid storage payload

If the stored payload is missing, malformed, has an unsupported version, or references an unknown method:

- ignore it safely
- clear it if needed
- continue with the normal empty root state

### Storage unavailable

If `localStorage` is unavailable or throws:

- fail quietly
- preserve current root behavior
- do not block compute, render, or interaction flows

### Auto-recompute failure

If a saved successful session restores fields correctly but recomputation now fails:

- keep the restored fields visible
- show the current validation or computation error
- replace the saved session with a draft-state snapshot
- do not erase the student's recovered inputs

## Data Flow

### Autosave triggers

Persist a draft snapshot when:

- a root text input changes
- a root numeric input changes
- a root select changes
- the active root method changes

Persist a successful snapshot when:

- `runCompute()` completes successfully for the active method

Clear the snapshot when:

- the root module is deliberately reset or cleared

### Recompute contract

Auto-recompute on load applies only to the Root module and only when `hasSuccessfulRun` is true.

It does not apply to unfinished drafts.

## Testing

Verify the following scenarios:

1. Bisection draft fields survive refresh without auto-running.
2. Newton draft fields survive refresh without auto-running.
3. Last active root method tab is restored on load.
4. Successful root run restores and auto-recomputes on load.
5. Restored successful runs redraw summary, diagnostics, graph, and table.
6. Invalid drafts restore their inputs without wiping the form.
7. Reset or clear removes the saved root session.
8. Corrupted storage payload is ignored safely.
9. Switching methods persists only the currently active method snapshot.
10. Existing root behaviors still work after restore, including copy solution and graph tab switching.

## Risks

- Restore ordering could be brittle if it runs before method panels and listeners are ready.
- Method-specific controls such as tolerance-type and decision-basis must be restored before recomputation.
- Future refactors to root method field IDs must stay synchronized with the persistence collector.

## Recommendation

Implement the draft-first root session restore entirely inside `root-ui.js` using a small, versioned storage object and the existing compute pipeline. This delivers the highest-value persistence improvement for the current project focus without expanding into app-wide state management.
