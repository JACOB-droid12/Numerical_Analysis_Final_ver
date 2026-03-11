# Master Cleanup Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Clean `codex/project-evolution-explorer` down to the real Numerical Analysis app plus important docs, then promote that cleaned result to `master`.

**Architecture:** Keep the static app files at the repository root, preserve only documentation and supporting course material, and remove generated artifacts plus duplicate/temporary content. Add a small `README.md` and `.gitignore` so the cleaned repository stays understandable and stable.

**Tech Stack:** Git, PowerShell, static HTML/CSS/JavaScript

---

### Task 1: Document the cleaned repository shape

**Files:**
- Create: `C:\Users\Emmy Lou\Downloads\New folder (16)\README.md`
- Create: `C:\Users\Emmy Lou\Downloads\New folder (16)\.gitignore`

**Step 1: Write the failing test**

Check the current repo shape and note the missing docs/hygiene files.

**Step 2: Run test to verify it fails**

Run: `Test-Path README.md; Test-Path .gitignore`
Expected: both paths are missing

**Step 3: Write minimal implementation**

- Add `README.md` with a short project overview and local usage instructions.
- Add `.gitignore` entries for logs, screenshots, Playwright artifacts, output folders, temp server files, local tool folders, and generated deliverables.

**Step 4: Run test to verify it passes**

Run: `Test-Path README.md; Test-Path .gitignore`
Expected: both paths exist

**Step 5: Commit**

```bash
git add README.md .gitignore
git commit -m "docs: add repo readme and ignore rules"
```

### Task 2: Remove non-project clutter from the app branch

**Files:**
- Delete tracked clutter from:
  - `C:\Users\Emmy Lou\Downloads\New folder (16)\.agent\`
  - `C:\Users\Emmy Lou\Downloads\New folder (16)\.agents\`
  - `C:\Users\Emmy Lou\Downloads\New folder (16)\.claude\`
  - `C:\Users\Emmy Lou\Downloads\New folder (16)\.playwright-cli\`
  - `C:\Users\Emmy Lou\Downloads\New folder (16)\.playwright-mcp\`
  - `C:\Users\Emmy Lou\Downloads\New folder (16)\output\`
  - `C:\Users\Emmy Lou\Downloads\New folder (16)\DO NOT OPEN UNLESS SPECIFIED TO DO SO!\`
- Delete tracked root artifacts:
  - `*.png`
  - `*.log`
  - `__tmp_server__.js`
  - `project-evolution-explorer.html`
  - `project-evolution-explorer.css`
  - `project-evolution-explorer.js`
  - `CLAUDE.md`
  - `skills-lock.json`
  - `scripts/check-project-evolution-explorer.ps1`

**Step 1: Write the failing test**

List the tracked files that should not remain in the cleaned repo.

**Step 2: Run test to verify it fails**

Run: `git ls-files`
Expected: includes Playwright/output/log/artifact files and duplicate app content

**Step 3: Write minimal implementation**

Remove the tracked clutter while preserving:

- `index.html`
- `styles.css`
- `app.js`
- `math-engine.js`
- `expression-engine.js`
- `calc-engine.js`
- `poly-engine.js`
- `math-display.js`
- `lesson-roundoff.pdf`
- `docs/plans/`
- `scripts/build-deliverable.ps1`

**Step 4: Run test to verify it passes**

Run: `git ls-files`
Expected: the kept app/docs files remain and the clutter paths are absent

**Step 5: Commit**

```bash
git add -A
git commit -m "chore: clean repository to app source and docs"
```

### Task 3: Verify branch state and promote the cleaned repo to master

**Files:**
- Verify: `C:\Users\Emmy Lou\Downloads\New folder (16)\master`
- Verify: `C:\Users\Emmy Lou\Downloads\New folder (16)\origin/master`

**Step 1: Write the failing test**

Compare `master` against the cleaned branch and confirm they differ before promotion.

**Step 2: Run test to verify it fails**

Run: `git diff --stat master..HEAD`
Expected: non-empty diff showing `master` is not yet the cleaned app branch

**Step 3: Write minimal implementation**

- Move `master` to the cleaned commit.
- Push `master` to `origin`.
- Use force-with-lease only if required by the branch-history mismatch.

**Step 4: Run test to verify it passes**

Run: `git rev-parse master; git rev-parse HEAD`
Expected: both SHAs match

Run: `git ls-remote --heads origin master`
Expected: remote `master` SHA matches the cleaned commit SHA

**Step 5: Commit**

No new content commit; this task updates branch pointers and remote state.
