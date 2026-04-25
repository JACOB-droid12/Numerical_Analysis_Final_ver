# Project Evolution Diff Explorer Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a standalone animated HTML experience that compares the older modular Numerical Analysis app with the newer root-level teaching lab through a technical diff explorer plus showcase narrative.

**Architecture:** Create a self-contained static page in the workspace root with dedicated HTML, CSS, and JavaScript files. Keep the comparison logic data-driven with a curated JavaScript dataset, then layer filtering, counters, story sections, and an evidence drawer on top of that dataset. Use CSS-led motion and lightweight JavaScript state so the feature loads instantly and does not interfere with the existing calculator app.

**Tech Stack:** HTML, CSS, vanilla JavaScript, PowerShell smoke checks, local browser verification

---

### Task 1: Scaffold The Standalone Explorer Shell

**Files:**
- Create: `C:\Users\Emmy Lou\Downloads\New folder (16)\project-evolution-explorer.html`
- Create: `C:\Users\Emmy Lou\Downloads\New folder (16)\project-evolution-explorer.css`
- Create: `C:\Users\Emmy Lou\Downloads\New folder (16)\project-evolution-explorer.js`
- Create: `C:\Users\Emmy Lou\Downloads\New folder (16)\scripts\check-project-evolution-explorer.ps1`

**Step 1: Write the failing smoke check**

```powershell
$required = @(
  'project-evolution-explorer.html',
  'project-evolution-explorer.css',
  'project-evolution-explorer.js'
)

foreach ($path in $required) {
  if (-not (Test-Path $path)) {
    throw "Missing required file: $path"
  }
}

$html = Get-Content 'project-evolution-explorer.html' -Raw
if ($html -notmatch 'project-evolution-explorer.css') {
  throw 'HTML does not reference the explorer stylesheet.'
}
if ($html -notmatch 'project-evolution-explorer.js') {
  throw 'HTML does not reference the explorer script.'
}
```

**Step 2: Run the smoke check to verify it fails**

Run: `pwsh -NoProfile -File .\scripts\check-project-evolution-explorer.ps1`
Expected: FAIL with a missing-file error for `project-evolution-explorer.html`

**Step 3: Write the minimal shell implementation**

```html
<!doctype html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Project Evolution Explorer</title>
  <link rel="stylesheet" href="project-evolution-explorer.css">
</head>
<body>
  <main class="explorer-shell">
    <section class="hero-console"></section>
    <section class="change-explorer"></section>
    <aside class="evidence-drawer"></aside>
  </main>
  <script src="project-evolution-explorer.js"></script>
</body>
</html>
```

**Step 4: Run the smoke check to verify it passes**

Run: `pwsh -NoProfile -File .\scripts\check-project-evolution-explorer.ps1`
Expected: PASS with no output

**Step 5: Commit**

```bash
git add project-evolution-explorer.html project-evolution-explorer.css project-evolution-explorer.js scripts/check-project-evolution-explorer.ps1
git commit -m "feat: scaffold project evolution explorer"
```

### Task 2: Add The Curated Comparison Dataset And Summary Rendering

**Files:**
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\project-evolution-explorer.html`
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\project-evolution-explorer.js`
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\scripts\check-project-evolution-explorer.ps1`

**Step 1: Write the failing data-render check**

```powershell
$html = Get-Content 'project-evolution-explorer.html' -Raw
$requiredHooks = @(
  'data-summary-metric',
  'data-category-filter',
  'data-change-list',
  'data-evidence-drawer'
)

foreach ($hook in $requiredHooks) {
  if ($html -notmatch [regex]::Escape($hook)) {
    throw "Missing required hook: $hook"
  }
}

$js = Get-Content 'project-evolution-explorer.js' -Raw
$requiredTokens = @('const comparisonEntries', 'renderSummary', 'renderChangeList')
foreach ($token in $requiredTokens) {
  if ($js -notmatch [regex]::Escape($token)) {
    throw "Missing required script token: $token"
  }
}
```

**Step 2: Run the smoke check to verify it fails**

Run: `pwsh -NoProfile -File .\scripts\check-project-evolution-explorer.ps1`
Expected: FAIL with a missing hook such as `data-summary-metric`

**Step 3: Write the minimal data-driven implementation**

```js
const comparisonEntries = [
  {
    id: 'shell-shift',
    type: 'modified',
    category: 'layout',
    oldPath: 'DO NOT OPEN UNLESS SPECIFIED TO DO SO!/Num_analysis - Copy (2)/index.html',
    newPath: 'index.html',
    title: 'Shell and navigation shifted',
    explanation: 'The app moved from the older Spatial Quasar shell to the newer teaching-lab layout.'
  }
]

function renderSummary(entries) {
  return {
    added: entries.filter((entry) => entry.type === 'added').length,
    removed: entries.filter((entry) => entry.type === 'removed').length,
    modified: entries.filter((entry) => entry.type === 'modified').length,
    refactored: entries.filter((entry) => entry.type === 'refactored').length,
    expanded: entries.filter((entry) => entry.type === 'expanded').length,
  }
}

function renderChangeList(entries, activeFilter) {
  const visibleEntries = activeFilter === 'all'
    ? entries
    : entries.filter((entry) => entry.type === activeFilter || entry.category === activeFilter)

  return visibleEntries
}
```

**Step 4: Run the smoke check to verify it passes**

Run: `pwsh -NoProfile -File .\scripts\check-project-evolution-explorer.ps1`
Expected: PASS with no output

**Step 5: Commit**

```bash
git add project-evolution-explorer.html project-evolution-explorer.js scripts/check-project-evolution-explorer.ps1
git commit -m "feat: add diff explorer dataset and summary rendering"
```

### Task 3: Build The Showcase Sections And Interactive Evidence Drawer

**Files:**
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\project-evolution-explorer.html`
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\project-evolution-explorer.css`
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\project-evolution-explorer.js`
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\scripts\check-project-evolution-explorer.ps1`

**Step 1: Write the failing interaction-state check**

```powershell
$html = Get-Content 'project-evolution-explorer.html' -Raw
$requiredSections = @(
  'id="hero-console"',
  'id="change-explorer"',
  'id="evolution-stories"',
  'id="architecture-lens"',
  'id="evidence-drawer"'
)
foreach ($section in $requiredSections) {
  if ($html -notmatch [regex]::Escape($section)) {
    throw "Missing required section: $section"
  }
}

$js = Get-Content 'project-evolution-explorer.js' -Raw
$requiredTokens = @('openEvidenceDrawer', 'setActiveFilter', 'renderStories', 'matchMedia("(prefers-reduced-motion: reduce)")')
foreach ($token in $requiredTokens) {
  if ($js -notmatch [regex]::Escape($token)) {
    throw "Missing required interaction token: $token"
  }
}
```

**Step 2: Run the smoke check to verify it fails**

Run: `pwsh -NoProfile -File .\scripts\check-project-evolution-explorer.ps1`
Expected: FAIL with a missing section or interaction token

**Step 3: Write the minimal interaction implementation**

```js
function setActiveFilter(nextFilter) {
  state.activeFilter = nextFilter
  renderAll()
}

function openEvidenceDrawer(entryId) {
  state.activeEntryId = entryId
  drawer.removeAttribute('hidden')
  renderDrawer()
}

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
if (!prefersReducedMotion) {
  document.documentElement.classList.add('motion-ready')
}
```

```html
<section id="evolution-stories"></section>
<section id="architecture-lens"></section>
<aside id="evidence-drawer" hidden></aside>
```

**Step 4: Run the smoke check to verify it passes**

Run: `pwsh -NoProfile -File .\scripts\check-project-evolution-explorer.ps1`
Expected: PASS with no output

**Step 5: Commit**

```bash
git add project-evolution-explorer.html project-evolution-explorer.css project-evolution-explorer.js scripts/check-project-evolution-explorer.ps1
git commit -m "feat: add explorer interactions and evidence drawer"
```

### Task 4: Apply The Approved Visual System And Responsive Motion Polish

**Files:**
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\project-evolution-explorer.css`
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\project-evolution-explorer.html`
- Modify: `C:\Users\Emmy Lou\Downloads\New folder (16)\project-evolution-explorer.js`

**Step 1: Write the failing visual-system check**

```powershell
$css = Get-Content 'project-evolution-explorer.css' -Raw
$requiredTokens = @(
  '--accent-moss',
  '.hero-console',
  '.change-filter.is-active',
  '@media (max-width: 768px)',
  '@media (prefers-reduced-motion: reduce)'
)
foreach ($token in $requiredTokens) {
  if ($css -notmatch [regex]::Escape($token)) {
    throw "Missing required style token: $token"
  }
}
```

**Step 2: Run the smoke check to verify it fails**

Run: `pwsh -NoProfile -File .\scripts\check-project-evolution-explorer.ps1`
Expected: FAIL with a missing style token such as `--accent-moss`

**Step 3: Write the minimal visual-system implementation**

```css
:root {
  --surface: #f4f1ea;
  --ink: #171915;
  --muted: #687166;
  --accent-moss: #7b9661;
}

.hero-console {
  min-height: 100dvh;
}

.change-filter.is-active {
  transform: translateY(-1px);
}

@media (max-width: 768px) {
  .explorer-shell {
    grid-template-columns: 1fr;
  }
}

@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}
```

**Step 4: Run the smoke check and manual QA**

Run: `pwsh -NoProfile -File .\scripts\check-project-evolution-explorer.ps1`
Expected: PASS with no output

Run: `python -m http.server 4173 --bind 127.0.0.1`
Expected: local server starts successfully

Manual verification:
- open `http://127.0.0.1:4173/project-evolution-explorer.html`
- confirm hero counters animate once
- confirm filters update visible records
- confirm drawer opens with the selected entry
- confirm mobile layout stacks cleanly
- confirm reduced-motion mode removes continuous motion

**Step 5: Commit**

```bash
git add project-evolution-explorer.html project-evolution-explorer.css project-evolution-explorer.js scripts/check-project-evolution-explorer.ps1
git commit -m "feat: polish project evolution explorer"
```
