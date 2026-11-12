import { Request, Response } from 'express';
import { DrugsService } from '../services/drugs.service';
import { asyncHandler } from '../middleware/asyncHandler';
import { sendSuccess } from '../utils/response';

export class DrugsController {
  searchDrugs = asyncHandler(async (req: Request, res: Response) => {
    const q = (req.query.q as string) || '';
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 100;
    const drugs = await DrugsService.searchDrugs(q, limit);
    sendSuccess(res, drugs);
  });

  deleteDrug = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await DrugsService.deleteDrug(id);
    sendSuccess(res, { success: true, message: 'تم حذف الدواء من القائمة بنجاح' });
  });

  saveDrug = asyncHandler(async (req: Request, res: Response) => {
    const result = await DrugsService.saveDrug(req.body);
    sendSuccess(res, result, { message: 'تم حفظ الدواء في القائمة بنجاح' });
  });

  updateDrug = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await DrugsService.updateDrug(id, req.body);
    sendSuccess(res, result, { message: 'تم تحديث بيانات الدواء بنجاح' });
  });

  getAnalytics = asyncHandler(async (req: Request, res: Response) => {
    const period = req.query.period as any;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;
    const stats = await DrugsService.getDrugAnalytics({ period, startDate, endDate });
    sendSuccess(res, stats);
  });
}

export const drugsController = new DrugsController();
