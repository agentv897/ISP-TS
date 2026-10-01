# Startup Script for Suneel - All 3 Modules + Frontend
# Usage: .\run_portal_suneel_new.ps1
# Updated: New port numbers to avoid conflicts

Write-Host ""
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "    Drug Interaction & Analysis Platform            " -ForegroundColor Cyan
Write-Host "    Starting all services...                        " -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

# Resolve Python - check multiple venv locations
$ROOT = Split-Path -Parent $MyInvocation.MyCommand.Path

$PYTHON = $null
foreach ($venvDir in @("myenv", "venv_portal", "venv_suneel", "myenv_new", "venv", "venv1")) {
    $candidate = Join-Path $ROOT "$venvDir\Scripts\python.exe"
    if (Test-Path $candidate) {
        # Verify the venv python is actually functional (not pointing to another user's Python)
        try {
            $testResult = & $candidate -c "print('ok')" 2>&1
            if ($testResult -eq "ok") {
                $PYTHON = $candidate
                break
            }
        } catch {
            continue
        }
    }
}
if (-not $PYTHON) {
    $PYTHON = (Get-Command python -ErrorAction SilentlyContinue).Source
}

if (-not $PYTHON) {
    Write-Host "  ERROR: Python not found." -ForegroundColor Red
    exit 1
}
Write-Host "  Using Python: $PYTHON" -ForegroundColor DarkGray

# ── Port Configuration ──
$DE_PORT   = 8201   # Data Extraction Backend
$TOX_PORT  = 8202   # Toxicity Prediction Backend
$KG_PORT   = 8203   # Knowledge Graph Backend
$FE_PORT   = 5190   # Unified Frontend

Write-Host ""
Write-Host "  Port Assignments:" -ForegroundColor DarkGray
Write-Host "    Data Extraction:    $DE_PORT" -ForegroundColor DarkGray
Write-Host "    Tox Prediction:     $TOX_PORT" -ForegroundColor DarkGray
Write-Host "    Knowledge Graph:    $KG_PORT" -ForegroundColor DarkGray
Write-Host "    Frontend:           $FE_PORT" -ForegroundColor DarkGray
Write-Host ""

# 0. Cleanup - Kill any processes on the new ports
Write-Host "[0/4] Cleaning up existing services..." -ForegroundColor Yellow
$ports = @($DE_PORT, $TOX_PORT, $KG_PORT, $FE_PORT)
foreach ($port in $ports) {
    $proc = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($proc -and $proc.OwningProcess -ne 0) {
        Stop-Process -Id $proc.OwningProcess -Force -ErrorAction SilentlyContinue
        Write-Host "      Killed process on port $port (PID: $($proc.OwningProcess))" -ForegroundColor DarkGray
    }
}

# 1. Data Extraction Backend
Write-Host "[1/4] Starting Data Extraction Backend on port $DE_PORT..." -ForegroundColor Yellow
$deBackend = Start-Process $PYTHON -ArgumentList "-m", "uvicorn", "main_gauravvm:app", "--host", "0.0.0.0", "--port", "$DE_PORT" -WorkingDirectory "$ROOT\Data_extraction\backend" -PassThru -WindowStyle Normal
if ($deBackend) { Write-Host "      PID: $($deBackend.Id)" -ForegroundColor DarkGray }

# 2. Toxicity Prediction Backend
Write-Host "[2/4] Starting Toxicity Prediction Backend on port $TOX_PORT..." -ForegroundColor Yellow
$toxBackend = Start-Process $PYTHON -ArgumentList "-m", "uvicorn", "api_render:app", "--host", "0.0.0.0", "--port", "$TOX_PORT" -WorkingDirectory "$ROOT\Tox_pred\research\app" -PassThru -WindowStyle Normal
if ($toxBackend) { Write-Host "      PID: $($toxBackend.Id)" -ForegroundColor DarkGray }

# 3. Knowledge Graph Backend
Write-Host "[3/4] Starting Knowledge Graph Backend on port $KG_PORT..." -ForegroundColor Yellow
$OldPort = $env:PORT
$env:PORT = "$KG_PORT"
$kgBackend = Start-Process $PYTHON -ArgumentList "flask_server.py" -WorkingDirectory "$ROOT\kg" -PassThru -WindowStyle Normal
$env:PORT = $OldPort
if ($kgBackend) { Write-Host "      PID: $($kgBackend.Id)" -ForegroundColor DarkGray }

# 4. Unified Frontend
Write-Host "[4/4] Starting Unified Frontend on port $FE_PORT..." -ForegroundColor Green
Start-Sleep -Seconds 2
$frontend = Start-Process ".\node_modules\.bin\vite.cmd" -ArgumentList "--port", "$FE_PORT", "--config", "vite.config.suneel.js" -WorkingDirectory "$ROOT\frontend" -PassThru -WindowStyle Normal
if ($frontend) { Write-Host "      PID: $($frontend.Id)" -ForegroundColor DarkGray }

Write-Host ""
Write-Host "  All services initiated!" -ForegroundColor Green
Write-Host ""
Write-Host "  Portal: http://localhost:$FE_PORT" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Backend APIs:" -ForegroundColor DarkGray
Write-Host "    Data Extraction:  http://localhost:$DE_PORT/api/health" -ForegroundColor DarkGray
Write-Host "    Tox Prediction:   http://localhost:$TOX_PORT/api/health" -ForegroundColor DarkGray
Write-Host "    Knowledge Graph:  http://localhost:$KG_PORT/" -ForegroundColor DarkGray
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
