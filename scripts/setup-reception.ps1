# PowerShell Setup Script for Clinic Reception PC
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "تهيئة كمبيوتر الاستقبال - عيادة د. إسلام"

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "   🏥 تهيئة كمبيوتر الاستقبال (محطة العمل الفرعية)" -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "[1/1] جاري إنشاء اختصار للبرنامج على سطح المكتب..." -ForegroundColor Yellow
$scriptDir = Split-Path -Parent $PSCommandPath
$candidates = @(
    (Join-Path $scriptDir "Clinic Management System.exe"),
    (Join-Path $scriptDir "win-unpacked\Clinic Management System.exe"),
    (Join-Path $scriptDir "ClinicApp\Clinic Management System.exe"),
    (Join-Path $scriptDir "..\desktop\dist-installer\win-unpacked\Clinic Management System.exe")
)

$targetExe = $null
foreach ($c in $candidates) {
    if (Test-Path $c) {
        $targetExe = (Resolve-Path $c).Path
        break
    }
}

if ($targetExe) {
    $desktopPath = [Environment]::GetFolderPath('Desktop')
    $shortcutPath = Join-Path $desktopPath "عيادة د. إسلام - الاستقبال.lnk"
    $ws = New-Object -ComObject WScript.Shell
    $shortcut = $ws.CreateShortcut($shortcutPath)
    $shortcut.TargetPath = $targetExe
    $shortcut.WorkingDirectory = Split-Path -Parent $targetExe
    $shortcut.Save()
    Write-Host " [✓] تم إنشاء اختصار البرنامج على سطح المكتب: عيادة د. إسلام - الاستقبال" -ForegroundColor Green
} else {
    Write-Host " [!] لم يتم العثور على ملف Clinic Management System.exe بجوار الملف." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "   🎉 تم الانتهاء بنجاح!" -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "اضغط زر Enter في الكيبورد للخروج..." -ForegroundColor Gray
Read-Host

