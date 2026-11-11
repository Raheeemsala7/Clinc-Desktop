import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';

const MASTER_SECRET = 'NAFS_SECURE_HMAC_KEY_DRESLAM_SYSTEM_2026_PROD_SECRET';
const HWID_SALT = 'NAFS_CLINIC_SALT_2026_HARDWARE_FINGERPRINT';

export function getMachineHardwareId(): string {
  let uuid = '';
  let cpu = '';
  let board = '';

  try {
    uuid = execSync('powershell -NoProfile -Command "(Get-CimInstance Win32_ComputerSystemProduct).UUID"', {
      encoding: 'utf8',
      timeout: 4000,
      windowsHide: true,
    }).trim();
  } catch {}

  try {
    cpu = execSync('powershell -NoProfile -Command "(Get-CimInstance Win32_Processor | Select-Object -First 1).ProcessorId"', {
      encoding: 'utf8',
      timeout: 4000,
      windowsHide: true,
    }).trim();
  } catch {}

  try {
    board = execSync('powershell -NoProfile -Command "(Get-CimInstance Win32_BaseBoard).SerialNumber"', {
      encoding: 'utf8',
      timeout: 4000,
      windowsHide: true,
    }).trim();
  } catch {}

  const combined = [uuid, cpu, board].filter(Boolean).join('|') || 'FALLBACK-DEFAULT-HWID';
  const hash = crypto.createHash('sha256').update(combined + '_' + HWID_SALT).digest('hex').toUpperCase();
  return `NAFS-${hash.slice(0, 4)}-${hash.slice(4, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}`;
}

export function verifyServerLicense(): boolean {
  if (process.env.NODE_ENV !== 'production' || process.env.NAFS_DEV_UNLOCKED === 'true') {
    return true;
  }

  const possiblePaths = [
    path.resolve(process.cwd(), '../clinic-license.lic'),
    path.resolve(process.cwd(), 'clinic-license.lic'),
    path.resolve(__dirname, '../../resources/clinic-license.lic'),
  ];

  const appData = process.env.APPDATA;
  if (appData) {
    possiblePaths.push(path.join(appData, 'Nafs Clinic Management', 'clinic-license.lic'));
    possiblePaths.push(path.join(appData, 'Clinic Management System', 'clinic-license.lic'));
    possiblePaths.push(path.join(appData, 'clinic-management-desktop', 'clinic-license.lic'));
  }

  let licenseKey = '';
  for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
      try {
        licenseKey = fs.readFileSync(p, 'utf8').trim();
        if (licenseKey) break;
      } catch {}
    }
  }

  if (!licenseKey || !licenseKey.includes('.')) {
    console.error('🔒 [SECURITY] No valid license file found for this system.');
    return false;
  }

  try {
    const [encodedPayload, signature] = licenseKey.split('.');
    const expectedSig = crypto
      .createHmac('sha256', MASTER_SECRET)
      .update(encodedPayload)
      .digest('hex');

    if (signature !== expectedSig) {
      console.error('🔒 [SECURITY] License signature invalid.');
      return false;
    }

    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    const currentMachineId = getMachineHardwareId();

    if (payload.machineId !== currentMachineId && payload.machineId !== 'GLOBAL_DEV_BYPASS') {
      console.error(`🔒 [SECURITY] License is bound to another machine (${payload.machineId}). Current: ${currentMachineId}`);
      return false;
    }

    if (payload.expiresAt && Date.now() > new Date(payload.expiresAt).getTime()) {
      console.error('🔒 [SECURITY] License has expired.');
      return false;
    }

    console.log(`🛡️ [SECURITY] Server license verified: ${payload.clientName} [${payload.tier}]`);
    return true;
  } catch (err: any) {
    console.error('🔒 [SECURITY] License verification exception:', err?.message || err);
    return false;
  }
}

