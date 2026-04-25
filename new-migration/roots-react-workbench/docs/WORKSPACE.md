# Roots React Standalone Workspace

This directory is the portable source package for the Vercel Roots Workbench.
It is intended to become its own repository or workspace without depending on
the legacy calculator repo above it.

## Source Boundary

The React app loads the browser engine bundle from `public/legacy/`.
Those files are synced from the engine sources kept at this workspace root:

| File | Why it stays here |
|------|-------------------|
| `math-engine.js` | Scalar arithmetic dependency for expression/root evaluation |
| `calc-engine.js` | Multi-step arithmetic dependency used by audits and expression support |
| `expression-engine.js` | Free-form expression parser/evaluator |
| `root-engine.js` | Root-finding numerical core used by the React UI |
| `poly-engine.js` | Needed by `scripts/engine-correctness-audit.cjs` |

Do not edit `public/legacy/*.js` by hand. Edit the root engine source, then run:

```powershell
npm run sync:legacy
```

## Main Commands

```powershell
npm install
npm run sync:legacy
npm run test:engine
npm run typecheck
npm run build
npm run release:check
```

`npm run release:check` is the local release gate. It runs the engine audits,
syncs the runtime legacy engines, verifies the synced files are committed when
inside git, then runs TypeScript and the Vite production build.

## Deployment

Deploy this workspace root to Vercel. Do not point Vercel at the old legacy repo
root for this React pilot.
