@echo off
cd /d "%~dp0"
echo ========================================================
echo   Clinic Server Diagnostics
echo ========================================================
echo.

set PORT=4000
set NODE_ENV=production
set MONGODB_URI=mongodb://127.0.0.1:27017/clinic-management
set JWT_ACCESS_SECRET=your-super-secret-jwt-key-change-in-production
set JWT_REFRESH_SECRET=your-super-secret-refresh-key-change-in-production
set JWT_ACCESS_TTL=900
set JWT_REFRESH_TTL=604800
set LOCAL_STORAGE_PATH=D:/ClinicData/uploads
set STORAGE_DRIVER=local

echo [1] Checking Node version:
"%~dp0resources\bin\node.exe" -v
if %errorlevel% neq 0 (
    echo [ERROR] Failed to run resources\bin\node.exe!
    goto :keep_open
)
echo [OK] Node is working!
echo.

echo [2] Starting Backend Server directly:
"%~dp0resources\bin\node.exe" "%~dp0resources\server\server.js"

:keep_open
echo.
echo ========================================================
echo   [!] The window is locked and will NOT close.
echo   Read the error message printed above.
echo ========================================================
cmd /k
