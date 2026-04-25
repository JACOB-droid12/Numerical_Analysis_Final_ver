# Roots React Staging Release Design

Date: 2026-04-24  
Status: Draft for user review

## Purpose

Create a deployment and release workflow for the isolated `roots-react/` pilot so it can be tested privately before any public release. This phase is about release safety and repeatability, not new calculator features.

The static calculator, existing `roots/` workbench, and offline double-click backup remain intact. The deployment target for this phase is only `roots-react/`.

## Decisions

- Priority order: deployment/share stability first, study workflow second, compare methods third.
- Deployment target: `roots-react/` only.
- Staging model: one private staging site from a dedicated `staging` branch.
- Production model: Vercel default production URL first, custom domain later.
- Promotion gate: manual review plus required build/audit checks.
- Access: staging should be limited to approved reviewers, not open to anyone with the link.

## Branch Model

The release flow should be:

```text
feature branch
  -> reviewed merge
staging branch
  -> private Vercel staging deployment
  -> required checks and manual browser smoke review
production branch
  -> Vercel production deployment
```

Recommended branch roles:

- `codex/*` or similar feature branches: active implementation work by Codex, Claude Code, or other coding agents.
- `staging`: private testable deployment for the current candidate release.
- `master` or `main`: production-ready code.

The exact production branch name should follow the repository's existing default branch. Do not rename branches as part of this phase unless needed for Vercel or Git hosting consistency.

## Vercel Project Shape

The Vercel project should point at the repository but build only `roots-react/`.

Expected Vercel settings:

- Root directory: `roots-react`
- Install command: default or `npm install`
- Build command: `npm run build`
- Output directory: `dist`
- Framework preset: Vite

The deployment must not publish repository docs, `.superpowers/`, legacy audits, screenshots, local tooling, or the static backup app as part of the React app output.

## Staging Access

Staging should be private to approved reviewers. Preferred Vercel behavior is access protection on the staging deployment.

If Vercel account settings make access protection unavailable, the fallback is:

- keep staging URLs unlisted,
- mark the app visibly as staging only if needed,
- avoid sharing the staging URL broadly,
- revisit formal access control before using staging with real users.

The design preference remains approved-reviewer access, not public-by-link staging.

## Production URL Strategy

Use the Vercel default production URL first.

Reasons:

- avoids DNS work while the React pilot is still stabilizing,
- gives a usable public URL quickly,
- keeps custom-domain setup independent from app architecture,
- makes rollback and redeploy testing easier during the first release cycle.

Custom domain setup is deferred until the pilot is stable enough for normal users.

## Promotion Gate

Promotion from staging to production requires both automated checks and manual review.

Required checks from repository root:

```powershell
node scripts/engine-correctness-audit.js
node scripts/root-engine-audit.js
```

Required checks from `roots-react/`:

```powershell
npm run sync:legacy
npm run typecheck
npm run build
```

Required manual staging smoke review:

- Bisection returns an answer and evidence preview.
- Newton-Raphson returns an answer and evidence preview.
- Secant returns an answer and evidence preview.
- False Position returns an answer and evidence preview.
- Fixed Point returns an answer and evidence preview.
- `Copy answer` is visible as the main post-run action.
- Confidence summary appears near the answer.
- `Show full work` expands and `Hide full work` collapses.
- Editing an input after a run marks the result stale.
- Changing angle mode after a run marks the result stale.
- Changing method after a run keeps the last answer visible and marked stale.

Production promotion should not happen if any required check fails.

## Agentic Coding Workflow

Coding agents should work on feature branches, not directly on `staging` or the production branch.

Recommended agent flow:

```text
create feature branch
make scoped changes
run local checks
review diff
merge or cherry-pick into staging
verify staging
promote to production only after gate passes
```

This helps prevent agent-generated experiments from changing the site users see before review.

For larger work, each phase should keep the same pattern used in the React pilot:

- design spec,
- implementation plan,
- scoped implementation,
- deterministic checks,
- browser verification where UI behavior changes.

## Rollback

Rollback should be simple and branch-based:

- If staging is bad, fix the feature branch or reset `staging` to the previous known-good commit.
- If production is bad, redeploy the previous production deployment in Vercel or revert the production branch to the previous known-good commit.

No database rollback is needed in this phase because the Roots React pilot is client-side and stateless.

## Non-Goals

This phase does not include:

- full compare-methods implementation,
- study workflow features such as history, saved runs, exports, or presets,
- numerical engine rewrites,
- deploying the legacy static calculator as part of the React app,
- custom domain setup,
- full automated CI promotion,
- payment, auth, database, or user accounts.

## Success Criteria

This phase is successful when:

- `roots-react/` can be deployed to a private staging Vercel site from `staging`,
- production can be deployed from the production branch to a Vercel default URL,
- the promotion gate is documented and repeatable,
- required checks can be run locally or in CI,
- staging smoke review catches UI regressions before production,
- the static backup remains available in the repository and untouched.

## Open Implementation Questions

These are implementation details for the next planning phase:

- whether to use Vercel CLI first or connect the Git repository through the Vercel dashboard,
- whether GitHub Actions or Vercel build checks should run the required audit commands,
- whether staging access protection is available on the current Vercel account,
- whether the repository's production branch is `master` or `main`.

These questions do not change the release design. They determine the implementation plan.
