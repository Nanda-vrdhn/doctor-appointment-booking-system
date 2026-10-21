@echo off
title CareConnect - Doctor Appointment Booking System
set ROOT=%~dp0

echo ============================================
echo    CareConnect - Doctor Appointment Booking
echo ============================================
echo.

cd /d "%ROOT%backend"
if exist node_modules (
  echo [1/3] Backend dependencies: already installed.
) else (
  echo [1/3] Installing backend dependencies...
  call npm install --no-audit --no-fund
)

cd /d "%ROOT%frontend"
if exist dist\index.html (
  echo [2/3] Frontend: already built.
) else (
  echo [2/3] Building the frontend...
  if not exist node_modules call npm install --no-audit --no-fund
  call npm run build
)

echo.
echo [3/3] Starting the application on http://localhost:5000
echo.
echo    Patient  : http://localhost:5000/login/patient
echo    Doctor   : http://localhost:5000/login/doctor
echo    Admin    : http://localhost:5000/login/admin
echo.
echo    Close THIS window to stop the server.
echo.

timeout /t 3 /nobreak >nul
start "" "http://localhost:5000"

cd /d "%ROOT%backend"
call npm start

echo.
echo Server stopped.
pause
