# Release Finalization and Git-Connected Vercel Baseline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Merge the Roots React pilot into `master`, update `staging` from the verified baseline, and confirm the Vercel production URL remains healthy.

**Architecture:** Treat this as a release operation, not feature work. Run gates before merge, merge the existing feature branch into `master`, verify again, push `master`, then create or fast-forward `staging` only when safe.

**Tech Stack:** Git, PowerShell, Vercel CLI via `npx vercel`, browser verification, existing release check script.

---

## File Structure

This plan should not create or modify application files.

Expected branch operations:

- merge `codex/roots-react-pilot` into `master`,
- push `master`,
- create or fast-forward `staging` to the verified `master` baseline,
- push `staging`.

Potential local metadata:

- Vercel CLI may read local `roots-react/.vercel/` metadata.
- Do not commit `.vercel/`.

Do not modify:

- `index.html`
- `app.js`
- `styles.css`
- `roots/`
- `roots-react/src/`
- numerical engine files

## Task 1: Pre-Merge Readiness Check

**Files:**

- No file changes.

- [ ] **Step 1: Confirm current branch and clean state**

Run from repository root:

```powershell
git branch --show-current
git status --short
```

Expected:

```text
codex/roots-react-pilot
```

and no output from `git status --short`.

Stop if the worktree is dirty.

- [ ] **Step 2: Confirm remote branches**

Run:

```powershell
git branch --list master staging
git ls-remote --heads origin master
git ls-remote --heads origin staging
```

Expected:

```text
master exists locally and remotely.
staging may exist or may be absent.
```

If `master` is missing locally or remotely, stop and report the blocker.

- [ ] **Step 3: Run canonical release check on feature branch**

Run:

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

Stop if the command fails.

- [ ] **Step 4: Confirm legacy backup diff is empty**

Run:

```powershell
git diff -- index.html app.js styles.css roots/
```

Expected:

```text
No output.
```

Stop if any diff appears.

## Task 2: Merge Feature Branch Into Master

**Files:**

- No manual file edits.
- Git branch operation only.

- [ ] **Step 1: Fetch remote branch state**

Run:

```powershell
git fetch origin master
```

Expected:

```text
Fetch completes without error.
```

- [ ] **Step 2: Switch to master**

Run:

```powershell
git switch master
```

Expected:

```text
Switched to branch 'master'
```

Stop if the switch fails.

- [ ] **Step 3: Fast-forward local master to origin/master**

Run:

```powershell
git merge --ff-only origin/master
```

Expected:

```text
Already up to date.
```

or a successful fast-forward.

Stop if fast-forward is not possible.

- [ ] **Step 4: Merge the feature branch into master**

Run:

```powershell
git merge --no-ff codex/roots-react-pilot -m "Merge Roots React pilot release baseline"
```

Expected:

```text
Merge completes without conflicts.
```

If conflicts occur, stop. Do not resolve conflicts casually during this release operation.

- [ ] **Step 5: Record master commit SHA**

Run:

```powershell
git rev-parse HEAD
```

Expected:

```text
A 40-character commit SHA for the merged master baseline.
```

Save this SHA for the final handoff.

## Task 3: Verify And Push Master

**Files:**

- No manual file edits.

- [ ] **Step 1: Run release check on master**

Run:

```powershell
.\scripts\roots-react-release-check.ps1
```

Expected:

```text
All checks pass on master.
```

Stop if this fails.

- [ ] **Step 2: Confirm legacy backup diff is empty on master**

Run:

```powershell
git diff -- index.html app.js styles.css roots/
```

Expected:

```text
No output.
```

Stop if any diff appears.

- [ ] **Step 3: Push master**

Run:

```powershell
git push origin master
```

Expected:

```text
master is pushed to origin.
```

Stop if push is rejected.

- [ ] **Step 4: Confirm origin/master matches local master**

Run:

```powershell
git rev-parse master
git rev-parse origin/master
```

Expected:

```text
Both SHAs match.
```

## Task 4: Create Or Update Staging

**Files:**

- No manual file edits.
- Git branch operation only.

- [ ] **Step 1: Check whether remote staging exists**

Run:

```powershell
git ls-remote --heads origin staging
```

Expected:

```text
Either a staging ref is printed, or no output if staging does not exist.
```

- [ ] **Step 2: If staging does not exist, create it from master**

Only run this if `origin/staging` does not exist:

```powershell
git switch -c staging master
git push -u origin staging
```

Expected:

```text
staging is created locally and pushed to origin.
```

- [ ] **Step 3: If staging exists, fast-forward it to master**

Only run this if `origin/staging` exists:

```powershell
git fetch origin staging
git switch staging
git merge --ff-only master
git push origin staging
```

Expected:

```text
staging fast-forwards to master and pushes successfully.
```

Stop if fast-forward is not possible. Do not force-push.

- [ ] **Step 4: Confirm staging matches master**

Run:

```powershell
git rev-parse master
git rev-parse staging
```

Expected:

```text
Both SHAs match.
```

## Task 5: Verify Vercel Production URL

**Files:**

- No file changes.

- [ ] **Step 1: Verify HTTP 200**

Run:

```powershell
Invoke-WebRequest -Uri "https://roots-react.vercel.app" -UseBasicParsing | Select-Object -ExpandProperty StatusCode
```

Expected:

```text
200
```

- [ ] **Step 2: Open production URL in browser**

Use the browser tool to open:

```text
https://roots-react.vercel.app
```

Expected:

```text
Page title is NET+ Roots Workbench.
```

- [ ] **Step 3: Check browser console**

Use the browser console inspection tool.

Expected:

```text
0 errors.
```

- [ ] **Step 4: Inspect Vercel deployment if CLI is available**

Run from `roots-react/`:

```powershell
npx vercel inspect https://roots-react.vercel.app
```

Expected:

```text
Deployment status is Ready.
```

If this command cannot confirm Git-connected deployment, record this as an account-side follow-up instead of claiming Git integration is complete.

## Task 6: Document Vercel Git Integration Follow-Up If Needed

**Files:**

- Modify only if Git integration cannot be confirmed locally: `docs/deployment/roots-react-agent-release-checklist.md`

- [ ] **Step 1: Decide whether a documentation note is needed**

If Vercel inspection confirms the existing project is Git-connected to `JACOB-droid12/Numerical_Analysis_Final_ver`, skip this task.

If it cannot be confirmed, continue.

- [ ] **Step 2: Add account-side follow-up note**

Append this section to `docs/deployment/roots-react-agent-release-checklist.md`:

```markdown
## Account-Side Vercel Follow-Up

- [ ] Existing Vercel project checked: `marvillarq20-3593s-projects/roots-react`
- [ ] GitHub repository connected: `JACOB-droid12/Numerical_Analysis_Final_ver`
- [ ] Root Directory confirmed: `roots-react`
- [ ] Production Branch confirmed: `master`
- [ ] Preview deployments confirmed for `staging`
- [ ] Deployment Protection confirmed for preview deployments, or staging URL treated as unlisted.
```

- [ ] **Step 3: Commit the follow-up note**

Run:

```powershell
git add docs/deployment/roots-react-agent-release-checklist.md
git commit -m "docs: add vercel git integration follow-up checklist"
git push origin master
```

Expected:

```text
The follow-up note is committed and pushed to master.
```

## Task 7: Final Handoff

**Files:**

- No file changes.

- [ ] **Step 1: Confirm final branch state**

Run:

```powershell
git branch --show-current
git status --short
git rev-parse master
git rev-parse origin/master
git rev-parse staging
git rev-parse origin/staging
```

Expected:

```text
Worktree is clean.
master and origin/master match.
staging and origin/staging match.
staging matches master or a documented blocker exists.
```

- [ ] **Step 2: Summarize release result**

Final handoff must include:

```text
Branch merged: codex/roots-react-pilot -> master
Master SHA:
Staging SHA:
Production URL: https://roots-react.vercel.app
Release check result:
Legacy backup diff result:
Vercel status:
Remaining Vercel dashboard steps, if any:
```

## Stop Conditions

Stop and report instead of proceeding if:

- release check fails,
- legacy backup diff is non-empty,
- local `master` cannot fast-forward to `origin/master`,
- merge into `master` has conflicts,
- push to `master` is rejected,
- `staging` cannot fast-forward to `master`,
- Vercel production URL is unreachable,
- any command requires force push or destructive reset.

## Execution Notes

- Do not use `git reset --hard`.
- Do not force-push.
- Do not delete branches.
- Do not modify runtime app files during this release operation.
- If subagents are used, use GPT-5.5 with low reasoning as requested by the user.

