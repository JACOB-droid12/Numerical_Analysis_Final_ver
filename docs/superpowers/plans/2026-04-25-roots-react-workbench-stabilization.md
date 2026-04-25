# Roots React Workbench Stabilization Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Move the active Roots React Workbench into `new-migration/roots-react-workbench/`, restore the release gate, and fix the visible UI states that currently misrepresent invalid or incomplete numerical runs.

**Architecture:** Use copy-first migration so `roots-react/` remains available as transitional reference while all active tooling moves to `new-migration/roots-react-workbench/`. Put the migrated engine source files beside the React app and sync browser-loaded copies from those local engine sources. Keep UI changes focused in React components and formatter helpers.

**Tech Stack:** React 19, Vite, TypeScript, Tailwind CSS, PowerShell release scripts, browser-loaded legacy numerical engines.

---

## Scope Check

This plan covers one release unit: the source-of-truth migration plus the immediate and selected short-term stabilization fixes approved in the design spec. It intentionally does not add test infrastructure, extract ESM engine modules, create an `apps/` monorepo, or add new product features such as Help, Quick Command, CSV export, compare methods, saved sessions, or reports.

## File Structure

- `new-migration/roots-react-workbench/` becomes the active app folder.
- `new-migration/roots-react-workbench/src/hooks/useRootsWorkbench.ts` owns run state, invalid-run classification, stale/current behavior, and evidence expansion.
- `new-migration/roots-react-workbench/src/lib/rootEngineAdapter.ts` owns mapping form state into legacy engine calls and exposes small result-classification helpers.
- `new-migration/roots-react-workbench/src/lib/resultFormatters.ts` owns method labels, stop labels, confidence summaries, graph captions, copy text, solution text, and table cell formatting.
- `new-migration/roots-react-workbench/src/components/` owns visible UI fixes: removed no-op controls, method-specific formulas, graph caption display, confidence display, accessible form controls, and symbol editing.
- `new-migration/roots-react-workbench/math-engine.js`, `calc-engine.js`, `expression-engine.js`, `root-engine.js`, and `poly-engine.js` are the migrated local engine sources.
- `new-migration/roots-react-workbench/scripts/sync-legacy-engines.mjs` syncs local migrated engine files into `new-migration/roots-react-workbench/public/legacy/`.
- `scripts/roots-react-release-check.ps1` remains the root release gate entry point and targets the migrated app folder.
- `.github/workflows/roots-react-ci.yml` remains the CI entry point and targets the migrated app folder.
- `docs/deployment/*`, `README.md`, and `AGENTS.md` document the new active source boundary.
- `roots-react/` remains on disk as transitional reference only.

---

### Task 1: Copy React Source Into The Migrated App Folder

**Files:**
- Create/Replace: `new-migration/roots-react-workbench/src/**`
- Create/Replace: `new-migration/roots-react-workbench/public/**`
- Create/Replace: `new-migration/roots-react-workbench/scripts/**`
- Create/Replace: `new-migration/roots-react-workbench/package.json`
- Create/Replace: `new-migration/roots-react-workbench/package-lock.json`
- Create/Replace: `new-migration/roots-react-workbench/index.html`
- Create/Replace: `new-migration/roots-react-workbench/README.md`
- Create/Replace: `new-migration/roots-react-workbench/tsconfig.json`
- Create/Replace: `new-migration/roots-react-workbench/tsconfig.node.json`
- Create/Replace: `new-migration/roots-react-workbench/vite.config.ts`
- Create/Replace: `new-migration/roots-react-workbench/vercel.json`
- Create/Replace: `new-migration/roots-react-workbench/.gitignore`
- Create/Replace: `new-migration/roots-react-workbench/math-engine.js`
- Create/Replace: `new-migration/roots-react-workbench/calc-engine.js`
- Create/Replace: `new-migration/roots-react-workbench/expression-engine.js`
- Create/Replace: `new-migration/roots-react-workbench/root-engine.js`
- Create/Replace: `new-migration/roots-react-workbench/poly-engine.js`

- [ ] **Step 1: Verify the source and target folders**

Run from the repository root:

```powershell
Test-Path roots-react\package.json
Test-Path roots-react\src\App.tsx
Test-Path new-migration\roots-react-workbench
Get-ChildItem new-migration\roots-react-workbench -Force
```

Expected:

```text
True
True
True
```

The target folder may currently contain `dist/`, `node_modules/`, logs, and `*.tsbuildinfo`. Leave those files on disk for now; the copied `.gitignore` will keep generated artifacts out of git.

- [ ] **Step 2: Copy the source files into the migrated folder**

Run from the repository root:

```powershell
$Source = Resolve-Path "roots-react"
$Target = Resolve-Path "new-migration\roots-react-workbench"
$Names = @(
  ".gitignore",
  "index.html",
  "package-lock.json",
  "package.json",
  "README.md",
  "tsconfig.json",
  "tsconfig.node.json",
  "vercel.json",
  "vite.config.ts",
  "public",
  "scripts",
  "src"
)
foreach ($Name in $Names) {
  $From = Join-Path $Source $Name
  $To = Join-Path $Target $Name
  if (Test-Path $To) {
    Remove-Item -LiteralPath $To -Recurse -Force
  }
Copy-Item -LiteralPath $From -Destination $To -Recurse
}
$EngineFiles = @(
  "math-engine.js",
  "calc-engine.js",
  "expression-engine.js",
  "root-engine.js",
  "poly-engine.js"
)
foreach ($Name in $EngineFiles) {
  Copy-Item -LiteralPath $Name -Destination (Join-Path $Target $Name) -Force
}
```

Expected: command exits successfully and `new-migration/roots-react-workbench/src/App.tsx` exists.

- [ ] **Step 3: Rename the migrated package**

Modify `new-migration/roots-react-workbench/package.json`:

```json
{
  "name": "roots-react-workbench",
  "private": true,
  "version": "0.1.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "typecheck": "tsc --noEmit -p tsconfig.json && tsc --noEmit -p tsconfig.node.json",
    "build": "npm run typecheck && vite build",
    "preview": "vite preview",
    "sync:legacy": "node scripts/sync-legacy-engines.mjs"
  },
  "dependencies": {
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "gsap": "^3.15.0",
    "lucide-react": "^1.9.0",
    "react": "^19.2.5",
    "react-dom": "^19.2.5",
    "tailwind-merge": "^3.5.0"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.2.4",
    "@types/react": "^19.2.14",
    "@types/react-dom": "^19.2.3",
    "@vitejs/plugin-react": "^6.0.1",
    "tailwindcss": "^4.2.4",
    "typescript": "^6.0.3",
    "vite": "^8.0.9"
  }
}
```

Modify `new-migration/roots-react-workbench/package-lock.json` so the top-level package name is also `roots-react-workbench`:

```json
{
  "name": "roots-react-workbench",
  "version": "0.1.0",
  "lockfileVersion": 3,
  "requires": true,
  "packages": {
    "": {
      "name": "roots-react-workbench",
      "version": "0.1.0",
      "dependencies": {
```

Only change the top-level name fields; leave dependency versions unchanged.

- [ ] **Step 4: Update the migrated README**

Replace `new-migration/roots-react-workbench/README.md` with:

```markdown
# Roots React Workbench

This folder is the active Vite + React + TypeScript + Tailwind source of truth for the migrated Roots Workbench.

## Local Commands

```powershell
npm install
npm run sync:legacy
npm run typecheck
npm run build
npm run dev
```

## Source Boundary

Use this folder for current React, Vercel, staging, production, or migrated Roots UI work:

```text
new-migration/roots-react-workbench/
```

The old `roots-react/` folder is transitional reference only. Do not deploy or edit it for active migrated work.

## Deployment

Vercel must build this folder as the project root:

```text
new-migration/roots-react-workbench/
```

For deployment settings, staging flow, and release checks, start at:

```text
docs/deployment/README.md
```

From the repository root, the canonical release gate is:

```powershell
.\scripts\roots-react-release-check.ps1
```

## UI Dependency Layer

This workbench uses Tailwind directly plus a small shadcn-style primitive layer:

```text
src/lib/cn.ts
src/components/ui/Button.tsx
```

Installed UI dependencies:

- `class-variance-authority` for typed component variants,
- `clsx` and `tailwind-merge` for class composition,
- `lucide-react` for icons,
- `gsap` reserved for deliberate future motion work.
```

- [ ] **Step 5: Install dependencies in the migrated app**

Run:

```powershell
npm install --prefix new-migration\roots-react-workbench
```

Expected: install completes with no critical vulnerability report. A changed `new-migration/roots-react-workbench/package-lock.json` is acceptable if npm rewrites metadata consistently.

- [ ] **Step 6: Build the copied app before behavior changes**

Run:

```powershell
npm run build --prefix new-migration\roots-react-workbench
```

Expected: TypeScript and Vite build pass.

- [ ] **Step 7: Commit the source migration**

Run:

```powershell
git add new-migration/roots-react-workbench
git commit -m "chore: migrate roots workbench source"
```

Expected: commit includes the migrated app source and lockfile, not `dist/`, `node_modules/`, logs, or `*.tsbuildinfo`.

---

### Task 2: Retarget Release Gate, CI, Vercel, And Docs

**Files:**
- Modify: `scripts/roots-react-release-check.ps1`
- Modify: `.github/workflows/roots-react-ci.yml`
- Modify: `AGENTS.md`
- Modify: `README.md`
- Modify: `docs/deployment/README.md`
- Modify: `docs/deployment/roots-react-agent-release-checklist.md`
- Modify: `docs/deployment/roots-react-pr-body.md`
- Modify: `docs/deployment/roots-react-staging-smoke-checklist.md`
- Modify: `docs/deployment/roots-react-vercel-release.md`

- [ ] **Step 1: Update the release gate script**

Replace the path setup and legacy diff block in `scripts/roots-react-release-check.ps1` with this version:

```powershell
$ErrorActionPreference = "Stop"

function Invoke-RequiredCommand {
    param(
        [Parameter(Mandatory = $true)]
        [string] $Command,

        [Parameter(Mandatory = $true)]
        [string[]] $Arguments
    )

    & $Command @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "$Command $($Arguments -join ' ') failed with exit code $LASTEXITCODE"
    }
}

$RepoRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$RootsReactPath = Join-Path $RepoRoot "new-migration\roots-react-workbench"
$SyncedLegacyPath = "new-migration/roots-react-workbench/public/legacy"

Push-Location $RepoRoot
try {
    Invoke-RequiredCommand "node" @("scripts/engine-correctness-audit.js", $RootsReactPath)
    Invoke-RequiredCommand "node" @("scripts/root-engine-audit.js", $RootsReactPath)
}
finally {
    Pop-Location
}

Push-Location $RootsReactPath
try {
    Invoke-RequiredCommand "npm" @("run", "sync:legacy")

    Push-Location $RepoRoot
    try {
        & git diff --quiet -- $SyncedLegacyPath
        if ($LASTEXITCODE -eq 1) {
            Write-Error "$SyncedLegacyPath has tracked changes after sync. Commit the synced legacy engine files before running the release check."
        }
        elseif ($LASTEXITCODE -ne 0) {
            throw "git diff --quiet -- $SyncedLegacyPath failed with exit code $LASTEXITCODE"
        }
    }
    finally {
        Pop-Location
    }

    Invoke-RequiredCommand "npm" @("run", "typecheck")
    Invoke-RequiredCommand "npm" @("run", "build")
}
finally {
    Pop-Location
}
```

- [ ] **Step 2: Update the GitHub Actions workflow**

In `.github/workflows/roots-react-ci.yml`, update path filters, cache path, install command, and source references:

```yaml
name: Roots React CI

on:
  pull_request:
    branches:
      - master
      - staging
    paths:
      - ".github/workflows/roots-react-ci.yml"
      - "root-engine.js"
      - "new-migration/roots-react-workbench/**"
      - "scripts/engine-correctness-audit.js"
      - "scripts/root-engine-audit.js"
      - "scripts/roots-react-release-check.ps1"
      - "docs/deployment/**"
  push:
    branches:
      - master
      - staging
    paths:
      - ".github/workflows/roots-react-ci.yml"
      - "root-engine.js"
      - "new-migration/roots-react-workbench/**"
      - "scripts/engine-correctness-audit.js"
      - "scripts/root-engine-audit.js"
      - "scripts/roots-react-release-check.ps1"
      - "docs/deployment/**"
  workflow_dispatch:

concurrency:
  group: roots-react-ci-${{ github.ref }}
  cancel-in-progress: true

jobs:
  release-gate:
    name: Release gate
    runs-on: windows-latest
    timeout-minutes: 15

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
          cache-dependency-path: new-migration/roots-react-workbench/package-lock.json

      - name: Install Roots React Workbench dependencies
        run: npm ci --prefix new-migration/roots-react-workbench

      - name: Run Roots React Workbench release check
        shell: pwsh
        run: .\scripts\roots-react-release-check.ps1
```

- [ ] **Step 3: Update Vercel install metadata**

Modify `new-migration/roots-react-workbench/vercel.json`:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "installCommand": "npm ci"
}
```

- [ ] **Step 4: Update the root README active-source section**

In `README.md`, replace the “Roots React + Vercel Fast Lane” target references with:

```markdown
## Roots React + Vercel Fast Lane

The migrated React workbench lives in `new-migration/roots-react-workbench/`. It is the only Vercel deployment target for the migrated Roots Workbench.

For Vercel, release, staging, or production work, start with:

| File | Purpose |
|------|---------|
| `new-migration/roots-react-workbench/README.md` | Migrated app commands and source boundary |
| `docs/deployment/README.md` | Deployment entry point and route table for agents |
| `docs/deployment/roots-react-vercel-release.md` | Vercel settings, branch flow, staging, promotion, rollback |
| `docs/deployment/roots-react-staging-smoke-checklist.md` | Manual staging and production smoke checklist |
| `docs/deployment/roots-react-agent-release-checklist.md` | Copyable PR, staging, and production handoff checklist |
| `docs/deployment/roots-react-pr-body.md` | Reusable GitHub PR body for migrated Roots React changes |
| `scripts/roots-react-release-check.ps1` | Canonical local release gate |
| `.github/workflows/roots-react-ci.yml` | GitHub Actions release gate for `staging` and `master` |
| `new-migration/roots-react-workbench/vercel.json` | Vercel build metadata for the migrated app |
| `new-migration/roots-react-workbench/package.json` | React app scripts |

Do not deploy the repository root or the old `roots-react/` folder to Vercel for the migrated workbench. Use `new-migration/roots-react-workbench` as the Vercel project root directory.
```

- [ ] **Step 5: Update AGENTS command guidance**

In `AGENTS.md`, keep `new-migration/roots-react-workbench/` as the active folder and replace the release command block with:

```powershell
.\scripts\roots-react-release-check.ps1
```

Also make sure the “Current Migration Fast Lane” table includes these local engine source files in `new-migration/roots-react-workbench/`:

```text
math-engine.js
calc-engine.js
expression-engine.js
root-engine.js
poly-engine.js
```

- [ ] **Step 6: Update deployment docs by replacing old target strings**

Apply these replacements in `docs/deployment/*.md`:

```text
roots-react/ -> new-migration/roots-react-workbench/
roots-react/package-lock.json -> new-migration/roots-react-workbench/package-lock.json
npm ci --prefix roots-react -> npm ci --prefix new-migration/roots-react-workbench
Project root directory: roots-react -> Project root directory: new-migration/roots-react-workbench
Root Directory confirmed: roots-react -> Root Directory confirmed: new-migration/roots-react-workbench
```

Also add this sentence to `docs/deployment/README.md` under “Current Deployment Target”:

```markdown
The old `roots-react/` folder is transitional reference only and must not be used as the Vercel root.
```

- [ ] **Step 7: Verify no active docs still point to `roots-react/` as deploy target**

Run:

```powershell
Select-String -Path README.md,AGENTS.md,docs\deployment\*.md -Pattern "roots-react/"
```

Expected: matches only explain that `roots-react/` is transitional/reference, or no matches.

- [ ] **Step 8: Commit release-target retargeting**

Run:

```powershell
git add scripts/roots-react-release-check.ps1 .github/workflows/roots-react-ci.yml AGENTS.md README.md docs/deployment new-migration/roots-react-workbench/vercel.json new-migration/roots-react-workbench/README.md
git commit -m "chore: retarget roots workbench release path"
```

Expected: commit contains only release path and documentation changes.

---

### Task 3: Fix Root Audit Contract And Sync Legacy Engines

**Files:**
- Modify: `scripts/root-engine-audit.js`
- Modify: `scripts/engine-correctness-audit.js`
- Modify: `new-migration/roots-react-workbench/scripts/sync-legacy-engines.mjs`
- Modify: `new-migration/roots-react-workbench/public/legacy/math-engine.js`
- Modify: `new-migration/roots-react-workbench/public/legacy/calc-engine.js`
- Modify: `new-migration/roots-react-workbench/public/legacy/expression-engine.js`
- Modify: `new-migration/roots-react-workbench/public/legacy/root-engine.js`

- [ ] **Step 1: Make audits accept an engine root argument**

In both `scripts/root-engine-audit.js` and `scripts/engine-correctness-audit.js`, replace:

```js
const ROOT = __dirname ? path.resolve(__dirname, "..") : process.cwd();
```

with:

```js
const ROOT = process.argv[2]
  ? path.resolve(process.argv[2])
  : (__dirname ? path.resolve(__dirname, "..") : process.cwd());
```

- [ ] **Step 2: Update the bisection bound audit expectation**

In `scripts/root-engine-audit.js`, replace the failing check with:

```js
    report.check(
      "Lecture bisection bound returns width / 2^n for ten iterations",
      "Stopping formulas",
      "0.0009765625",
      C.formatReal(epsilon, 8),
      C.formatReal(epsilon, 8) === "0.0009765625",
      "For [1,2], the guaranteed absolute bound after 10 iterations is exactly 1 / 2^10."
    );
```

- [ ] **Step 3: Run audits against migrated local engine sources**

Run:

```powershell
node scripts/engine-correctness-audit.js new-migration\roots-react-workbench
node scripts/root-engine-audit.js new-migration\roots-react-workbench
```

Expected:

```text
Summary: 47/47 passed
Summary: 47/47 passed
```

- [ ] **Step 4: Update migrated engine sync script to use local engine sources**

Replace `new-migration/roots-react-workbench/scripts/sync-legacy-engines.mjs` with:

```js
import { copyFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(here, '..');
const targetDir = resolve(appRoot, 'public', 'legacy');

const engineFiles = [
  'math-engine.js',
  'calc-engine.js',
  'expression-engine.js',
  'root-engine.js',
];

mkdirSync(targetDir, { recursive: true });

for (const file of engineFiles) {
  copyFileSync(resolve(appRoot, file), resolve(targetDir, file));
  console.log(`Copied ${file}`);
}
```

- [ ] **Step 5: Sync migrated legacy engines**

Run:

```powershell
npm run sync:legacy --prefix new-migration\roots-react-workbench
```

Expected output includes:

```text
Copied math-engine.js
Copied calc-engine.js
Copied expression-engine.js
Copied root-engine.js
```

- [ ] **Step 6: Verify synced engine files are identical to migrated local files**

Run:

```powershell
Compare-Object (Get-FileHash new-migration\roots-react-workbench\math-engine.js).Hash (Get-FileHash new-migration\roots-react-workbench\public\legacy\math-engine.js).Hash
Compare-Object (Get-FileHash new-migration\roots-react-workbench\calc-engine.js).Hash (Get-FileHash new-migration\roots-react-workbench\public\legacy\calc-engine.js).Hash
Compare-Object (Get-FileHash new-migration\roots-react-workbench\expression-engine.js).Hash (Get-FileHash new-migration\roots-react-workbench\public\legacy\expression-engine.js).Hash
Compare-Object (Get-FileHash new-migration\roots-react-workbench\root-engine.js).Hash (Get-FileHash new-migration\roots-react-workbench\public\legacy\root-engine.js).Hash
```

Expected: no output from any `Compare-Object` command.

- [ ] **Step 7: Commit audit and sync fixes**

Run:

```powershell
git add scripts/root-engine-audit.js scripts/engine-correctness-audit.js new-migration/roots-react-workbench/scripts/sync-legacy-engines.mjs new-migration/roots-react-workbench/public/legacy
git commit -m "fix: sync migrated root engine release gate"
```

Expected: commit includes the audit expectation, sync script, and synced legacy engine files.

---

### Task 4: Stop Invalid Runs From Displaying As Successful

**Files:**
- Modify: `new-migration/roots-react-workbench/src/lib/rootEngineAdapter.ts`
- Modify: `new-migration/roots-react-workbench/src/hooks/useRootsWorkbench.ts`

- [ ] **Step 1: Add result classification helpers**

In `new-migration/roots-react-workbench/src/lib/rootEngineAdapter.ts`, add these exports after `runRootMethod`:

```ts
export function hasValidApproximation(result: RootRunResult): boolean {
  if (result.summary?.stopReason === 'invalid-input') {
    return false;
  }

  return result.summary?.approximation != null;
}

export function resultFailureMessage(result: RootRunResult): string {
  const detail = result.summary?.stopDetail?.trim();
  if (detail) {
    return detail;
  }

  const warning = result.warnings?.[0]?.message?.trim();
  if (warning) {
    return warning;
  }

  return 'The root calculation could not finish. Check the required inputs and run again.';
}
```

- [ ] **Step 2: Use invalid-run classification in the workbench hook**

In `new-migration/roots-react-workbench/src/hooks/useRootsWorkbench.ts`, change the import:

```ts
import {
  errorMessage,
  hasValidApproximation,
  resultFailureMessage,
  runRootMethod,
} from '../lib/rootEngineAdapter';
```

Replace the `try` block inside `runActiveMethod` with:

```ts
    try {
      const request = createRequestSnapshot(activeMethod, forms, angleMode);
      const result = runRootMethod(activeMethod, forms[activeMethod], angleMode);

      if (!hasValidApproximation(result)) {
        setLastRun(null);
        setWorkbenchStatus({ kind: 'error', message: resultFailureMessage(result) });
        setEvidenceExpanded(false);
        return;
      }

      setLastRun({ result, request });
      setWorkbenchStatus({ kind: 'ready', message: 'Answer ready.' });
      setEvidenceExpanded(true);
    } catch (error) {
      setLastRun(null);
      setWorkbenchStatus({ kind: 'error', message: errorMessage(error) });
      setEvidenceExpanded(false);
    }
```

- [ ] **Step 3: Build after invalid-run changes**

Run:

```powershell
npm run build --prefix new-migration\roots-react-workbench
```

Expected: TypeScript and Vite build pass.

- [ ] **Step 4: Browser-smoke invalid input manually**

Run the dev server:

```powershell
npm run dev --prefix new-migration\roots-react-workbench -- --host 127.0.0.1 --port 5173
```

In the browser:

1. Open `http://127.0.0.1:5173`.
2. Clear the Newton expression field.
3. Click `Run method`.

Expected:

```text
Status near run controls shows an error message.
The result console does not show N/A as a current root.
Evidence workspace is not visible.
```

- [ ] **Step 5: Commit invalid-run handling**

Run:

```powershell
git add new-migration/roots-react-workbench/src/lib/rootEngineAdapter.ts new-migration/roots-react-workbench/src/hooks/useRootsWorkbench.ts
git commit -m "fix: reject invalid root runs in workbench"
```

Expected: commit only contains invalid-run state changes.

---

### Task 5: Remove No-Op Controls And Seed Valid Defaults

**Files:**
- Modify: `new-migration/roots-react-workbench/src/App.tsx`
- Modify: `new-migration/roots-react-workbench/src/config/methods.ts`
- Modify: `new-migration/roots-react-workbench/src/components/IterationTable.tsx`

- [ ] **Step 1: Remove Help and Quick Command from the app header**

In `new-migration/roots-react-workbench/src/App.tsx`, remove this import:

```ts
import { CircleHelp, Command } from 'lucide-react';
```

Replace the header navigation with:

```tsx
            <nav aria-label="Utility controls">
              <AngleToggle angleMode={angleMode} onToggle={toggleAngleMode} />
            </nav>
```

- [ ] **Step 2: Seed valid default method fields**

In `new-migration/roots-react-workbench/src/config/methods.ts`, replace `createDefaultFormState` with:

```ts
export function createDefaultFormState(): Record<RootMethod, MethodFormState> {
  return METHOD_CONFIGS.reduce(
    (acc, config) => {
      acc[config.method] = Object.fromEntries(
        config.fields.map((field) => [field.id, field.defaultValue]),
      );
      return acc;
    },
    {} as Record<RootMethod, MethodFormState>,
  );
}
```

- [ ] **Step 3: Remove the CSV no-op button**

In `new-migration/roots-react-workbench/src/components/IterationTable.tsx`, replace:

```tsx
      <div className="flex items-center justify-between gap-3">
        <h2 className="section-kicker">
          Iteration table
        </h2>
        <button type="button" className="copy-icon-button h-8 w-auto px-3 text-xs">Download CSV</button>
      </div>
```

with:

```tsx
      <h2 className="section-kicker">
        Iteration table
      </h2>
```

- [ ] **Step 4: Build after removing no-op controls**

Run:

```powershell
npm run build --prefix new-migration\roots-react-workbench
```

Expected: TypeScript and Vite build pass.

- [ ] **Step 5: Browser-smoke default run**

Run the dev server if it is not already running:

```powershell
npm run dev --prefix new-migration\roots-react-workbench -- --host 127.0.0.1 --port 5173
```

In the browser:

1. Open `http://127.0.0.1:5173`.
2. Confirm the Newton fields are prefilled with `x^2 - 2`, `2x`, and `1`.
3. Confirm Help, Quick Command, and Download CSV are not visible.
4. Click `Run method`.

Expected: the result shows an approximate root near `1.4142136`.

- [ ] **Step 6: Commit no-op control removal and defaults**

Run:

```powershell
git add new-migration/roots-react-workbench/src/App.tsx new-migration/roots-react-workbench/src/config/methods.ts new-migration/roots-react-workbench/src/components/IterationTable.tsx
git commit -m "fix: remove no-op controls and seed examples"
```

---

### Task 6: Fix Expression Editing And Precision Accessibility

**Files:**
- Modify: `new-migration/roots-react-workbench/src/components/SymbolInsertBar.tsx`
- Modify: `new-migration/roots-react-workbench/src/components/MethodForm.tsx`
- Modify: `new-migration/roots-react-workbench/src/styles.css`

- [ ] **Step 1: Make symbol actions explicit**

Replace `new-migration/roots-react-workbench/src/components/SymbolInsertBar.tsx` with:

```tsx
interface SymbolInsertBarProps {
  onInsert: (symbol: string, action?: 'insert' | 'backspace') => void;
}

const SYMBOLS = ['π', 'e', 'sin', 'cos', 'tan', 'ln', '√', '^', '(', ')', '⌫'] as const;
const SYMBOL_LABELS: Record<(typeof SYMBOLS)[number], string> = {
  'π': 'Insert pi constant',
  e: 'Insert e constant',
  sin: 'Insert sine function',
  cos: 'Insert cosine function',
  tan: 'Insert tangent function',
  ln: 'Insert natural logarithm',
  '√': 'Insert square root',
  '^': 'Insert exponent',
  '(': 'Insert left parenthesis',
  ')': 'Insert right parenthesis',
  '⌫': 'Backspace',
};

const INSERT_VALUE: Record<(typeof SYMBOLS)[number], string> = {
  'π': 'pi',
  e: 'e',
  sin: 'sin(',
  cos: 'cos(',
  tan: 'tan(',
  ln: 'log(',
  '√': 'sqrt(',
  '^': '^',
  '(': '(',
  ')': ')',
  '⌫': '',
};

export function SymbolInsertBar({ onInsert }: SymbolInsertBarProps) {
  return (
    <div className="symbol-bar">
      {SYMBOLS.map((symbol) => (
        <button
          key={symbol}
          type="button"
          onClick={() => onInsert(INSERT_VALUE[symbol], symbol === '⌫' ? 'backspace' : 'insert')}
          title={SYMBOL_LABELS[symbol]}
          aria-label={SYMBOL_LABELS[symbol]}
          className="symbol-chip"
        >
          {symbol}
        </button>
      ))}
    </div>
  );
}
```

- [ ] **Step 2: Implement backspace and accessible expression labels**

In `new-migration/roots-react-workbench/src/components/MethodForm.tsx`, replace `insertSymbol` with:

```tsx
  const insertSymbol = useCallback(
    (symbol: string, action: 'insert' | 'backspace' = 'insert') => {
      const input = expressionRef.current;
      const currentValue = input?.value ?? formState[config.expressionFieldId] ?? '';
      const selectionStart = input?.selectionStart ?? currentValue.length;
      const selectionEnd = input?.selectionEnd ?? currentValue.length;

      let nextValue = currentValue;
      let nextCursor = selectionStart;

      if (action === 'backspace') {
        if (selectionStart !== selectionEnd) {
          nextValue = currentValue.slice(0, selectionStart) + currentValue.slice(selectionEnd);
          nextCursor = selectionStart;
        } else if (selectionStart > 0) {
          nextValue = currentValue.slice(0, selectionStart - 1) + currentValue.slice(selectionEnd);
          nextCursor = selectionStart - 1;
        }
      } else {
        nextValue =
          currentValue.slice(0, selectionStart) + symbol + currentValue.slice(selectionEnd);
        nextCursor = selectionStart + symbol.length;
      }

      onChange(config.method, config.expressionFieldId, nextValue);

      if (!input) {
        return;
      }

      requestAnimationFrame(() => {
        input.focus();
        input.setSelectionRange(nextCursor, nextCursor);
      });
    },
    [config.expressionFieldId, config.method, formState, onChange],
  );
```

Inside `renderField`, add a screen-reader label for expression inputs by replacing the opening label contents:

```tsx
        <label key={field.id} className={field.id === config.expressionFieldId ? 'expression-field' : 'field-row'}>
          {field.id === config.expressionFieldId ? (
            <span className="sr-only">{`${config.shortLabel} ${field.label}`}</span>
          ) : (
            <span>{field.label}</span>
          )}
```

- [ ] **Step 3: Make the digit precision middle value non-clickable**

In `new-migration/roots-react-workbench/src/components/MethodForm.tsx`, replace:

```tsx
                <button type="button" className="active">{formState[digitsField.id] ?? digitsField.defaultValue}</button>
```

with:

```tsx
                <span className="stepper-value active numeric-value" aria-live="polite">
                  {formState[digitsField.id] ?? digitsField.defaultValue}
                </span>
```

- [ ] **Step 4: Update CSS for the stepper value**

In `new-migration/roots-react-workbench/src/styles.css`, replace:

```css
.stepper button,
.segment button {
  border: 0;
  border-left: 1px solid var(--line);
  background: transparent;
  color: var(--ink);
}

.stepper button:first-child,
.segment button:first-child {
  border-left: 0;
}

.segment .active,
.stepper .active {
  background: var(--action-blue);
  color: var(--surface-raised);
  font-weight: 700;
}
```

with:

```css
.stepper button,
.segment button,
.stepper-value {
  display: grid;
  place-items: center;
  border: 0;
  border-left: 1px solid var(--line);
  background: transparent;
  color: var(--ink);
}

.stepper button:first-child,
.segment button:first-child {
  border-left: 0;
}

.segment .active,
.stepper .active {
  background: var(--action-blue);
  color: var(--surface-raised);
  font-weight: 700;
}
```

- [ ] **Step 5: Build and browser-smoke expression editing**

Run:

```powershell
npm run build --prefix new-migration\roots-react-workbench
```

Expected: TypeScript and Vite build pass.

Browser smoke:

1. Open `http://127.0.0.1:5173`.
2. Focus the expression input.
3. Click `sin`, then `⌫`.
4. Confirm the expression removes the previous character or selected range.
5. Confirm Playwright or browser accessibility lookup can find the expression field by name such as `Newton f(x)`.

- [ ] **Step 6: Commit editing and accessibility fixes**

Run:

```powershell
git add new-migration/roots-react-workbench/src/components/SymbolInsertBar.tsx new-migration/roots-react-workbench/src/components/MethodForm.tsx new-migration/roots-react-workbench/src/styles.css
git commit -m "fix: improve expression editing accessibility"
```

---

### Task 7: Make Formulas, Graph Captions, And Confidence Method-Aware

**Files:**
- Modify: `new-migration/roots-react-workbench/src/lib/resultFormatters.ts`
- Modify: `new-migration/roots-react-workbench/src/components/ConvergenceGraph.tsx`
- Modify: `new-migration/roots-react-workbench/src/components/ConfidenceSummary.tsx`
- Modify: `new-migration/roots-react-workbench/src/components/SolutionSteps.tsx`
- Modify: `new-migration/roots-react-workbench/src/styles.css`

- [ ] **Step 1: Add confidence and graph caption helpers**

In `new-migration/roots-react-workbench/src/lib/resultFormatters.ts`, add these exports after `compactConfidenceItems`:

```ts
export interface ConfidenceStatus {
  label: string;
  ariaLabel: string;
  bars: number;
  tone: 'high' | 'medium' | 'low' | 'stale';
  note: string;
}

export function confidenceStatus(run: RootRunResult, freshness: 'empty' | 'current' | 'stale'): ConfidenceStatus {
  if (freshness === 'stale') {
    return {
      label: 'Stale',
      ariaLabel: 'Stale confidence. Re-run before trusting this result.',
      bars: 2,
      tone: 'stale',
      note: 'This result is from an earlier input state. Re-run before copying or submitting it.',
    };
  }

  if (run.warnings?.length) {
    return {
      label: 'Review',
      ariaLabel: 'Low confidence. Review warnings before trusting this result.',
      bars: 2,
      tone: 'low',
      note: run.warnings[0]?.message ?? 'Warnings were reported for this run.',
    };
  }

  const reason = run.summary?.stopReason;
  if (
    reason === 'tolerance-reached' ||
    reason === 'tolerance-already-met' ||
    reason === 'endpoint-root' ||
    reason === 'exact-zero' ||
    reason === 'machine-zero'
  ) {
    return {
      label: 'High',
      ariaLabel: 'High confidence. The run reached a trusted stopping condition.',
      bars: 5,
      tone: 'high',
      note: 'The run reached a trusted stopping condition under the selected precision.',
    };
  }

  if (reason === 'iteration-limit') {
    return {
      label: 'Medium',
      ariaLabel: 'Medium confidence. The run completed the requested iterations.',
      bars: 3,
      tone: 'medium',
      note: 'The run completed the requested iterations. Increase n or use tolerance mode for a tighter result.',
    };
  }

  return {
    label: 'Review',
    ariaLabel: 'Low confidence. Review diagnostics before trusting this result.',
    bars: 2,
    tone: 'low',
    note: stopReasonLabel(reason, run.method),
  };
}

export function convergenceCaption(run: RootRunResult): string {
  const reason = stopReasonLabel(run.summary?.stopReason, run.method);

  if (run.method === 'bisection') {
    return `Bisection trace shows the midpoint sequence for the active bracket. Stop: ${reason}.`;
  }

  if (run.method === 'falsePosition') {
    return `False Position trace shows interpolation points inside the active bracket. Stop: ${reason}.`;
  }

  if (run.method === 'newton') {
    return `Newton-Raphson trace shows successive tangent updates. Stop: ${reason}.`;
  }

  if (run.method === 'secant') {
    return `Secant trace shows updates from the two-point slope approximation. Stop: ${reason}.`;
  }

  return `Fixed-point trace shows repeated x = g(x) updates. Stop: ${reason}.`;
}
```

- [ ] **Step 2: Use graph captions from formatter helpers**

In `new-migration/roots-react-workbench/src/components/ConvergenceGraph.tsx`, add this import:

```ts
import { convergenceCaption } from '../lib/resultFormatters';
```

Replace:

```tsx
      <p className="graph-caption">Quadratic convergence observed on the latest numerical trace.</p>
```

with:

```tsx
      <p className="graph-caption">{convergenceCaption(run)}</p>
```

- [ ] **Step 3: Render dynamic confidence bars**

In `new-migration/roots-react-workbench/src/components/ConfidenceSummary.tsx`, replace the import:

```ts
import { compactConfidenceItems, confidenceStatus, staleStatusText } from '../lib/resultFormatters';
```

Replace `statusClasses` with:

```ts
function statusClasses(tone: ReturnType<typeof confidenceStatus>['tone']): string {
  if (tone === 'high') return 'text-[var(--green)]';
  if (tone === 'medium') return 'text-[var(--orange)]';
  if (tone === 'stale') return 'text-[var(--clay)]';
  return 'text-[var(--red)]';
}
```

Remove `statusLabel`. Inside the component, after `const warnings = run.warnings ?? [];`, add:

```ts
  const confidence = confidenceStatus(run, freshness);
```

Replace the status span content:

```tsx
          className={`numeric-value text-sm font-semibold ${statusClasses(
            confidence.tone,
          )}`}
        >
          {confidence.label}
```

Replace the confidence `<dd>` with:

```tsx
          <dd className={`confidence-bars confidence-${confidence.tone}`} aria-label={confidence.ariaLabel}>
            {Array.from({ length: 5 }, (_, index) => (
              <span key={index} aria-hidden="true" className={index < confidence.bars ? 'filled' : ''} />
            ))}
          </dd>
```

Replace the diagnostic note text expression with:

```tsx
          {warnings[0]?.message ?? `${note} ${confidence.note}`}
```

- [ ] **Step 4: Add CSS for empty confidence bars**

In `new-migration/roots-react-workbench/src/styles.css`, replace:

```css
.confidence-bars span {
  display: block;
  width: 18px;
  height: 6px;
  border-radius: 999px;
  background: rgba(22, 133, 95, 0.72);
}
```

with:

```css
.confidence-bars span {
  display: block;
  width: 18px;
  height: 6px;
  border-radius: 999px;
  background: var(--line);
}

.confidence-high .filled {
  background: rgba(22, 133, 95, 0.72);
}

.confidence-medium .filled {
  background: rgba(198, 106, 24, 0.72);
}

.confidence-low .filled {
  background: rgba(194, 57, 52, 0.72);
}

.confidence-stale .filled {
  background: rgba(168, 101, 0, 0.72);
}
```

- [ ] **Step 5: Make solution formulas method-specific**

In `new-migration/roots-react-workbench/src/components/SolutionSteps.tsx`, add this helper above the component:

```tsx
function formulaForMethod(method: RootRunResult['method']) {
  if (method === 'bisection') {
    return {
      label: 'Bisection midpoint formula:',
      node: <>c = (a + b) / 2</>,
    };
  }

  if (method === 'falsePosition') {
    return {
      label: 'False Position interpolation formula:',
      node: <>c = b - f(b)(b - a) / (f(b) - f(a))</>,
    };
  }

  if (method === 'secant') {
    return {
      label: 'Secant iteration formula:',
      node: <>x<sub>n+1</sub> = x<sub>n</sub> - f(x<sub>n</sub>)(x<sub>n</sub> - x<sub>n-1</sub>) / (f(x<sub>n</sub>) - f(x<sub>n-1</sub>))</>,
    };
  }

  if (method === 'fixedPoint') {
    return {
      label: 'Fixed-point iteration formula:',
      node: <>x<sub>n+1</sub> = g(x<sub>n</sub>)</>,
    };
  }

  return {
    label: 'Newton-Raphson iteration formula:',
    node: <>x<sub>n+1</sub> = x<sub>n</sub> - f(x<sub>n</sub>) / f′(x<sub>n</sub>)</>,
  };
}
```

Inside `SolutionSteps`, after `const copyDisabled = !copyPayload;`, add:

```ts
  const formula = formulaForMethod(run.method);
```

Replace the hard-coded formula block with:

```tsx
          <p className="mt-3 text-sm text-[var(--ink)]">{formula.label}</p>
          <p className="mt-2 font-serif text-lg italic">{formula.node}</p>
```

- [ ] **Step 6: Build and browser-smoke method-aware UI**

Run:

```powershell
npm run build --prefix new-migration\roots-react-workbench
```

Expected: TypeScript and Vite build pass.

Browser smoke:

1. Run Newton and confirm formula says Newton-Raphson.
2. Switch to Bisection, run with defaults, and confirm formula says Bisection midpoint.
3. Confirm graph caption says Bisection trace, not quadratic convergence.
4. Change a field after a successful run and confirm confidence changes to stale.

- [ ] **Step 7: Commit method-aware result UI**

Run:

```powershell
git add new-migration/roots-react-workbench/src/lib/resultFormatters.ts new-migration/roots-react-workbench/src/components/ConvergenceGraph.tsx new-migration/roots-react-workbench/src/components/ConfidenceSummary.tsx new-migration/roots-react-workbench/src/components/SolutionSteps.tsx new-migration/roots-react-workbench/src/styles.css
git commit -m "fix: make root evidence method aware"
```

---

### Task 8: Remove Clearly Dead Components And Hook Returns

**Files:**
- Delete: `new-migration/roots-react-workbench/src/components/CompareMethodsCallout.tsx`
- Delete: `new-migration/roots-react-workbench/src/components/EvidencePreview.tsx`
- Delete: `new-migration/roots-react-workbench/src/components/DiagnosticsPanel.tsx`
- Modify: `new-migration/roots-react-workbench/src/hooks/useRootsWorkbench.ts`

- [ ] **Step 1: Confirm the components are unused**

Run:

```powershell
Select-String -Path new-migration\roots-react-workbench\src\**\*.tsx -Pattern "CompareMethodsCallout|EvidencePreview|DiagnosticsPanel"
```

Expected: matches only in the component files being deleted and imports inside `EvidencePreview.tsx`.

- [ ] **Step 2: Delete unused components**

Run:

```powershell
Remove-Item -LiteralPath new-migration\roots-react-workbench\src\components\CompareMethodsCallout.tsx
Remove-Item -LiteralPath new-migration\roots-react-workbench\src\components\EvidencePreview.tsx
Remove-Item -LiteralPath new-migration\roots-react-workbench\src\components\DiagnosticsPanel.tsx
```

- [ ] **Step 3: Remove unused hook outputs**

In `new-migration/roots-react-workbench/src/hooks/useRootsWorkbench.ts`, remove this memo:

```ts
  const activeRun = useMemo(
    () => (displayRun.freshness === 'current' ? displayRun.run : null),
    [displayRun.freshness, displayRun.run],
  );
```

Remove this memo:

```ts
  const runs = useMemo<Partial<Record<RootMethod, ReturnType<typeof runRootMethod>>>>(() => {
    if (!lastRun || displayRun.freshness !== 'current') {
      return {};
    }

    return {
      [lastRun.result.method]: lastRun.result,
    } as Partial<Record<RootMethod, ReturnType<typeof runRootMethod>>>;
  }, [displayRun.freshness, lastRun]);
```

Remove these properties from the returned object:

```ts
    activeRun,
    forms,
    runs,
    setEvidenceExpanded,
```

- [ ] **Step 4: Build after cleanup**

Run:

```powershell
npm run build --prefix new-migration\roots-react-workbench
```

Expected: TypeScript and Vite build pass.

- [ ] **Step 5: Commit cleanup**

Run:

```powershell
git add -u new-migration/roots-react-workbench/src
git commit -m "chore: remove unused roots workbench components"
```

---

### Task 9: Final Release Verification

**Files:**
- No source edits expected.

- [ ] **Step 1: Run engine correctness audit**

Run:

```powershell
node scripts/engine-correctness-audit.js new-migration\roots-react-workbench
```

Expected:

```text
Summary: 47/47 passed
```

- [ ] **Step 2: Run root engine audit**

Run:

```powershell
node scripts/root-engine-audit.js new-migration\roots-react-workbench
```

Expected:

```text
Summary: 47/47 passed
```

- [ ] **Step 3: Run the full release gate**

Run:

```powershell
.\scripts\roots-react-release-check.ps1
```

Expected:

```text
engine correctness audit passes
root engine audit passes
sync:legacy passes
legacy diff guard passes
typecheck passes
Vite build passes
```

- [ ] **Step 4: Run browser smoke against the migrated app**

Start the dev server:

```powershell
npm run dev --prefix new-migration\roots-react-workbench -- --host 127.0.0.1 --port 5173
```

Browser checks:

```text
Default Newton run succeeds and shows a root near 1.4142136.
Clearing the expression and running shows an error and no fake current result.
Changing x0 after a successful run marks the previous result stale.
Bisection formula says c = (a + b) / 2.
Newton formula says x_n+1 = x_n - f(x_n) / f'(x_n).
Graph caption changes by method.
Expression input can be found by an accessible name such as Newton f(x).
The ⌫ symbol deletes text in the expression field.
Help, Quick Command, and Download CSV are not visible.
```

- [ ] **Step 5: Check git status for accidental generated files**

Run:

```powershell
git status --short
```

Expected: no generated `dist/`, `node_modules/`, logs, `.vite/`, or `*.tsbuildinfo` files are staged or untracked because app `.gitignore` covers them.

- [ ] **Step 6: Final commit if verification created sync changes**

If `npm run sync:legacy` changed tracked legacy files during the release gate, run:

```powershell
git add new-migration/roots-react-workbench/public/legacy
git commit -m "chore: update migrated legacy engine copies"
```

Expected: this commit is only needed when canonical engines changed after Task 3.
