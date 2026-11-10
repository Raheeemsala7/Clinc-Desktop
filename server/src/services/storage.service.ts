import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/env';
import { BadRequestError } from '../utils/errors';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
];

export interface PresignedUrlResult {
  uploadUrl: string;
  fileUrl: string;
  fileKey: string;
  expiresInSeconds: number;
}

export class StorageService {
  private static s3Client: S3Client | null = null;

  public static getBaseUploadDir(): string {
    const configuredPath = config.storage.localPath || process.env.LOCAL_STORAGE_PATH || 'D:/ClinicData/uploads';
    try {
      if (!fs.existsSync(configuredPath)) {
        fs.mkdirSync(configuredPath, { recursive: true });
      }
      return configuredPath;
    } catch {
      // Fallback to project root ./uploads if D: is inaccessible
      const fallback = path.resolve(process.cwd(), 'uploads');
      if (!fs.existsSync(fallback)) {
        fs.mkdirSync(fallback, { recursive: true });
      }
      return fallback;
    }
  }

  private static getClient(): S3Client {
    if (!this.s3Client) {
      this.s3Client = new S3Client({
        region: config.storage.region || 'auto',
        endpoint: config.storage.endpoint || 'https://t3.storage.dev',
        credentials: {
          accessKeyId: config.storage.accessKeyId,
          secretAccessKey: config.storage.secretAccessKey,
        },
      });
    }
    return this.s3Client;
  }

  /**
   * Generates an upload URL.
   * If local storage driver is active, points directly to local API upload endpoint.
   * If S3 driver is active, generates an S3 presigned PUT URL.
   */
  static async getPresignedUploadUrl(
    fileName: string,
    mimeType: string,
    folder = 'appointments',
  ): Promise<PresignedUrlResult> {
    if (!fileName || !mimeType) {
      throw new BadRequestError('fileName and mimeType are required');
    }

    const cleanMime = mimeType.toLowerCase().trim();
    if (!ALLOWED_MIME_TYPES.includes(cleanMime)) {
      throw new BadRequestError(
        'نوع الملف غير مدعوم، الصيغ المسموح بها هي صور (JPEG, PNG, WebP) وملفات PDF',
      );
    }

    const extension = fileName.split('.').pop()?.toLowerCase() || 'jpg';
    const uniqueId = uuidv4();
    const fileKey = `${folder}/${uniqueId}.${extension}`;

    // Local Storage Mode (Standard for Clinic Desktop)
    if (config.storage.driver !== 's3' || !config.storage.accessKeyId) {
      return {
        uploadUrl: '/api/v1/attachments/upload',
        fileUrl: `/api/v1/attachments/file/${uniqueId}.${extension}`,
        fileKey,
        expiresInSeconds: 3600,
      };
    }

    // S3 Cloud Fallback
    const client = this.getClient();
    const bucket = config.storage.bucketName || 'clinic-uploads-bucket';

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: fileKey,
      ContentType: cleanMime,
    });

    const expiresInSeconds = 300; // 5 minutes
    const uploadUrl = await getSignedUrl(client, command, {
      expiresIn: expiresInSeconds,
    });

    const endpointUrl = config.storage.endpoint.replace(/\/+$/, '');
    const fileUrl = `${endpointUrl}/${bucket}/${fileKey}`;

    return {
      uploadUrl,
      fileUrl,
      fileKey,
      expiresInSeconds,
    };
  }

  /**
   * Directly uploads a binary Buffer to local storage (or S3 if configured)
   */
  static async uploadBuffer(
    buffer: Buffer,
    fileName: string,
    mimeType: string,
    folder = 'appointments',
  ): Promise<{ fileUrl: string; fileKey: string; id: string; fileName: string }> {
    const cleanMime = mimeType.toLowerCase().trim();
    if (!ALLOWED_MIME_TYPES.includes(cleanMime)) {
      throw new BadRequestError(
        'نوع الملف غير مدعوم، الصيغ المسموح بها هي صور (JPEG, PNG, WebP) وملفات PDF',
      );
    }

    const extension = fileName.split('.').pop()?.toLowerCase() || 'jpg';
    const fileId = path.parse(fileName).name || uuidv4();
    const storedFileName = `${fileId}.${extension}`;
    const fileKey = `${folder}/${storedFileName}`;

    // Local Disk Storage Mode
    if (config.storage.driver !== 's3' || !config.storage.accessKeyId) {
      const baseDir = this.getBaseUploadDir();
      const targetFolder = path.join(baseDir, folder);
      if (!fs.existsSync(targetFolder)) {
        fs.mkdirSync(targetFolder, { recursive: true });
      }

      const filePath = path.join(targetFolder, storedFileName);
      await fs.promises.writeFile(filePath, buffer);

      return {
        fileUrl: `/api/v1/attachments/file/${storedFileName}`,
        fileKey,
        id: fileId,
        fileName: storedFileName,
      };
    }

    // S3 Cloud Fallback
    const client = this.getClient();
    const bucket = config.storage.bucketName || 'clinic-uploads-bucket';

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: fileKey,
      Body: buffer,
      ContentType: cleanMime,
    });

    await client.send(command);

    const endpointUrl = config.storage.endpoint.replace(/\/+$/, '');
    const fileUrl = `${endpointUrl}/${bucket}/${fileKey}`;

    return {
      fileUrl,
      fileKey,
      id: fileId,
      fileName: storedFileName,
    };
  }

  /**
   * Fetches file as a readable stream from local disk (or S3)
   */
  static async getFileStream(
    fileKey: string,
  ): Promise<{ stream: any; contentType: string; contentLength?: number }> {
    if (config.storage.driver !== 's3' || !config.storage.accessKeyId) {
      const baseDir = this.getBaseUploadDir();
      let filePath = path.join(baseDir, fileKey);

      if (!fs.existsSync(filePath)) {
        const fileName = path.basename(fileKey);
        // Search subfolders
        const subfolders = ['appointments', 'patients', 'reports', 'prescriptions', 'examination'];
        for (const sub of subfolders) {
          const candidate = path.join(baseDir, sub, fileName);
          if (fs.existsSync(candidate)) {
            filePath = candidate;
            break;
          }
        }
      }

      if (!fs.existsSync(filePath)) {
        throw new BadRequestError('File not found');
      }

      const stat = await fs.promises.stat(filePath);
      const ext = path.extname(filePath).toLowerCase();
      const mimeMap: Record<string, string> = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.gif': 'image/gif',
        '.pdf': 'application/pdf',
      };

      return {
        stream: fs.createReadStream(filePath),
        contentType: mimeMap[ext] || 'application/octet-stream',
        contentLength: stat.size,
      };
    }

    const client = this.getClient();
    const bucket = config.storage.bucketName || 'clinic-uploads-bucket';
    const command = new GetObjectCommand({
      Bucket: bucket,
      Key: fileKey,
    });
    const res = await client.send(command);
    return {
      stream: res.Body,
      contentType: res.ContentType || 'application/octet-stream',
      contentLength: res.ContentLength,
    };
  }

  /**
   * Deletes a file from local disk (or S3)
   */
  static async deleteFile(fileKey: string): Promise<void> {
    if (config.storage.driver !== 's3' || !config.storage.accessKeyId) {
      const baseDir = this.getBaseUploadDir();
      const filePath = path.join(baseDir, fileKey);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
      }
      return;
    }

    const client = this.getClient();
    const bucket = config.storage.bucketName || 'clinic-uploads-bucket';

    const command = new DeleteObjectCommand({
      Bucket: bucket,
      Key: fileKey,
    });

    await client.send(command);
  }
}
