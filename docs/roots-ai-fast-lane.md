# Roots AI Fast Lane

Use this file before editing Roots. The goal is to keep AI context small and avoid touching the main calculator unless the request explicitly crosses that boundary.

## Start Here

1. Read `docs/roots-context.md`.
2. Pick one route below.
3. Read only the files listed for that route.
4. Run the matching audits before finishing.

## Routes

### Roots UI, Copy, Or Styling

Read:

- `docs/roots-context.md`
- `docs/roots-ai-fast-lane.md`
- `roots/index.html`
- `roots/roots.css`

Do not edit `index.html`, `app.js`, or `styles.css` for ordinary Roots mini-app UI work.

Run:

```powershell
node scripts/roots-mini-app-static-audit.js
node scripts/roots-mini-app-ui-audit.js
```

### Roots Interaction Wiring

Read:

- `docs/roots-context.md`
- `roots/roots-app.js`
- `roots/roots-state.js`
- `roots/index.html`

Run:

```powershell
node scripts/roots-mini-app-ui-audit.js
node scripts/roots-mini-app-static-audit.js
```

### Roots Rendering

Read:

- `docs/roots-context.md`
- `roots/roots-render.js`
- `roots/roots-state.js`
- `roots/index.html`

Run:

```powershell
node scripts/roots-mini-app-ui-audit.js
```

### Roots Adapter Or Request Packaging

Read:

- `docs/roots-context.md`
- `roots/roots-engine-adapter.js`
- `roots/roots-state.js`
- `root-engine.js` only for public API names and expected option fields

Run:

```powershell
node scripts/root-engine-audit.js
node scripts/roots-mini-app-ui-audit.js
```

### Roots Numerical Behavior

Read:

- `docs/roots-context.md`
- `root-engine.js`
- `scripts/root-engine-audit.js`
- `scripts/engine-correctness-audit.js` when expression or arithmetic behavior changes

Run:

```powershell
node scripts/engine-correctness-audit.js
node scripts/root-engine-audit.js
```

### Main Calculator Roots Bridge

Read:

- `index.html`
- `app.js`
- `styles.css`
- `scripts/roots-mini-app-static-audit.js`

Run:

```powershell
node scripts/roots-mini-app-static-audit.js
node scripts/engine-correctness-audit.js
```

## Boundary Rule

If a request does not fit one route, ask one short clarification before reading broad context. If a change crosses from `roots/` into the main calculator, name that boundary crossing before editing.

## Full Verification

Use this when a task is broad or uncertain:

```powershell
node scripts/engine-correctness-audit.js
node scripts/root-engine-audit.js
node scripts/roots-mini-app-static-audit.js
node scripts/roots-mini-app-ui-audit.js
node scripts/roots-fast-lane-audit.js
```
