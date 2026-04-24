# Agent-Ready Release Pipeline Design

Date: 2026-04-24  
Status: Approved design direction, pending implementation plan

## Purpose

Make the Roots React pilot safe for repeated work by Codex, Claude Code, and other AI coding agents. The release path should be obvious, repeatable, and hard to confuse with the legacy static calculator.

This phase is about operational clarity and release safety. It does not add new numerical features, study mode, compare mode, animations, or visual redesign.

## Current State

The repository now has:

- a legacy static calculator at the repository root,
- the backup standalone Roots app under `roots/`,
- an isolated React pilot under `roots-react/`,
- a live Vercel deployment at `https://roots-react.vercel.app`,
- Vercel project metadata for the React pilot,
- a canonical release check at `scripts/roots-react-release-check.ps1`,
- deployment docs under `docs/deployment/`,
- a Roots React + Vercel fast lane in `AGENTS.md`.

The main remaining risk is process confusion: future agents may edit the wrong app, deploy the wrong folder, skip the release check, or treat a one-time CLI deployment as the long-term release process.

## Goals

- Make `roots-react/` the unmistakable Vercel deployment target.
- Keep the legacy static calculator and `roots/` backup intact.
- Make the branch flow explicit for agents and humans.
- Make Vercel Git deployment the preferred long-term path.
- Create a clear staging branch policy.
- Make one release checklist the standard handoff artifact.
- Keep all release checks tied to `scripts/roots-react-release-check.ps1`.
- Reduce ambiguity for future AI agents working in the repo.

## Non-Goals

This phase does not include:

- Compare Methods implementation,
- Study Mode implementation,
- GSAP animation work,
- expanded shadcn/ui component adoption,
- custom domain setup,
- authentication, users, database, payments, or analytics,
- rewriting numerical logic,
- deploying the legacy static app through the Roots React Vercel project.

## Branch Model

The release flow is:

```text
feature branch -> staging -> master -> Vercel production
```

Branch roles:

- `codex/*`, `claude/*`, or similar feature branches: active implementation and experimentation.
- `staging`: private release-candidate branch for reviewer validation.
- `master`: production branch for this repository.

Rules:

- Agents should not work directly on `staging` or `master`.
- Feature branches must pass the release check before merge or cherry-pick into `staging`.
- `staging` should represent the exact candidate being reviewed.
- `master` should receive only reviewed staging candidates.
- If the repository default branch changes later, update the deployment docs and Vercel settings in the same change.

## Vercel Deployment Model

Preferred long-term deployment model:

- Vercel project is connected to the GitHub repository.
- Vercel project root directory is `roots-react`.
- `staging` branch deployments are private preview deployments.
- `master` branch deployments are production deployments.

Required Vercel project settings:

```text
Project root directory: roots-react
Framework preset: Vite
Install command: npm install
Build command: npm run build
Output directory: dist
Production branch: master
```

The existing direct CLI deployment is useful as proof that the app builds and runs on Vercel. It is not the preferred long-term release workflow because it bypasses the branch-based review lane.

## Staging Access

Staging should be review-only. The preferred setup is Vercel Deployment Protection with Vercel Authentication and Standard Protection for preview deployments.

If account settings do not allow formal preview protection, staging URLs should be treated as unlisted and shared only with approved reviewers. That fallback is acceptable for early pilot validation but should not be treated as public release policy.

## Canonical Release Check

All Roots React release candidates must run:

```powershell
.\scripts\roots-react-release-check.ps1
```

The script verifies:

- legacy engine correctness audit,
- root engine audit,
- React legacy engine sync,
- stale synced legacy diff guard,
- TypeScript typecheck,
- Vite production build.

Agents must not replace this with an incomplete command subset. Extra checks are allowed, but this command remains the minimum gate.

## Agent Operating Rules

Future AI agents should follow these rules:

- Start with `AGENTS.md`.
- For Vercel or release work, start with `docs/deployment/README.md`.
- For Roots React app work, start with `roots-react/README.md`.
- Do not deploy the repository root to Vercel for the React pilot.
- Do not edit `index.html`, `app.js`, `styles.css`, or `roots/` for React pilot work unless explicitly requested.
- Do not rewrite `root-engine.js` just to change UI behavior.
- Keep `roots-react/public/legacy` synced through the release check.
- Use feature branches for implementation.
- Run the canonical release check before handoff.
- Record the branch, commit SHA, deployment URL, and check result in final handoff.

## Release Checklist

This phase should produce a single agent-facing release checklist that can be copied into PRs, staging handoffs, or production handoffs.

Checklist sections:

- scope confirmation,
- changed files summary,
- legacy backup untouched confirmation,
- release check result,
- staging branch and commit SHA,
- staging Vercel URL,
- staging smoke checklist result,
- production branch and commit SHA,
- production Vercel URL,
- rollback notes.

The checklist should link to:

- `docs/deployment/README.md`,
- `docs/deployment/roots-react-vercel-release.md`,
- `docs/deployment/roots-react-staging-smoke-checklist.md`,
- `scripts/roots-react-release-check.ps1`.

## GitHub PR Workflow

The current feature branch should be reviewed through a PR before becoming the baseline for `master`.

Expected PR behavior:

- base branch: `master`,
- head branch: current feature branch,
- summary includes React pilot, Vercel release setup, deployment docs, and UI dependency foundation,
- test plan includes `.\scripts\roots-react-release-check.ps1`,
- notes that legacy static calculator files are untouched.

The absence of GitHub CLI should not block the workflow. If `gh` is unavailable, the PR can be created through the GitHub web URL.

## Rollback

Rollback should stay branch-based and Vercel-native:

- If staging fails, fix forward on a feature branch and update `staging`.
- If production fails, revert the production merge or redeploy the previous known-good Vercel production deployment.
- Document the failed commit SHA, restored commit SHA, and observed failure.

No database rollback is needed because this pilot is client-side and stateless.

## Success Criteria

This phase is complete when:

- `AGENTS.md` points agents to the release operating path,
- deployment docs clearly distinguish CLI proof deploy from Git-based long-term deploy,
- the `staging` branch policy is documented and ready to execute,
- the release checklist exists in one obvious place,
- Vercel Git setup steps are explicit enough for an agent or human to follow,
- the legacy static calculator remains untouched,
- `scripts/roots-react-release-check.ps1` remains the canonical gate.

## Implementation Notes

Likely implementation artifacts:

- update `docs/deployment/README.md` with the release checklist route,
- add `docs/deployment/roots-react-agent-release-checklist.md`,
- tighten `docs/deployment/roots-react-vercel-release.md` to separate CLI proof deploy from Git-connected deployment,
- update `AGENTS.md` to reference the release checklist,
- optionally add PR body text under `docs/deployment/` for repeatable GitHub PR creation.

Implementation should stay documentation and process focused. It should not modify runtime app behavior.

