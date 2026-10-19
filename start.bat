@echo off
setlocal enabledelayedexpansion
title Aura Smart Home - 1-Click Launcher

echo ======================================================================
echo    Aura Smart Home Cyber-Physical HVAC ^& Fuzzy Logic Controller
echo                        1-Click Universal Launcher
echo ======================================================================
echo.

:: 1. Verify Prerequisites
echo [1/5] Checking Python installation...
python --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Python is not installed or not in PATH!
    echo Please install Python 3.10 or higher from https://python.org
    pause
    exit /b 1
)

echo [2/5] Checking Node.js installation...
node --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH!
    echo Please install Node.js 18 or higher from https://nodejs.org
    pause
    exit /b 1
)

:: 2. Setup Python Virtual Environment
echo [3/5] Setting up Backend Virtual Environment...
if not exist ".venv\Scripts\python.exe" (
    echo Creating virtual environment (.venv)...
    python -m venv .venv
    echo Installing backend dependencies from requirements.txt...
    .\.venv\Scripts\python.exe -m pip install --upgrade pip
    .\.venv\Scripts\python.exe -m pip install -r requirements.txt
) else (
    echo Virtual environment (.venv) found.
)

:: 3. Setup Frontend Dependencies
echo [4/5] Checking Frontend Dependencies...
if not exist "frontend\node_modules\" (
    echo Installing frontend dependencies via npm...
    cd frontend
    call npm install
    cd ..
) else (
    echo Frontend node_modules found.
)

:: 4. Launch Backend and Frontend
echo [5/5] Launching Services...
echo - Starting FastAPI Backend Server on http://127.0.0.1:8000...
start "Aura Backend (FastAPI)" cmd /k "title Aura Backend && .\.venv\Scripts\python.exe -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000"

echo - Starting Next.js Frontend on http://localhost:3000...
start "Aura Frontend (Next.js)" cmd /k "title Aura Frontend && cd frontend && npm run dev"

:: 5. Open Web Browser
echo Waiting 4 seconds for servers to initialize...
timeout /t 4 /nobreak >nul
echo Opening your browser to http://localhost:3000...
start http://localhost:3000

echo.
echo ======================================================================
echo  Aura System is now running!
echo  - Frontend Dashboard: http://localhost:3000
echo  - Backend API Docs:   http://127.0.0.1:8000/docs
echo.
echo  To shut down, simply close the two command windows or press Ctrl+C.
echo ======================================================================
echo.
pause
