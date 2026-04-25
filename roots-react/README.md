# Roots React Pilot

This folder is the old transitional Vite + React + TypeScript + Tailwind pilot for the Roots Workbench. The active deployment target and source of truth now live in:

```text
new-migration/roots-react-workbench/
```

## Local Commands

```powershell
npm install
npm run sync:legacy
npm run typecheck
npm run build
npm run dev
```

## Deployment

Do not use this folder as the Vercel project root. Use `new-migration/roots-react-workbench/` for active Roots React deployment work.

For deployment settings, staging flow, and release checks, start at:

```text
docs/deployment/README.md
```

From the repository root, the canonical release gate is:

```powershell
.\scripts\roots-react-release-check.ps1
```

Do not deploy the repository root for the React workbench.

## UI Dependency Layer

This pilot uses Tailwind directly plus a small shadcn-style primitive layer:

```text
src/lib/cn.ts
src/components/ui/Button.tsx
```

Installed UI dependencies:

- `class-variance-authority` for typed component variants,
- `clsx` and `tailwind-merge` for class composition,
- `lucide-react` for icons,
- `gsap` for future animation work.

Use the local `Button` primitive before adding one-off button classes. Keep GSAP reserved for deliberate motion passes; do not add animations to numerical result changes unless reduced-motion behavior and readability are preserved.
