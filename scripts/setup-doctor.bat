@echo off
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup-doctor.ps1"
if %errorlevel% neq 0 (
    echo.
    echo [!] An error occurred. Press any key to exit.
    pause
)
