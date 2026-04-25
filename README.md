# Numerical Analysis Workspace

This repo is split into two intentional work areas:

| Folder | Status | Use it for |
|--------|--------|------------|
| `new-migration/roots-react-workbench/` | Current source of truth | React/Vite Roots Workbench, Vercel deployment, migrated UI work |
| `legacy-static/` | Protected legacy archive | Old static calculator, standalone static Roots backup, previous pilot files, historical docs/assets |

Start all current Roots React or Vercel work in `new-migration/roots-react-workbench/`.
Do not edit `legacy-static/` unless the task explicitly asks for legacy work or you are intentionally porting required behavior/assets into the migrated app.

## Current Migration Commands

Run from the repository root:

```powershell
npm install --prefix new-migration\roots-react-workbench
.\scripts\roots-react-release-check.ps1
```

Run from `new-migration/roots-react-workbench/`:

```powershell
npm install
npm run sync:legacy
npm run check:legacy
npm run test
npm run typecheck
npm run build
npm run release:check
```

Deploy `new-migration/roots-react-workbench/` as the Vercel project root. Do not deploy the repository root or `legacy-static/`.

Current production URL: `https://roots-react-workbench.vercel.app/`

## Current Workbench

The migrated Roots Workbench keeps the textbook/notebook display treatment from the standalone deployment while retaining the stabilized features in the current React app: Help, Quick Command presets, CSV export, expression accessibility, guarded invalid-run handling, method-specific reporting, legacy engine sync checks, Vitest coverage, Playwright smoke coverage, and release-gate automation.

Important files:

| File | Purpose |
|------|---------|
| `new-migration/roots-react-workbench/src/App.tsx` | Workbench shell and utility popovers |
| `new-migration/roots-react-workbench/src/components/NotebookDisplay.tsx` | Textbook/notebook input display |
| `new-migration/roots-react-workbench/src/components/MethodForm.tsx` | Method inputs, symbol insertion, backspace, and notebook placement |
| `new-migration/roots-react-workbench/src/components/IterationTable.tsx` | Iteration table and CSV export |
| `new-migration/roots-react-workbench/src/hooks/useRootsWorkbench.ts` | Workbench state, presets, execution, and stale-result handling |
| `new-migration/roots-react-workbench/src/lib/rootEngineAdapter.ts` | UI-to-engine request mapping and invalid-run classification |
| `scripts/roots-react-release-check.ps1` | Canonical release gate |

## Legacy Boundary

`legacy-static/` keeps the old app available for reference and fallback. Treat it as read-mostly:

- inspect it when matching legacy behavior,
- copy/adapt only the specific code or visual treatment needed by the migration,
- avoid wiring the migrated app back to legacy-relative paths,
- keep new source, tests, and deployment metadata inside `new-migration/roots-react-workbench/` or the active root release-gate files.

The hidden dot-directories plus `skills/` and `skills-lock.json` at the repository root are local agent/tool state. They are not app source.
