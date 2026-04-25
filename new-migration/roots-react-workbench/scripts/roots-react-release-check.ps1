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

$WorkspaceRoot = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path

Push-Location $WorkspaceRoot
try {
    Invoke-RequiredCommand "node" @("scripts/engine-correctness-audit.cjs")
    Invoke-RequiredCommand "node" @("scripts/root-engine-audit.cjs")
    Invoke-RequiredCommand "npm" @("run", "sync:legacy")

    & git rev-parse --is-inside-work-tree *> $null
    if ($LASTEXITCODE -eq 0) {
        & git diff --quiet -- public/legacy
        if ($LASTEXITCODE -eq 1) {
            Write-Error "public/legacy has tracked changes after sync. Commit the synced legacy engine files before running the release check."
        }
        elseif ($LASTEXITCODE -ne 0) {
            throw "git diff --quiet -- public/legacy failed with exit code $LASTEXITCODE"
        }
    }

    Invoke-RequiredCommand "npm" @("run", "typecheck")
    Invoke-RequiredCommand "npm" @("run", "build")
}
finally {
    Pop-Location
}
