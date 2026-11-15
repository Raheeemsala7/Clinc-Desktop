import { app, BrowserWindow, ipcMain, dialog, Menu, shell } from 'electron';
import path from 'path';
import os from 'os';
import http from 'http';
import fs from 'fs';
import { autoUpdater } from 'electron-updater';
import { ConfigManager } from './config-manager';
import { ProcessSupervisor } from './process-supervisor';
import { LicenseManager } from './license-manager';

export function appLog(msg: string) {
  try {
    const logPath = path.join(app.getPath('userData'), 'desktop.log');
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${msg}\n`, 'utf8');
  } catch {}
  console.log(msg);
}

appLog(`--- APP PROCESS LAUNCHED (PID: ${process.pid}, isPackaged: ${app.isPackaged}) ---`);

process.on('uncaughtException', (err) => {
  appLog(`[FATAL UNCAUGHT] ${err?.stack || err}`);
});
process.on('unhandledRejection', (reason) => {
  appLog(`[FATAL REJECTION] ${reason}`);
});

let mainWindow: BrowserWindow | null = null;
const isDev = process.env.NODE_ENV !== 'production';
const projectRoot = path.resolve(__dirname, '../../../');

appLog(`🚀 [BOOT] Starting Clinic Desktop app. isPackaged=${app.isPackaged}, root=${projectRoot}`);

const gotTheLock = app.requestSingleInstanceLock();
appLog(`🔒 [LOCK] gotTheLock = ${gotTheLock}`);
if (!gotTheLock) {
  appLog('⚠️ [BOOT] Another instance is already running. Quitting.');
  app.quit();
} else {
  app.on('second-instance', () => {
    appLog('ℹ️ [BOOT] Second instance opened. Focusing existing window.');
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    } else {
      createWindow();
    }
  });
}

function getLanIps(): Array<{ name: string; ip: string }> {
  const interfaces = os.networkInterfaces();
  const results: Array<{ name: string; ip: string }> = [];
  for (const [name, nets] of Object.entries(interfaces)) {
    if (!nets) continue;
    for (const net of nets) {
      if (net.family === 'IPv4' && !net.internal) {
        results.push({ name, ip: net.address });
      }
    }
  }
  return results;
}

async function testConnection(ip: string, port: number): Promise<{ success: boolean; latency?: number; error?: string }> {
  const startTime = Date.now();
  return new Promise((resolve) => {
    const req = http.get(
      {
        host: ip,
        port,
        path: '/health',
        timeout: 4000,
      },
      (res) => {
        const latency = Date.now() - startTime;
        if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
          resolve({ success: true, latency });
        } else {
          resolve({ success: false, error: `Server returned HTTP ${res.statusCode}` });
        }
      }
    );

    req.on('error', (err) => {
      resolve({ success: false, error: err.message });
    });

    req.on('timeout', () => {
      req.destroy();
      resolve({ success: false, error: 'Connection timed out' });
    });
  });
}

async function bootServicesAndLoadUrl() {
  if (!mainWindow) return;

  // 1. التحقق من الترخيص وبصمة الجهاز (Machine Lock Security)
  const licenseCheck = LicenseManager.checkInstalledLicense();
  if (!licenseCheck.valid) {
    const hwid = LicenseManager.getMachineId();
    appLog(`🔒 [LICENSE] Machine is not activated (${hwid}). Showing activation screen. Reason: ${licenseCheck.error}`);
    const activateHtmlPath = path.resolve(__dirname, '../renderer/activate.html');
    mainWindow.loadFile(activateHtmlPath);
    return;
  }
  appLog(`✅ [LICENSE] Valid license verified for: ${licenseCheck.info?.clientName} (HWID: ${licenseCheck.info?.machineId})`);

  const config = ConfigManager.load();
  appLog(`🔧 [CONFIG] Loaded mode: ${config.mode}, ip: ${config.serverIp}, port: ${config.serverPort}`);

  if (config.mode === 'unconfigured') {
    appLog('ℹ️ [BOOT] Mode is unconfigured. Showing Setup Wizard.');
    const setupHtmlPath = path.resolve(__dirname, '../renderer/setup.html');
    mainWindow.loadFile(setupHtmlPath);
    return;
  }

  if (config.mode === 'client') {
    const apiUrl = `http://${config.serverIp || '127.0.0.1'}:${config.serverPort || 4000}/api/v1`;
    appLog(`💻 [DESKTOP] Launching in Doctor Workstation Client Mode (Target: ${apiUrl})...`);
    await ProcessSupervisor.startNextFrontend(projectRoot, apiUrl);
  } else {
    // Default to Server Mode (Reception Central Host)
    appLog('🏥 [DESKTOP] Launching in Reception Central Server Mode...');
    await ProcessSupervisor.ensureMongoRunning();
    await ProcessSupervisor.startServerBackend(projectRoot);
    appLog('⏳ [DESKTOP] Waiting for API Server on port 4000...');
    const serverReady = await ProcessSupervisor.waitForPort(4000, '127.0.0.1', 25000);
    appLog(`📡 [DESKTOP] API Server on port 4000 ready: ${serverReady}`);

    if (!serverReady) {
      const isMongoUp = await ProcessSupervisor.waitForPort(27017, '127.0.0.1', 1500);
      appLog(`🔍 [DIAGNOSTIC] MongoDB on port 27017 active: ${isMongoUp}`);
      if (mainWindow && !mainWindow.isDestroyed()) {
        const errorTitle = !isMongoUp ? 'قاعدة البيانات (MongoDB) متوقفة' : 'تعذر تشغيل خادم العيادة (API 4000)';
        const errorDesc = !isMongoUp
          ? 'يتطلب تشغيل المنظومة كجهاز رئيسي أن تكون خدمة MongoDB قيد التشغيل على هذا الجهاز.<br><br><b>طريقة الحل:</b><br>1. افتح نافذة Services في ويندوز (أو اضغط Win+R واكتب services.msc).<br>2. ابحث عن خدمة <b>MongoDB Server</b> واضغط عليها Start.<br>3. أو قم بتثبيت MongoDB Community كـ Windows Service.'
          : 'تعذر بدء خدمة الخادم على المنفذ 4000. قد يكون المنفذ مستخدماً أو حدث خطأ في الصلاحيات.';
        mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(`
          <!DOCTYPE html>
          <html dir="rtl" lang="ar">
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #071E18; color: #FFFFFF; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
              .card { background: #0B2A22; border: 1px solid rgba(69, 219, 165, 0.25); border-radius: 16px; padding: 32px; max-width: 520px; width: 100%; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
              .icon { width: 56px; height: 56px; border-radius: 14px; background: rgba(239, 68, 68, 0.15); color: #EF4444; display: inline-flex; align-items: center; justify-content: center; font-size: 28px; margin-bottom: 16px; }
              h2 { font-size: 20px; font-weight: 700; color: #FFFFFF; margin: 0 0 12px 0; }
              p { font-size: 14px; line-height: 1.7; color: #D0E5DC; margin: 0 0 24px 0; text-align: right; }
              .actions { display: flex; gap: 12px; justify-content: center; }
              .btn-primary { background: #0B7B5E; color: #FFFFFF; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; font-size: 14px; cursor: pointer; transition: 0.2s; }
              .btn-primary:hover { background: #074C3A; }
              .btn-secondary { background: rgba(255,255,255,0.08); color: #D0E5DC; border: 1px solid rgba(255,255,255,0.15); padding: 10px 20px; border-radius: 8px; font-weight: 600; font-size: 14px; cursor: pointer; }
            </style>
          </head>
          <body>
            <div class="card">
              <div class="icon">⚠️</div>
              <h2>${errorTitle}</h2>
              <p>${errorDesc}</p>
              <div class="actions">
                <button class="btn-primary" onclick="location.reload()">إعادة الفحص والمحاولة</button>
              </div>
            </div>
          </body>
          </html>
        `));
        return;
      }
    }

    await ProcessSupervisor.startNextFrontend(projectRoot, 'http://127.0.0.1:4000/api/v1');
  }

  // Wait for Next.js UI on port 3000
  appLog('⏳ [DESKTOP] Waiting for Next.js UI on port 3000...');
  const nextReady = await ProcessSupervisor.waitForPort(3000, '127.0.0.1', 60000);
  appLog(`🌐 [DESKTOP] Next.js UI on port 3000 ready: ${nextReady}`);

  if (mainWindow && !mainWindow.isDestroyed()) {
    if (nextReady) {
      appLog('🚀 [DESKTOP] Loading http://localhost:3000 in main window.');
      mainWindow.loadURL('http://localhost:3000');
    } else {
      appLog('❌ [DESKTOP] Next.js UI timed out. Showing fallback error page.');
      mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(`
        <!DOCTYPE html>
        <html dir="rtl" lang="ar">
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #071E18; color: #FFFFFF; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; padding: 20px; box-sizing: border-box; }
            .card { background: #0B2A22; border: 1px solid rgba(69, 219, 165, 0.25); border-radius: 16px; padding: 32px; max-width: 500px; width: 100%; text-align: center; box-shadow: 0 20px 40px rgba(0,0,0,0.4); }
            .icon { width: 56px; height: 56px; border-radius: 14px; background: rgba(239, 68, 68, 0.15); color: #EF4444; display: inline-flex; align-items: center; justify-content: center; font-size: 28px; margin-bottom: 16px; }
            h2 { font-size: 20px; font-weight: 700; color: #FFFFFF; margin: 0 0 10px 0; }
            p { font-size: 14px; line-height: 1.6; color: #D0E5DC; margin: 0 0 24px 0; }
            .actions { display: flex; gap: 12px; justify-content: center; }
            .btn-primary { background: #0B7B5E; color: #FFFFFF; border: none; padding: 10px 20px; border-radius: 8px; font-weight: 600; font-size: 14px; cursor: pointer; transition: 0.2s; }
            .btn-primary:hover { background: #074C3A; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="icon">⏱️</div>
            <h2>استغرق بدء الواجهة وقتاً أطول من المتوقع</h2>
            <p>قد تكون الخدمة بصدد التهيئة لأول مرة أو هناك تعارض في منفذ التشغيل (Port 3000).</p>
            <div class="actions">
              <button class="btn-primary" onclick="location.reload()">إعادة المحاولة</button>
              <button class="btn-secondary" onclick="if (window.electronAPI && window.electronAPI.openSetup) { window.electronAPI.openSetup(); } else { location.reload(); }">إعدادات الوضع والاتصال</button>
            </div>
          </div>
        </body>
        </html>
      `));
    }
  }
}

function buildMenu() {
  const template: any[] = [
    {
      label: 'النظام',
      submenu: [
        {
          label: 'إعدادات وضع التشغيل (الاستقبال / الطبيب)',
          click: () => {
            if (mainWindow) {
              const setupHtmlPath = path.resolve(__dirname, '../renderer/setup.html');
              mainWindow.loadFile(setupHtmlPath);
            }
          },
        },
        {
          label: 'إعادة تحميل الصفحة',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow?.reload();
          },
        },
        { type: 'separator' },
        {
          label: 'خروج من البرنامج',
          accelerator: 'CmdOrCtrl+Q',
          click: () => {
            app.quit();
          },
        },
      ],
    },
    {
      label: 'معلومات الشبكة',
      submenu: [
        {
          label: 'عرض عنوان IP لهذا الجهاز',
          click: () => {
            const ips = getLanIps();
            const ipList = ips.map((i) => `• ${i.name}: ${i.ip}`).join('\n') || 'لا يوجد اتصال شبكي نشط';
            dialog.showMessageBox({
              type: 'info',
              title: 'عناوين الشبكة المحلية (LAN)',
              message: `عناوين هذا الجهاز على الشبكة:\n\n${ipList}\n\nاستخدم هذا العنوان للربط من جهاز الطبيب.`,
            });
          },
        },
      ],
    },
    {
      label: 'الترخيص والأمان',
      submenu: [
        {
          label: 'معلومات ترخيص هذا الجهاز',
          click: () => {
            const hwid = LicenseManager.getMachineId();
            const lic = LicenseManager.checkInstalledLicense();
            dialog.showMessageBox({
              type: lic.valid ? 'info' : 'warning',
              title: 'ترخيص منظومة نَفَس',
              message: `كود بصمة هذا الجهاز (Machine ID):\n${hwid}\n\nحالة الترخيص: ${lic.valid ? 'مرخص ومفعل قانونياً بنجاح ✅' : 'غير مرخص ⚠️'}\nالمالك: ${lic.info?.clientName || 'غير مسجل'}\nالفئة: ${lic.info?.tier || '—'}`,
            });
          },
        },
      ],
    },
    {
      label: 'مساعدة',
      submenu: [
        {
          label: '🔄 التحقق من وجود تحديثات الآن',
          click: async () => {
            if (!app.isPackaged) {
              dialog.showMessageBox({
                type: 'info',
                title: 'التحديث التلقائي',
                message: 'التحديث التلقائي يعمل في النسخة المثبتة الرسمية (Packaged) فقط.',
              });
              return;
            }
            try {
              const res = await autoUpdater.checkForUpdates();
              if (!res || !res.downloadPromise) {
                dialog.showMessageBox({
                  type: 'info',
                  title: 'أحدث إصدار',
                  message: `البرنامج مُحدّث إلى آخر إصدار بالفعل (v${app.getVersion()})!`,
                });
              } else {
                dialog.showMessageBox({
                  type: 'info',
                  title: 'جاري تحميل التحديث',
                  message: 'تم العثور على إصدار أحدث وجاري تحميله في الخلفية الآن تلقائياً... ستصلك رسالة عند اكتمال التحميل.',
                });
              }
            } catch (err: any) {
              dialog.showMessageBox({
                type: 'error',
                title: 'خطأ أثناء فحص التحديثات',
                message: 'تعذر الاتصال بـ GitHub أو التحقق من التحديثات:\n' + (err?.message || err),
              });
            }
          },
        },
        { type: 'separator' },
        {
          label: 'أدوات المطورين (DevTools)',
          accelerator: 'F12',
          click: () => {
            mainWindow?.webContents.toggleDevTools();
          },
        },
        {
          label: 'حول نظام العيادة',
          click: () => {
            dialog.showMessageBox({
              type: 'info',
              title: 'نظام إدارة العيادة',
              message: `نظام إدارة عيادة د. إسلام التخصصية - إصدار v${app.getVersion()}\nمبني باستخدام Next.js و Express و Electron مع دعم كامل للشبكة المحلية والتحديث التلقائي.`,
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

async function createWindow() {
  buildMenu();

  const iconPath = path.resolve(__dirname, '../../resources/icon.ico');

  mainWindow = new BrowserWindow({
    width: 1366,
    height: 850,
    minWidth: 1024,
    minHeight: 700,
    title: 'نظام نَفَس · إدارة العيادات',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    backgroundColor: '#074C3A',
    show: true,
    autoHideMenuBar: false,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
      return { action: 'deny' };
    }
    return { action: 'allow' };
  });

  mainWindow.maximize();
  mainWindow.show();
  mainWindow.focus();

  const splashHtml = `
    <!DOCTYPE html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="UTF-8">
      <title>جاري تشغيل نظام نَفَس...</title>
      <style>
        body {
          margin: 0; padding: 0; display: flex; align-items: center; justify-content: center;
          height: 100vh; background-color: #074C3A; color: white;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Tahoma, sans-serif;
        }
        .container { text-align: center; }
        .spinner {
          width: 50px; height: 50px; border: 4px solid rgba(255,255,255,0.2);
          border-top: 4px solid #45DBA5; border-radius: 50%;
          animation: spin 1s linear infinite; margin: 0 auto 20px;
        }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        h2 { font-size: 24px; margin-bottom: 8px; font-weight: 700; color: #FFFFFF; }
        p { font-size: 14px; color: #D0E5DC; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="spinner"></div>
        <h2>نظام نَفَس لإدارة العيادات</h2>
        <p>جاري تشغيل الخدمات وقاعدة البيانات...</p>
      </div>
    </body>
    </html>
  `;
  mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(splashHtml));

  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  await bootServicesAndLoadUrl();
}

// ─── Native IPC Handlers ───────────────────────────────────────────────────────

ipcMain.handle('app:get-mode', async () => {
  const config = ConfigManager.load();
  return config.mode;
});

ipcMain.handle('app:get-version', async () => {
  return app.getVersion();
});

ipcMain.handle('app:get-status', async () => {
  const config = ConfigManager.load();
  return {
    mode: config.mode,
    serverIp: config.serverIp,
    serverPort: config.serverPort,
  };
});

ipcMain.handle('app:get-lan-ips', async () => {
  return getLanIps();
});

ipcMain.handle('app:test-connection', async (_event, ip: string, port: number) => {
  return testConnection(ip, port);
});

ipcMain.handle('app:save-config', async (_event, newConfig) => {
  ProcessSupervisor.stopAll();
  const saved = ConfigManager.save(newConfig);
  return { success: true, config: saved };
});

ipcMain.handle('app:start-app', async () => {
  await bootServicesAndLoadUrl();
  return { success: true };
});

ipcMain.handle('app:go-to-login', async () => {
  const config = ConfigManager.load();
  if (config.mode === 'unconfigured') {
    ConfigManager.save({ mode: 'server', serverIp: '127.0.0.1', serverPort: 4000 });
  }
  await bootServicesAndLoadUrl();
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.loadURL('http://localhost:3000/auth/login');
  }
  return { success: true };
});

ipcMain.handle('app:open-setup', async () => {
  if (mainWindow) {
    const setupHtmlPath = path.resolve(__dirname, '../renderer/setup.html');
    mainWindow.loadFile(setupHtmlPath);
  }
});

ipcMain.handle('dialog:select-backup-file', async () => {
  if (!mainWindow) return null;
  const result = await dialog.showOpenDialog(mainWindow, {
    title: 'اختر ملف النسخة الاحتياطية',
    filters: [{ name: 'Zip Archives', extensions: ['zip'] }],
    properties: ['openFile'],
  });
  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }
  return result.filePaths[0];
});

ipcMain.handle('print:prescription', async (_event, htmlContent: string) => {
  const printWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);
  return new Promise((resolve) => {
    printWindow.webContents.print({ silent: false, printBackground: true }, (success) => {
      printWindow.close();
      resolve(success);
    });
  });
});

ipcMain.handle('print:receipt', async (_event, htmlContent: string) => {
  const printWindow = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);
  return new Promise((resolve) => {
    printWindow.webContents.print({ silent: true, printBackground: true }, (success) => {
      printWindow.close();
      resolve(success);
    });
  });
});

ipcMain.handle('license:get-machine-id', async () => {
  return LicenseManager.getMachineId();
});

ipcMain.handle('license:check', async () => {
  return LicenseManager.checkInstalledLicense();
});

ipcMain.handle('license:activate', async (_event, key: string) => {
  return LicenseManager.saveLicense(key);
});

// ─── Auto-Update (GitHub Releases Silent Auto-Updater) ─────────────────────────

function setupAutoUpdater() {
  if (!app.isPackaged) {
    appLog('ℹ️ [AUTO-UPDATE] Skipping auto-updater in dev mode (app.isPackaged=false).');
    return;
  }

  try {
    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;

    autoUpdater.on('checking-for-update', () => {
      appLog('🔄 [AUTO-UPDATE] Checking GitHub Releases for updates...');
    });

    autoUpdater.on('update-available', (info) => {
      appLog(`✨ [AUTO-UPDATE] Found new release version ${info.version}! Downloading silently in background...`);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('app:update-available', info);
      }
    });

    autoUpdater.on('update-not-available', () => {
      appLog('✅ [AUTO-UPDATE] System is up to date.');
    });

    autoUpdater.on('error', (err) => {
      appLog(`⚠️ [AUTO-UPDATE] Update error: ${err?.message || err}`);
    });

    autoUpdater.on('download-progress', (progressObj) => {
      appLog(`📥 [AUTO-UPDATE] Downloading: ${Math.round(progressObj.percent)}%`);
    });

    autoUpdater.on('update-downloaded', (info) => {
      appLog(`🎉 [AUTO-UPDATE] Update v${info.version} downloaded! Showing notification.`);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('app:update-downloaded', info);
      }
      dialog.showMessageBox({
        type: 'info',
        title: '✨ تم تحميل التحديث الجديد بنجاح!',
        message: `تم تحميل الإصدار الجديد (v${info.version}) وهو جاهز للتثبيت.\n\nهل ترغب في إعادة تشغيل البرنامج الآن لتطبيق التحديث فوراً؟`,
        buttons: ['تحديث وإعادة التشغيل الآن', 'لاحقاً (سيتم التثبيت عند الإغلاق)'],
        defaultId: 0,
      }).then((ret) => {
        if (ret.response === 0) {
          autoUpdater.quitAndInstall();
        }
      });
    });

    // أول فحص بعد تشغيل البرنامج بـ 15 ثانية (بعد اكتمال إقلاع الواجهة)
    setTimeout(() => {
      autoUpdater.checkForUpdatesAndNotify().catch((e) => {
        appLog(`⚠️ [AUTO-UPDATE] Initial check failed: ${e?.message}`);
      });
    }, 15000);

    // فحص دوري كل 3 ساعات في الخلفية
    setInterval(() => {
      autoUpdater.checkForUpdatesAndNotify().catch((e) => {
        appLog(`⚠️ [AUTO-UPDATE] Periodic check failed: ${e?.message}`);
      });
    }, 3 * 60 * 60 * 1000);
  } catch (err: any) {
    appLog(`⚠️ [AUTO-UPDATE] Failed to setup autoUpdater: ${err?.message}`);
  }
}

ipcMain.handle('app:check-for-updates', async () => {
  if (!app.isPackaged) {
    return { status: 'dev', message: 'وضع التطوير المحلي - التحديث التلقائي يعمل في النسخة المثبتة Packaged فقط' };
  }
  try {
    const result = await autoUpdater.checkForUpdates();
    return { status: 'success', updateInfo: result?.updateInfo };
  } catch (err: any) {
    return { status: 'error', message: err?.message };
  }
});

ipcMain.handle('app:install-update-now', async () => {
  autoUpdater.quitAndInstall();
});

// App Lifecycle
if (gotTheLock) {
  app.whenReady().then(async () => {
    await createWindow();
    setupAutoUpdater();
  });

  app.on('window-all-closed', () => {
    ProcessSupervisor.stopAll();
    if (process.platform !== 'darwin') {
      app.exit(0);
    }
  });

  app.on('before-quit', () => {
    ProcessSupervisor.stopAll();
  });
}
