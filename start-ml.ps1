# start-ml.ps1 — Start the FastAPI ML service (port 8000)
# Run AFTER setup-ml.ps1

$ErrorActionPreference = "Stop"
$mlDir = "$PSScriptRoot\ml-models"
$venvPython = "$mlDir\.venv\Scripts\python.exe"

if (-not (Test-Path $venvPython)) {
    Write-Host "[ERROR] Virtual environment not found. Run setup-ml.ps1 first." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host "  Starting ML service on port 8000... " -ForegroundColor Green
Write-Host "  Press Ctrl+C to stop               " -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host ""

Push-Location $mlDir
try {
    & $venvPython service.py
} finally {
    Pop-Location
}
