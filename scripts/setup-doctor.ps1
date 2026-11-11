# PowerShell Setup Script for Clinic Doctor PC
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$Host.UI.RawUI.WindowTitle = "تهيئة كمبيوتر الطبيب - عيادة د. إسلام"

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "   👨‍⚕️ تهيئة كمبيوتر الطبيب (الخادم الرئيسي للعيادة)" -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

# 1. التحقق من صلاحيات المدير
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[!] تنبيه: جاري طلب صلاحيات المسؤول (Run as Administrator)..." -ForegroundColor Yellow
    try {
        Start-Process powershell -Verb RunAs -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`""
        exit
    } catch {
        Write-Host "[!] اضغط كليك يمين على ملف setup-doctor.bat واختر 'تشغيل كمسؤول' (Run as Administrator)." -ForegroundColor Red
        Read-Host "اضغط Enter للإغلاق..."
        exit
    }
}

# 2. إنشاء مجلدات التخزين المركزية في D:\ClinicData
Write-Host "[1/4] جاري تجهيز مجلدات حفظ بيانات العيادة في D:\ClinicData..." -ForegroundColor Yellow
$folders = @(
    "D:\ClinicData",
    "D:\ClinicData\database",
    "D:\ClinicData\uploads",
    "D:\ClinicData\uploads\patients",
    "D:\ClinicData\uploads\reports",
    "D:\ClinicData\uploads\prescriptions",
    "D:\ClinicData\backups"
)

foreach ($f in $folders) {
    if (-not (Test-Path $f)) {
        try {
            New-Item -ItemType Directory -Path $f -Force | Out-Null
        } catch {
            Write-Host "[!] تعذر إنشاء المجلد $f : $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}
Write-Host " [✓] تم تجهيز مجلدات التخزين بنجاح." -ForegroundColor Green
Write-Host ""

# 3. فتح منفذ الجدار الناري 4000
Write-Host "[2/4] جاري فتح المنفذ 4000 في جدار الحماية لويندوز لربط الريسبشن..." -ForegroundColor Yellow
try {
    Remove-NetFirewallRule -DisplayName "Clinic Management API" -ErrorAction SilentlyContinue | Out-Null
    New-NetFirewallRule -DisplayName "Clinic Management API" -Direction Inbound -LocalPort 4000 -Protocol TCP -Action Allow -Profile Any | Out-Null
    Write-Host " [✓] تم فتح المنفذ 4000 في جدار الحماية بنجاح." -ForegroundColor Green
} catch {
    Write-Host "[!] تعذر فتح المنفذ تلقائياً: $($_.Exception.Message)" -ForegroundColor Red
}
Write-Host ""

# 4. التحقق من تشغيل خدمة MongoDB
Write-Host "[3/4] جاري التحقق من خدمة قاعدة البيانات MongoDB..." -ForegroundColor Yellow
$mongoService = Get-Service -Name "*mongo*" -ErrorAction SilentlyContinue

if ($mongoService) {
    if ($mongoService.Status -ne 'Running') {
        Write-Host " [*] جاري محاولة تشغيل خدمة MongoDB..." -ForegroundColor Yellow
        Start-Service $mongoService.Name -ErrorAction SilentlyContinue
    }
    $mongoService.Refresh()
    if ($mongoService.Status -eq 'Running') {
        Write-Host " [✓] قاعدة البيانات MongoDB تعمل بنجاح (Running)." -ForegroundColor Green
    } else {
        Write-Host " [X] خدمة MongoDB موجودة ولكنها متوقفة. يرجى تشغيلها من Services." -ForegroundColor Red
    }
} else {
    Write-Host " [!] تحذير: خدمة MongoDB ليست مثبتة على هذا الجهاز!" -ForegroundColor Red
    Write-Host "     يرجى تثبيت ملف MongoDB Community (.msi) كـ Service لكي يعمل البرنامج." -ForegroundColor Yellow
}
Write-Host ""

# 5. إنشاء اختصار على سطح المكتب
Write-Host "[4/4] جاري إنشاء اختصار للبرنامج على سطح المكتب..." -ForegroundColor Yellow
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
    $shortcutPath = Join-Path $desktopPath "عيادة د. إسلام - الطبيب.lnk"
    $ws = New-Object -ComObject WScript.Shell
    $shortcut = $ws.CreateShortcut($shortcutPath)
    $shortcut.TargetPath = $targetExe
    $shortcut.WorkingDirectory = Split-Path -Parent $targetExe
    $shortcut.Save()
    Write-Host " [✓] تم إنشاء اختصار البرنامج على سطح المكتب: عيادة د. إسلام - الطبيب" -ForegroundColor Green
} else {
    Write-Host " [!] لم يتم العثور على ملف Clinic Management System.exe بجوار الملف." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "   🎉 تم الانتهاء من فحص وتهيئة الجهاز بنجاح!" -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "اضغط زر Enter في الكيبورد للخروج..." -ForegroundColor Gray
Read-Host
