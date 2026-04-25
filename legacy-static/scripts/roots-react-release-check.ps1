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

    Push-Location $RepoRoot
    try {
        & git diff --quiet -- roots-react/public/legacy
        if ($LASTEXITCODE -eq 1) {
            Write-Error "roots-react/public/legacy has tracked changes after sync. Commit the synced legacy engine files before running the release check."
        }
        elseif ($LASTEXITCODE -ne 0) {
            throw "git diff --quiet -- roots-react/public/legacy failed with exit code $LASTEXITCODE"
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
