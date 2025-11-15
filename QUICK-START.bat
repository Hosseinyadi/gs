@echo off
chcp 65001 >nul
title Bil Flow - Quick Start
color 0E

echo.
echo ╔═══════════════════════════════════════════════════════╗
echo ║        BIL FLOW - QUICK START                         ║
echo ╚═══════════════════════════════════════════════════════╝
echo.

REM Find NVM root
set "NVM_HOME=%APPDATA%\nvm"
if not exist "%NVM_HOME%" (
    echo ❌ ERROR: NVM not found at %NVM_HOME%
    echo Please install nvm-windows first
    pause
    exit /b 1
)

REM Find Node 22.9.0
set "NODE_PATH=%NVM_HOME%\v22.9.0"
if not exist "%NODE_PATH%" (
    echo ❌ ERROR: Node v22.9.0 not found
    echo Please run: nvm install 22.9.0
    pause
    exit /b 1
)

REM Set PATH
set "PATH=%NODE_PATH%;%PATH%"

REM Verify Node
echo [1/5] Checking Node.js...
"%NODE_PATH%\node.exe" --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.exe not working
    pause
    exit /b 1
)
for /f "delims=" %%i in ('"%NODE_PATH%\node.exe" --version') do set NODE_VERSION=%%i
echo ✓ Node %NODE_VERSION% found
echo.

REM Verify npm
echo [2/5] Checking npm...
"%NODE_PATH%\npm.cmd" --version >nul 2>&1
if errorlevel 1 (
    echo ❌ npm not working
    pause
    exit /b 1
)
for /f "delims=" %%i in ('"%NODE_PATH%\npm.cmd" --version') do set NPM_VERSION=%%i
echo ✓ npm %NPM_VERSION% found
echo.

REM Check node_modules
echo [3/5] Checking dependencies...
if not exist "node_modules\" (
    echo ⏳ Installing dependencies (this will take 2-3 minutes)...
    echo.
    "%NODE_PATH%\npm.cmd" install
    if errorlevel 1 (
        echo.
        echo ❌ npm install FAILED!
        echo.
        echo Try running this command manually:
        echo   nvm use 22.9.0
        echo   cd %CD%
        echo   npm install
        echo.
        pause
        exit /b 1
    )
    echo ✓ Dependencies installed
) else (
    echo ✓ node_modules exists
)
echo.

REM Start Vite
echo [4/5] Starting Vite dev server...
echo.
echo ╔═══════════════════════════════════════════════════════╗
echo ║  Frontend will start on: http://localhost:5173       ║
echo ║  The browser should open automatically               ║
echo ╚═══════════════════════════════════════════════════════╝
echo.
echo ⏳ Starting...
echo.

"%NODE_PATH%\npm.cmd" run dev

REM If we get here, server stopped
echo.
echo ⚠️  Server stopped
pause
