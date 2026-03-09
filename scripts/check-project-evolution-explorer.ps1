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
if ($html -notmatch 'project-evolution-explorer.css') {
  throw 'HTML does not reference the explorer stylesheet.'
}
if ($html -notmatch 'project-evolution-explorer.js') {
  throw 'HTML does not reference the explorer script.'
}
