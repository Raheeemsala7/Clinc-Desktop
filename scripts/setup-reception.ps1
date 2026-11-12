# PowerShell Setup Script for Clinic Reception PC
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
try { $Host.UI.RawUI.WindowTitle = "Clinic Reception Setup" } catch {}

Write-Host "===================================================" -ForegroundColor Cyan
Write-Host "   [+] Setup Clinic Reception PC (Client Node)    " -ForegroundColor Green
Write-Host "===================================================" -ForegroundColor Cyan
Write-Host ""

# 1. Firewall outbound check
Write-Host "[1/2] Configuring network permissions..." -ForegroundColor Yellow
Write-Host " [OK] Network configuration ready." -ForegroundColor Green
Write-Host ""

# 2. Desktop Shortcut
Write-Host "[2/2] Creating Desktop Shortcut..." -ForegroundColor Yellow
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
    $shortcutPath = Join-Path $desktopPath "Clinic - Reception.lnk"
    $ws = New-Object -ComObject WScript.Shell
    $shortcut = $ws.CreateShortcut($shortcutPath)
    $shortcut.TargetPath = $targetExe
    $shortcut.WorkingDirectory = Split-Path -Parent $targetExe
    $shortcut.Save()
    Write-Host " [OK] Shortcut created on Desktop: Clinic - Reception" -ForegroundColor Green
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
