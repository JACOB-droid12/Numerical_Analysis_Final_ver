# Numerical Analysis Teaching Lab

This repository contains a standalone browser-based numerical analysis calculator for machine arithmetic, error analysis, polynomial evaluation, and one-variable root approximation with the Bisection Method.

## Run locally

1. Open `index.html` in a modern browser.
2. No installation or backend is required.

## Project layout

- `index.html` - app shell and UI markup
- `styles.css` - application styling
- `app.js` - UI wiring and interaction flow
- `math-engine.js`, `expression-engine.js`, `calc-engine.js`, `poly-engine.js`, `root-engine.js`, `math-display.js` - calculation and formatting logic
- `scripts/engine-correctness-audit.js` - core expression and machine-arithmetic audit
- `scripts/root-engine-audit.js` - bisection/root-finding audit
- `docs/superpowers/specs/` and `docs/superpowers/plans/` - design and implementation notes
- `lesson-roundoff.pdf` - supporting course material
- `scripts/build-deliverable.ps1` - packages the static app into a shareable folder

## Verify

Run the audit scripts from the project folder:

```powershell
node scripts/engine-correctness-audit.js
node scripts/root-engine-audit.js
```
