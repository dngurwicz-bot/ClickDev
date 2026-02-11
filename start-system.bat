@echo off
REM CLICK System Quick Start Batch File
REM This script starts both backend and frontend servers in separate windows

setlocal enabledelayedexpansion

echo.
echo ====================================
echo    CLICK System Startup Script
echo ====================================
echo.

REM Get the directory where this script is located
set ROOTDIR=%~dp0

echo Starting CLICK System from: %ROOTDIR%
echo.

REM Check if backend .env exists
if not exist "%ROOTDIR%backend\.env" (
    echo ERROR: backend\.env not found!
    echo Please ensure .env file is configured.
    pause
    exit /b 1
)

REM Check if frontend .env.local exists
if not exist "%ROOTDIR%frontend\.env.local" (
    echo ERROR: frontend\.env.local not found!
    echo Please ensure .env.local file is configured.
    pause
    exit /b 1
)

echo [1/4] Configuration files verified...
echo.

REM Start Backend
echo [2/4] Starting Backend Server (FastAPI)...
echo       Running: python run_server.py
echo       Listen: http://localhost:8000
start "CLICK Backend" /D "%ROOTDIR%backend" cmd /k python run_server.py
timeout /t 3 /nobreak

echo.

REM Check if node_modules exists in frontend
if not exist "%ROOTDIR%frontend\node_modules" (
    echo [3/4] Installing Frontend Dependencies...
    start "Frontend NPM Install" /D "%ROOTDIR%frontend" /wait cmd /k npm install
) else (
    echo [3/4] Frontend dependencies already installed
)

echo.

REM Start Frontend
echo [4/4] Starting Frontend Server (Next.js)...
echo       Running: npm run dev
echo       Listen: http://localhost:3000
start "CLICK Frontend" /D "%ROOTDIR%frontend" cmd /k npm run dev

echo.
echo ====================================
echo    CLICK System is Starting Up
echo ====================================
echo.
echo Frontend:  http://localhost:3000
echo Backend:   http://localhost:8000
echo API Docs:  http://localhost:8000/docs
echo.
echo Open https://localhost:3000 in your browser
echo.
timeout /t 5

endlocal
