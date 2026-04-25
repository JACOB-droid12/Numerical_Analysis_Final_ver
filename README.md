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
- `docs/roots-context.md` - compact Roots file map and edit boundaries for AI-assisted work
- `docs/roots-ai-fast-lane.md` - routing guide for low-context Roots edits
- `lesson-roundoff.pdf` - supporting course material
- `scripts/build-deliverable.ps1` - packages the static app into a shareable folder

## Roots React + Vercel Fast Lane

The migrated Roots React Workbench lives in `new-migration/roots-react-workbench/`. The older `roots-react/` folder is transitional reference only and must not be used as the Vercel deployment root.

For Vercel, release, staging, or production work, start with:

| File | Purpose |
|------|---------|
| `new-migration/roots-react-workbench/README.md` | Migrated workbench app notes and local commands |
| `docs/deployment/README.md` | Deployment entry point and route table for agents |
| `docs/deployment/roots-react-vercel-release.md` | Vercel settings, branch flow, staging, promotion, rollback |
| `docs/deployment/roots-react-staging-smoke-checklist.md` | Manual staging and production smoke checklist |
| `docs/deployment/roots-react-agent-release-checklist.md` | Copyable PR, staging, and production handoff checklist |
| `docs/deployment/roots-react-pr-body.md` | Reusable GitHub PR body for Roots React changes |
| `scripts/roots-react-release-check.ps1` | Canonical local release gate |
| `.github/workflows/roots-react-ci.yml` | GitHub Actions release gate for `staging` and `master` |
| `new-migration/roots-react-workbench/vercel.json` | Vercel build metadata for the migrated workbench |
| `new-migration/roots-react-workbench/package.json` | Migrated workbench scripts |

Do not deploy the repository root to Vercel for the React workbench. Use `new-migration/roots-react-workbench` as the Vercel project root directory.

Before merging, staging, or promoting Roots React changes, run this from the repository root:

```powershell
.\scripts\roots-react-release-check.ps1
```

## Verify

Run the audit scripts from the project folder:

```powershell
node scripts/engine-correctness-audit.js
node scripts/root-engine-audit.js
node scripts/roots-mini-app-static-audit.js
node scripts/roots-mini-app-ui-audit.js
node scripts/roots-fast-lane-audit.js
```
