# Roots React Agent Release Checklist

Use this checklist for Roots React PRs, staging handoffs, and production handoffs.

## Scope

- [ ] Work is limited to the Roots React pilot or release docs.
- [ ] The Vercel deployment target is `new-migration/roots-react-workbench/`.
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

## Required CI Gate

- [ ] GitHub Actions workflow completed: `.github/workflows/roots-react-ci.yml`
- [ ] Roots React CI passed for the commit SHA under review.
- [ ] Any failed CI run is fixed before staging or production promotion.

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

## Account-Side Vercel Follow-Up

- [ ] Existing Vercel project checked: `marvillarq20-3593s-projects/roots-react`
- [ ] GitHub repository connected: `JACOB-droid12/Numerical_Analysis_Final_ver`
- [ ] Root Directory confirmed: `new-migration/roots-react-workbench`
- [ ] Production Branch confirmed: `master`
- [ ] Preview deployments confirmed for `staging`
- [ ] Deployment Protection confirmed for preview deployments, or staging URL treated as unlisted.
