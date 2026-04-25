# Roots Phase 2 Fast Lane And UX Design

## Purpose

Phase 1 moved Roots into a standalone mini-app. Phase 2 makes that move pay off:

1. Future AI sessions should need less context to work safely on Roots.
2. The standalone Roots workbench should feel clearer and more intentional without changing the numerical engine.

Phase 2 is split into two ordered parts: first the AI Fast Lane, then Roots UX polish.

## Phase 2B: AI Fast Lane

### Goal

Give future coding AIs a small, reliable starting path for Roots work so they do not reread or edit the whole app by default.

### Files

- Create or update `AGENTS.md` at the repository root with a Roots-specific section.
- Create `docs/roots-ai-fast-lane.md` as the detailed routing guide.
- Update `docs/roots-context.md` only if the routing guide exposes a missing boundary.
- Update `README.md` only if it needs a short pointer to the AI-facing context docs.

### Routing Rules

The fast lane should classify common requests:

- Roots UI/copy/style work: start with `docs/roots-context.md`, `docs/roots-ai-fast-lane.md`, `roots/index.html`, and `roots/roots.css`.
- Roots interaction work: add `roots/roots-app.js` and `roots/roots-state.js`.
- Roots rendering work: add `roots/roots-render.js`.
- Roots adapter work: add `roots/roots-engine-adapter.js`.
- Roots numerical behavior: read `root-engine.js` and `scripts/root-engine-audit.js`.
- Main calculator bridge work: read only `index.html`, `app.js`, `styles.css`, and `scripts/roots-mini-app-static-audit.js`.

The guide should explicitly say that main calculator files are out of scope for ordinary Roots mini-app UI work.

### Verification Rules

The guide should map changes to audits:

- Engine behavior: `node scripts/engine-correctness-audit.js` and `node scripts/root-engine-audit.js`.
- Roots shell or bridge behavior: `node scripts/roots-mini-app-static-audit.js`.
- Roots UI wiring: `node scripts/roots-mini-app-ui-audit.js`.
- Broad or uncertain changes: run all four.

### Error Handling

If a future AI request does not fit one route, the guide should require a short clarification before reading broad context. If a requested edit crosses boundaries, the AI should name the boundary crossing before editing.

## Phase 2A: Roots UX Polish

### Goal

Improve clarity and usability inside the standalone Roots mini-app while keeping the extraction boundary intact.

### Scope

Allowed files:

- `roots/index.html`
- `roots/roots.css`
- `roots/roots-render.js`
- `roots/roots-app.js` only if interaction wording or state behavior requires it
- `scripts/roots-mini-app-static-audit.js`
- `scripts/roots-mini-app-ui-audit.js`

Avoid changing `root-engine.js` unless an audit exposes a numerical bug.

### UX Direction

The polish should focus on:

- A clearer first-run experience that explains what to enter and what the methods do.
- Method navigation that distinguishes bracket methods from open/fixed-point methods.
- Stronger result hierarchy: approximate root first, stopping reason second, diagnostics visible but not noisy.
- Easier-to-scan solution steps and iteration tables.
- Responsive behavior for narrow screens, especially method controls and the iteration table.
- Accessibility preservation for status messages, diagnostics, copy feedback, and keyboard navigation.

### Non-Goals

- No framework or build system.
- No rewrite of the main calculator.
- No new root-finding method.
- No redesign of the shared numerical engine.
- No decorative-only UI pass that increases complexity without improving comprehension.

### Testing

Before Phase 2A is considered complete:

```powershell
node scripts/engine-correctness-audit.js
node scripts/root-engine-audit.js
node scripts/roots-mini-app-static-audit.js
node scripts/roots-mini-app-ui-audit.js
```

If the polish changes layout, also inspect `roots/index.html` manually in a browser at desktop and narrow widths.

## Acceptance Criteria

- Future AI work has a documented Roots routing path before implementation starts.
- Roots UI work can be scoped to `docs/roots-context.md`, `docs/roots-ai-fast-lane.md`, and the `roots/` files in ordinary cases.
- The main app remains only a bridge to `roots/index.html`.
- All four audit commands pass.
- The standalone Roots workbench is clearer without changing numerical results.
