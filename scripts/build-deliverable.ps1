$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$deliverable = Join-Path $root "deliverable"

$files = @(
  "index.html",
  "styles.css",
  "app.js",
  "math-engine.js",
  "expression-engine.js",
  "calc-engine.js",
  "poly-engine.js",
  "math-display.js"
)

if (Test-Path $deliverable) {
  Remove-Item $deliverable -Recurse -Force
}

New-Item -ItemType Directory -Path $deliverable | Out-Null

foreach ($file in $files) {
  $source = Join-Path $root $file
  if (-not (Test-Path $source)) {
    throw "Required file missing: $file"
  }

  Copy-Item $source -Destination (Join-Path $deliverable $file) -Force
}

$favicon = Get-ChildItem -Path $root -File |
  Where-Object { $_.BaseName -eq "favicon" -and $_.Extension -in ".ico", ".png", ".svg" } |
  Select-Object -First 1

if ($favicon) {
  Copy-Item $favicon.FullName -Destination (Join-Path $deliverable $favicon.Name) -Force
}

$readme = @"
This folder contains the standalone Numerical Analysis Calculator.

To use it:
1. Open index.html
2. Use any modern browser (Chrome, Edge, Firefox)
3. No installation is required
"@

$openMe = @"
Open index.html in your browser.
No installation is required.
"@

Set-Content -Path (Join-Path $deliverable "README.txt") -Value $readme -Encoding UTF8
Set-Content -Path (Join-Path $deliverable "OPEN-ME-FIRST.txt") -Value $openMe -Encoding UTF8

Write-Output "Deliverable created at: $deliverable"
Get-ChildItem $deliverable | Select-Object Name, Length
