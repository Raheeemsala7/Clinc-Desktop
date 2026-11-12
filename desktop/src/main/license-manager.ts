import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { execSync } from 'child_process';
import { app } from 'electron';

export interface LicensePayload {
  machineId: string;
  clientName: string;
  clinicName: string;
  tier: 'DOCTOR' | 'RECEPTION' | 'LIFETIME' | 'DEV';
  issuedAt: string;
  expiresAt?: string; // ISO date string, or undefined for lifetime
}

export interface LicenseValidationResult {
  valid: boolean;
  error?: string;
  info?: LicensePayload;
}

const MASTER_SECRET = 'NAFS_SECURE_HMAC_KEY_DRESLAM_SYSTEM_2026_PROD_SECRET';
const HWID_SALT = 'NAFS_CLINIC_SALT_2026_HARDWARE_FINGERPRINT';

export class LicenseManager {
  private static cachedMachineId: string | null = null;

  /**
   * استخراج بصمة عتاد الجهاز الثابتة (UUID + CPU + Motherboard Serial)
   */
  static getMachineId(): string {
    if (this.cachedMachineId) return this.cachedMachineId;

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
    this.cachedMachineId = `NAFS-${hash.slice(0, 4)}-${hash.slice(4, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}`;
    return this.cachedMachineId;
  }

  /**
   * المسار الذي يُحفظ فيه ملف الترخيص
   */
  static getLicenseFilePath(): string {
    const userData = app.getPath('userData');
    return path.join(userData, 'clinic-license.lic');
  }

  /**
   * التحقق من مفتاح الترخيص المدخل
   */
  static verifyLicenseKey(keyString: string): LicenseValidationResult {
    try {
      const trimmed = keyString.trim();
      if (!trimmed.includes('.')) {
        return { valid: false, error: 'صيغة كود الترخيص غير صحيحة' };
      }

      const [encodedPayload, signature] = trimmed.split('.');
      if (!encodedPayload || !signature) {
        return { valid: false, error: 'بيانات الترخيص ناقصة أو تالفة' };
      }

      // 1. التحقق من التوقيع الرقمي HMAC
      const expectedSig = crypto
        .createHmac('sha256', MASTER_SECRET)
        .update(encodedPayload)
        .digest('hex');

      if (signature !== expectedSig) {
        return { valid: false, error: 'مفتاح الترخيص غير صالح أو تم التلاعب به' };
      }

      // 2. قراءة بيانات الترخيص
      const rawJson = Buffer.from(encodedPayload, 'base64url').toString('utf8');
      const payload: LicensePayload = JSON.parse(rawJson);

      // 3. التحقق من مطابقة بصمة الجهاز
      const currentMachineId = this.getMachineId();
      if (payload.machineId !== currentMachineId && payload.machineId !== 'GLOBAL_DEV_BYPASS') {
        return {
          valid: false,
          error: `هذا الترخيص مخصص لجهاز آخر (${payload.machineId}) ولا يتوافق مع هذا الجهاز (${currentMachineId})`,
        };
      }

      // 4. التحقق من تاريخ الصلاحية إن وجد
      if (payload.expiresAt) {
        const expTime = new Date(payload.expiresAt).getTime();
        if (Date.now() > expTime) {
          return { valid: false, error: 'انتهت صلاحية هذا الترخيص' };
        }
      }

      return { valid: true, info: payload };
    } catch (err: any) {
      return { valid: false, error: 'تعذر التحقق من الترخيص: ' + (err?.message || err) };
    }
  }

  /**
   * استرجاع النص الخام لكود الترخيص المثبت
   */
  static getRawLicenseKey(): string | null {
    try {
      const p1 = this.getLicenseFilePath();
      if (fs.existsSync(p1)) {
        const val = fs.readFileSync(p1, 'utf8').trim();
        if (val) return val;
      }
      const p2 = path.resolve(__dirname, '../../resources/clinic-license.lic');
      if (fs.existsSync(p2)) {
        const val = fs.readFileSync(p2, 'utf8').trim();
        if (val) return val;
      }
    } catch {}
    return null;
  }

  /**
   * التحقق من الترخيص المحفوظ في النظام
   */
  static checkInstalledLicense(): LicenseValidationResult {
    // تجاوز الترخيص التلقائي في بيئة التطوير إن تم تحديد متغير
    if (process.env.NAFS_DEV_UNLOCKED === 'true') {
      return {
        valid: true,
        info: {
          machineId: this.getMachineId(),
          clientName: 'دكتور العيادة (بيئة تطوير)',
          clinicName: 'عيادة د. إسلام التخصصية',
          tier: 'DEV',
          issuedAt: new Date().toISOString(),
        },
      };
    }

    try {
      const filePath = this.getLicenseFilePath();
      if (!fs.existsSync(filePath)) {
        // فحص مسار بديل في مجلد resources
        const fallbackPath = path.resolve(__dirname, '../../resources/clinic-license.lic');
        if (fs.existsSync(fallbackPath)) {
          const content = fs.readFileSync(fallbackPath, 'utf8');
          return this.verifyLicenseKey(content);
        }
        return { valid: false, error: 'البرنامج غير مرخص على هذا الجهاز. يرجى إدخال كود التفعيل.' };
      }

      const content = fs.readFileSync(filePath, 'utf8');
      return this.verifyLicenseKey(content);
    } catch (err: any) {
      return { valid: false, error: 'خطأ في قراءة ملف الترخيص: ' + err.message };
    }
  }

  /**
   * حفظ الترخيص في مسار البرنامج
   */
  static saveLicense(keyString: string): LicenseValidationResult {
    const validation = this.verifyLicenseKey(keyString);
    if (!validation.valid) {
      return validation;
    }

    try {
      const filePath = this.getLicenseFilePath();
      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(filePath, keyString.trim(), 'utf8');
      return { valid: true, info: validation.info };
    } catch (err: any) {
      return { valid: false, error: 'فشل حفظ ملف الترخيص: ' + err.message };
    }
  }

  /**
   * توليد مفتاح ترخيص جديد لجهاز معين (أداة المطور)
   */
  static generateLicenseKey(payload: LicensePayload): string {
    const jsonStr = JSON.stringify(payload);
    const encoded = Buffer.from(jsonStr, 'utf8').toString('base64url');
    const signature = crypto
      .createHmac('sha256', MASTER_SECRET)
      .update(encoded)
      .digest('hex');
    return `${encoded}.${signature}`;
  }
}

