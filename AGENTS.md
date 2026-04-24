# Machine Arithmetic and Error Analysis Lab

A single-page vanilla JavaScript numerical analysis calculator. No build system, no framework, no npm -- just HTML/CSS/JS served statically.

## Roots Fast Lane

Roots UI work should start with `docs/roots-context.md` and `docs/roots-ai-fast-lane.md`.

Current Roots architecture:

| File | Responsibility |
|------|---------------|
| `root-engine.js` | Root-finding numerical core: bisection, Newton, secant, false position, fixed point |
| `roots/index.html` | Standalone Roots shell and markup |
| `roots/roots-app.js` | Roots DOM events, angle toggle, symbols, compute orchestration |
| `roots/roots-state.js` | Active method, cached runs, angle mode, default state |
| `roots/roots-render.js` | Result cards, diagnostics, graph, solution steps, tables |
| `roots/roots-engine-adapter.js` | Maps UI fields to `RootEngine` calls |
| `roots/roots.css` | Roots-only styling |
| `index.html` | Main calculator shell; the Roots tab is only a bridge to `roots/index.html` |

`root-ui.js` has been removed. The main calculator no longer loads `root-engine.js` or `root-ui.js`.

For ordinary Roots UI/copy/style work, do not edit `index.html`, `app.js`, or `styles.css`. Use the route table in `docs/roots-ai-fast-lane.md`.

## Roots React + Vercel Fast Lane

The isolated React pilot lives in `roots-react/`. It is the only Vercel deployment target for the migrated Roots Workbench.

For Vercel, release, staging, or production work, start with:

| File | Purpose |
|------|---------|
| `docs/deployment/README.md` | Deployment entry point and route table for agents |
| `docs/deployment/roots-react-vercel-release.md` | Vercel settings, branch flow, staging, promotion, rollback |
| `docs/deployment/roots-react-staging-smoke-checklist.md` | Manual staging and production smoke checklist |
| `docs/deployment/roots-react-agent-release-checklist.md` | Copyable PR, staging, and production handoff checklist |
| `docs/deployment/roots-react-pr-body.md` | Reusable GitHub PR body for Roots React changes |
| `scripts/roots-react-release-check.ps1` | Canonical local release gate |
| `roots-react/vercel.json` | Vercel build metadata for the React pilot |
| `roots-react/package.json` | React app scripts |

Do not deploy the repository root to Vercel for the React pilot. Use `roots-react` as the Vercel project root directory.

Before merging, staging, or promoting Roots React changes, run:

```powershell
.\scripts\roots-react-release-check.ps1
```

Branch flow for the React pilot:

```text
feature branch -> staging -> master
```

Every Roots React handoff should include:

- branch name,
- commit SHA,
- `.\scripts\roots-react-release-check.ps1` result,
- Vercel URL when deployed,
- whether the legacy static backup stayed untouched.

The current production URL is `https://roots-react.vercel.app`.

## Engine Architecture

Each engine is a standalone IIFE that attaches to `window`:

| File | Responsibility |
|------|---------------|
| `ieee754.js` | Machine representation, chopping, rounding, normalization |
| `math-engine.js` | Scalar arithmetic with exact vs machine comparison |
| `calc-engine.js` | Multi-operand calculations with error propagation |
| `expression-engine.js` | Free-form expression parsing and stepwise evaluation |
| `poly-engine.js` | Polynomial evaluation (Horner vs Direct methods) |
| `root-engine.js` | Root-finding: bisection, Newton, secant, false position, fixed point |
| `app.js` | Wires all engines to DOM events |

Load order matters -- `app.js` must come last and requires all engines present on `window`.

## Test Battery

All tests run with `node scripts/<name>.js`:

- `node scripts/engine-correctness-audit.js` -- 47 canonical tests (fast, run first)
- `node scripts/battery-validation.js` -- full category battery
- `node scripts/ieee754-audit.js` -- IEEE 754 edge cases
- `node scripts/root-engine-audit.js` -- root-finding accuracy
- `node scripts/roots-mini-app-static-audit.js` -- Roots entry-point, bridge, and static UI audit
- `node scripts/roots-mini-app-ui-audit.js` -- standalone Roots wiring audit
- `node scripts/roots-fast-lane-audit.js` -- Roots fast-lane guidance audit

Always run `node scripts/engine-correctness-audit.js` after any engine file change.

## Known Numerical Edge Cases

- Catastrophic cancellation when `x ≈ y` in subtraction
- Polynomial near-root sensitivity: Horner and Direct methods diverge -- intentional behavior
- Rounding carry: `9.9996` -> `10.000` requires exponent renormalization
- Negative zero (`-0`) must display separately from `0`
- Bisection pathologies documented in `bisection_nightmares.js`

## Companion Site

`calculator-companion-site/` is a static site. Content source: `calculator-site-content/content/*.json`

## Common Commands

```bash
node scripts/engine-correctness-audit.js   # quick sanity check
node scripts/battery-validation.js         # full test suite
python -m http.server 7432                 # preview app
```
