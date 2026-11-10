import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import AdmZip from 'adm-zip';
import mongoose from 'mongoose';
import { StorageService } from './storage.service';
import { BadRequestError } from '../utils/errors';

export interface BackupResult {
  success: boolean;
  archivePath: string;
  backupId: string;
  timestamp: string;
  collectionsCount: number;
  recordsCount: number;
  filesCount: number;
  totalSizeBytes: number;
  sha256: string;
}

export class BackupService {
  private static getBackupsDir(): string {
    const baseDir = path.resolve(StorageService.getBaseUploadDir(), '..', 'backups');
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
    }
    return baseDir;
  }

  /**
   * Generates a unified snapshot archive of both MongoDB and uploaded files
   */
  static async createBackup(customDestination?: string): Promise<BackupResult> {
    const backupId = crypto.randomUUID();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const zip = new AdmZip();

    // 1. Dump MongoDB Collections
    const collections = await mongoose.connection.db!.collections();
    let totalRecords = 0;
    const dbManifest: Record<string, number> = {};

    for (const col of collections) {
      const colName = col.collectionName;
      if (colName.startsWith('system.')) continue;

      const docs = await col.find({}).toArray();
      totalRecords += docs.length;
      dbManifest[colName] = docs.length;

      const jsonString = JSON.stringify(docs, null, 2);
      zip.addFile(`database/${colName}.json`, Buffer.from(jsonString, 'utf-8'));
    }

    // 2. Add Uploaded Files from D:/ClinicData/uploads
    const uploadBaseDir = StorageService.getBaseUploadDir();
    let totalFiles = 0;
    let totalFilesBytes = 0;

    const addFilesRecursively = (currentDir: string, zipPrefix: string) => {
      if (!fs.existsSync(currentDir)) return;
      const entries = fs.readdirSync(currentDir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(currentDir, entry.name);
        if (entry.isDirectory()) {
          addFilesRecursively(fullPath, `${zipPrefix}/${entry.name}`);
        } else if (entry.isFile()) {
          const content = fs.readFileSync(fullPath);
          totalFiles++;
          totalFilesBytes += content.length;
          zip.addFile(`${zipPrefix}/${entry.name}`, content);
        }
      }
    };

    addFilesRecursively(uploadBaseDir, 'uploads');

    // 3. Manifest metadata
    const manifest = {
      system: 'Clinic Management System Desktop',
      version: '1.0.0',
      backupId,
      createdAt: new Date().toISOString(),
      database: {
        collectionsCount: Object.keys(dbManifest).length,
        recordsCount: totalRecords,
        tables: dbManifest,
      },
      uploads: {
        filesCount: totalFiles,
        totalSizeBytes: totalFilesBytes,
      },
    };

    zip.addFile('manifest.json', Buffer.from(JSON.stringify(manifest, null, 2), 'utf-8'));

    // 4. Write Archive to Disk
    const backupsDir = this.getBackupsDir();
    const archiveFileName = `clinic_backup_${timestamp}.zip`;
    const targetArchivePath = path.join(backupsDir, archiveFileName);

    zip.writeZip(targetArchivePath);

    // Compute archive hash
    const archiveBuffer = fs.readFileSync(targetArchivePath);
    const sha256 = crypto.createHash('sha256').update(archiveBuffer).digest('hex');

    // 5. If custom destination specified (e.g. USB flash drive), copy there too
    if (customDestination && fs.existsSync(customDestination)) {
      try {
        const copyPath = path.join(customDestination, archiveFileName);
        fs.copyFileSync(targetArchivePath, copyPath);
        console.log(`💾 [BACKUP] Mirrored snapshot to external drive: ${copyPath}`);
      } catch (err) {
        console.warn('⚠️ [BACKUP] Failed copying to external drive:', err);
      }
    }

    console.log(`✅ [BACKUP] Snapshot successfully created: ${targetArchivePath} (${totalRecords} records, ${totalFiles} files)`);

    return {
      success: true,
      archivePath: targetArchivePath,
      backupId,
      timestamp,
      collectionsCount: Object.keys(dbManifest).length,
      recordsCount: totalRecords,
      filesCount: totalFiles,
      totalSizeBytes: archiveBuffer.length,
      sha256,
    };
  }

  /**
   * Restores a previously exported backup archive
   */
  static async restoreBackup(archivePath: string): Promise<{ success: boolean; message: string }> {
    if (!fs.existsSync(archivePath)) {
      throw new BadRequestError('ملف النسخة الاحتياطية غير موجود');
    }

    const zip = new AdmZip(archivePath);
    const manifestEntry = zip.getEntry('manifest.json');
    if (!manifestEntry) {
      throw new BadRequestError('ملف النسخة الاحتياطية غير صالح (مفقود manifest.json)');
    }

    const manifest = JSON.parse(zip.readAsText(manifestEntry));
    console.log(`🔄 [RESTORE] Restoring backup ${manifest.backupId} created at ${manifest.createdAt}...`);

    // 1. Restore Collections into MongoDB
    const zipEntries = zip.getEntries();
    for (const entry of zipEntries) {
      if (entry.entryName.startsWith('database/') && entry.name.endsWith('.json')) {
        const colName = entry.name.replace('.json', '');
        const docs = JSON.parse(zip.readAsText(entry));

        const col = mongoose.connection.db!.collection(colName);
        if (Array.isArray(docs) && docs.length > 0) {
          // Clean existing collection and insert restored documents
          await col.deleteMany({});
          await col.insertMany(docs);
          console.log(`📦 [RESTORE] Restored ${docs.length} documents into ${colName}`);
        }
      }
    }

    // 2. Restore Uploaded Files
    const uploadBaseDir = StorageService.getBaseUploadDir();
    for (const entry of zipEntries) {
      if (entry.entryName.startsWith('uploads/') && !entry.isDirectory) {
        const relativePath = entry.entryName.replace(/^uploads\//, '');
        const destination = path.join(uploadBaseDir, relativePath);
        const dir = path.dirname(destination);
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(destination, entry.getData());
      }
    }

    console.log('✅ [RESTORE] Database and uploaded files successfully restored!');
    return {
      success: true,
      message: 'تمت استعادة قاعدة البيانات والملفات بنجاح',
    };
  }
}

