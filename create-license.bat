@echo off
chcp 65001 >nul
cls
echo ======================================================================
echo       🛡️  نظام نَفَس لإدارة العيادات - أداة توليد كود التفعيل للعملاء
echo ======================================================================
echo.
echo يرجى إدخال بيانات الترخيص الخاصة بجهاز العميل:
echo.

set /p TARGET_HWID="1. الصق كود بصمة جهاز العميل (Machine ID مثل NAFS-XXXX-XXXX-...): "
if "%TARGET_HWID%"=="" (
    echo.
    echo ⚠️ لم يتم إدخال كود الجهاز. سيتم توليد ترخيص لجهازك الحالي تلقائياً.
)

set /p CLIENT_NAME="2. اسم الطبيب / العميل (اضغط Enter للافتراضي): "
if "%CLIENT_NAME%"=="" set CLIENT_NAME=د. إسلام عبدالله كريمة

set /p CLINIC_NAME="3. اسم العيادة (اضغط Enter للافتراضي): "
if "%CLINIC_NAME%"=="" set CLINIC_NAME=عيادة نَفَس التخصصية

echo.
echo جاري توليد كود الترخيص المشفر...
echo.

if "%TARGET_HWID%"=="" (
    node scripts\generate-license.js --name="%CLIENT_NAME%" --clinic="%CLINIC_NAME%"
) else (
    node scripts\generate-license.js --machine="%TARGET_HWID%" --name="%CLIENT_NAME%" --clinic="%CLINIC_NAME%"
)

echo.
echo ======================================================================
echo اضغط أي زر لإغلاق النافذة...
pause >nul
