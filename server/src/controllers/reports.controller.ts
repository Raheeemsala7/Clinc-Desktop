import { Request, Response } from 'express';
import { reportsService } from '../services/reports.service';
import { asyncHandler } from '../middleware/asyncHandler';
import { sendSuccess } from '../utils/response';

export class ReportsController {
  getSummary = asyncHandler(async (req: Request, res: Response) => {
    const result = await reportsService.getSummary(
      req.query.from as string,
      req.query.to as string,
    );
    sendSuccess(res, result);
  });

  getIncomeByDay = asyncHandler(async (req: Request, res: Response) => {
    const result = await reportsService.getIncomeByDay(
      req.query.from as string,
      req.query.to as string,
    );
    sendSuccess(res, result);
  });

  getExpensesByCategory = asyncHandler(async (req: Request, res: Response) => {
    const result = await reportsService.getExpensesByCategory(
      req.query.from as string,
      req.query.to as string,
    );
    sendSuccess(res, result);
  });

  getPaymentsByMethod = asyncHandler(async (req: Request, res: Response) => {
    const result = await reportsService.getPaymentsByMethod(
      req.query.from as string,
      req.query.to as string,
    );
    sendSuccess(res, result);
  });

  getDoctorRevenue = asyncHandler(async (req: Request, res: Response) => {
    let doctorId = (req.query.doctorId as string) || undefined;
    if (doctorId === 'ALL' || doctorId === '' || doctorId === 'undefined') {
      doctorId = undefined;
    }

    const from = req.query.from as string;
    const to = req.query.to as string;

    const result = await reportsService.getDoctorRevenue(from, to, doctorId);
    sendSuccess(res, result);
  });
}

export const reportsController = new ReportsController();
