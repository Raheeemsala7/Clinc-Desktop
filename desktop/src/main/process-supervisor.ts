import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs';
import net from 'net';
import http from 'http';
import { app } from 'electron';
import { LicenseManager } from './license-manager';

function supervisorLog(msg: string) {
  try {
    const logPath = path.join(app.getPath('userData'), 'desktop.log');
    fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${msg}\n`, 'utf8');
  } catch {}
  console.log(msg);
}

export class ProcessSupervisor {
  private static children: ChildProcess[] = [];

  static checkPortOnce(port: number, host: string): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const socket = new net.Socket();
      socket.setTimeout(800);
      socket.on('connect', () => {
        socket.destroy();
        resolve(true);
      });
      socket.on('error', () => {
        socket.destroy();
        resolve(false);
      });
      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });
      socket.connect(port, host);
    });
  }

  static async waitForPort(port: number, host = '127.0.0.1', timeoutMs = 45000): Promise<boolean> {
    const startTime = Date.now();
    while (Date.now() - startTime < timeoutMs) {
      const isListening = await this.checkPortOnce(port, host);
      if (isListening) return true;
      if (host === '127.0.0.1') {
        const isLocalhost = await this.checkPortOnce(port, 'localhost');
        if (isLocalhost) return true;
      }
      await new Promise((r) => setTimeout(r, 600));
    }
    return false;
  }

  static killPort(port: number) {
    if (process.platform === 'win32') {
      try {
        const out = require('child_process').execSync(`netstat -ano | findstr :${port} | findstr LISTENING`, {
          encoding: 'utf8',
          stdio: ['ignore', 'pipe', 'ignore'],
        });
        const lines = out.trim().split('\n');
        for (const line of lines) {
          const parts = line.trim().split(/\s+/);
          const pid = parts[parts.length - 1];
          if (pid && Number(pid) > 0 && Number(pid) !== process.pid) {
            try {
              supervisorLog(`🛑 [SUPERVISOR] Freeing port ${port} by terminating PID ${pid}`);
              require('child_process').execSync(`taskkill /pid ${pid} /f /t`, { stdio: 'ignore' });
            } catch {}
          }
        }
      } catch {}
    }
  }

  static async isHttpHealthy(port: number, path = '/health'): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const req = http.get({ host: '127.0.0.1', port, path, timeout: 1500 }, (res) => {
        resolve(Boolean(res.statusCode && res.statusCode >= 200 && res.statusCode < 500));
      });
      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });
    });
  }

  static getResourcesDir(projectRoot: string): string {
    const candidates = [
      process.resourcesPath,
      path.resolve(app.getAppPath(), '..'),
      path.resolve(projectRoot, 'desktop', 'resources'),
      path.resolve(projectRoot, 'desktop', 'dist-installer', 'win-unpacked', 'resources'),
    ];
    for (const c of candidates) {
      if (fs.existsSync(path.join(c, 'server', 'server.js')) || fs.existsSync(path.join(c, 'bin', 'node.exe'))) {
        return c;
      }
    }
    return process.resourcesPath;
  }

  static getNodeBinary(projectRoot: string): string {
    const resourcesDir = this.getResourcesDir(projectRoot);
    const candidates = [
      path.join(resourcesDir, 'bin', 'node.exe'),
      path.resolve(projectRoot, 'resources', 'bin', 'node.exe'),
      path.resolve(projectRoot, 'desktop', 'resources', 'bin', 'node.exe'),
    ];
    for (const p of candidates) {
      if (fs.existsSync(p)) return p;
    }
    return 'node';
  }

  static async ensureMongoRunning(): Promise<boolean> {
    supervisorLog('🔍 [SUPERVISOR] Checking MongoDB status on 127.0.0.1:27017...');
    const isAlreadyRunning = await this.waitForPort(27017, '127.0.0.1', 1500);
    if (isAlreadyRunning) {
      supervisorLog('✅ [SUPERVISOR] MongoDB is already running on port 27017.');
      return true;
    }

    supervisorLog('⚠️ [SUPERVISOR] MongoDB not running on port 27017. Searching for mongod.exe...');
    const dbPath = 'D:\\ClinicData\\database';
    const uploadsPath = 'D:\\ClinicData\\uploads';

    try {
      if (!fs.existsSync(dbPath)) fs.mkdirSync(dbPath, { recursive: true });
      if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath, { recursive: true });
    } catch (err) {
      supervisorLog(`Could not initialize D:\\ClinicData directories: ${err}`);
    }

    const candidates = [
      'C:\\Program Files\\MongoDB\\Server\\8.2\\bin\\mongod.exe',
      'C:\\Program Files\\MongoDB\\Server\\8.0\\bin\\mongod.exe',
      'C:\\Program Files\\MongoDB\\Server\\7.0\\bin\\mongod.exe',
      'C:\\Program Files\\MongoDB\\Server\\6.0\\bin\\mongod.exe',
      'D:\\ClinicData\\bin\\mongod.exe',
    ];

    let mongodExe: string | null = null;
    for (const c of candidates) {
      if (fs.existsSync(c)) {
        mongodExe = c;
        break;
      }
    }

    if (!mongodExe && fs.existsSync('C:\\Program Files\\MongoDB\\Server')) {
      try {
        const dirs = fs.readdirSync('C:\\Program Files\\MongoDB\\Server');
        for (const dir of dirs) {
          const testP = path.join('C:\\Program Files\\MongoDB\\Server', dir, 'bin', 'mongod.exe');
          if (fs.existsSync(testP)) {
            mongodExe = testP;
            break;
          }
        }
      } catch {}
    }

    if (mongodExe) {
      supervisorLog(`🍃 [SUPERVISOR] Auto-starting MongoDB Community (${mongodExe})...`);
      const mongoChild = spawn(mongodExe, ['--dbpath', dbPath, '--bind_ip', '127.0.0.1', '--port', '27017'], {
        stdio: 'ignore',
        detached: true,
      });
      mongoChild.unref();
      this.children.push(mongoChild);

      const ready = await this.waitForPort(27017, '127.0.0.1', 12000);
      if (ready) {
        supervisorLog('✅ [SUPERVISOR] MongoDB successfully started in background.');
        return true;
      }
    }

    supervisorLog('⚠️ [SUPERVISOR] mongod.exe not found for auto-start. Expecting Windows Service.');
    return false;
  }

  static async startServerBackend(projectRoot: string): Promise<ChildProcess | null> {
    const isAlreadyRunning = await this.waitForPort(4000, '127.0.0.1', 1000);
    if (isAlreadyRunning) {
      const healthy = await this.isHttpHealthy(4000, '/health');
      if (healthy) {
        supervisorLog('✅ [SUPERVISOR] Central Express API Server is already running and healthy on port 4000.');
        return null;
      }
      supervisorLog('⚠️ [SUPERVISOR] Port 4000 is occupied by an unresponsive process. Terminating old process...');
      this.killPort(4000);
      await new Promise((r) => setTimeout(r, 800));
    }
    supervisorLog('🚀 [SUPERVISOR] Starting Central Express API Server in background...');
    const resourcesDir = this.getResourcesDir(projectRoot);
    const packagedServer = path.join(resourcesDir, 'server', 'server.js');
    const devServerDir = path.resolve(projectRoot, 'server');
    const devBundledServer = path.resolve(projectRoot, 'desktop', 'resources', 'server', 'server.js');

    const candidates = [
      packagedServer,
      devBundledServer,
      path.join(devServerDir, 'server.js'),
      path.join(devServerDir, 'dist', 'bundle.js'),
      path.join(devServerDir, 'dist', 'src', 'server.js'),
    ];

    let scriptPath: string | null = null;
    let cwd = resourcesDir;

    for (const c of candidates) {
      if (fs.existsSync(c)) {
        scriptPath = c;
        cwd = path.dirname(c);
        break;
      }
    }

    let command = this.getNodeBinary(projectRoot);
    let args: string[] = [];

    if (scriptPath) {
      args = [scriptPath];
    } else {
      cwd = devServerDir;
      command = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
      args = ['run', 'start:dev'];
    }

    supervisorLog(`[SUPERVISOR] Backend spawn: command=${command}, args=${args.join(' ')}, cwd=${cwd}`);

    const rawLicKey = LicenseManager.getRawLicenseKey() || '';
    const machineId = LicenseManager.getMachineId();
    const defaultStorage = fs.existsSync('D:\\') ? 'D:/ClinicData/uploads' : 'C:/ClinicData/uploads';

    const child = spawn(command, args, {
      cwd,
      env: {
        ...process.env,
        PORT: '4000',
        NODE_ENV: 'production',
        CLINIC_SERVER_AUTHORIZED: 'true',
        CLINIC_MACHINE_HWID: machineId,
        CLINIC_LICENSE_KEY: rawLicKey,
        MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/clinic-management',
        JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'your-super-secret-jwt-key-change-in-production',
        JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key-change-in-production',
        JWT_ACCESS_TTL: '2592000',
        JWT_REFRESH_TTL: '5184000',
        LOCAL_STORAGE_PATH: process.env.LOCAL_STORAGE_PATH || defaultStorage,
        STORAGE_DRIVER: 'local',
      },
      stdio: 'pipe',
      shell: process.platform === 'win32' && command.endsWith('.cmd'),
    });

    child.stdout?.on('data', (data) => {
      supervisorLog(`[API-OUT] ${data.toString().trim()}`);
    });

    child.stderr?.on('data', (data) => {
      supervisorLog(`[API-ERR] ${data.toString().trim()}`);
    });

    this.children.push(child);
    return child;
  }

  private static findStandaloneServer(baseDir: string): { scriptPath: string; cwd: string } | null {
    const candidates = [
      path.join(baseDir, 'server.js'),
      path.join(baseDir, 'desktop', 'ui', 'server.js'),
      path.join(baseDir, '.next', 'standalone', 'server.js'),
      path.join(baseDir, '.next', 'standalone', 'desktop', 'ui', 'server.js'),
    ];

    for (const c of candidates) {
      if (fs.existsSync(c)) {
        return { scriptPath: c, cwd: path.dirname(c) };
      }
    }
    return null;
  }

  static async startNextFrontend(projectRoot: string, apiUrl = 'http://127.0.0.1:4000/api/v1'): Promise<ChildProcess | null> {
    const isAlreadyRunning = await this.waitForPort(3000, '127.0.0.1', 1000);
    if (isAlreadyRunning) {
      const healthy = await this.isHttpHealthy(3000, '/');
      if (healthy) {
        supervisorLog('✅ [SUPERVISOR] Next.js UI Frontend is already running and healthy on port 3000.');
        return null;
      }
      supervisorLog('⚠️ [SUPERVISOR] Port 3000 is occupied by an unresponsive process. Terminating old process...');
      this.killPort(3000);
      await new Promise((r) => setTimeout(r, 800));
    }
    supervisorLog(`🚀 [SUPERVISOR] Starting Next.js UI Frontend in background (Connecting to ${apiUrl})...`);
    const resourcesDir = this.getResourcesDir(projectRoot);
    const desktopUiDir = path.resolve(projectRoot, 'desktop', 'ui');

    const searchDirs = [
      path.join(resourcesDir, 'frontend', 'desktop', 'ui'),
      path.join(resourcesDir, 'frontend'),
      path.join(desktopUiDir, '.next', 'standalone', 'desktop', 'ui'),
      path.join(desktopUiDir, '.next', 'standalone'),
      desktopUiDir,
    ];

    let resolved: { scriptPath: string; cwd: string } | null = null;
    for (const dir of searchDirs) {
      if (fs.existsSync(dir)) {
        resolved = this.findStandaloneServer(dir);
        if (resolved) {
          supervisorLog(`[SUPERVISOR] Found Next.js standalone server at: ${resolved.scriptPath}`);
          break;
        }
      }
    }

    let command = this.getNodeBinary(projectRoot);
    let args = resolved ? [resolved.scriptPath] : ['run', 'dev'];
    let cwd = resolved ? resolved.cwd : desktopUiDir;

    if (!resolved) {
      command = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';
    }

    supervisorLog(`[SUPERVISOR] Frontend spawn: command=${command}, args=${args.join(' ')}, cwd=${cwd}`);

    const socketUrl = apiUrl.replace(/\/api\/v1\/?$/, '');

    const child = spawn(command, args, {
      cwd,
      env: {
        ...process.env,
        PORT: '3000',
        HOSTNAME: '0.0.0.0',
        API_URL: apiUrl,
        NEXT_PUBLIC_API_URL: apiUrl,
        NEXT_PUBLIC_SOCKET_URL: socketUrl,
        NEXTAUTH_SECRET: '204a49bce159670a0bba3850cac547dc8d8dfb04ef7402b6cbb5eac7986c5545',
        NEXTAUTH_URL: 'http://localhost:3000',
        NODE_ENV: 'production',
      },
      stdio: 'pipe',
      shell: process.platform === 'win32' && command.endsWith('.cmd'),
    });

    child.stdout?.on('data', (data) => {
      supervisorLog(`[NEXT-OUT] ${data.toString().trim()}`);
    });

    child.stderr?.on('data', (data) => {
      supervisorLog(`[NEXT-ERR] ${data.toString().trim()}`);
    });

    this.children.push(child);
    return child;
  }

  static stopAll() {
    supervisorLog('🛑 [SUPERVISOR] Terminating all background processes...');
    for (const child of this.children) {
      try {
        if (process.platform === 'win32' && child.pid) {
          try {
            require('child_process').execSync(`taskkill /pid ${child.pid} /f /t`, { stdio: 'ignore' });
          } catch {}
        } else {
          child.kill('SIGKILL');
        }
      } catch (err) {
        supervisorLog(`⚠️ Error stopping child process: ${err}`);
      }
    }
    this.children = [];
    this.killPort(3000);
    this.killPort(4000);
  }
}
