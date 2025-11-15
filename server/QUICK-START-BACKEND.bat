@echo off
chcp 65001 >nul
title Bil Flow - Backend
color 0B

echo.
echo ╔═══════════════════════════════════════════════════════╗
echo ║        BIL FLOW - BACKEND SERVER                      ║
echo ╚═══════════════════════════════════════════════════════╝
echo.

REM Find NVM root
set "NVM_HOME=%APPDATA%\nvm"
if not exist "%NVM_HOME%" (
    echo ❌ ERROR: NVM not found at %NVM_HOME%
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
echo [1/4] Checking Node.js...
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
echo [2/4] Checking npm...
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
echo [3/4] Checking dependencies...
if not exist "node_modules\" (
    echo ⏳ Installing dependencies...
    echo.
    "%NODE_PATH%\npm.cmd" install
    if errorlevel 1 (
        echo.
        echo ❌ npm install FAILED!
        pause
        exit /b 1
    )
    echo ✓ Dependencies installed
) else (
    echo ✓ node_modules exists
)
echo.

REM Start backend
echo [4/4] Starting backend server...
echo.
echo ╔═══════════════════════════════════════════════════════╗
echo ║  Backend: http://localhost:8080                       ║
echo ║  Health:  http://localhost:8080/health                ║
echo ╚═══════════════════════════════════════════════════════╝
echo.
echo ⏳ Starting...
echo.

"%NODE_PATH%\npm.cmd" run dev

echo.
echo ⚠️  Server stopped
pause
