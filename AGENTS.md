# Numerical Analysis Workspace

The workspace is intentionally split into two app folders:

| Folder | Role |
|--------|------|
| `new-migration/roots-react-workbench/` | Active migrated React/Vite Roots Workbench and Vercel source of truth |
| `legacy-static/` | Protected archive of the old static calculator, standalone Roots backup, previous pilot files, and historical docs/assets |

For current React, Vercel, staging, production, or migrated Roots UI work, start in:

```text
new-migration/roots-react-workbench/
```

Do not edit `legacy-static/` unless the user explicitly asks for legacy work or the migrated app needs a specific legacy behavior/asset ported. When porting, inspect legacy files as reference, then copy/adapt the needed piece into `new-migration/roots-react-workbench/`; do not make the migrated app depend on parent-folder legacy paths.

## Current Migration Fast Lane

Inside `new-migration/roots-react-workbench/`:

| File | Purpose |
|------|---------|
| `README.md` | Standalone migration map and commands |
| `docs/WORKSPACE.md` | Source boundary and agent handoff notes |
| `src/` | React Workbench UI |
| `public/legacy/` | Browser-loaded synced engine copies |
| `math-engine.js`, `calc-engine.js`, `expression-engine.js`, `root-engine.js`, `poly-engine.js` | Local engine sources used by runtime sync and audits |
| `scripts/sync-legacy-engines.mjs` | Syncs local engine sources into `public/legacy/` |
| `scripts/roots-react-release-check.ps1` | Local release gate |
| `.github/workflows/roots-react-ci.yml` | CI workflow for the standalone repo once extracted |
| `vercel.json` | Vercel build metadata |

Run the release gate before merging, staging, or promoting migrated app changes:

```powershell
cd new-migration\roots-react-workbench
npm run release:check
```

## Legacy Archive Rules

`legacy-static/` is read-mostly. It contains the old static app, standalone static Roots backup, historical deployment docs, old audit scripts, screenshots/logs, and the previous `roots-react/` pilot. Treat docs under `legacy-static/docs/superpowers/plans/` and `legacy-static/docs/superpowers/specs/` as historical unless the user explicitly asks for that history.

The hidden dot-directories plus `skills/` and `skills-lock.json` at the repository root are local agent/tool state. Ignore them for app architecture decisions.
