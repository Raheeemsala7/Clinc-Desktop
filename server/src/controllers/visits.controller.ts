import { Request, Response } from 'express';
import { VisitsService } from '../services/visits.service';
import { RealtimeService } from '../realtime/socket.server';
import { asyncHandler } from '../middleware/asyncHandler';
import { sendSuccess } from '../utils/response';

export class VisitsController {
  getVisitById = asyncHandler(async (req: Request, res: Response) => {
    const visit = await VisitsService.getVisitById(req.params.id, req.user!.id);
    sendSuccess(res, visit);
  });

  autosaveVisit = asyncHandler(async (req: Request, res: Response) => {
    const ip = req.ip || req.socket.remoteAddress || '';
    const result = await VisitsService.autosaveVisit(
      req.params.id,
      req.body,
      req.user!.id,
      ip,
    );
    sendSuccess(res, result, { message: 'Visit auto-saved successfully' });
  });

  closeVisit = asyncHandler(async (req: Request, res: Response) => {
    const ip = req.ip || req.socket.remoteAddress || '';
    const result = await VisitsService.closeVisit(req.params.id, req.user!.id, ip);
    RealtimeService.emitExaminationCompleted({
      visitId: result.id,
      appointmentId: result.appointmentId,
      patientId: result.patientId,
      doctorId: req.user!.id,
    });
    sendSuccess(res, result, { message: 'Visit closed successfully' });
  });

  reopenVisit = asyncHandler(async (req: Request, res: Response) => {
    const ip = req.ip || req.socket.remoteAddress || '';
    const result = await VisitsService.reopenVisit(req.params.id, req.user!.id, ip);
    sendSuccess(res, result, { message: 'Visit reopened successfully' });
  });

  addPrescription = asyncHandler(async (req: Request, res: Response) => {
    const ip = req.ip || req.socket.remoteAddress || '';
    const result = await VisitsService.addPrescription(
      req.params.visitId,
      req.body,
      req.user!.id,
      ip,
    );
    sendSuccess(res, result, { code: 201, message: 'Prescription added successfully' });
  });

  clinicalSearch = asyncHandler(async (req: Request, res: Response) => {
    const query = (req.query.q as string) || (req.query.query as string) || '';
    const results = await VisitsService.clinicalSearch(query, req.user!.id);
    sendSuccess(res, results);
  });
}

export const visitsController = new VisitsController();
