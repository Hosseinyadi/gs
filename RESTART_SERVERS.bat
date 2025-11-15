@echo off
echo ========================================
echo   راه‌اندازی مجدد سرورها
echo ========================================
echo.

echo [1/4] متوقف کردن سرورهای قبلی...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 >nul

echo [2/4] شروع Backend Server...
cd server
start "Backend Server" cmd /k "npm start"
timeout /t 3 >nul

echo [3/4] شروع Frontend Server...
cd ..
start "Frontend Server" cmd /k "npm run dev"
timeout /t 3 >nul

echo [4/4] باز کردن مرورگر...
timeout /t 2 >nul
start http://localhost:5173

echo.
echo ========================================
echo   ✅ سرورها راه‌اندازی شدند!
echo ========================================
echo.
echo Backend:  http://localhost:8080
echo Frontend: http://localhost:5173
echo.
echo برای بستن این پنجره Enter بزنید...
pause >nul
