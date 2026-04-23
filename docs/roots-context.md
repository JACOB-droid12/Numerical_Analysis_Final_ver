# Roots Context

Short working map for future Roots mini-app edits.

## File Map

- `roots/index.html` - standalone Roots entry point and shell
- `math-engine.js`, `calc-engine.js`, `expression-engine.js`, `math-display.js` - shared parsing, arithmetic, and display dependencies loaded by `roots/index.html`
- `roots/roots-app.js` - event wiring and interaction flow
- `roots/roots-state.js` - state, caches, default state, and shared UI flags
- `roots/roots-render.js` - DOM rendering and update behavior
- `roots/roots-engine-adapter.js` - UI request packaging for `root-engine.js`
- `roots/roots.css` - Roots-specific styling
- `root-engine.js` - numerical root-finding logic and methods
- `index.html` - main calculator bridge to `roots/index.html`
- `scripts/engine-correctness-audit.js` - shared arithmetic and expression audit
- `scripts/root-engine-audit.js` - root-engine audit
- `scripts/roots-mini-app-static-audit.js` - entry-point and cutover audit
- `scripts/roots-mini-app-ui-audit.js` - Roots shell and wiring audit

## Edit Boundaries

- UI, copy, and styles: `roots/index.html`, `roots/roots.css`
- State, caches, and default values: `roots/roots-state.js`
- Interaction wiring: `roots/roots-app.js`
- Render behavior: `roots/roots-render.js`
- Adapter and request packaging: `roots/roots-engine-adapter.js`
- Numerical behavior: `root-engine.js`

## Verification

From the project root:

```powershell
node scripts/engine-correctness-audit.js
node scripts/root-engine-audit.js
node scripts/roots-mini-app-static-audit.js
node scripts/roots-mini-app-ui-audit.js
```

## Cutover Note

The main calculator now links to `roots/index.html`. The main app no longer loads `root-engine.js` or `root-ui.js`, and the legacy `root-ui.js` file has been removed.

## Current Design Direction

- Tone: designed, but still a disciplined lab instrument.
- Primary promise: fast quiz answers. The function input and run action should dominate the first viewport.
- Evidence model: answer first; solution record, diagnostics, graphs, steps, and tables expand on demand.
- Method visibility: keep all five methods equally visible. Do not demote False Position or Fixed Point behind menus.
- Current priority order from critique follow-up: first-viewport speed, then setup-field organization, then answer-copy convenience.
- Evidence order decision: keep diagnostics and graph before solution steps.
