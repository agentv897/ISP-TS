# AViiD Unified Portal - Startup Script
# This script starts all services for the platform.
# Usage: .\run_portal.ps1

Write-Host ""
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "    Drug Interaction & Analysis Platform            " -ForegroundColor Cyan
Write-Host "    Starting all services...                        " -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

# Resolve Python - prefer venv if it exists
$ROOT = Split-Path -Parent $MyInvocation.MyCommand.Path
$VENV_PYTHON = Join-Path $ROOT "venv\Scripts\python.exe"

if (Test-Path $VENV_PYTHON) {
    $PYTHON = $VENV_PYTHON
}
else {
    $PYTHON = (Get-Command python -ErrorAction SilentlyContinue).Source
}

if (-not $PYTHON) {
    Write-Host "  ERROR: Python not found. Please install Python 3.11+." -ForegroundColor Red
    exit 1
}
Write-Host "  Using Python: $PYTHON" -ForegroundColor DarkGray

# 0. Cleanup - Kill existing processes on target ports
Write-Host "[0/4] Cleaning up existing services on target ports..." -ForegroundColor Yellow
$ports = @(8101, 8102, 8103, 5180, 8123, 8125, 4001, 5170)
foreach ($port in $ports) {
    $proc = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($proc) {
        Write-Host "      Stopping process on port $port (PID: $($proc.OwningProcess))..." -ForegroundColor DarkGray
        Stop-Process -Id $proc.OwningProcess -Force -ErrorAction SilentlyContinue
    }
}

# 1. Data Extraction Backend (port 8101)
Write-Host "[1/4] Starting Data Extraction Backend on port 8101..." -ForegroundColor Yellow
$deBackend = Start-Process $PYTHON -ArgumentList "-m", "uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8101" -WorkingDirectory "$ROOT\Data_extraction\backend" -PassThru -WindowStyle Normal
if ($deBackend) { Write-Host "      PID: $($deBackend.Id)" -ForegroundColor DarkGray }

# 2. Toxicity Prediction Backend (port 8102)
Write-Host "[2/4] Starting Toxicity Prediction Backend on port 8102..." -ForegroundColor Yellow
$toxBackend = Start-Process $PYTHON -ArgumentList "-m", "uvicorn", "api_render:app", "--host", "0.0.0.0", "--port", "8102" -WorkingDirectory "$ROOT\Tox_pred\research\app" -PassThru -WindowStyle Normal
if ($toxBackend) { Write-Host "      PID: $($toxBackend.Id)" -ForegroundColor DarkGray }

# 3. Knowledge Graph Backend (port 8103)
Write-Host "[3/4] Starting Knowledge Graph Backend on port 8103..." -ForegroundColor Yellow
$OldPort = $env:PORT
$env:PORT = "8103"
    $kgBackend = Start-Process $PYTHON -ArgumentList "flask_server.py" -WorkingDirectory "$ROOT\kg" -PassThru -WindowStyle Normal
$env:PORT = $OldPort
if ($kgBackend) { Write-Host "      PID: $($kgBackend.Id)" -ForegroundColor DarkGray }

# 4. Unified Frontend (port 5180)
Write-Host "[4/4] Starting Unified Frontend on port 5180..." -ForegroundColor Green
Start-Sleep -Seconds 2
$frontend = Start-Process "npm.cmd" -ArgumentList "run", "dev", "--", "--port", "5180" -WorkingDirectory "$ROOT\frontend" -PassThru -WindowStyle Normal
if ($frontend) { Write-Host "      PID: $($frontend.Id)" -ForegroundColor DarkGray }

Write-Host ""
Write-Host "  All services initiated!" -ForegroundColor Green
Write-Host ""
Write-Host "  Portal: http://localhost:5180" -ForegroundColor Cyan

Write-Host ""
Write-Host "  Press Ctrl+C to stop." -ForegroundColor DarkGray
Write-Host ""

# Keep script alive and handle cleanup
try {
    while ($true) { Start-Sleep -Seconds 60 }
}
finally {
    Write-Host "`n  Shutting down services..." -ForegroundColor Yellow
    if ($deBackend -and !$deBackend.HasExited) { Stop-Process -Id $deBackend.Id -Force -ErrorAction SilentlyContinue }
    if ($toxBackend -and !$toxBackend.HasExited) { Stop-Process -Id $toxBackend.Id -Force -ErrorAction SilentlyContinue }
    if ($kgBackend -and !$kgBackend.HasExited) { Stop-Process -Id $kgBackend.Id -Force -ErrorAction SilentlyContinue }
    if ($frontend -and !$frontend.HasExited) { Stop-Process -Id $frontend.Id -Force -ErrorAction SilentlyContinue }
    Write-Host "  All services stopped." -ForegroundColor Green
}
