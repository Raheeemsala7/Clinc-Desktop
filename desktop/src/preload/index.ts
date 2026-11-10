import { contextBridge, ipcRenderer } from 'electron';

export interface IElectronAPI {
  getAppMode: () => Promise<'server' | 'client' | 'unconfigured'>;
  getServerStatus: () => Promise<any>;
  getAppVersion: () => Promise<string>;
  getLanIps: () => Promise<Array<{ name: string; ip: string }>>;
  testServerConnection: (ip: string, port: number) => Promise<{ success: boolean; latency?: number; error?: string }>;
  goToLogin: () => Promise<void>;
  startApp: () => Promise<void>;
  openSetup: () => Promise<void>;
  saveConfig: (config: { mode: 'server' | 'client'; serverIp?: string; serverPort?: number }) => Promise<any>;
  printPrescription: (htmlContent: string) => Promise<boolean>;
  printReceipt: (htmlContent: string) => Promise<boolean>;
  triggerBackup: () => Promise<any>;
  restoreBackup: (filePath: string) => Promise<any>;
  selectBackupFile: () => Promise<string | null>;
}

contextBridge.exposeInMainWorld('electronAPI', {
  getAppMode: () => ipcRenderer.invoke('app:get-mode'),
  getServerStatus: () => ipcRenderer.invoke('app:get-status'),
  getAppVersion: () => ipcRenderer.invoke('app:get-version'),
  getLanIps: () => ipcRenderer.invoke('app:get-lan-ips'),
  testServerConnection: (ip: string, port: number) => ipcRenderer.invoke('app:test-connection', ip, port),
  goToLogin: () => ipcRenderer.invoke('app:go-to-login'),
  startApp: () => ipcRenderer.invoke('app:start-app'),
  openSetup: () => ipcRenderer.invoke('app:open-setup'),
  saveConfig: (config: any) => ipcRenderer.invoke('app:save-config', config),
  printPrescription: (html: string) => ipcRenderer.invoke('print:prescription', html),
  printReceipt: (html: string) => ipcRenderer.invoke('print:receipt', html),
  triggerBackup: () => ipcRenderer.invoke('backup:trigger'),
  restoreBackup: (filePath: string) => ipcRenderer.invoke('backup:restore', filePath),
  selectBackupFile: () => ipcRenderer.invoke('dialog:select-backup-file'),
});
