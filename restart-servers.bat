@echo off
echo 🔄 Restarting servers...
echo.

echo 🛑 Stopping existing processes...
taskkill /F /IM node.exe /T 2>nul
timeout /t 2 /nobreak > nul

echo 🚀 Starting Backend...
start "Backend Server" cmd /k "cd server && npm run dev"
timeout /t 3 /nobreak > nul

echo 🎨 Starting Frontend...
start "Frontend Server" cmd /k "npm run dev"
timeout /t 2 /nobreak > nul

echo.
echo ✅ Servers restarted!
echo 📱 Frontend: http://localhost:5173
echo 🔧 Backend: http://localhost:8080
echo.
pause