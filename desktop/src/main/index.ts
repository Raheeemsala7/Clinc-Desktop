import { app, BrowserWindow, ipcMain, dialog, Menu, shell } from 'electron';
import path from 'path';
import os from 'os';
import http from 'http';
import fs from 'fs';
import { ConfigManager } from './config-manager';
import { ProcessSupervisor } from './process-supervisor';

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
    const serverReady = await ProcessSupervisor.waitForPort(4000, '127.0.0.1', 45000);
    appLog(`📡 [DESKTOP] API Server on port 4000 ready: ${serverReady}`);
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
        <html dir="rtl" style="font-family:sans-serif;background:#0A164E;color:#fff;display:flex;align-items:center;justify-content:center;height:100vh;">
          <div style="text-align:center;">
            <h2>تعذر بدء واجهة النظام</h2>
            <p style="color:#cbd5e1;">يرجى إعادة تشغيل البرنامج أو التحقق من المنافذ.</p>
            <button onclick="location.reload()" style="padding:10px 24px;border-radius:8px;border:none;background:#38bdf8;color:#0f172a;font-weight:bold;cursor:pointer;">إعادة المحاولة</button>
          </div>
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
      label: 'مساعدة',
      submenu: [
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
              message: 'نظام إدارة عيادة د. إسلام التخصصية - إصدار 1.0.0 Desktop\nمبني باستخدام Next.js و Express و Electron مع دعم كامل للشبكة المحلية.',
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

// App Lifecycle
if (gotTheLock) {
  app.whenReady().then(createWindow);

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
