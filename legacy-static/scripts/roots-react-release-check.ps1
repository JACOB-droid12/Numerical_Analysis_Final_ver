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
    Invoke-RequiredCommand "npm" @("run", "check:legacy")

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

    Invoke-RequiredCommand "npm" @("run", "install:e2e")
    Invoke-RequiredCommand "npm" @("run", "test:unit")
    Invoke-RequiredCommand "npm" @("run", "test:e2e")
    Invoke-RequiredCommand "npm" @("run", "typecheck")
    Invoke-RequiredCommand "npm" @("run", "build")
}
finally {
    Pop-Location
}
