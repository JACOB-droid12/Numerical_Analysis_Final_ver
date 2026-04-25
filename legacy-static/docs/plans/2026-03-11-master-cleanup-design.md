# Master Cleanup Design

## Goal

Promote the real Numerical Analysis teaching-lab app on `codex/project-evolution-explorer` to `master` while cleaning the repository down to app source and important documentation only.

## Current State

- `master` currently contains only planning documents.
- `codex/project-evolution-explorer` contains the actual browser-based numerical analysis app.
- That branch also includes a large amount of non-project clutter:
  - generated screenshots
  - Playwright artifacts
  - server logs
  - temporary helper files
  - duplicate agent/skill folders
  - an archived duplicate app under `DO NOT OPEN UNLESS SPECIFIED TO DO SO!/`
  - a separate `project-evolution-explorer` release microsite

## Desired Repository Shape

Keep:

- the root static app source:
  - `index.html`
  - `styles.css`
  - `app.js`
  - `math-engine.js`
  - `expression-engine.js`
  - `calc-engine.js`
  - `poly-engine.js`
  - `math-display.js`
- important docs:
  - `docs/plans/`
  - `lesson-roundoff.pdf`
- useful project script(s):
  - `scripts/build-deliverable.ps1`
- new repository hygiene files:
  - `README.md`
  - `.gitignore`

Remove:

- `.agent/`, `.agents/`, `.claude/`
- `.playwright-cli/`, `.playwright-mcp/`
- `output/`
- all `*.log` and `*.png` audit/output artifacts
- `__tmp_server__.js`
- `DO NOT OPEN UNLESS SPECIFIED TO DO SO!/`
- `project-evolution-explorer.html`
- `project-evolution-explorer.css`
- `project-evolution-explorer.js`
- `scripts/check-project-evolution-explorer.ps1`
- `CLAUDE.md`
- `skills-lock.json`

## Repository Organization

- Keep the runnable app at the repository root because it is a standalone static site.
- Keep planning/history docs under `docs/plans/`.
- Keep the lesson PDF as supporting course material.
- Keep only the deliverable helper script in `scripts/`.
- Add a README that tells a newcomer what the app is and how to open it locally.
- Add a `.gitignore` that prevents logs, screenshots, temporary server files, generated deliverables, and local tool folders from returning.

## Branch Strategy

- Perform the cleanup on `codex/project-evolution-explorer`, since that branch already contains the real app.
- Verify the cleaned working tree contains the intended files and no junk.
- Move `master` to the cleaned commit.
- Push the updated `master` to GitHub.

Because the current remote `master` is not the same history line as the app branch, updating GitHub will likely require a force push. The old history remains in Git and is not deleted locally.

## Verification

Before claiming completion:

- confirm the kept root files still exist
- confirm removed artifact directories/files are gone from git status/diff
- confirm `master` points to the cleaned commit
- confirm the remote `master` matches after push
