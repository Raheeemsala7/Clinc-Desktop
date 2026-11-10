@echo off
chcp 65001 > nul
echo ===================================================
echo   🏥 تهيئة كمبيوتر الاستقبال (الخادم الرئيسي للعيادة)
echo ===================================================
echo.

:: 1. التحقق من صلاحيات المدير Administrator
net session >nul 2>&1
if %errorLevel% neq 0 (
    echo [!] يرجى تشغيل هذا الملف كمسؤول (Run as Administrator)
    echo اضغط كليك يمين على الملف واختر "Run as administrator"
    pause
    exit /b 1
)

:: 2. إنشاء مجلدات التخزين المركزية في D:\ClinicData
echo [*] جاري إنشاء مجلدات التخزين المحلية للعيادة...
if not exist "D:\ClinicData" mkdir "D:\ClinicData"
if not exist "D:\ClinicData\database" mkdir "D:\ClinicData\database"
if not exist "D:\ClinicData\uploads" mkdir "D:\ClinicData\uploads"
if not exist "D:\ClinicData\uploads\patients" mkdir "D:\ClinicData\uploads\patients"
if not exist "D:\ClinicData\uploads\reports" mkdir "D:\ClinicData\uploads\reports"
if not exist "D:\ClinicData\uploads\prescriptions" mkdir "D:\ClinicData\uploads\prescriptions"
if not exist "D:\ClinicData\backups" mkdir "D:\ClinicData\backups"
echo [✓] تم تجهيز مجلدات التخزين في D:\ClinicData بنجاح.

:: 3. فتح منفذ الجدار الناري للشبكة المحلية (Port 4000)
echo.
echo [*] جاري تهيئة الجدار الناري لويندوز لربط كمبيوتر الطبيب...
netsh advfirewall firewall delete rule name="Clinic Management API" >nul 2>&1
netsh advfirewall firewall add rule name="Clinic Management API" dir=in action=allow protocol=TCP localport=4000 >nul 2>&1
echo [✓] تم فتح المنفذ 4000 في الجدار الناري بنجاح.

:: 4. إنشاء اختصار على سطح المكتب
echo.
echo [*] جاري إنشاء اختصار البرنامج على سطح المكتب...
set "TARGET_EXE=%~dp0..\desktop\dist-installer\win-unpacked\Clinic Management System.exe"
if not exist "%TARGET_EXE%" (
    set "TARGET_EXE=%~dp0Clinic Management System.exe"
)

powershell -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut([System.IO.Path]::Combine([Environment]::GetFolderPath('Desktop'), 'عيادة د. إسلام - الاستقبال.lnk')); $Shortcut.TargetPath = '%TARGET_EXE%'; $Shortcut.WorkingDirectory = [System.IO.Path]::GetDirectoryName('%TARGET_EXE%'); $Shortcut.Save()"
echo [✓] تم إنشاء اختصار البرنامج على سطح المكتب!

echo.
echo ===================================================
echo   🎉 تم الانتهاء بنجاح!
echo   يمكنك الآن تشغيل البرنامج مباشرة من سطح المكتب
echo ===================================================
echo.
pause

