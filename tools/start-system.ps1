$ErrorActionPreference = "Stop"

function Test-PortListening {
    param(
        [Parameter(Mandatory = $true)][int]$Port
    )

    $line = netstat -ano | Select-String ":$Port" | Select-String "LISTENING"
    return [bool]$line
}

function Assert-EnvValue {
    param(
        [Parameter(Mandatory = $true)][string]$FilePath,
        [Parameter(Mandatory = $true)][string]$Key
    )

    if (-not (Test-Path $FilePath)) {
        throw "Missing env file: $FilePath"
    }

    $line = Get-Content $FilePath | Where-Object { $_ -match "^$Key=" } | Select-Object -First 1
    if (-not $line) {
        throw "Missing '$Key' in $FilePath"
    }

    $value = ($line -replace "^$Key=", "").Trim()
    if ([string]::IsNullOrWhiteSpace($value)) {
        throw "Empty '$Key' in $FilePath"
    }
}

$root = Split-Path -Parent $PSScriptRoot
$frontendEnv = Join-Path $root "frontend/.env.local"
$backendEnv = Join-Path $root "backend/.env"

Assert-EnvValue -FilePath $frontendEnv -Key "NEXT_PUBLIC_SUPABASE_URL"
Assert-EnvValue -FilePath $frontendEnv -Key "NEXT_PUBLIC_SUPABASE_ANON_KEY"
Assert-EnvValue -FilePath $backendEnv -Key "SUPABASE_URL"
Assert-EnvValue -FilePath $backendEnv -Key "SUPABASE_API_KEY"

if (-not (Test-PortListening -Port 8000)) {
    Start-Process -FilePath "python" `
        -ArgumentList "-m uvicorn main:app --reload --host 127.0.0.1 --port 8000" `
        -WorkingDirectory (Join-Path $root "backend") `
        -WindowStyle Hidden `
        -RedirectStandardOutput (Join-Path $root "backend_stdout.log") `
        -RedirectStandardError (Join-Path $root "backend_stderr.log") | Out-Null
    Write-Host "Backend start requested on http://127.0.0.1:8000"
} else {
    Write-Host "Backend already running on port 8000"
}

if (-not (Test-PortListening -Port 3000)) {
    Start-Process -FilePath "cmd.exe" `
        -ArgumentList "/c", "npm run dev" `
        -WorkingDirectory (Join-Path $root "frontend") `
        -WindowStyle Hidden `
        -RedirectStandardOutput (Join-Path $root "frontend_stdout.log") `
        -RedirectStandardError (Join-Path $root "frontend_stderr.log") | Out-Null
    Write-Host "Frontend start requested on http://localhost:3000"
} else {
    Write-Host "Frontend already running on port 3000"
}

$deadline = (Get-Date).AddSeconds(30)
do {
    $frontendUp = Test-PortListening -Port 3000
    $backendUp = Test-PortListening -Port 8000
    if ($frontendUp -and $backendUp) { break }
    Start-Sleep -Milliseconds 500
} while ((Get-Date) -lt $deadline)

if (-not $frontendUp -or -not $backendUp) {
    throw "System startup timed out. Check frontend_stderr.log/backend_stderr.log"
}

Write-Host ""
Write-Host "System is up:"
Write-Host "- Frontend: http://localhost:3000"
Write-Host "- Backend:  http://127.0.0.1:8000/docs"
