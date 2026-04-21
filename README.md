# Numerical Analysis Teaching Lab

This repository contains a static browser-based numerical analysis calculator. No install or backend is required.

## Entry points

- Main calculator: `index.html`
- Standalone Roots workbench: `roots/index.html`

## Project layout

- `index.html` - main app shell and the bridge to the standalone Roots workbench
- `roots/index.html` - standalone Roots entry point
- `roots/roots-app.js` - Roots interaction wiring
- `roots/roots-state.js` - Roots state and cache
- `roots/roots-render.js` - Roots render/update logic
- `roots/roots-engine-adapter.js` - request packaging between UI state and `root-engine.js`
- `roots/roots.css` - Roots-only styling
- `root-engine.js` - numerical root-finding behavior
- `scripts/engine-correctness-audit.js` - machine arithmetic and expression audit
- `scripts/root-engine-audit.js` - root engine audit
- `scripts/roots-mini-app-static-audit.js` - static cutover and entry-point audit
- `scripts/roots-mini-app-ui-audit.js` - Roots UI wiring audit
- `docs/superpowers/specs/` and `docs/superpowers/plans/` - design and implementation notes
- `lesson-roundoff.pdf` - supporting course material
- `scripts/build-deliverable.ps1` - packages the static app into a shareable folder

## Verify

Run the audit scripts from the project folder:

```powershell
node scripts/engine-correctness-audit.js
node scripts/root-engine-audit.js
node scripts/roots-mini-app-static-audit.js
node scripts/roots-mini-app-ui-audit.js
```
