# PowerShell Local Workstation Orchestrator
# Starts all four tiers in background processes on 127.0.0.1 loopback

Write-Host "============================================================" -ForegroundColor Cyan
Write-Host " LAUNCHING INTELLIGENT RF SPECTRUM SCANNER WORKSTATION" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan

# Configure Java
if (-not $env:JAVA_HOME -or -not (Test-Path "$env:JAVA_HOME\bin\java.exe")) {
    $env:JAVA_HOME = "C:\Users\arast\Downloads\JAVA"
}
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

# 1. Start AI-ML-1 (Contextual Bandit & DQN) on port 8500
Write-Host "[1/4] Starting AI-ML-1 Scheduler Service on 127.0.0.1:8500..." -ForegroundColor Yellow
$procMl1 = Start-Process python -ArgumentList "-m uvicorn ml.api.main:app --host 127.0.0.1 --port 8500" -WorkingDirectory "$PSScriptRoot\..\ai-ml\ai-ml-1-scheduler" -PassThru

# 2. Start AI-ML-2 (Periodicity Estimator) on port 8600
Write-Host "[2/4] Starting AI-ML-2 Periodicity Service on 127.0.0.1:8600..." -ForegroundColor Yellow
$procMl2 = Start-Process python -ArgumentList "-m uvicorn periodicity.api.main:app --host 127.0.0.1 --port 8600" -WorkingDirectory "$PSScriptRoot\..\ai-ml\ai-ml-2-periodicity" -PassThru

# 3. Start Spring Boot Backend on port 8080
Write-Host "[3/4] Starting Java Spring Boot Backend on 127.0.0.1:8080..." -ForegroundColor Yellow
$backendDir = Resolve-Path "$PSScriptRoot\..\Backend"
$jarPath = "$backendDir\target\backend-0.0.1-SNAPSHOT.jar"
$procBackend = Start-Process "$env:JAVA_HOME\bin\java.exe" -ArgumentList "-jar `"$jarPath`"" -WorkingDirectory "$backendDir" -PassThru

# Wait briefly for backend to initialize
Start-Sleep -Seconds 3

# 4. Start Standalone Desktop Application Window (.exe)
Write-Host "[4/4] Launching Native Windows Desktop Application Window (.exe)..." -ForegroundColor Yellow
$exePath = Resolve-Path "$PSScriptRoot\..\deployment\installer\win-unpacked\Intelligent RF Spectrum Scanner.exe" -ErrorAction SilentlyContinue

if ($exePath -and (Test-Path $exePath)) {
    Start-Process "$exePath"
} else {
    $desktopDir = Resolve-Path "$PSScriptRoot\..\desktop"
    Start-Process cmd.exe -ArgumentList "/c cd /d `"$desktopDir`" && npm run desktop"
}

Write-Host "`nAll background services and desktop application initiated successfully." -ForegroundColor Green
Write-Host "AI-ML-1: http://127.0.0.1:8500/internal/health" -ForegroundColor Cyan
Write-Host "AI-ML-2: http://127.0.0.1:8600/internal/health" -ForegroundColor Cyan
Write-Host "Backend: http://127.0.0.1:8080/api/v1/simulations" -ForegroundColor Cyan
Write-Host "Desktop Application (.exe): Running natively on Windows desktop (not on browser)" -ForegroundColor Green
Write-Host "`nTo stop all background processes when done, run: .\scripts\stop_all.ps1" -ForegroundColor Yellow
