# Deployment Fast Lane

Start here for Vercel or Roots React release work.

## Current Deployment Target

Deploy only the isolated React pilot:

```text
roots-react/
```

Do not deploy the repository root as the Vercel project. The repo root also contains the legacy static calculator, docs, audits, worktrees, and local tooling that are not part of the React app output.

## Live Project

Current Vercel project:

```text
marvillarq20-3593s-projects/roots-react
```

Current production URL:

```text
https://roots-react.vercel.app
```

## Agent Route Table

| Task | Start Here |
|------|------------|
| Need Vercel settings | `docs/deployment/roots-react-vercel-release.md` |
| Need staging or production release steps | `docs/deployment/roots-react-vercel-release.md` |
| Need manual QA checklist | `docs/deployment/roots-react-staging-smoke-checklist.md` |
| Need local release verification | `scripts/roots-react-release-check.ps1` |
| Need React app commands | `roots-react/package.json` |
| Need Vercel project config | `roots-react/vercel.json` |

## Required Local Gate

Before merging, staging, or promoting Roots React work, run this from the repository root:

```powershell
.\scripts\roots-react-release-check.ps1
```

This runs:

- engine correctness audit,
- root engine audit,
- legacy engine sync,
- stale synced legacy diff guard,
- TypeScript typecheck,
- Vite build.

## Branch Flow

Use this release path:

```text
feature branch -> staging -> master
```

- Feature branches are implementation branches.
- `staging` is the private release-candidate branch.
- `master` is production for this repo.

## Vercel Settings

Use these settings for the `roots-react` Vercel project:

```text
Project root directory: roots-react
Framework preset: Vite
Install command: npm install
Build command: npm run build
Output directory: dist
Production branch: master
```

## Non-Goals

Do not use this deployment path for:

- the legacy static calculator at `index.html`,
- the backup Roots app under `roots/`,
- repository docs or local audit tooling,
- custom domain setup,
- auth, database, payments, or user accounts.

