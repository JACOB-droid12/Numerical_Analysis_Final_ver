# Numerical Analysis Workspace

This repo is now split into two intentional work areas:

| Folder | Status | Use it for |
|--------|--------|------------|
| `new-migration/roots-react-workbench/` | Current source of truth | React/Vite Roots Workbench, Vercel deployment, migrated UI work |
| `legacy-static/` | Protected legacy archive | Old static calculator, standalone static Roots backup, previous pilot files, historical docs/assets |

Start all current Roots React or Vercel work in `new-migration/roots-react-workbench/`.
Do not edit `legacy-static/` unless the task explicitly asks for legacy work or you are intentionally porting required behavior/assets into the migrated app.

## Current Migration Commands

Run from `new-migration/roots-react-workbench/`:

```powershell
npm install
npm run sync:legacy
npm run test:engine
npm run typecheck
npm run build
npm run release:check
```

Deploy `new-migration/roots-react-workbench/` as the Vercel project root. Do not deploy the repository root or `legacy-static/`.

## Legacy Boundary

`legacy-static/` keeps the old app available for reference and fallback. Treat it as read-mostly:

- inspect it when matching legacy behavior,
- copy/adapt only the specific code or visual treatment needed by the migration,
- avoid wiring the migrated app back to legacy-relative paths,
- keep new source, tests, and deployment metadata inside `new-migration/roots-react-workbench/`.

The hidden dot-directories plus `skills/` and `skills-lock.json` at the repository root are local agent/tool state. They are not app source.
