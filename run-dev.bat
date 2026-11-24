@echo off
chcp 65001 >nul
title Vyro Clinic System - Live Dev Mode (Dr. Eslam Abdallah)
echo ========================================================
echo   عيادة د. إسلام عبدالله - Vyro Clinic Management
echo   تشغيل المنظومة في وضع التطوير المباشر (Live Dev Mode)
echo ========================================================
echo.

echo [1/3] فحص وإخلاء المنافذ 3000 و 4000 من أي عمليات معلقة...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3000.*LISTENING"') do (
    if not "%%a"=="0" taskkill /f /pid %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":4000.*LISTENING"') do (
    if not "%%a"=="0" taskkill /f /pid %%a >nul 2>&1
)
echo      تم تحرير المنافذ بنجاح.
echo.

echo [2/3] بناء وتحديث كود تشغيل الديسكتوب (Desktop TypeScript)...
cd /d "D:\realy-projects\desktop\dr-eslam\desktop"
call npx tsc -p tsconfig.json
if %ERRORLEVEL% neq 0 (
    echo [ERROR] فشل تجميع كود الديسكتوب!
    pause
    exit /b 1
)
echo.

echo [3/3] تشغيل تطبيق Electron مع السيرفر والواجهة المباشرة (Hot Reloading)...
echo      جميع تعديلات الكود ستظهر فوراً بدون الحاجة لعمل Build نهائي!
echo.
call pnpm dev
pause
