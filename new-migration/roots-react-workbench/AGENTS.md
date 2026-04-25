# Roots React Workbench

This is the active source of truth for the migrated Roots Workbench.

## Source Boundary

The browser app loads engine files from `public/legacy/`. Those files are generated from local engine sources at this workspace root:

- `math-engine.js`
- `calc-engine.js`
- `expression-engine.js`
- `root-engine.js`
- `poly-engine.js` for audits

Do not edit `public/legacy/*.js` by hand. Edit the root engine source, then run:

```powershell
npm run sync:legacy
```

Do not make this app depend on files outside this folder. `../../legacy-static/` is reference-only unless the user explicitly asks for legacy changes.

## Required Checks

Before merging, staging, promoting, or handing off migrated app changes:

```powershell
npm run release:check
```

For narrower work, use:

```powershell
npm run test:engine
npm run typecheck
npm run build
```

Deploy this folder, not the repository root, to Vercel.
