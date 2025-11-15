@echo off
chcp 65001 >nul
echo ========================================
echo 🚀 راه‌اندازی سریع پروژه گاراژ
echo ========================================
echo.

REM Check if .env exists
if not exist "server\.env" (
    echo ⚠️  فایل .env یافت نشد. در حال ایجاد...
    copy "server\.env.example" "server\.env"
    echo.
    echo ✅ فایل .env ایجاد شد
    echo ⚠️  لطفاً فایل server\.env را ویرایش کنید:
    echo    - JWT_SECRET را تغییر دهید
    echo    - برای تست محلی: OTP_MOCK=true
    echo    - برای SMS واقعی: SMS_IR_API_KEY را وارد کنید
    echo.
    pause
)

echo 📦 نصب وابستگی‌های سرور...
cd server
call npm install
if errorlevel 1 (
    echo ❌ خطا در نصب وابستگی‌های سرور
    pause
    exit /b 1
)
cd ..

echo.
echo 📦 نصب وابستگی‌های Frontend...
call npm install
if errorlevel 1 (
    echo ❌ خطا در نصب وابستگی‌های Frontend
    pause
    exit /b 1
)

echo.
echo ========================================
echo ✅ نصب کامل شد!
echo ========================================
echo.
echo برای اجرای پروژه:
echo.
echo 1️⃣  سرور Backend:
echo    cd server
echo    npm start
echo.
echo 2️⃣  Frontend:
echo    npm run dev
echo.
echo 3️⃣  ایجاد کاربر مدیر:
echo    cd server
echo    node scripts/create-admin.js
echo.
echo 📖 راهنمای کامل: ENV_SETUP.md
echo.
pause
