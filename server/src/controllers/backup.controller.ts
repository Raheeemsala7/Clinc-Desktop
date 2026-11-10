import { Request, Response } from 'express';
import { BackupService } from '../services/backup.service';
import { asyncHandler } from '../middleware/asyncHandler';
import { sendSuccess } from '../utils/response';

export class BackupController {
  createBackup = asyncHandler(async (req: Request, res: Response) => {
    const destination = req.body?.destination;
    const result = await BackupService.createBackup(destination);
    sendSuccess(res, result, { message: 'تم إنشاء النسخة الاحتياطية بنجاح' });
  });

  restoreBackup = asyncHandler(async (req: Request, res: Response) => {
    const archivePath = req.body?.archivePath;
    const result = await BackupService.restoreBackup(archivePath);
    sendSuccess(res, result, { message: 'تمت استعادة البيانات بنجاح' });
  });
}

export const backupController = new BackupController();

