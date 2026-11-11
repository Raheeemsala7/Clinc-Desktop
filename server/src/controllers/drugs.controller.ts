import { Request, Response } from 'express';
import { DrugsService } from '../services/drugs.service';
import { asyncHandler } from '../middleware/asyncHandler';
import { sendSuccess } from '../utils/response';

export class DrugsController {
  searchDrugs = asyncHandler(async (req: Request, res: Response) => {
    const q = (req.query.q as string) || '';
    const drugs = await DrugsService.searchDrugs(q);
    sendSuccess(res, drugs);
  });

  deleteDrug = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    await DrugsService.deleteDrug(id);
    sendSuccess(res, { success: true, message: 'تم حذف الدواء من الاقتراحات بنجاح' });
  });

  saveDrug = asyncHandler(async (req: Request, res: Response) => {
    const result = await DrugsService.saveDrug(req.body);
    sendSuccess(res, result, { message: 'تم حفظ الدواء في الاقتراحات بنجاح' });
  });
}

export const drugsController = new DrugsController();
