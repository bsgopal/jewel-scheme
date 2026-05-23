@echo off
echo ================================
echo   Pre-Installation Cleanup
echo ================================
echo.

echo Stopping all Node.js processes...
taskkill /f /im node.exe 2>nul
if errorlevel 1 (
    echo No Node.js processes running.
) else (
    echo All Node.js processes stopped.
)

echo.
echo Checking for processes using port 3001...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001') do (
    echo Killing process with PID %%a
    taskkill /f /pid %%a 2>nul
)

echo.
echo Checking for processes using port 3000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3000') do (
    echo Killing process with PID %%a
    taskkill /f /pid %%a 2>nul
)

echo.
echo Checking for processes using port 5000...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5000') do (
    echo Killing process with PID %%a
    taskkill /f /pid %%a 2>nul
)

echo.
echo Waiting 5 seconds for ports to be fully released...
timeout /t 5 /nobreak >nul

echo.
echo ================================
echo   Cleanup Complete!
echo ================================
echo All ports should now be available.
echo You can now proceed with installation.
echo.
pause