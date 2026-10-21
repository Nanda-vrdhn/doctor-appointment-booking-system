@echo off
title CareConnect - Development mode
set ROOT=%~dp0

echo Starting CARECONNECT in development mode...
echo   API  -> http://localhost:5000
echo   UI   -> http://localhost:5173  (opens automatically)
echo.
echo Close the two opened windows to stop the servers.
echo.

start "CareConnect API (backend :5000)" /d "%ROOT%backend" cmd /k npm run dev
start "CareConnect UI  (frontend :5173)" /d "%ROOT%frontend" cmd /k npm run dev

timeout /t 6 /nobreak >nul
start "" "http://localhost:5173"
