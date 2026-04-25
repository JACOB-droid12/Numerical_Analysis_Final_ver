# Legacy Static Archive

This folder is the protected archive for the old numerical analysis app.

Do not edit files here unless the user explicitly asks for legacy work or the active migrated app needs a specific behavior, engine case, visual treatment, or content asset ported. Prefer copying/adapting the smallest required piece into `../new-migration/roots-react-workbench/` instead of making the migrated app depend on this folder.

## Contents

| Path | Purpose |
|------|---------|
| `index.html`, `app.js`, `styles.css` | Original single-page static calculator |
| `roots/` | Standalone static Roots backup |
| `roots-react/` | Previous React/Vercel pilot, now historical |
| `math-engine.js`, `calc-engine.js`, `expression-engine.js`, `poly-engine.js`, `root-engine.js`, `ieee754.js` | Legacy engine sources |
| `scripts/` | Legacy/static audit scripts |
| `docs/` | Historical architecture, deployment, plans, and specs |
| `calculator-companion-site/`, `calculator-site-content/` | Companion static site and content |

## Legacy Commands

Run from `legacy-static/` only when intentionally testing the old app:

```powershell
node scripts/engine-correctness-audit.js
node scripts/root-engine-audit.js
node scripts/roots-mini-app-static-audit.js
node scripts/roots-mini-app-ui-audit.js
node scripts/roots-fast-lane-audit.js
python -m http.server 7432
```

For current migrated app work, leave this folder and work in `../new-migration/roots-react-workbench/`.
