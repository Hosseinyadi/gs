@echo off
echo ================================
echo رفع مشکل لاگین پنل مدیریت
echo ================================
echo.

echo ⏹️  متوقف کردن سرورهای قبلی...
taskkill /F /IM node.exe >nul 2>&1

echo ⏳ صبر کنید...
timeout /t 2 >nul

echo.
echo ✅ سرورها متوقف شدند
echo.
echo 📝 برای اجرای سرور، دستورات زیر را اجرا کنید:
echo.
echo    1. سرور Backend:
echo       cd c:\Users\rose\Desktop\site\server
echo       npm start
echo.
echo    2. Frontend (در terminal دیگر):
echo       cd c:\Users\rose\Desktop\site
echo       npm run dev
echo.
echo    3. بعد از اجرا به آدرس زیر بروید:
echo       http://localhost:5173/admin/login
echo.
echo    4. ورود با:
echo       نام کاربری: hossein
echo       رمز عبور: password
echo.
echo ⚠️  مهم: قبل از لاگین، در مرورگر F12 را بزنید و در Console این کد را اجرا کنید:
echo       localStorage.clear(); location.reload();
echo.
pause
