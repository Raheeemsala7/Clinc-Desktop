# Clinic Management Desktop Application (نظام إدارة العيادات - ديسكتوب)

نظام إدارة عيادة د. إسلام التخصصية المحوّل إلى تطبيق سطح مكتب حقيقي لنظام التشغيل Windows باستخدام Electron، مع الحفاظ الكامل على واجهة المستخدم الحديثة (Next.js 16 + React 19 + Tailwind v4 + الخط العربي Cairo + لوحة رسم فحص الأنف والأذن والحنجرة ENT)، ويعمل على جهازين (كمبيوتر الاستقبال وكمبيوتر الطبيب) عبر شبكة العيادة المحلية (LAN) دون أي حاجة لخوادم سحابية مدفوعة أو اشتراكات شهرية.

---

## 🏗️ البنية والتقنيات المستخدمة (Tech Stack)

- **واجهة المستخدم (Frontend):** Next.js 16.4.3 (App Router), React 19.3.0, Tailwind CSS v4, Lucide Icons, Cairo Font, RTL Support.
- **الخادم الداخلي (API Backend):** Node.js 20, Express.js 5.3.0, TypeScript.
- **الاتصال اللحظي (Real-Time):** Socket.IO 4.8.4 مع نظام التذاكر المؤقتة (Single-Use Ticket Authentication) وتحديثات React Query التلقائية.
- **قاعدة البيانات (Database):** MongoDB Community Edition محلياً على جهاز الاستقبال (`127.0.0.1:27017`).
- **التخزين المشترك (Local File Storage):** تخزين ملفات الأشعة والمرفقات في المسار المركزي `D:\ClinicData\uploads\` مع حماية Magic-Bytes ضد الملفات المشبوهة.
- **محرك النسخ الاحتياطي (Disaster Recovery):** ضغط بيانات MongoDB + المرفقات بصيغة ZIP مشفرة بختم SHA-256 مع دعم الاستعادة بنقرة واحدة.
- **حاوية سطح المكتب (Desktop Container):** Electron 33 مع عزل سياق آمن (Context Isolation: true, Node Integration: false) ومعالج تثبيت Windows NSIS.

---

## 📁 هيكل المشروع (Project Structure)

```
dr-eslam/
├── desktop/                  # كود تطبيق Electron الرئيسي وإعدادات الحزم
│   ├── src/
│   │   ├── main/             # Process Supervisor, Config Manager, IPC
│   │   ├── preload/          # Context Bridge الآمن (window.electronAPI)
│   │   └── renderer/         # شاشة التهيئة التفاعلية (setup.html)
│   ├── resources/            # أيقونات البرنامج وملفات الواجهة
│   └── electron-builder.yml  # إعدادات حزمة التثبيت Windows NSIS
│
├── next/                     # واجهة المستخدم Next.js (نفس شكل وتصميم فولدر next)
│   ├── src/
│   │   ├── app/              # المسارات، الصفحات المتوازية (@admin, @doctor, @receptionist)
│   │   ├── features/         # موديولات الكشف، الروشتات، الحسابات، لوحة القيادة
│   │   └── shared/           # الخطافات اللحظية use-clinic-realtime، المكونات المشتركة
│   └── package.json
│
├── server/                   # خادم Express 5 API ومحرك Socket.IO
│   ├── src/
│   │   ├── controllers/      # وحدات التحكم (المرضى، الزيارات، الطابور، النسخ الاحتياطي)
│   │   ├── models/           # نماذج Mongoose (21 Schema)
│   │   ├── realtime/         # خادم Socket.IO وغرف الصلاحيات وإدارة التذاكر
│   │   ├── services/         # خدمة التخزين المحلي، النسخ الاحتياطي، الأمان
│   │   └── server.ts         # نقطة البداية للخادم (Port 4000)
│   └── package.json
│
├── specs/                    # وثائق المواصفات الهندسية الكاملة (Specs 01-10)
├── DEPLOYMENT_GUIDE.md       # دليل التثبيت والتشغيل وضبط الشبكة والجدار الناري
└── package.json              # أوامر التحكم المركزية للمشروع بالكامل
```

---

## ⚡ أوامر التشغيل السريعة (Root Commands)

من المجلد الرئيسي للمشروع (`dr-eslam`):

```bash
# تشغيل تطبيق سطح المكتب في وضع التطوير (Electron + Backend + Frontend)
pnpm run desktop:dev

# تشغيل خادم Express فقط
pnpm run server:dev

# تشغيل واجهة Next.js فقط في المتصفح
pnpm run next:dev

# تشغيل جميع اختبارات الخادم والتأكد من نجاحها (38 اختبار)
pnpm run server:test

# بناء جميع أجزاء المشروع (Server + Next Standalone + Desktop)
pnpm run build:all

# إنشاء ملف التثبيت النهائي لويندوز (Clinic-Setup.exe)
pnpm run desktop:dist
```

---

## 🏥 كيفية عمل الجهازين (Two-Computer Topology)

1. **جهاز الاستقبال (الخادم الرئيسي):**
   - يشغل البرنامج ويستضيف خادم Express وقاعدة بيانات MongoDB في المسار `D:\ClinicData\database`.
   - يخزن جميع الأشعات والمرفقات في المسار `D:\ClinicData\uploads`.
   - يعرض عنوان الـ IP الداخلي (مثال: `192.168.1.5`).

2. **جهاز الطبيب (محطة العمل):**
   - يشغل البرنامج نفسه دون الحاجة لتثبيت MongoDB.
   - يتصل تلقائياً بسيرفر الاستقبال عبر الشبكة المحلية (LAN).
   - يشاهد المرضى في الطابور لحظياً، ويقوم بالكشف الطبي ورسم الأنف والأذن والحنجرة، وتظهر التحديثات فوراً عند الاستقبال.

