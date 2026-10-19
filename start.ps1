<#
.SYNOPSIS
    Aura Smart Home Cyber-Physical HVAC - PowerShell Launcher
.DESCRIPTION
    Launches both FastAPI backend and Next.js frontend with automatic dependency setup.
#>

Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host "   Aura Smart Home Cyber-Physical HVAC & Fuzzy Logic Controller" -ForegroundColor Green
Write-Host "                       PowerShell Launcher" -ForegroundColor Cyan
Write-Host "======================================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Verify Prerequisites
Write-Host "[1/5] Checking Python..." -ForegroundColor Yellow
try {
    $pyVersion = & python --version 2>&1
    Write-Host "  Found: $pyVersion" -ForegroundColor Gray
} catch {
    Write-Host "  [ERROR] Python is not installed or not in PATH." -ForegroundColor Red
    Write-Host "  Please install Python 3.10+ from https://python.org" -ForegroundColor Red
    exit 1
}

Write-Host "[2/5] Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = & node --version 2>&1
    Write-Host "  Found Node: $nodeVersion" -ForegroundColor Gray
} catch {
    Write-Host "  [ERROR] Node.js is not installed or not in PATH." -ForegroundColor Red
    Write-Host "  Please install Node.js 18+ from https://nodejs.org" -ForegroundColor Red
    exit 1
}

# 2. Setup Virtual Environment
Write-Host "[3/5] Setting up Backend Virtual Environment..." -ForegroundColor Yellow
if (-not (Test-Path ".venv\Scripts\python.exe")) {
    Write-Host "  Creating virtual environment (.venv)..." -ForegroundColor Gray
    & python -m venv .venv
    Write-Host "  Installing dependencies from requirements.txt..." -ForegroundColor Gray
    & .\.venv\Scripts\python.exe -m pip install --upgrade pip
    & .\.venv\Scripts\python.exe -m pip install -r requirements.txt
} else {
    Write-Host "  Virtual environment (.venv) already configured." -ForegroundColor Gray
}

# 3. Setup Frontend Dependencies
Write-Host "[4/5] Checking Frontend Dependencies..." -ForegroundColor Yellow
if (-not (Test-Path "frontend\node_modules")) {
    Write-Host "  Installing npm packages in ./frontend..." -ForegroundColor Gray
    Push-Location "frontend"
    & npm install
    Pop-Location
} else {
    Write-Host "  Frontend node_modules verified." -ForegroundColor Gray
}

# 4. Launch Services
Write-Host "[5/5] Starting Services..." -ForegroundColor Yellow
$backendJob = Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$Host.UI.RawUI.WindowTitle = 'Aura Backend (FastAPI)'; .\.venv\Scripts\python.exe -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000" -PassThru
$frontendJob = Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$Host.UI.RawUI.WindowTitle = 'Aura Frontend (Next.js)'; Set-Location frontend; npm run dev" -PassThru

Write-Host "  Waiting for servers to initialize..." -ForegroundColor Gray
Start-Sleep -Seconds 4

# 5. Open Browser
Start-Process "http://localhost:3000"

Write-Host ""
Write-Host "======================================================================" -ForegroundColor Green
Write-Host "  Aura is running!" -ForegroundColor Green
Write-Host "  - Frontend UI:  http://localhost:3000" -ForegroundColor White
Write-Host "  - Backend Docs: http://127.0.0.1:8000/docs" -ForegroundColor White
Write-Host "======================================================================" -ForegroundColor Green
Write-Host "Close the launched terminal windows to stop services." -ForegroundColor Yellow
