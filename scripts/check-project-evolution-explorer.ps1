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

$requiredHooks = @(
  'data-summary-value',
  'data-proof-grid',
  'data-filter-bar',
  'data-change-list',
  'data-empty-state',
  'data-evidence-drawer',
  'data-capability-grid',
  'data-architecture-old',
  'data-architecture-new'
)
foreach ($hook in $requiredHooks) {
  if ($html -notmatch [regex]::Escape($hook)) {
    throw "Missing required hook: $hook"
  }
}

$js = Get-Content 'project-evolution-explorer.js' -Raw
$requiredTokens = @(
  'const comparisonEntries',
  'const proofModules',
  'const capabilityStories',
  'function buildSummaryMetrics',
  'function buildArchitectureGroups',
  'function renderProofBand',
  'function renderChangeExplorer',
  'function renderCapabilityStories',
  'function renderArchitectureLens',
  'function syncEvidenceDrawer',
  "window.matchMedia('(prefers-reduced-motion: reduce)')"
)
foreach ($token in $requiredTokens) {
  if ($js -notmatch [regex]::Escape($token)) {
    throw "Missing required script token: $token"
  }
}

$css = Get-Content 'project-evolution-explorer.css' -Raw
$requiredStyleTokens = @(
  '--surface-0',
  '--accent-signal',
  '.release-shell',
  '.launch-hero',
  '.proof-band',
  '.comparison-engine',
  '.change-filter.is-active',
  '@media (max-width: 768px)',
  '@media (prefers-reduced-motion: reduce)'
)
foreach ($token in $requiredStyleTokens) {
  if ($css -notmatch [regex]::Escape($token)) {
    throw "Missing required style token: $token"
  }
}
