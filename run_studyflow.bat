@echo off
set PYTHONIOENCODING=utf-8
title AI StudyFlow Dev Suite
cd /d "%~dp0"

echo ===================================================
echo   🚀 AI StudyFlow One-Click Launcher
echo ===================================================

:: 1. Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo 🐳 Docker daemon is not running. 
    echo ⏳ Attempting to start Docker Desktop...
    
    if exist "C:\Program Files\Docker\Docker\Docker Desktop.exe" (
        start "" "C:\Program Files\Docker\Docker\Docker Desktop.exe"
        echo 🕒 Waiting for Docker to initialize - approx. 20 seconds...
        timeout /t 20 /nobreak
    ) else (
        echo ❌ Docker Desktop was not found in the default location.
        echo Please open Docker Desktop manually, then press any key to continue.
        pause >nul
    )
)

:: Double check Docker before continuing
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ⚠️ Docker is still not responding. We will attempt to run anyway...
)

:: 2. Launch Development Suite
echo ===================================================
echo   📦 Initializing Python Dev Environment...
echo ===================================================
.\backend\venv\Scripts\python.exe start_dev.py

if %errorlevel% neq 0 (
    echo ❌ The development suite crashed or failed to start.
    pause
)
