# Roots React Vercel Release

## Purpose

This document defines the deployment workflow for promoting the Roots React staging release through Vercel preview and production environments. It is intended to keep the React pilot isolated from the legacy static calculator while giving reviewers a repeatable release path.

## Deployment Model

The existing Vercel CLI deployment proved that the React pilot builds and runs on Vercel:

```text
https://roots-react.vercel.app
```

That CLI deploy is not the preferred long-term workflow. The preferred workflow is Git-connected Vercel deployment:

```text
feature branch -> staging -> master
```

Expected Vercel behavior:

- pushes to `staging` create protected preview deployments,
- merges to `master` create production deployments,
- Vercel builds only `roots-react/`.

## Branch Roles

- Feature branches such as `codex/roots-react-pilot`: active implementation branches only. They are not the private staging release branch.
- `staging`: private release-candidate branch. Feature branches merge or cherry-pick into `staging`, and `staging` is expected to produce the private staging deployment.
- `master`: production branch for this repository unless the repository default is changed later.
- Promotion path: feature branch -> staging -> master.

Do not promote to production until the local promotion gate and staging smoke checklist both pass for the exact commit being promoted.

## Vercel Project Settings

```text
Project root directory: roots-react
Framework preset: Vite
Install command: npm install
Build command: npm run build
Output directory: dist
Production branch: master
```

Keep `Install command: npm install` for the initial Vercel setup because the release plan requires that exact setting. `npm ci` can be considered later after Vercel setup is stable.

Because Vercel builds from roots-react as the project root, files above roots-react are not available during the Vercel build. Always run npm run sync:legacy before committing a release candidate so the copied legacy engine files inside roots-react are current.

## Private Staging Access

Enable Vercel Deployment Protection with Vercel Authentication and Standard Protection for preview deployments. Share staging only with approved reviewers. If account-level protection is unavailable, treat the staging URL as unlisted and do not share it broadly.

## Local Promotion Gate

Before merging or cherry-picking a feature branch into `staging`, run the canonical release check, `scripts/roots-react-release-check.ps1`, from the repository root:

```powershell
.\scripts\roots-react-release-check.ps1
```

The script runs the engine audit, root-engine audit, `sync:legacy`, stale synced legacy diff guard, typecheck, and build. Treat a passing run as the local gate for moving implementation work from a feature branch into `staging`.

After the gate passes, confirm the legacy static calculator files remain untouched unless the release explicitly includes approved legacy changes, then record the candidate commit SHA for staging review.

## Git-Connected Vercel Setup

Use the Vercel dashboard to connect the GitHub repository to the existing `roots-react` Vercel project.

Required setup:

1. Open the `roots-react` project in Vercel.
2. Connect the GitHub repository `JACOB-droid12/Numerical_Analysis_Final_ver`.
3. Confirm the project root directory is `roots-react`.
4. Confirm the production branch is `master`.
5. Confirm preview deployments are enabled for non-production branches.
6. Enable Deployment Protection for preview deployments when available.

Do not create a second Vercel project for the repository root.

## Staging Deployment Steps

1. Merge or cherry-pick the approved feature branch changes into `staging`.
2. Push `staging` to the remote repository.
3. Confirm Vercel creates the private staging preview deployment from `staging` using the project settings above.
4. Verify Deployment Protection is enabled before sharing the preview URL.
5. Share the preview URL only with approved reviewers.
6. Complete `docs/deployment/roots-react-staging-smoke-checklist.md` against the staging deployment and exact commit SHA.
7. Resolve any blocking findings on a feature branch, rerun the local promotion gate, merge or cherry-pick the fix into `staging`, and repeat staging review for the new commit.

## Production Promotion Steps

1. Confirm the local promotion gate passed for the exact commit being promoted.
2. Confirm the staging smoke checklist passed for the same commit SHA.
3. Merge `staging` into `master` using the approved project workflow.
4. Confirm Vercel creates a production deployment from `master`.
5. Smoke test the production URL using the same high-level checks as staging.
6. Record the production deployment URL and promoted commit SHA in the release notes or handoff.

## Rollback

If staging fails, keep the candidate branch out of production and fix forward on the branch.

If production fails after promotion:

1. Revert the production merge or redeploy the last known good production commit.
2. Confirm Vercel completes the rollback deployment.
3. Run the staging smoke checklist against the restored production behavior.
4. Document the failed commit SHA, rollback target SHA, and observed failure.
