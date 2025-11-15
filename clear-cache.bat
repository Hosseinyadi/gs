@echo off
echo ========================================
echo   پاک کردن کش و ریستارت سرورها
echo ========================================
echo.

echo [1/5] بستن تمام Node processes...
taskkill /F /IM node.exe >nul 2>&1
timeout /t 2 /nobreak >nul

echo [2/5] پاک کردن کش Vite...
if exist "node_modules\.vite" (
    rmdir /s /q "node_modules\.vite"
)
if exist ".vite" (
    rmdir /s /q ".vite"
)
if exist "dist" (
    rmdir /s /q "dist"
)

echo [3/5] شروع Backend...
cd server
start "Backend" cmd /k "npm start"
cd ..
timeout /t 3 /nobreak >nul

echo [4/5] شروع Frontend با Force...
start "Frontend" cmd /k "npm run dev -- --force --clearScreen false"
timeout /t 3 /nobreak >nul

echo [5/5] Done!
echo.
echo ========================================
echo   سرورها آماده شدند!
echo ========================================
echo.
echo ⚠️  الان این کار را بکنید:
echo.
echo 1. مرورگر Chrome را باز کنید
echo 2. Ctrl + Shift + N (Incognito)
echo 3. برو به: localhost:5173/admin/login
echo 4. ورود: admin / admin123
echo.
echo ✅ الان باید تب‌ها را ببینید!
echo.
pause
