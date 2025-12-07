@echo off
echo 🚀 Starting Garazh Sangin Production Environment...
echo.

echo 📦 Installing production dependencies...
call npm install --production=false
echo.

echo 🏗️ Building frontend...
call npm run build
echo.

echo 🗄️ Setting up database...
cd server
call npm install
call node run-main-schema.js
call node run-cities-migration.js
call node run-trust-badge-migration.js
call node run-listing-limits-migration.js
call node database/run-approval-migration.js
call node database/run-reviews-migration.js
cd ..
echo.

echo 🚀 Starting servers...
echo Backend will run on: http://localhost:8080
echo Frontend will run on: http://localhost:3000
echo.

start "Backend Server" cmd /k "cd server && npm run dev"
timeout /t 3 /nobreak > nul
start "Frontend Server" cmd /k "node server-production.js"
timeout /t 2 /nobreak > nul

echo ✅ Production environment started!
echo 📱 Open: http://localhost:3000
echo 🔧 Admin: http://localhost:3000/admin/login
echo.
pause