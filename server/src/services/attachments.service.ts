import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import FileType from 'file-type';
import { BadRequestError } from '../utils/errors';
import { StorageService } from './storage.service';
import { config } from '../config/env';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
];
const MAX_FILE_SIZE_BYTES = 25 * 1024 * 1024; // 25MB
const MAX_FILES_PER_BATCH = 100; // Unlimited / large batch support

export interface StoredAttachment {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  url: string;
  uploadedAt: Date;
}

export class AttachmentsService {
  /**
   * Resolves the target upload directory on local disk
   */
  private static getTargetDir(category = 'appointments'): string {
    const baseDir = StorageService.getBaseUploadDir();
    const targetDir = path.join(baseDir, category);
    if (!fs.existsSync(targetDir)) {
      try {
        fs.mkdirSync(targetDir, { recursive: true });
      } catch (err) {
        console.warn('⚠️ [STORAGE] Directory creation warning:', err);
      }
    }
    return targetDir;
  }

  /**
   * Validates and saves an uploaded file (from base64 or raw buffer).
   * Verifies real file signature (magic bytes) to prevent forged file extensions.
   */
  static async saveFile(
    fileName: string,
    dataInput: string | Buffer,
    category = 'appointments',
  ): Promise<StoredAttachment> {
    let buffer: Buffer;

    if (Buffer.isBuffer(dataInput)) {
      buffer = dataInput;
    } else if (typeof dataInput === 'string') {
      // Handle base64 string or data URL
      const base64Data = dataInput.includes(';base64,')
        ? dataInput.split(';base64,')[1]
        : dataInput;
      buffer = Buffer.from(base64Data, 'base64');
    } else {
      throw new BadRequestError('Invalid file data provided');
    }

    if (buffer.length === 0) {
      throw new BadRequestError('Uploaded file is empty');
    }

    if (buffer.length > MAX_FILE_SIZE_BYTES) {
      throw new BadRequestError('حجم الملف يتجاوز الحد الأقصى المسموح به (10 ميجابايت)');
    }

    // Inspect real file signature (magic bytes)
    const detectedType = await FileType.fromBuffer(buffer);
    if (!detectedType || !ALLOWED_MIME_TYPES.includes(detectedType.mime)) {
      throw new BadRequestError(
        'نوع الملف غير صالح أو تم التلاعب به. الصيغ المسموح بها هي صور (JPEG, PNG, WebP) وملفات PDF',
      );
    }

    const safeExt = detectedType.ext;
    const fileId = uuidv4();
    const storedFileName = `${fileId}.${safeExt}`;
    const safeOriginalName = path.basename(fileName || `attachment.${safeExt}`).substring(0, 100);

    // If S3 / Tigris cloud driver is explicitly enabled with valid credentials
    if (config.storage.driver === 's3' && config.storage.accessKeyId) {
      try {
        const uploadResult = await StorageService.uploadBuffer(
          buffer,
          storedFileName,
          detectedType.mime,
          category,
        );

        return {
          id: uploadResult.id,
          fileName: safeOriginalName,
          fileSize: buffer.length,
          mimeType: detectedType.mime,
          url: `/api/v1/attachments/file/${storedFileName}`,
          uploadedAt: new Date(),
        };
      } catch (s3Error: any) {
        console.warn('⚠️ [STORAGE] Tigris S3 upload failed, falling back to local disk:', s3Error?.message);
      }
    }

    // Local Disk Storage on Reception Server
    const targetDir = this.getTargetDir(category);
    const destinationPath = path.join(targetDir, storedFileName);

    await fs.promises.writeFile(destinationPath, buffer);

    return {
      id: fileId,
      fileName: safeOriginalName,
      fileSize: buffer.length,
      mimeType: detectedType.mime,
      url: `/api/v1/attachments/file/${storedFileName}`,
      uploadedAt: new Date(),
    };
  }

  static async saveMultipleFiles(
    files: Array<{ name: string; data: string | Buffer; category?: string }>,
    defaultCategory = 'appointments',
  ): Promise<StoredAttachment[]> {
    if (!Array.isArray(files) || files.length === 0) {
      throw new BadRequestError('No files provided');
    }

    if (files.length > MAX_FILES_PER_BATCH) {
      throw new BadRequestError(`الحد الأقصى المسموح به هو ${MAX_FILES_PER_BATCH} ملفات في المرة الواحدة`);
    }

    const results: StoredAttachment[] = [];
    for (const file of files) {
      const category = file.category || defaultCategory;
      const stored = await this.saveFile(file.name, file.data, category);
      results.push(stored);
    }

    return results;
  }

  static getFilePath(filename: string): { filePath: string; mimeType: string } {
    // Sanitize filename to prevent directory traversal
    const safeName = path.basename(filename);
    const baseDir = StorageService.getBaseUploadDir();

    const candidateFolders = [
      'appointments',
      'patients',
      'reports',
      'prescriptions',
      'examination',
      '',
    ];

    let foundPath: string | null = null;
    for (const folder of candidateFolders) {
      const candidate = folder ? path.join(baseDir, folder, safeName) : path.join(baseDir, safeName);
      if (fs.existsSync(candidate)) {
        foundPath = candidate;
        break;
      }
    }

    // Legacy fallback check
    if (!foundPath) {
      const legacyPath = path.resolve(process.cwd(), 'uploads/appointments', safeName);
      if (fs.existsSync(legacyPath)) {
        foundPath = legacyPath;
      }
    }

    if (!foundPath) {
      throw new BadRequestError('File not found');
    }

    const ext = path.extname(safeName).toLowerCase();
    const mimeMap: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
      '.gif': 'image/gif',
      '.pdf': 'application/pdf',
    };

    return {
      filePath: foundPath,
      mimeType: mimeMap[ext] || 'application/octet-stream',
    };
  }
}
