# Deployment Fast Lane

Start here for Vercel or Roots React release work.

## Current Deployment Target

Deploy only the isolated React pilot:

```text
new-migration/roots-react-workbench/
```

Do not deploy the repository root as the Vercel project. The repo root also contains the legacy static calculator, docs, audits, worktrees, and local tooling that are not part of the React app output.

The old `roots-react/` folder is transitional reference only and must not be used as the Vercel root.

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
| Need agent release checklist | `docs/deployment/roots-react-agent-release-checklist.md` |
| Need PR body text | `docs/deployment/roots-react-pr-body.md` |
| Need manual QA checklist | `docs/deployment/roots-react-staging-smoke-checklist.md` |
| Need local release verification | `scripts/roots-react-release-check.ps1` |
| Need CI release gate | `.github/workflows/roots-react-ci.yml` |
| Need React app commands | `new-migration/roots-react-workbench/package.json` |
| Need Vercel project config | `new-migration/roots-react-workbench/vercel.json` |

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

## Automated Gate

GitHub Actions runs the same release gate in `.github/workflows/roots-react-ci.yml` for pull requests and pushes targeting `staging` or `master`.

The workflow installs workbench dependencies with `npm ci --prefix new-migration/roots-react-workbench`, then runs:

```powershell
.\scripts\roots-react-release-check.ps1
```

Treat a failed Roots React CI run as a release blocker.

## Release Handoff

Use `docs/deployment/roots-react-agent-release-checklist.md` for every PR, staging handoff, and production handoff.

Use `docs/deployment/roots-react-pr-body.md` when creating a GitHub PR manually or through an agent.

The checklist and PR body are intentionally separate:

- the checklist tracks whether the release is safe,
- the PR body communicates the change to reviewers.

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
Project root directory: new-migration/roots-react-workbench
Framework preset: Vite
Install command: npm ci
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
