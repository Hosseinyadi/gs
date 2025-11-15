@echo off
chcp 65001 >nul
echo ========================================
echo 🚀 اجرای محیط توسعه
echo ========================================
echo.

REM Check if .env exists
if not exist "server\.env" (
    echo ❌ فایل server\.env یافت نشد!
    echo.
    echo لطفاً ابتدا START_LOCAL.bat را اجرا کنید
    pause
    exit /b 1
)

echo 🔧 شروع Backend Server...
start "Backend Server" cmd /k "cd server && npm start"

timeout /t 3 /nobreak >nul

echo 🎨 شروع Frontend Dev Server...
start "Frontend Dev" cmd /k "npm run dev"

echo.
echo ========================================
echo ✅ سرورها در حال اجرا هستند
echo ========================================
echo.
echo 🌐 Backend:  http://localhost:8080
echo 🎨 Frontend: http://localhost:5173
echo.
echo 📝 برای ایجاد کاربر مدیر:
echo    cd server
echo    node scripts/create-admin.js
echo.
echo ⚠️  برای توقف، پنجره‌های CMD را ببندید
echo.
pause
