@echo off
title Bil Flow Frontend
color 0A
echo ========================================
echo    Bil Flow Frontend - Starting...
echo ========================================
echo.

REM Add Node to PATH for this session
set "PATH=C:\Users\rose\AppData\Roaming\nvm\v22.9.0;%PATH%"

REM Check Node
echo [1/4] Checking Node installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node not found!
    echo Please run this command first in a NEW terminal:
    echo   nvm use 22.9.0
    echo.
    pause
    exit /b 1
)
echo ✓ Node found: 
node --version
echo.

REM Check npm
echo [2/4] Checking npm...
npm --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: npm not found!
    pause
    exit /b 1
)
echo ✓ npm found:
npm --version
echo.

REM Check node_modules
echo [3/4] Checking dependencies...
if not exist "node_modules\" (
    echo Installing dependencies... This may take a few minutes.
    echo.
    npm install
    if errorlevel 1 (
        echo ERROR: npm install failed!
        pause
        exit /b 1
    )
) else (
    echo ✓ Dependencies already installed
)
echo.

REM Start dev server
echo [4/4] Starting Vite dev server...
echo.
echo ========================================
echo The browser will open automatically
echo If not, open: http://localhost:5173
echo ========================================
echo.
npm run dev

pause
