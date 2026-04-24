# Roots React Vercel Release

## Purpose

This document defines the deployment workflow for promoting the Roots React staging release through Vercel preview and production environments. It is intended to keep the React pilot isolated from the legacy static calculator while giving reviewers a repeatable release path.

## Branch Roles

- `codex/roots-react-pilot`: release-candidate branch for Roots React staging validation.
- Vercel preview deployments: staging review environments created from non-production branches.
- Production branch: `master` or `main`, matching the repository default.

Do not promote to production until the local promotion gate and staging smoke checklist both pass for the exact commit being promoted.

## Vercel Project Settings

```text
Project root directory: roots-react
Framework preset: Vite
Install command: npm install
Build command: npm run build
Output directory: dist
Production branch: master or main, matching the repository default
```

Because Vercel builds from roots-react as the project root, files above roots-react are not available during the Vercel build. Always run npm run sync:legacy before committing a release candidate so the copied legacy engine files inside roots-react are current.

## Private Staging Access

Enable Vercel Deployment Protection with Vercel Authentication and Standard Protection for preview deployments. Share staging only with approved reviewers. If account-level protection is unavailable, treat the staging URL as unlisted and do not share it broadly.

## Local Promotion Gate

Before creating or updating a release candidate commit:

1. Run `npm run sync:legacy` from `roots-react`.
2. Run the Roots React local build and test commands defined for the pilot.
3. Run the repository audit scripts relevant to the changed surface, including `node scripts/engine-correctness-audit.js` if any engine file changed.
4. Confirm the legacy static calculator files remain untouched unless the release explicitly includes approved legacy changes.
5. Record the candidate commit SHA for staging review.

## Staging Deployment Steps

1. Push the release-candidate branch to the remote repository.
2. Confirm Vercel creates a preview deployment using the project settings above.
3. Verify Deployment Protection is enabled before sharing the preview URL.
4. Share the preview URL only with approved reviewers.
5. Complete `docs/deployment/roots-react-staging-smoke-checklist.md` against the preview deployment and exact commit SHA.
6. Resolve any blocking findings on the release-candidate branch and repeat staging review for the new commit.

## Production Promotion Steps

1. Confirm the local promotion gate passed for the exact commit being promoted.
2. Confirm the staging smoke checklist passed for the same commit SHA.
3. Merge the release-candidate branch into the repository default branch using the approved project workflow.
4. Confirm Vercel creates a production deployment from the default branch.
5. Smoke test the production URL using the same high-level checks as staging.
6. Record the production deployment URL and promoted commit SHA in the release notes or handoff.

## Rollback

If staging fails, keep the candidate branch out of production and fix forward on the branch.

If production fails after promotion:

1. Revert the production merge or redeploy the last known good production commit.
2. Confirm Vercel completes the rollback deployment.
3. Run the staging smoke checklist against the restored production behavior.
4. Document the failed commit SHA, rollback target SHA, and observed failure.
