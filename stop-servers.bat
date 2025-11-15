@echo off
echo ========================================
echo   Stopping Garazh Sangin Servers
echo ========================================
echo.

echo Stopping all Node.js processes...
taskkill /F /IM node.exe >nul 2>&1

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo   All servers stopped successfully!
    echo ========================================
) else (
    echo.
    echo No running servers found.
)

echo.
echo Press any key to exit...
pause >nul
