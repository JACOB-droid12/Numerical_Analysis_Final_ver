# Numerical Analysis Teaching Lab

This repository now contains three related surfaces:

- legacy static calculator at `index.html`,
- standalone static Roots workbench at `roots/index.html`,
- isolated Vite + React Roots pilot at `roots-react/`.

The legacy calculator and `roots/` backup are plain HTML/CSS/JavaScript. The React pilot is the only Vercel deployment target and has its own npm/Vite toolchain inside `roots-react/`.

## Current Source Of Truth

Start with `AGENTS.md` for agent instructions.

Use these files for current architecture and release boundaries:

- `docs/roots-context.md` - static Roots file map and edit boundaries
- `docs/roots-ai-fast-lane.md` - route table for low-context static Roots work
- `docs/deployment/README.md` - Vercel and Roots React release entry point
- `roots-react/README.md` - React pilot commands and UI dependency notes

Files under `docs/superpowers/plans/` and `docs/superpowers/specs/` are historical implementation notes unless a task explicitly asks for that history.

## Entry Points

- Main legacy calculator: `index.html`
- Static Roots backup: `roots/index.html`
- React Roots pilot: `roots-react/index.html`
- React production URL: `https://roots-react.vercel.app`

Do not deploy the repository root to Vercel. Use `roots-react` as the Vercel project root directory.

## Project Layout

- `index.html`, `app.js`, `styles.css` - legacy static calculator shell
- `roots/` - standalone static Roots backup
- `roots-react/` - Vite + React + TypeScript Roots pilot
- `root-engine.js` - canonical root-finding numerical engine
- `math-engine.js`, `calc-engine.js`, `expression-engine.js`, `poly-engine.js`, `ieee754.js` - shared numerical engines
- `roots-react/public/legacy/` - committed synced copies required by Vercel builds
- `roots-react/scripts/sync-legacy-engines.mjs` - syncs shared engines into `roots-react/public/legacy/`
- `scripts/roots-react-release-check.ps1` - canonical Roots React release gate
- `scripts/*.js` - static app and engine audit scripts
- `docs/deployment/` - Vercel release workflow and handoff checklists
- `calculator-companion-site/` and `calculator-site-content/` - static companion site and JSON content

## Common Commands

Run from the repository root:

```powershell
node scripts/engine-correctness-audit.js
node scripts/root-engine-audit.js
node scripts/roots-mini-app-static-audit.js
node scripts/roots-mini-app-ui-audit.js
node scripts/roots-fast-lane-audit.js
.\scripts\roots-react-release-check.ps1
```

Run from `roots-react/`:

```powershell
npm install
npm run sync:legacy
npm run typecheck
npm run build
npm run dev
```

## Release Rule

Before merging, staging, or promoting Roots React work, run:

```powershell
.\scripts\roots-react-release-check.ps1
```

That gate verifies the shared numerical engines, syncs legacy engine copies for Vercel, checks for stale synced files, typechecks the React app, and builds the Vite app.
