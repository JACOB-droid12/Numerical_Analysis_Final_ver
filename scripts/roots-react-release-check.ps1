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
$RootsReactPath = Join-Path $RepoRoot "roots-react"

Push-Location $RepoRoot
try {
    Invoke-RequiredCommand "node" @("scripts/engine-correctness-audit.js")
    Invoke-RequiredCommand "node" @("scripts/root-engine-audit.js")
}
finally {
    Pop-Location
}

Push-Location $RootsReactPath
try {
    Invoke-RequiredCommand "npm" @("run", "sync:legacy")
    Invoke-RequiredCommand "npm" @("run", "typecheck")
    Invoke-RequiredCommand "npm" @("run", "build")
}
finally {
    Pop-Location
}
