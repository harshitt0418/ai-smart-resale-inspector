# setup-ml.ps1 — One-click Python ML service setup for Windows
# Run this script in PowerShell to install Python 3.11 and all ML dependencies.
# After running, use start-ml.ps1 to launch the FastAPI service.

$ErrorActionPreference = "Stop"
$mlDir = "$PSScriptRoot\ml-models"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  AI Smart Resale Inspector — ML Setup  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ── Check for Python ──────────────────────────────────────────────────────────
$pythonCmd = $null
foreach ($cmd in @("python3.11", "python3", "python", "py")) {
    try {
        $ver = & $cmd --version 2>&1
        if ($ver -match "Python 3\.(9|10|11|12)") {
            $pythonCmd = $cmd
            Write-Host "[OK] Found $ver ($cmd)" -ForegroundColor Green
            break
        }
    } catch { }
}

if (-not $pythonCmd) {
    Write-Host "[INFO] Python 3.9+ not found. Attempting install via winget..." -ForegroundColor Yellow
    try {
        winget install --id Python.Python.3.11 --source winget --accept-package-agreements --accept-source-agreements
        $pythonCmd = "python"
        Write-Host "[OK] Python 3.11 installed. You may need to restart your terminal." -ForegroundColor Green
    } catch {
        Write-Host ""
        Write-Host "[ERROR] Could not auto-install Python. Please install manually:" -ForegroundColor Red
        Write-Host "  1. Visit https://www.python.org/downloads/" -ForegroundColor Yellow
        Write-Host "  2. Download Python 3.11.x (Windows installer, 64-bit)" -ForegroundColor Yellow
        Write-Host "  3. Run installer — CHECK 'Add python.exe to PATH'" -ForegroundColor Yellow
        Write-Host "  4. Re-run this script" -ForegroundColor Yellow
        exit 1
    }
}

# ── Create virtual environment ────────────────────────────────────────────────
$venvPath = "$mlDir\.venv"
if (-not (Test-Path $venvPath)) {
    Write-Host "[INFO] Creating virtual environment at ml-models\.venv ..." -ForegroundColor Cyan
    & $pythonCmd -m venv $venvPath
    Write-Host "[OK] Virtual environment created" -ForegroundColor Green
} else {
    Write-Host "[OK] Virtual environment already exists" -ForegroundColor Green
}

$pip = "$venvPath\Scripts\pip.exe"

# ── Install dependencies ──────────────────────────────────────────────────────
Write-Host ""
Write-Host "[INFO] Installing ML dependencies from requirements.txt ..." -ForegroundColor Cyan
Write-Host "       (First run may take 5-10 minutes — ultralytics + torch)" -ForegroundColor Yellow
Write-Host ""

& $pip install --upgrade pip --quiet
& $pip install -r "$mlDir\requirements.txt"

Write-Host ""
Write-Host "[OK] All dependencies installed!" -ForegroundColor Green
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Setup complete. Start the ML service:  " -ForegroundColor Cyan
Write-Host "    .\start-ml.ps1                       " -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
