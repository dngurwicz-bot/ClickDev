#!/usr/bin/env pwsh
# CLICK System Startup Script

Write-Host "Starting CLICK System..." -ForegroundColor Cyan

$rootDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path $rootDir "backend"
$frontendDir = Join-Path $rootDir "frontend"

Write-Host "Root directory: $rootDir" -ForegroundColor Gray
Write-Host ""

# Start Backend
Write-Host "Starting Backend (FastAPI)..." -ForegroundColor Green
Write-Host "Command: python run_server.py" -ForegroundColor Gray
Set-Location $backendDir
Start-Process -NoNewWindow -PassThru python run_server.py
Write-Host "Backend started on http://localhost:8000" -ForegroundColor Green
Write-Host ""

# Install frontend dependencies if needed
Write-Host "Checking frontend dependencies..." -ForegroundColor Yellow
Set-Location $frontendDir
if (-Not (Test-Path "node_modules")) {
    Write-Host "Installing npm dependencies..." -ForegroundColor Yellow
    npm install
}

# Start Frontend
Write-Host "Starting Frontend (Next.js)..." -ForegroundColor Green
Write-Host "Command: npm run dev" -ForegroundColor Gray
Start-Process -NoNewWindow -PassThru npm run dev
Write-Host "Frontend started on http://localhost:3000" -ForegroundColor Green
Write-Host ""

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "CLICK System is Starting Up" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Frontend:  http://localhost:3000" -ForegroundColor Green
Write-Host "Backend:   http://localhost:8000" -ForegroundColor Green
Write-Host "API Docs:  http://localhost:8000/docs" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C in either terminal to stop a service" -ForegroundColor Yellow
