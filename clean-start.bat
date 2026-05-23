@echo off
echo ================================
echo   JewelScheme Clean Startup
echo ================================
echo.

echo Step 1: Killing existing Node.js processes...
taskkill /f /im node.exe 2>nul
if errorlevel 1 (
    echo No Node.js processes to kill.
) else (
    echo Node.js processes terminated.
)

echo.
echo Step 2: Waiting 3 seconds for ports to be released...
timeout /t 3 /nobreak >nul

echo.
echo Step 3: Starting Backend Server (Port 5000)...
cd /d "%~dp0backend"
start "JewelScheme Backend" cmd /k "npm start"

echo.
echo Step 4: Waiting 5 seconds for backend to start...
timeout /t 5 /nobreak >nul

echo.
echo Step 5: Starting Frontend (Port 3000)...
cd /d "%~dp0frontend"
start "JewelScheme Frontend" cmd /k "npm start"

echo.
echo ================================
echo   Startup Complete!
echo ================================
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
echo.
pause