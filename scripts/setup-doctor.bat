@echo off
chcp 65001 > nul
echo ===================================================
echo   👨‍⚕️ تهيئة كمبيوتر الطبيب (محطة العمل)
echo ===================================================
echo.

:: إنشاء اختصار على سطح المكتب
echo [*] جاري إنشاء اختصار البرنامج على سطح المكتب...
set "TARGET_EXE=%~dp0..\desktop\dist-installer\win-unpacked\Clinic Management System.exe"
if not exist "%TARGET_EXE%" (
    set "TARGET_EXE=%~dp0Clinic Management System.exe"
)

powershell -Command "$WshShell = New-Object -ComObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut([System.IO.Path]::Combine([Environment]::GetFolderPath('Desktop'), 'عيادة د. إسلام - الطبيب.lnk')); $Shortcut.TargetPath = '%TARGET_EXE%'; $Shortcut.WorkingDirectory = [System.IO.Path]::GetDirectoryName('%TARGET_EXE%'); $Shortcut.Save()"
echo [✓] تم إنشاء اختصار البرنامج على سطح المكتب!

echo.
echo ===================================================
echo   🎉 تم الانتهاء!
echo   افتح البرنامج من سطح المكتب، وضع عنوان IP كمبيوتر الاستقبال
echo ===================================================
echo.
pause

