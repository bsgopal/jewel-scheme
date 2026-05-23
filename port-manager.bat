@echo off
echo ================================
echo   JewelScheme Port Manager
echo ================================
echo.

echo Checking for processes using common ports...
echo.

echo Checking port 3000 (Frontend):
netstat -ano | findstr :3000
echo.

echo Checking port 3001:
netstat -ano | findstr :3001
echo.

echo Checking port 5000 (Backend):
netstat -ano | findstr :5000
echo.

echo Current Node.js processes:
tasklist /fi "imagename eq node.exe" 2>nul
if errorlevel 1 (
    echo No Node.js processes running.
) else (
    echo.
    echo To kill all Node.js processes, run: taskkill /f /im node.exe
)

echo.
echo ================================
echo   Port Status Check Complete
echo ================================
pause