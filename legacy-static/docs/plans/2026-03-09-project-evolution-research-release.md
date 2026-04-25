# Project Evolution Research Release Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the standalone project evolution explorer into a dark-mode AI-lab release microsite with a live comparison engine, proof modules, and a grounded technical evidence workflow.

**Architecture:** Rework the existing standalone HTML, CSS, and JavaScript explorer rather than rebuilding from scratch. Keep a single curated dataset in `project-evolution-explorer.js`, use semantic HTML sections to support the new launch-page information architecture, and drive all motion with CSS transforms, opacity, and lightweight JavaScript state while preserving reduced-motion behavior. Verification should combine the existing PowerShell smoke check with browser-level checks of counters, filtering, drawer sync, and console cleanliness.

**Tech Stack:** HTML, CSS, vanilla JavaScript, PowerShell smoke checks, browser verification via Playwright or equivalent local browser tooling

---

### Task 1: Lock The New Information Architecture In HTML

**Files:**
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\project-evolution-explorer.html`
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\scripts\check-project-evolution-explorer.ps1`

**Step 1: Write the failing structure check**

```powershell
$html = Get-Content 'project-evolution-explorer.html' -Raw
$requiredSections = @(
  'id="launch-hero"',
  'id="proof-band"',
  'id="change-explorer"',
  'id="capability-stories"',
  'id="architecture-lens"',
  'id="evidence-drawer"'
)

foreach ($section in $requiredSections) {
  if ($html -notmatch [regex]::Escape($section)) {
    throw "Missing required section: $section"
  }
}
```

**Step 2: Run the check to verify it fails**

Run: `pwsh -NoProfile -File .\scripts\check-project-evolution-explorer.ps1`
Expected: FAIL with a missing section such as `id="launch-hero"`

**Step 3: Write the minimal HTML restructure**

```html
<main class="release-shell">
  <section id="launch-hero"></section>
  <section id="proof-band"></section>
  <section id="change-explorer"></section>
  <section id="capability-stories"></section>
  <section id="architecture-lens"></section>
  <aside id="evidence-drawer"></aside>
</main>
```

**Step 4: Run the check to verify it passes**

Run: `pwsh -NoProfile -File .\scripts\check-project-evolution-explorer.ps1`
Expected: PASS with no output

**Step 5: Commit**

```bash
git add project-evolution-explorer.html scripts/check-project-evolution-explorer.ps1
git commit -m "feat: restructure explorer as research release page"
```

### Task 2: Refactor The Dataset Into Release-Proof Inputs

**Files:**
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\project-evolution-explorer.js`
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\scripts\check-project-evolution-explorer.ps1`

**Step 1: Write the failing dataset-shape check**

```powershell
$js = Get-Content 'project-evolution-explorer.js' -Raw
$requiredTokens = @(
  'const comparisonEntries',
  'const proofModules',
  'const capabilityStories',
  'function buildSummaryMetrics',
  'function buildArchitectureGroups'
)

foreach ($token in $requiredTokens) {
  if ($js -notmatch [regex]::Escape($token)) {
    throw "Missing required script token: $token"
  }
}
```

**Step 2: Run the check to verify it fails**

Run: `pwsh -NoProfile -File .\scripts\check-project-evolution-explorer.ps1`
Expected: FAIL with a missing token such as `const proofModules`

**Step 3: Write the minimal dataset refactor**

```js
const comparisonEntries = [
  {
    id: 'shell-shift',
    type: 'modified',
    theme: 'architecture',
    oldPath: 'DO NOT OPEN UNLESS SPECIFIED TO DO SO!/Num_analysis - Copy (2)/index.html',
    newPath: 'index.html',
    title: 'Shell shifted into a broader release surface',
    summary: 'The newer app consolidates the experience into a flatter root-level shell.'
  }
]

const proofModules = [
  { id: 'added', label: 'Added systems' },
  { id: 'refactored', label: 'Rewired structure' }
]

function buildSummaryMetrics(entries) {
  return {
    added: entries.filter((entry) => entry.type === 'added').length,
    removed: entries.filter((entry) => entry.type === 'removed').length
  }
}
```

**Step 4: Run the check to verify it passes**

Run: `pwsh -NoProfile -File .\scripts\check-project-evolution-explorer.ps1`
Expected: PASS with no output

**Step 5: Commit**

```bash
git add project-evolution-explorer.js scripts/check-project-evolution-explorer.ps1
git commit -m "feat: reshape explorer data for release storytelling"
```

### Task 3: Build The Dark-Mode Visual System And Hero Engine

**Files:**
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\project-evolution-explorer.css`
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\project-evolution-explorer.html`
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\project-evolution-explorer.js`
- Test: `C:\Users\Emmy Lou\Downloads\New folder (16)\scripts\check-project-evolution-explorer.ps1`

**Step 1: Write the failing visual-system check**

```powershell
$css = Get-Content 'project-evolution-explorer.css' -Raw
$requiredTokens = @(
  '--surface-0',
  '--accent-signal',
  '.release-shell',
  '.launch-hero',
  '.comparison-engine',
  '@media (prefers-reduced-motion: reduce)'
)

foreach ($token in $requiredTokens) {
  if ($css -notmatch [regex]::Escape($token)) {
    throw "Missing required CSS token: $token"
  }
}
```

**Step 2: Run the check to verify it fails**

Run: `pwsh -NoProfile -File .\scripts\check-project-evolution-explorer.ps1`
Expected: FAIL with a missing token such as `--surface-0`

**Step 3: Write the minimal dark hero system**

```css
:root {
  --surface-0: #0f1318;
  --surface-1: #151b22;
  --text-strong: #f3f5f7;
  --accent-signal: #7fd4c1;
}

.launch-hero {
  min-height: 100dvh;
}

.comparison-engine {
  position: relative;
  overflow: hidden;
}
```

**Step 4: Run the check to verify it passes**

Run: `pwsh -NoProfile -File .\scripts\check-project-evolution-explorer.ps1`
Expected: PASS with no output

**Step 5: Commit**

```bash
git add project-evolution-explorer.css project-evolution-explorer.html project-evolution-explorer.js scripts/check-project-evolution-explorer.ps1
git commit -m "feat: add dark release hero and comparison engine styling"
```

### Task 4: Implement Proof Band, Explorer States, And Evidence Sync

**Files:**
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\project-evolution-explorer.html`
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\project-evolution-explorer.css`
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\project-evolution-explorer.js`
- Test: `C:\Users\Emmy Lou\Downloads\New folder (16)\scripts\check-project-evolution-explorer.ps1`

**Step 1: Write the failing interaction-state check**

```powershell
$html = Get-Content 'project-evolution-explorer.html' -Raw
$requiredHooks = @(
  'data-proof-grid',
  'data-filter-bar',
  'data-change-list',
  'data-empty-state',
  'data-evidence-drawer'
)

foreach ($hook in $requiredHooks) {
  if ($html -notmatch [regex]::Escape($hook)) {
    throw "Missing required hook: $hook"
  }
}

$js = Get-Content 'project-evolution-explorer.js' -Raw
$requiredTokens = @(
  'function setActiveFilter',
  'function renderProofBand',
  'function renderChangeExplorer',
  'function syncEvidenceDrawer'
)

foreach ($token in $requiredTokens) {
  if ($js -notmatch [regex]::Escape($token)) {
    throw "Missing required interaction token: $token"
  }
}
```

**Step 2: Run the check to verify it fails**

Run: `pwsh -NoProfile -File .\scripts\check-project-evolution-explorer.ps1`
Expected: FAIL with a missing hook or interaction token

**Step 3: Write the minimal explorer-state implementation**

```js
function setActiveFilter(nextFilter) {
  state.activeFilter = nextFilter
  renderChangeExplorer()
  syncEvidenceDrawer()
}

function syncEvidenceDrawer() {
  const activeEntry = getActiveEntry()
  drawer.hidden = !activeEntry
}
```

**Step 4: Run the check to verify it passes**

Run: `pwsh -NoProfile -File .\scripts\check-project-evolution-explorer.ps1`
Expected: PASS with no output

**Step 5: Commit**

```bash
git add project-evolution-explorer.html project-evolution-explorer.css project-evolution-explorer.js scripts/check-project-evolution-explorer.ps1
git commit -m "feat: add release proof band and evidence sync"
```

### Task 5: Add Capability Stories And Architecture Lens Choreography

**Files:**
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\project-evolution-explorer.html`
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\project-evolution-explorer.css`
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\project-evolution-explorer.js`
- Test: `C:\Users\Emmy Lou\Downloads\New folder (16)\scripts\check-project-evolution-explorer.ps1`

**Step 1: Write the failing story-and-architecture check**

```powershell
$js = Get-Content 'project-evolution-explorer.js' -Raw
$requiredTokens = @(
  'function renderCapabilityStories',
  'function renderArchitectureLens',
  'function applyMotionReadiness',
  "window.matchMedia('(prefers-reduced-motion: reduce)')"
)

foreach ($token in $requiredTokens) {
  if ($js -notmatch [regex]::Escape($token)) {
    throw "Missing required storytelling token: $token"
  }
}
```

**Step 2: Run the check to verify it fails**

Run: `pwsh -NoProfile -File .\scripts\check-project-evolution-explorer.ps1`
Expected: FAIL with a missing storytelling token

**Step 3: Write the minimal storytelling implementation**

```js
function applyMotionReadiness() {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  document.documentElement.classList.toggle('motion-ready', !prefersReducedMotion)
}
```

**Step 4: Run the check to verify it passes**

Run: `pwsh -NoProfile -File .\scripts\check-project-evolution-explorer.ps1`
Expected: PASS with no output

**Step 5: Commit**

```bash
git add project-evolution-explorer.html project-evolution-explorer.css project-evolution-explorer.js scripts/check-project-evolution-explorer.ps1
git commit -m "feat: add release narrative and architecture choreography"
```

### Task 6: Verify The Standalone Experience End-To-End

**Files:**
- Test: `C:\Users\Emmy Lou\Downloads\New folder (16)\scripts\check-project-evolution-explorer.ps1`
- Verify: `C:\Users\Emmy Lou\Downloads\New folder (16)\project-evolution-explorer.html`

**Step 1: Run the smoke check**

```powershell
pwsh -NoProfile -File .\scripts\check-project-evolution-explorer.ps1
```

Expected: PASS with no output

**Step 2: Run browser verification on the standalone page**

Run: open `http://127.0.0.1:4173/project-evolution-explorer.html`
Expected:
- no console errors
- counters settle to the dataset values
- proof modules render
- filters update the visible evidence
- the drawer reflects the active focus
- reduced-motion handling remains present in code

**Step 3: Capture a final sanity screenshot if useful**

Run: use the local browser tooling to capture desktop and mobile views
Expected: screenshots confirm the page is visually distinct from the calculator app

**Step 4: Commit the verified finish**

```bash
git add project-evolution-explorer.html project-evolution-explorer.css project-evolution-explorer.js scripts/check-project-evolution-explorer.ps1
git commit -m "feat: complete research release redesign for project explorer"
```
