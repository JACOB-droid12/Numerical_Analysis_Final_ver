# Release Finalization and Git-Connected Vercel Baseline Design

Date: 2026-04-24  
Status: Approved design direction, pending implementation plan

## Purpose

Finalize the current Roots React pilot branch as the official baseline and move the project from one-time CLI deployment toward a Git-connected Vercel release lane.

This phase closes the loop on the migration pilot work already completed on `codex/roots-react-pilot`. It should make `master` the source of truth for the React pilot and release documentation, while preserving the existing static calculator and standalone `roots/` backup.

## Current State

- Active feature branch: `codex/roots-react-pilot`.
- Production branch: `master`.
- Vercel production URL: `https://roots-react.vercel.app`.
- Vercel project: `marvillarq20-3593s-projects/roots-react`.
- React pilot root: `roots-react/`.
- Canonical release check: `scripts/roots-react-release-check.ps1`.
- Agent release docs and handoff checklist are in place.
- GitHub CLI is not available locally, so PR creation may require the GitHub web URL.

## Goals

- Verify the current feature branch is release-ready.
- Merge `codex/roots-react-pilot` into `master` if all checks pass.
- Push `master` to GitHub.
- Create or update `staging` from the verified release baseline.
- Keep Vercel configured to build only `roots-react/`.
- Confirm the production Vercel URL remains available.
- Document any Vercel dashboard-only steps that cannot be completed from local tooling.
- Leave future agents with `master` as the clean starting point.

## Non-Goals

This phase does not include:

- new Roots React UI features,
- compare methods,
- study mode,
- GSAP animation work,
- shadcn/ui expansion,
- numerical engine rewrites,
- custom domain setup,
- auth, database, users, payments, or analytics,
- deleting the legacy static calculator or `roots/` backup.

## Release Gate

Before merging to `master`, run:

```powershell
.\scripts\roots-react-release-check.ps1
```

The merge must not proceed if this command fails.

Also verify:

```powershell
git diff -- index.html app.js styles.css roots/
```

Expected result:

```text
No output.
```

This confirms the legacy static calculator and backup Roots app are untouched by this phase.

## Merge Strategy

Preferred merge path:

```text
codex/roots-react-pilot -> master
```

Use a normal Git merge only after checks pass. Do not squash away the internal commit history unless explicitly requested later, because the current branch contains useful design, plan, implementation, and review commits.

After merging:

- run the release check again on `master`,
- push `master` to `origin`,
- record the final `master` commit SHA.

## Staging Strategy

After `master` is verified and pushed, create or update `staging` from the same verified baseline.

Expected result:

```text
staging == master at the release baseline
```

If `staging` does not exist, create it from `master`.

If `staging` exists, fast-forward it to the verified `master` commit when possible.

If a fast-forward is not possible, stop and report the divergence instead of forcing the branch.

## Vercel Git-Connected Baseline

The long-term preferred Vercel model is:

```text
push to staging -> protected preview deployment
push/merge to master -> production deployment
```

Required Vercel settings:

```text
Project root directory: roots-react
Framework preset: Vite
Install command: npm install
Build command: npm run build
Output directory: dist
Production branch: master
```

If local tooling cannot confirm or configure Git integration, document the exact dashboard steps:

1. Open the existing Vercel project `marvillarq20-3593s-projects/roots-react`.
2. Connect the GitHub repository `JACOB-droid12/Numerical_Analysis_Final_ver`.
3. Confirm Root Directory is `roots-react`.
4. Confirm Production Branch is `master`.
5. Confirm preview deployments are enabled.
6. Enable Deployment Protection for previews when available.

Do not create a second Vercel project for the repository root.

## Production Verification

After `master` is pushed, verify:

- `https://roots-react.vercel.app` returns HTTP 200,
- the page title is `NET+ Roots Workbench`,
- the browser console has no errors,
- Vercel production still points at the Roots React app.

If Vercel Git deployment is not yet connected, the existing production URL may still reflect the prior CLI deployment. In that case, mark Git integration as an account-side follow-up and do not claim Git-connected deployment is complete.

## Rollback

If the merge to `master` causes a local failure before push:

- abort the merge if possible,
- keep `master` unchanged,
- report the failure.

If `master` is pushed and production later fails:

- revert the merge commit on `master`, or
- redeploy the previous known-good Vercel production deployment.

Do not use destructive commands such as `git reset --hard` or forced pushes unless explicitly approved.

## Success Criteria

This phase is complete when:

- `master` contains the current Roots React pilot baseline,
- `origin/master` is updated,
- `staging` exists and points to the verified baseline or a clear blocker is documented,
- `scripts/roots-react-release-check.ps1` passes on the final branch,
- legacy static files remain untouched,
- `https://roots-react.vercel.app` is reachable,
- any remaining Vercel dashboard steps are explicitly documented.

## Implementation Notes

Implementation should be conservative:

- check branch state before merging,
- never force-push,
- prefer fast-forward updates where possible,
- preserve the existing backup app,
- record branch names, commit SHAs, URLs, and verification results in the final handoff.

