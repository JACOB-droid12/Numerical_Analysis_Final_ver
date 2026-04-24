# Roots React Staging Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the isolated `roots-react/` pilot deployable through a private Vercel staging flow with repeatable checks before production.

**Architecture:** Keep the legacy static calculator and `roots/` workbench untouched. Add release support around the existing React pilot: a local release-check script, Vercel project configuration inside `roots-react/`, and deployment documentation that treats `staging` as the private review branch and the repository default branch as production.

**Tech Stack:** Vite, React, TypeScript, Tailwind, PowerShell, Node audit scripts, Git branches, Vercel.

---

## Phase 1: Confirm Repo and Deployment Baseline

- [ ] Verify the active working branch and default production branch.

  Run from repository root:

  ```powershell
  git branch --show-current
  git branch --list master main staging
  git remote -v
  ```

  Expected result:

  - active implementation branch is `codex/roots-react-pilot` or another feature branch,
  - `master` or `main` is identified as the production branch,
  - `staging` exists or is confirmed absent before creation,
  - a remote exists before planning Vercel Git integration.

- [ ] Verify the React pilot has the expected build scripts.

  Inspect:

  ```powershell
  Get-Content -Raw roots-react/package.json
  ```

  Expected scripts:

  - `sync:legacy`
  - `typecheck`
  - `build`
  - `dev`
  - `preview`

- [ ] Run the current release checks once before editing release files.

  Run from repository root:

  ```powershell
  node scripts/engine-correctness-audit.js
  node scripts/root-engine-audit.js
  ```

  Run from `roots-react/`:

  ```powershell
  npm run sync:legacy
  npm run typecheck
  npm run build
  ```

  Expected result:

  - engine correctness audit passes,
  - root engine audit passes,
  - legacy sync succeeds,
  - TypeScript passes,
  - Vite production build succeeds.

## Phase 2: Add a Repeatable Release Check Script

- [ ] Create `scripts/roots-react-release-check.ps1`.

  Purpose:

  - run the root engine audits from the repository root,
  - run React legacy sync, typecheck, and build from `roots-react/`,
  - fail immediately when any required check fails,
  - keep the command simple enough for Codex, Claude Code, GitHub Actions, or a human reviewer.

  File content:

  ```powershell
  $ErrorActionPreference = "Stop"

  $repoRoot = Split-Path -Parent $PSScriptRoot
  $reactRoot = Join-Path $repoRoot "roots-react"

  Push-Location $repoRoot
  try {
      node scripts/engine-correctness-audit.js
      node scripts/root-engine-audit.js
  }
  finally {
      Pop-Location
  }

  Push-Location $reactRoot
  try {
      npm run sync:legacy
      npm run typecheck
      npm run build
  }
  finally {
      Pop-Location
  }
  ```

- [ ] Run the new release check.

  Run from repository root:

  ```powershell
  .\scripts\roots-react-release-check.ps1
  ```

  Expected result:

  - all required audit, sync, typecheck, and build steps pass through one command.

- [ ] Commit the release script.

  Suggested commit:

  ```powershell
  git add scripts/roots-react-release-check.ps1
  git commit -m "chore: add roots react release check"
  ```

## Phase 3: Add Vercel Project Configuration

- [ ] Create `roots-react/vercel.json`.

  Purpose:

  - keep deploy configuration beside the app Vercel will build,
  - document that this is a Vite static output,
  - keep production output restricted to `roots-react/dist`.

  File content:

  ```json
  {
    "$schema": "https://openapi.vercel.sh/vercel.json",
    "framework": "vite",
    "buildCommand": "npm run build",
    "outputDirectory": "dist",
    "installCommand": "npm install"
  }
  ```

- [ ] Verify the Vercel config is valid JSON.

  Run from repository root:

  ```powershell
  node -e "JSON.parse(require('fs').readFileSync('roots-react/vercel.json','utf8')); console.log('roots-react/vercel.json ok')"
  ```

  Expected output:

  ```text
  roots-react/vercel.json ok
  ```

- [ ] Run the release check again.

  Run from repository root:

  ```powershell
  .\scripts\roots-react-release-check.ps1
  ```

- [ ] Commit the Vercel config.

  Suggested commit:

  ```powershell
  git add roots-react/vercel.json
  git commit -m "chore: configure roots react vercel build"
  ```

## Phase 4: Document the Release Workflow

- [ ] Create `docs/deployment/roots-react-vercel-release.md`.

  Include these sections:

  - purpose,
  - branch roles,
  - Vercel project settings,
  - private staging access,
  - local promotion gate,
  - staging deployment steps,
  - production promotion steps,
  - rollback.

  Required Vercel project settings:

  ```text
  Project root directory: roots-react
  Framework preset: Vite
  Install command: npm install
  Build command: npm run build
  Output directory: dist
  Production branch: master or main, matching the repository default
  ```

  Required note:

  ```text
  Because Vercel builds from roots-react as the project root, files above roots-react are not available during the Vercel build. Always run npm run sync:legacy before committing a release candidate so the copied legacy engine files inside roots-react are current.
  ```

  Required staging access guidance:

  ```text
  Enable Vercel Deployment Protection with Vercel Authentication and Standard Protection for preview deployments. Share staging only with approved reviewers. If account-level protection is unavailable, treat the staging URL as unlisted and do not share it broadly.
  ```

- [ ] Create `docs/deployment/roots-react-staging-smoke-checklist.md`.

  Include this manual checklist:

  ```markdown
  # Roots React Staging Smoke Checklist

  URL under review:
  Commit SHA:
  Reviewer:
  Date:

  - [ ] Bisection returns an answer and evidence preview.
  - [ ] Newton-Raphson returns an answer and evidence preview.
  - [ ] Secant returns an answer and evidence preview.
  - [ ] False Position returns an answer and evidence preview.
  - [ ] Fixed Point returns an answer and evidence preview.
  - [ ] Copy answer is visible as the main post-run action.
  - [ ] Confidence summary appears near the answer.
  - [ ] Show full work expands evidence.
  - [ ] Hide full work collapses evidence.
  - [ ] Editing an input after a run marks the result stale.
  - [ ] Changing angle mode after a run marks the result stale.
  - [ ] Changing method after a run keeps the last answer visible and marked stale.
  - [ ] Desktop layout has no overlapping text or clipped controls.
  - [ ] Mobile layout has no overlapping text or clipped controls.
  - [ ] Browser console has no runtime errors.
  ```

- [ ] Commit the deployment docs.

  Suggested commit:

  ```powershell
  git add docs/deployment/roots-react-vercel-release.md docs/deployment/roots-react-staging-smoke-checklist.md
  git commit -m "docs: document roots react staging release"
  ```

## Phase 5: Prepare the Staging Branch

- [ ] Check whether `staging` already exists locally or remotely.

  Run from repository root:

  ```powershell
  git branch --list staging
  git ls-remote --heads origin staging
  ```

  Expected result:

  - if `staging` exists, update it by merging the reviewed feature branch,
  - if `staging` does not exist, create it from the reviewed release candidate commit.

- [ ] Create or update `staging`.

  If `staging` does not exist:

  ```powershell
  git switch -c staging
  git push -u origin staging
  ```

  If `staging` exists:

  ```powershell
  git switch staging
  git merge --ff-only codex/roots-react-pilot
  git push origin staging
  ```

  Expected result:

  - `staging` points to the same release candidate that passed `scripts/roots-react-release-check.ps1`.

- [ ] Return to the implementation branch after staging is updated.

  Run:

  ```powershell
  git switch codex/roots-react-pilot
  ```

## Phase 6: Configure Vercel

- [ ] Create or import the Vercel project from the Git repository.

  Use the Vercel dashboard first because it makes branch and protection settings clearer for this project.

  Configure:

  ```text
  Root Directory: roots-react
  Framework Preset: Vite
  Install Command: npm install
  Build Command: npm run build
  Output Directory: dist
  Production Branch: repository default branch, master or main
  ```

- [ ] Enable private staging access.

  In Vercel project settings:

  ```text
  Settings -> Deployment Protection
  Method: Vercel Authentication
  Scope: Standard Protection
  ```

  Expected result:

  - preview and generated deployment URLs require approved Vercel access,
  - public production custom domains remain outside this phase,
  - staging is not treated as public-by-link.

- [ ] Confirm Git branch deployment behavior.

  Expected behavior:

  - pushes to `staging` create preview deployments,
  - pushes or merges to the production branch create production deployments,
  - the deployed output is only the Vite `dist` output from `roots-react`.

## Phase 7: Verify Staging

- [ ] Open the staging deployment in the browser.

  Expected result:

  - app loads without publishing the legacy root app,
  - no repository docs or local tooling are exposed in the app output.

- [ ] Complete `docs/deployment/roots-react-staging-smoke-checklist.md` for the staging URL.

  Use desktop and mobile viewport checks.

  Required browser checks:

  - all five methods,
  - answer-first flow,
  - evidence preview,
  - show/hide full work,
  - stale result behavior,
  - console error check.

- [ ] Fix any staging-only failures on a feature branch.

  Rule:

  - do not patch `staging` directly unless the fix is a reviewed release commit,
  - do not promote while the smoke checklist has failing items.

## Phase 8: Promote to Production

- [ ] Run the release check on the final release candidate.

  Run from repository root:

  ```powershell
  .\scripts\roots-react-release-check.ps1
  ```

- [ ] Merge the verified candidate into the production branch.

  If production is `master`:

  ```powershell
  git switch master
  git merge --ff-only staging
  git push origin master
  ```

  If production is `main`:

  ```powershell
  git switch main
  git merge --ff-only staging
  git push origin main
  ```

  Expected result:

  - Vercel creates a production deployment from the production branch,
  - production URL uses the default Vercel URL for this phase.

- [ ] Smoke test production with the same checklist.

  Required minimum:

  - one bracket method,
  - one open method,
  - copy answer,
  - stale-state behavior,
  - console error check.

## Phase 9: Rollback Procedure

- [ ] If staging fails, reset staging to the previous known-good commit or merge a reviewed fix.

  Preferred:

  ```powershell
  git switch staging
  git revert <bad_commit_sha>
  git push origin staging
  ```

- [ ] If production fails, use the Vercel dashboard to redeploy the previous production deployment or revert the production branch.

  Branch rollback option for `master`:

  ```powershell
  git switch master
  git revert <bad_commit_sha>
  git push origin master
  ```

  Branch rollback option for `main`:

  ```powershell
  git switch main
  git revert <bad_commit_sha>
  git push origin main
  ```

## Phase 10: Final Verification and Handoff

- [ ] Confirm the static backup remains untouched.

  Check:

  ```powershell
  git diff -- index.html app.js styles.css roots/
  ```

  Expected result:

  - no diff unless a later task explicitly approved legacy edits.

- [ ] Confirm release files are present.

  Expected files:

  ```text
  scripts/roots-react-release-check.ps1
  roots-react/vercel.json
  docs/deployment/roots-react-vercel-release.md
  docs/deployment/roots-react-staging-smoke-checklist.md
  ```

- [ ] Final local check.

  Run:

  ```powershell
  .\scripts\roots-react-release-check.ps1
  git status --short
  ```

  Expected result:

  - release check passes,
  - only intentional documentation or release files are changed,
  - no legacy static calculator edits are present.

## Implementation Notes

- Use Vercel dashboard configuration for the first setup because branch selection and Deployment Protection are easier to review visually.
- Use Vercel CLI later only after the dashboard project is linked and the staging workflow is confirmed.
- Keep `roots-react/` self-contained for Vercel. Vercel's root directory setting means files above `roots-react/` are unavailable during build, so synced legacy engine files must be committed before deployment.
- Do not introduce GSAP, shadcn/ui, database, auth, or custom domain work in this phase.
- Do not deploy the legacy static app as part of this Vercel project.

