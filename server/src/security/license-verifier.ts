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

function isValidKey(key: string, currentMachineId: string): boolean {
  if (!key || !key.includes('.')) return false;
  try {
    const cleanKey = key.replace(/\s+/g, '');
    const [encodedPayload, signature] = cleanKey.split('.');
    const expectedSig = crypto
      .createHmac('sha256', MASTER_SECRET)
      .update(encodedPayload)
      .digest('hex');

    if (signature !== expectedSig) return false;

    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8'));
    if (payload.machineId !== currentMachineId && payload.machineId !== 'GLOBAL_DEV_BYPASS') {
      return false;
    }
    if (payload.expiresAt && Date.now() > new Date(payload.expiresAt).getTime()) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export function verifyServerLicense(): boolean {
  if (process.env.NODE_ENV !== 'production' || process.env.NAFS_DEV_UNLOCKED === 'true') {
    return true;
  }

  const currentMachineId = getMachineHardwareId();

  // 1. فحص المتغير البيئي الممرر مباشرة من Electron
  if (process.env.CLINIC_LICENSE_KEY && isValidKey(process.env.CLINIC_LICENSE_KEY, currentMachineId)) {
    console.log('🛡️ [SECURITY] Server license verified directly from process environment.');
    return true;
  }

  // 2. فحص مسارات ملفات الترخيص (نبدأ بـ AppData لأنها تحتوي على تفعيل المستخدم للجهاز الحالي)
  const candidatePaths: string[] = [];
  const appData = process.env.APPDATA;
  if (appData) {
    candidatePaths.push(path.join(appData, 'Clinic Management System', 'clinic-license.lic'));
    candidatePaths.push(path.join(appData, 'Nafs Clinic Management', 'clinic-license.lic'));
    candidatePaths.push(path.join(appData, 'clinic-management-desktop', 'clinic-license.lic'));
  }

  candidatePaths.push(path.resolve(process.cwd(), '../clinic-license.lic'));
  candidatePaths.push(path.resolve(process.cwd(), 'clinic-license.lic'));
  candidatePaths.push(path.resolve(__dirname, '../../resources/clinic-license.lic'));

  for (const p of candidatePaths) {
    if (fs.existsSync(p)) {
      try {
        const content = fs.readFileSync(p, 'utf8').trim();
        if (isValidKey(content, currentMachineId)) {
          console.log(`🛡️ [SECURITY] Server license verified successfully from: ${p}`);
          return true;
        }
      } catch {}
    }
  }

  console.error(`🔒 [SECURITY] No valid license found for current machine ID (${currentMachineId}).`);
  return false;
}

