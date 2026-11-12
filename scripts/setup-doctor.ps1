# PowerShell Setup Script for Clinic Doctor PC
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
try { $Host.UI.RawUI.WindowTitle = "Clinic Doctor Setup" } catch {}

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "   [+] Setup Clinic Doctor PC (Central Server)    " -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Check Administrator privileges
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "[!] Requesting Administrator privileges (Run as Administrator)..." -ForegroundColor Yellow
    try {
        Start-Process powershell -Verb RunAs -ArgumentList "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`""
        exit
    } catch {
        Write-Host "[!] Right click setup-doctor.bat and select 'Run as Administrator'." -ForegroundColor Red
        Read-Host "Press Enter to exit..."
        exit
    }
}

# 2. Storage directories in D:\ClinicData (or C:\ClinicData fallback)
$baseDrive = if (Test-Path "D:\") { "D:\ClinicData" } else { "C:\ClinicData" }
Write-Host "[1/4] Preparing data folders in $baseDrive..." -ForegroundColor Yellow
$folders = @(
    $baseDrive,
    (Join-Path $baseDrive "database"),
    (Join-Path $baseDrive "uploads"),
    (Join-Path $baseDrive "uploads\patients"),
    (Join-Path $baseDrive "uploads\reports"),
    (Join-Path $baseDrive "uploads\prescriptions"),
    (Join-Path $baseDrive "backups")
)

foreach ($f in $folders) {
    if (-not (Test-Path $f)) {
        try {
            New-Item -ItemType Directory -Path $f -Force | Out-Null
        } catch {
            Write-Host "[!] Could not create folder $f : $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}
Write-Host " [OK] Storage directories created successfully." -ForegroundColor Green
Write-Host ""

# 3. Open Firewall Port 4000
Write-Host "[2/4] Opening Firewall Port 4000 for Reception connection..." -ForegroundColor Yellow
try {
    Remove-NetFirewallRule -DisplayName "Clinic Management API" -ErrorAction SilentlyContinue | Out-Null
    New-NetFirewallRule -DisplayName "Clinic Management API" -Direction Inbound -LocalPort 4000 -Protocol TCP -Action Allow -Profile Any | Out-Null
    Write-Host " [OK] Port 4000 opened in Windows Firewall." -ForegroundColor Green
} catch {
    Write-Host "[!] Firewall rule notice: $($_.Exception.Message)" -ForegroundColor Yellow
}
Write-Host ""

# 4. Check and start MongoDB service
Write-Host "[3/4] Checking MongoDB Database Service..." -ForegroundColor Yellow
$mongoService = Get-Service -Name "*mongo*" -ErrorAction SilentlyContinue

if ($mongoService) {
    if ($mongoService.Status -ne 'Running') {
        Write-Host " [*] Starting MongoDB service..." -ForegroundColor Yellow
        Start-Service $mongoService.Name -ErrorAction SilentlyContinue
    }
    $mongoService.Refresh()
    if ($mongoService.Status -eq 'Running') {
        Write-Host " [OK] MongoDB is Running successfully." -ForegroundColor Green
    } else {
        Write-Host " [X] MongoDB service exists but is stopped. Please start it in Services." -ForegroundColor Red
    }
} else {
    Write-Host " [!] Warning: MongoDB service not found!" -ForegroundColor Red
    Write-Host "     Please ensure MongoDB Community is installed as a Windows Service." -ForegroundColor Yellow
}
Write-Host ""

# 5. Create Desktop Shortcut
Write-Host "[4/4] Creating Desktop Shortcut..." -ForegroundColor Yellow
$scriptDir = Split-Path -Parent $PSCommandPath
$candidates = @(
    (Join-Path $scriptDir "Clinic Management System.exe"),
    (Join-Path $scriptDir "Nafs Clinic Management.exe"),
    (Join-Path $scriptDir "win-unpacked\Clinic Management System.exe")
)

$targetExe = $null
foreach ($c in $candidates) {
    if (Test-Path $c) {
        $targetExe = (Resolve-Path $c).Path
        break
    }
}

if (-not $targetExe) {
    $found = Get-ChildItem -Path $scriptDir -Filter "*Clinic*.exe" -Recurse -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($found) { $targetExe = $found.FullName }
}

if ($targetExe) {
    $desktopPath = [Environment]::GetFolderPath('Desktop')
    $shortcutPath = Join-Path $desktopPath "Clinic - Doctor.lnk"
    $ws = New-Object -ComObject WScript.Shell
    $shortcut = $ws.CreateShortcut($shortcutPath)
    $shortcut.TargetPath = $targetExe
    $shortcut.WorkingDirectory = Split-Path -Parent $targetExe
    $shortcut.Save()
    Write-Host " [OK] Shortcut created on Desktop: Clinic - Doctor" -ForegroundColor Green
} else {
    Write-Host " [!] .exe executable not found in current folder." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "   Setup Completed Successfully!                  " -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Enter to exit..." -ForegroundColor Gray
Read-Host
