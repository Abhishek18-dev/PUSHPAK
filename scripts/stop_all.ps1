# Stop all running workstation services
Write-Host "Terminating local RF Scheduler processes on ports 8500, 8600, 8080..." -ForegroundColor Yellow

# Kill processes listening on 8500, 8600, 8080
$ports = @(8500, 8600, 8080)
foreach ($port in $ports) {
    $connections = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue
    if ($connections) {
        foreach ($conn in $connections) {
            $procId = $conn.OwningProcess
            if ($procId -gt 0) {
                Write-Host "Terminating PID $procId on port $port" -ForegroundColor Yellow
                Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
            }
        }
    }
}

# Also stop desktop exe if running
Stop-Process -Name "Intelligent RF Spectrum Scanner" -Force -ErrorAction SilentlyContinue

Write-Host "All processes stopped." -ForegroundColor Green
