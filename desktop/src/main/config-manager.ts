import fs from 'fs';
import path from 'path';
import { app } from 'electron';

export interface AppConfig {
  mode: 'server' | 'client' | 'unconfigured';
  serverIp: string;
  serverPort: number;
  lastConnectedAt?: string;
}

const DEFAULT_CONFIG: AppConfig = {
  mode: 'unconfigured',
  serverIp: '127.0.0.1',
  serverPort: 4000,
};

export class ConfigManager {
  private static getConfigPath(): string {
    const appData = app.getPath('userData');
    return path.join(appData, 'clinic-config.json');
  }

  static load(): AppConfig {
    try {
      const configPath = this.getConfigPath();
      if (fs.existsSync(configPath)) {
        const raw = fs.readFileSync(configPath, 'utf-8');
        return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
      }
    } catch (err) {
      console.warn('⚠️ [CONFIG] Failed to load clinic-config.json:', err);
    }
    return { ...DEFAULT_CONFIG };
  }

  static save(config: Partial<AppConfig>): AppConfig {
    const current = this.load();
    const updated: AppConfig = { ...current, ...config };
    try {
      const configPath = this.getConfigPath();
      const dir = path.dirname(configPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(configPath, JSON.stringify(updated, null, 2), 'utf-8');
    } catch (err) {
      console.error('❌ [CONFIG] Failed to write clinic-config.json:', err);
    }
    return updated;
  }
}

