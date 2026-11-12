@echo off
chcp 65001 >nul
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0setup-reception.ps1"
if %errorlevel% neq 0 (
    echo.
    echo [!] An error occurred. Press any key to exit.
    pause
)
