# Agent-Ready Release Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Roots React release workflow obvious and repeatable for Codex, Claude Code, and human reviewers.

**Architecture:** Keep this phase documentation and process focused. Add one reusable release checklist, one reusable PR body, and tighten the existing deployment docs so agents can distinguish CLI proof deploys from the preferred Git-connected Vercel workflow.

**Tech Stack:** Markdown documentation, Git branches, Vercel Git deployment, PowerShell release check.

---

## File Structure

Create:

- `docs/deployment/roots-react-agent-release-checklist.md`  
  Standard copyable checklist for PR, staging, and production handoffs.

- `docs/deployment/roots-react-pr-body.md`  
  Reusable PR body text for this React pilot branch and future Roots React release branches.

Modify:

- `docs/deployment/README.md`  
  Add direct links to the new checklist and PR body so agents find them first.

- `docs/deployment/roots-react-vercel-release.md`  
  Clarify that the existing CLI deploy proved Vercel compatibility, but Git-connected Vercel deployment is the long-term release lane.

- `AGENTS.md`  
  Add the release checklist and PR body to the Roots React + Vercel fast lane.

Do not modify:

- `index.html`
- `app.js`
- `styles.css`
- `roots/`
- runtime React app source under `roots-react/src/`
- numerical engine files

## Task 1: Add Agent Release Checklist

**Files:**

- Create: `docs/deployment/roots-react-agent-release-checklist.md`

- [ ] **Step 1: Create the checklist file**

Add this exact file content:

```markdown
# Roots React Agent Release Checklist

Use this checklist for Roots React PRs, staging handoffs, and production handoffs.

## Scope

- [ ] Work is limited to the Roots React pilot or release docs.
- [ ] The Vercel deployment target is `roots-react/`.
- [ ] The repository root is not being deployed as the React pilot.
- [ ] No legacy static calculator changes are included unless explicitly approved.

## Branch

- [ ] Current branch:
- [ ] Target branch:
- [ ] Commit SHA under review:
- [ ] Branch role is clear:
  - feature branch for implementation,
  - `staging` for private release candidate,
  - `master` for production.

## Changed Files

- [ ] Changed files reviewed.
- [ ] `index.html` untouched unless explicitly approved.
- [ ] `app.js` untouched unless explicitly approved.
- [ ] `styles.css` untouched unless explicitly approved.
- [ ] `roots/` untouched unless explicitly approved.
- [ ] Numerical engine files untouched unless explicitly approved.

## Required Local Gate

Run from repository root:

```powershell
.\scripts\roots-react-release-check.ps1
```

Record result:

- [ ] Engine correctness audit passed.
- [ ] Root engine audit passed.
- [ ] `sync:legacy` passed.
- [ ] Stale synced legacy diff guard passed.
- [ ] TypeScript typecheck passed.
- [ ] Vite production build passed.

## Staging Handoff

- [ ] Candidate is merged or cherry-picked into `staging`.
- [ ] `staging` commit SHA:
- [ ] Vercel staging URL:
- [ ] Deployment protection is enabled, or the URL is treated as unlisted.
- [ ] `docs/deployment/roots-react-staging-smoke-checklist.md` completed.
- [ ] Blocking findings are fixed on a feature branch, not patched directly on `staging`.

## Production Handoff

- [ ] Staging checklist passed for the exact commit being promoted.
- [ ] Candidate is merged from `staging` into `master`.
- [ ] Production commit SHA:
- [ ] Vercel production URL:
- [ ] Production smoke check completed.
- [ ] Rollback target SHA or previous deployment URL recorded.

## Final Notes

- [ ] Summary includes what changed.
- [ ] Summary includes verification commands and results.
- [ ] Summary includes deployment URL when applicable.
- [ ] Summary includes any deferred risks or account-side Vercel setup still needed.
```

- [ ] **Step 2: Verify checklist has required sections**

Run:

```powershell
Select-String -Path docs/deployment/roots-react-agent-release-checklist.md -Pattern 'Scope','Branch','Changed Files','Required Local Gate','Staging Handoff','Production Handoff','Final Notes'
```

Expected:

```text
Each listed section appears at least once.
```

- [ ] **Step 3: Commit the checklist**

Run:

```powershell
git add docs/deployment/roots-react-agent-release-checklist.md
git commit -m "docs: add roots react agent release checklist"
```

## Task 2: Add Reusable PR Body

**Files:**

- Create: `docs/deployment/roots-react-pr-body.md`

- [ ] **Step 1: Create the PR body file**

Add this exact file content:

```markdown
# Roots React PR Body

Use this body for Roots React pilot PRs. Complete each blank field before submitting the PR.

## Summary

- 
- 
- 

## Scope

- React pilot path: `roots-react/`
- Deployment target: `roots-react/`
- Production branch: `master`
- Staging branch: `staging`

## Legacy Backup

- [ ] `index.html` untouched unless explicitly approved.
- [ ] `app.js` untouched unless explicitly approved.
- [ ] `styles.css` untouched unless explicitly approved.
- [ ] `roots/` untouched unless explicitly approved.

## Verification

Run from repository root:

```powershell
.\scripts\roots-react-release-check.ps1
```

Result:

- [ ] Passed
- [ ] Failed, with notes below

## Vercel

- Current production URL: `https://roots-react.vercel.app`
- Vercel project root directory: `roots-react`
- Preview or staging URL:
- Production URL:

## Notes

- 
```

- [ ] **Step 2: Verify PR body has required release fields**

Run:

```powershell
Select-String -Path docs/deployment/roots-react-pr-body.md -Pattern 'Summary','Legacy Backup','Verification','Vercel','roots-react','master','staging'
```

Expected:

```text
Each listed field appears at least once.
```

- [ ] **Step 3: Commit the PR body**

Run:

```powershell
git add docs/deployment/roots-react-pr-body.md
git commit -m "docs: add roots react pr body"
```

## Task 3: Link Release Artifacts From Deployment Fast Lane

**Files:**

- Modify: `docs/deployment/README.md`

- [ ] **Step 1: Update the route table**

In `docs/deployment/README.md`, replace the existing route table with this table:

```markdown
| Task | Start Here |
|------|------------|
| Need Vercel settings | `docs/deployment/roots-react-vercel-release.md` |
| Need staging or production release steps | `docs/deployment/roots-react-vercel-release.md` |
| Need agent release checklist | `docs/deployment/roots-react-agent-release-checklist.md` |
| Need PR body text | `docs/deployment/roots-react-pr-body.md` |
| Need manual QA checklist | `docs/deployment/roots-react-staging-smoke-checklist.md` |
| Need local release verification | `scripts/roots-react-release-check.ps1` |
| Need React app commands | `roots-react/package.json` |
| Need Vercel project config | `roots-react/vercel.json` |
```

- [ ] **Step 2: Add a Release Handoff section**

Add this section after the "Required Local Gate" section:

```markdown
## Release Handoff

Use `docs/deployment/roots-react-agent-release-checklist.md` for every PR, staging handoff, and production handoff.

Use `docs/deployment/roots-react-pr-body.md` when creating a GitHub PR manually or through an agent.

The checklist and PR body are intentionally separate:

- the checklist tracks whether the release is safe,
- the PR body communicates the change to reviewers.
```

- [ ] **Step 3: Verify links are present**

Run:

```powershell
Select-String -Path docs/deployment/README.md -Pattern 'roots-react-agent-release-checklist.md','roots-react-pr-body.md','Release Handoff'
```

Expected:

```text
All three patterns are present.
```

- [ ] **Step 4: Commit the deployment README update**

Run:

```powershell
git add docs/deployment/README.md
git commit -m "docs: link roots react release handoff artifacts"
```

## Task 4: Clarify CLI Proof Deploy vs Git-Connected Vercel Flow

**Files:**

- Modify: `docs/deployment/roots-react-vercel-release.md`

- [ ] **Step 1: Add deployment model section**

In `docs/deployment/roots-react-vercel-release.md`, add this section after "Purpose":

```markdown
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
```

- [ ] **Step 2: Add Git connection steps**

In the same file, add this section before "Staging Deployment Steps":

```markdown
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
```

- [ ] **Step 3: Verify deployment model language**

Run:

```powershell
Select-String -Path docs/deployment/roots-react-vercel-release.md -Pattern 'CLI deployment proved','Git-connected Vercel deployment','Do not create a second Vercel project','staging','master'
```

Expected:

```text
All listed patterns are present.
```

- [ ] **Step 4: Commit the Vercel release doc update**

Run:

```powershell
git add docs/deployment/roots-react-vercel-release.md
git commit -m "docs: clarify roots react vercel deployment model"
```

## Task 5: Update AGENTS Fast Lane

**Files:**

- Modify: `AGENTS.md`

- [ ] **Step 1: Add checklist and PR body to the route table**

In the "Roots React + Vercel Fast Lane" table in `AGENTS.md`, add these rows:

```markdown
| `docs/deployment/roots-react-agent-release-checklist.md` | Copyable PR, staging, and production handoff checklist |
| `docs/deployment/roots-react-pr-body.md` | Reusable GitHub PR body for Roots React changes |
```

- [ ] **Step 2: Add final handoff rule**

After the branch flow block, add:

```markdown
Every Roots React handoff should include:

- branch name,
- commit SHA,
- `.\scripts\roots-react-release-check.ps1` result,
- Vercel URL when deployed,
- whether the legacy static backup stayed untouched.
```

- [ ] **Step 3: Verify AGENTS references the new files**

Run:

```powershell
Select-String -Path AGENTS.md -Pattern 'roots-react-agent-release-checklist.md','roots-react-pr-body.md','Every Roots React handoff'
```

Expected:

```text
All three patterns are present.
```

- [ ] **Step 4: Commit the AGENTS update**

Run:

```powershell
git add AGENTS.md
git commit -m "docs: tighten roots react agent handoff rules"
```

## Task 6: Final Verification

**Files:**

- No new files.
- Verifies all previous tasks.

- [ ] **Step 1: Confirm legacy backup was not changed**

Run:

```powershell
git diff -- index.html app.js styles.css roots/
```

Expected:

```text
No output.
```

- [ ] **Step 2: Run the canonical release check**

Run from repository root:

```powershell
.\scripts\roots-react-release-check.ps1
```

Expected:

```text
Engine correctness audit passes.
Root engine audit passes.
sync:legacy passes.
Stale synced legacy diff guard passes.
TypeScript typecheck passes.
Vite production build passes.
```

- [ ] **Step 3: Confirm release docs are discoverable**

Run:

```powershell
Select-String -Path AGENTS.md,docs/deployment/README.md,docs/deployment/roots-react-vercel-release.md -Pattern 'roots-react-agent-release-checklist.md','roots-react-pr-body.md','scripts/roots-react-release-check.ps1'
```

Expected:

```text
Each pattern appears in at least one route or instruction file.
```

- [ ] **Step 4: Confirm worktree state**

Run:

```powershell
git status --short
```

Expected:

```text
No output.
```

## Execution Notes

- This plan intentionally avoids runtime app changes.
- If a Vercel dashboard action is needed, document the exact handoff instead of guessing account settings.
- If `gh` is unavailable, use the GitHub web URL and `docs/deployment/roots-react-pr-body.md`.
- If future agents need subagents for execution, use GPT-5.5 with low reasoning as requested by the user.
