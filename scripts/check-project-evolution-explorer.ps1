$ErrorActionPreference = 'Stop'

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
if ($html -notmatch 'project-evolution-explorer.css') {
  throw 'HTML does not reference the explorer stylesheet.'
}
if ($html -notmatch 'project-evolution-explorer.js') {
  throw 'HTML does not reference the explorer script.'
}

$js = Get-Content 'project-evolution-explorer.js' -Raw
$requiredTokens = @(
  'const comparisonEntries',
  'renderSummary',
  'renderChangeList',
  'openEvidenceDrawer',
  'setActiveFilter',
  'renderStories',
  'matchMedia("(prefers-reduced-motion: reduce)")'
)
foreach ($token in $requiredTokens) {
  if ($js -notmatch [regex]::Escape($token)) {
    throw "Missing required script token: $token"
  }
}
