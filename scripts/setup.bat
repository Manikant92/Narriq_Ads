@echo off
REM Narriq Setup Script for Windows CMD
REM Run with: scripts\setup.bat

echo.
echo ========================================
echo   Narriq - AI Ad Studio Setup
echo ========================================
echo.

REM Check Node.js
where node >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Node.js not found. Please install Node.js 18+
    exit /b 1
)
echo [OK] Node.js found

REM Check npm
where npm >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [ERROR] npm not found
    exit /b 1
)
echo [OK] npm found

REM Check FFmpeg (optional)
where ffmpeg >nul 2>nul
if %ERRORLEVEL% neq 0 (
    echo [WARN] FFmpeg not found. Video rendering requires FFmpeg or Docker.
    echo        Download from: https://ffmpeg.org/download.html
) else (
    echo [OK] FFmpeg found
)

REM Create .env if not exists
if not exist ".env" (
    echo [INFO] Creating .env from .env.example...
    copy ".env.example" ".env" >nul
    echo [WARN] Please edit .env and add your API keys
)

REM Install dependencies
echo.
echo [INFO] Installing root dependencies...
call npm install

echo.
echo [INFO] Installing Motia dependencies...
cd motia
call npm install
cd ..

echo.
echo [INFO] Installing frontend dependencies...
cd frontend
call npm install
cd ..

echo.
echo [INFO] Installing worker dependencies...
cd worker
call npm install
cd ..

REM Create directories
if not exist "storage" mkdir storage
if not exist "tmp" mkdir tmp

echo.
echo ========================================
echo   Setup Complete!
echo ========================================
echo.
echo Next steps:
echo   1. Edit .env with your API keys
echo   2. Run: npm run dev
echo.
echo Or start separately:
echo   npm run dev:motia    (Backend :3000)
echo   npm run dev:frontend (Frontend :5173)
echo.
