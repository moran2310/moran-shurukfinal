@echo off
echo ========================================
echo   Starting Job Portal Project
echo ========================================
echo.

:: Kill any existing Node processes
echo Cleaning up existing processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

:: Start Backend Server
echo Starting Backend Server...
cd backend
start cmd /k "title Backend Server - Port 5000 && node server.js"
timeout /t 3 /nobreak >nul

:: Start Frontend
echo Starting Frontend Application...
cd ../frontend
start cmd /k "title Frontend - Port 3000 && npm start"

echo.
echo ========================================
echo   Project Started Successfully!
echo ========================================
echo.
echo Backend running on: http://localhost:5000
echo Frontend running on: http://localhost:3000
echo.
echo Press any key to open the application in browser...
pause >nul
start http://localhost:3000

echo.
echo To stop the servers, close the command windows.
pause
