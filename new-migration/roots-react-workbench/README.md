# Roots React Workbench

This folder is the migrated Vite + React + TypeScript + Tailwind app for the Roots Workbench.

## Local Commands

```powershell
npm install
npm run sync:legacy
npm run typecheck
npm run build
npm run dev
```

## Source Boundary

Active migrated source lives in:

```text
new-migration/roots-react-workbench/
```

Keep React app code, app-local scripts, Vite config, package metadata, and copied legacy engine sources inside this folder.

## Transitional Note

The old `roots-react/` folder remains as the current production pilot until the migration is promoted. Do not treat changes under `roots-react/` as part of this migrated app unless a task explicitly asks to sync from it.

## Deployment

When this migration becomes the deployment target, Vercel must build this folder as the project root:

```text
new-migration/roots-react-workbench/
```

Do not deploy the repository root for the React workbench.

## UI Dependency Layer

This app uses Tailwind directly plus a small shadcn-style primitive layer:

```text
src/lib/cn.ts
src/components/ui/Button.tsx
```

Installed UI dependencies:

- `class-variance-authority` for typed component variants,
- `clsx` and `tailwind-merge` for class composition,
- `lucide-react` for icons,
- `gsap` for deliberate animation work.

Use the local `Button` primitive before adding one-off button classes. Keep GSAP reserved for deliberate motion passes; do not add animations to numerical result changes unless reduced-motion behavior and readability are preserved.
