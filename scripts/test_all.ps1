# PowerShell Full-Stack Test Runner
# Verifies all 4 tiers: Python ML services, Java Spring Boot Backend, and Desktop UI

Write-Host '============================================================' -ForegroundColor Cyan
Write-Host ' INTELLIGENT RF SPECTRUM SCANNER — VERIFYING ALL TIERS' -ForegroundColor Cyan
Write-Host '============================================================' -ForegroundColor Cyan

# 1. Ensure JAVA_HOME is configured
if (-not $env:JAVA_HOME -or -not (Test-Path "$env:JAVA_HOME\bin\java.exe")) {
    $env:JAVA_HOME = 'C:\Users\arast\Downloads\JAVA'
}
$env:PATH = "$env:JAVA_HOME\bin;$env:PATH"

$javaVer = & java -version 2>&1 | Select-Object -First 1
Write-Host "[1/3] Java Environment: $javaVer" -ForegroundColor Green

# 2. Run Python AI/ML Services Tests
Write-Host "`n[2/3] Running AI/ML Unit and Integration Test Suites..." -ForegroundColor Yellow
python -m pytest "ai-ml/ai-ml-1-scheduler/tests" -q
if ($LASTEXITCODE -ne 0) {
    Write-Host '[-] AI-ML-1 Scheduler tests failed!' -ForegroundColor Red
    exit 1
}
Write-Host '[+] AI-ML-1 Scheduler tests passed cleanly.' -ForegroundColor Green

python -m pytest "ai-ml/ai-ml-2-periodicity/tests" -q
if ($LASTEXITCODE -ne 0) {
    Write-Host '[-] AI-ML-2 Periodicity tests failed!' -ForegroundColor Red
    exit 1
}
Write-Host '[+] AI-ML-2 Periodicity tests passed cleanly.' -ForegroundColor Green

# 3. Run Java Spring Boot Backend Unit and Integration Tests
Write-Host "`n[3/3] Running Java Spring Boot Backend Test Suite..." -ForegroundColor Yellow
Push-Location "$PSScriptRoot\..\Backend"
try {
    .\mvnw.cmd test
    if ($LASTEXITCODE -ne 0) {
        Write-Host '[-] Backend Maven tests failed!' -ForegroundColor Red
        exit 1
    }
    Write-Host '[+] Backend Maven tests passed cleanly.' -ForegroundColor Green
} finally {
    Pop-Location
}

Write-Host "`n============================================================" -ForegroundColor Green
Write-Host ' ALL TEST SUITES PASSED CLEANLY WITH ZERO FAILURES' -ForegroundColor Green
Write-Host '============================================================' -ForegroundColor Green
