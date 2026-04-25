# Numerical Analysis Workspace

The workspace is intentionally split into two app folders:

| Folder | Role |
|------|------|
| `new-migration/roots-react-workbench/` | Active migrated React/Vite Roots Workbench and Vercel source of truth |
| `legacy-static/` | Protected archive of the old static calculator, standalone Roots backup, previous pilot files, and historical docs/assets |

For current React, Vercel, staging, production, or migrated Roots UI work, start in:

```text
new-migration/roots-react-workbench/
```

Do not edit `legacy-static/` unless the user explicitly asks for legacy work or the migrated app needs a specific legacy behavior or asset ported. When porting, inspect legacy files as reference, then copy/adapt the needed piece into `new-migration/roots-react-workbench/`; do not make the migrated app depend on parent-folder legacy paths.

## Current Migration Fast Lane

Inside `new-migration/roots-react-workbench/`:

| File | Purpose |
|------|---------|
| `README.md` | Standalone migration map and commands |
| `docs/WORKSPACE.md` | Source boundary and agent handoff notes |
| `src/` | React Workbench UI |
| `src/components/NotebookDisplay.tsx` | Textbook/notebook input display; preserve this UI direction unless explicitly redesigning it |
| `public/legacy/` | Browser-loaded synced engine copies |
| `math-engine.js`, `calc-engine.js`, `expression-engine.js`, `root-engine.js`, `poly-engine.js` | Local engine sources used by runtime sync and audits |
| `scripts/sync-legacy-engines.mjs` | Syncs local engine sources into `public/legacy/` |
| `.github/workflows/roots-react-ci.yml` | Standalone CI workflow for extracted workspace use |
| `vercel.json` | Vercel build metadata |

Root-level release and CI files from the stabilized workspace are active:

| File | Purpose |
|------|---------|
| `scripts/roots-react-release-check.ps1` | Canonical local release gate |
| `scripts/engine-correctness-audit.js` | Machine arithmetic and expression audit |
| `scripts/root-engine-audit.js` | Root engine audit |
| `.github/workflows/roots-react-ci.yml` | GitHub Actions release gate for `staging` and `master` |

Do not deploy the repository root to Vercel for the React workbench. Use `new-migration/roots-react-workbench` as the Vercel project root directory.

Before merging, staging, or promoting Roots React changes, run this from the repository root:

```powershell
.\scripts\roots-react-release-check.ps1
```

From inside `new-migration/roots-react-workbench/`, use:

```powershell
npm run release:check
```

Branch flow for the React pilot:

```text
feature branch -> staging -> master
```

Every Roots React handoff should include:

- branch name,
- commit SHA,
- `.\scripts\roots-react-release-check.ps1` result,
- Vercel URL when deployed,
- whether the legacy static backup stayed untouched.

The current production URL is `https://roots-react-workbench.vercel.app/`.

Record the active standalone branch context in release handoffs when it differs from the current branch.

## Legacy Archive Rules

`legacy-static/` is read-mostly. It contains the old static app, standalone static Roots backup, historical deployment docs, old audit scripts, screenshots/logs, and the previous `roots-react/` pilot. Treat docs under `legacy-static/docs/superpowers/plans/` and `legacy-static/docs/superpowers/specs/` as historical unless the user explicitly asks for that history.

The hidden dot-directories plus `skills/` and `skills-lock.json` at the repository root are local agent/tool state. Ignore them for app architecture decisions.
