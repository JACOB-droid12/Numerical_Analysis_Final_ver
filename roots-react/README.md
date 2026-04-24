# Roots React Pilot

This folder is the isolated Vite + React + TypeScript + Tailwind pilot for the Roots Workbench.

## Local Commands

```powershell
npm install
npm run sync:legacy
npm run typecheck
npm run build
npm run dev
```

## Deployment

Vercel must build this folder as the project root:

```text
roots-react/
```

For deployment settings, staging flow, and release checks, start at:

```text
docs/deployment/README.md
```

From the repository root, the canonical release gate is:

```powershell
.\scripts\roots-react-release-check.ps1
```

Do not deploy the repository root for this React pilot.

