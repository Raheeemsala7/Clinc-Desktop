@echo off
chcp 65001 >nul
echo ========================================================
echo       مزامنة ورفع تحديثات نظام العيادة إلى GitHub
echo ========================================================
echo.
echo [1/3] جاري فحص وإضافة الملفات المعدلة...
git add .

echo.
echo [2/3] جاري تسجيل التحديث (Commit)...
git commit -m "update: Clinic system updates and sync %date% %time%"

echo.
echo [3/3] جاري رفع التحديثات إلى GitHub (origin main)...
git push origin main

echo.
if %ERRORLEVEL% equ 0 (
    echo ========================================================
    echo  تم رفع وتحديث المشروع على GitHub بنجاح تام!
    echo ========================================================
) else (
    echo  حدث خطأ أثناء المزامنة، يرجى التأكد من اتصال الإنترنت أو صلاحيات حساب GitHub.
)
echo.
pause
