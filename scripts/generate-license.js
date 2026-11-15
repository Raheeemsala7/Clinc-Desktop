const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { execSync } = require('child_process');

const MASTER_SECRET = 'NAFS_SECURE_HMAC_KEY_DRESLAM_SYSTEM_2026_PROD_SECRET';
const HWID_SALT = 'NAFS_CLINIC_SALT_2026_HARDWARE_FINGERPRINT';

function getLocalMachineId() {
  let uuid = '';
  let cpu = '';
  let board = '';

  try {
    const cmd = 'powershell -NoProfile -Command "$u=(Get-CimInstance Win32_ComputerSystemProduct).UUID; $c=(Get-CimInstance Win32_Processor | Select-Object -First 1).ProcessorId; $b=(Get-CimInstance Win32_BaseBoard).SerialNumber; \\"$u;;;$c;;;$b\\""';
    const output = execSync(cmd, {
      encoding: 'utf8',
      timeout: 10000,
      windowsHide: true,
    }).trim();

    const parts = output.split(';;;');
    if (parts.length >= 3) {
      uuid = (parts[0] || '').trim();
      cpu = (parts[1] || '').trim();
      board = (parts[2] || '').trim();
    }
  } catch {}

  const combined = [uuid, cpu, board].filter(Boolean).join('|') || 'FALLBACK-DEFAULT-HWID';
  const hash = crypto.createHash('sha256').update(combined + '_' + HWID_SALT).digest('hex').toUpperCase();
  return `NAFS-${hash.slice(0, 4)}-${hash.slice(4, 8)}-${hash.slice(8, 12)}-${hash.slice(12, 16)}`;
}

function generateLicense(payload) {
  const jsonStr = JSON.stringify(payload);
  const encoded = Buffer.from(jsonStr, 'utf8').toString('base64url');
  const signature = crypto
    .createHmac('sha256', MASTER_SECRET)
    .update(encoded)
    .digest('hex');
  return `${encoded}.${signature}`;
}

// قراءة البارامترات من سطر الأوامر
const args = process.argv.slice(2);
const params = {};
args.forEach((arg) => {
  if (arg.startsWith('--')) {
    const [k, v] = arg.slice(2).split('=');
    params[k] = v || true;
  }
});

const targetMachineId = params.machine || getLocalMachineId();
const clientName = params.name || 'د. إسلام عبدالله كريمة';
const clinicName = params.clinic || 'عيادة د. إسلام التخصصية للأنف والأذن والحنجرة';
const tier = params.tier || 'LIFETIME';

const payload = {
  machineId: targetMachineId,
  clientName,
  clinicName,
  tier,
  issuedAt: new Date().toISOString(),
};

const licenseKey = generateLicense(payload);

console.log('================================================================');
console.log('       🛡️  نظام نَفَس لإدارة العيادات - أداة توليد التراخيص المعتمدة');
console.log('================================================================\n');
console.log(`📌 كود بصمة الجهاز المستهدف (Machine ID): \x1b[32m${targetMachineId}\x1b[0m`);
console.log(`👤 العميل / الطبيب: ${clientName}`);
console.log(`🏥 العيادة: ${clinicName}`);
console.log(`⭐ فئة الترخيص: ${tier} (مدى الحياة - Offline)\n`);
console.log('🔑 مفتاح الترخيص والتفعيل (Activation License Key):');
console.log('----------------------------------------------------------------');
console.log(`\x1b[36m${licenseKey}\x1b[0m`);
console.log('----------------------------------------------------------------\n');

// إذا كان الطلب لحفظ الترخيص محلياً في مجلد resources
const rootDir = path.resolve(__dirname, '..');
const licFileInResources = path.join(rootDir, 'desktop', 'resources', 'clinic-license.lic');
try {
  fs.writeFileSync(licFileInResources, licenseKey, 'utf8');
  console.log(`✅ تم حفظ نسخة الترخيص تلقائياً في: ${licFileInResources}`);
} catch (e) {
  console.log('⚠️ تعذر الحفظ في مجلد resources:', e.message);
}

// أيضاً في appdata إن وجد
const appData = process.env.APPDATA;
if (appData) {
  const dirs = ['Nafs Clinic Management', 'Clinic Management System', 'clinic-management-desktop'];
  dirs.forEach((d) => {
    try {
      const fullDir = path.join(appData, d);
      if (!fs.existsSync(fullDir)) fs.mkdirSync(fullDir, { recursive: true });
      fs.writeFileSync(path.join(fullDir, 'clinic-license.lic'), licenseKey, 'utf8');
    } catch {}
  });
  console.log('✅ تم تثبيت الترخيص في نظام المستخدم (AppData) لهذا الجهاز.');
}

console.log('\n🎉 الترخيص جاهز ويمكن استخدامه فوراً لتفعيل البرنامج!');

