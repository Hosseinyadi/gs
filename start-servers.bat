@echo off
echo ========================================
echo   Starting Garazh Sangin Servers
echo ========================================
echo.

REM Kill any existing node processes
echo [1/4] Stopping existing processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

REM Start Backend
echo [2/4] Starting Backend Server...
cd server
start "Backend - Port 8080" cmd /k "npm start"
timeout /t 3 /nobreak >nul

REM Start Frontend
echo [3/4] Starting Frontend Server...
cd ..
start "Frontend - Port 5173" cmd /k "npm run dev"
timeout /t 2 /nobreak >nul

echo [4/4] Done!
echo.
echo ========================================
echo   Servers Started Successfully!
echo ========================================
echo.
echo Backend:  http://localhost:8080
echo Frontend: http://localhost:5173
echo Admin:    http://localhost:5173/admin/login
echo.
echo Press any key to exit...
pause >nul
