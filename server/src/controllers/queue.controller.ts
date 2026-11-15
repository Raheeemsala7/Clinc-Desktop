import { Request, Response } from 'express';
import { QueueService } from '../services/queue.service';
import { RealtimeService } from '../realtime/socket.server';
import { asyncHandler } from '../middleware/asyncHandler';
import { sendSuccess } from '../utils/response';

export class QueueController {
  getTodayQueue = asyncHandler(async (req: Request, res: Response) => {
    const rawDoctorId = req.query.doctorId as string;
    const includeCompleted = req.query.includeCompleted === 'true';
    const isDoctor = req.user?.role === 'DOCTOR';
    const doctorId = (rawDoctorId && rawDoctorId !== 'all') ? rawDoctorId : (isDoctor ? req.user!.id : undefined);

    const queue = await QueueService.getTodayQueue(doctorId, includeCompleted);
    sendSuccess(res, queue);
  });

  getDoctorStatus = asyncHandler(async (req: Request, res: Response) => {
    const doctorId =
      (req.query.doctorId as string) ||
      (req.user?.role === 'DOCTOR' ? req.user.id : undefined);
    const status = await QueueService.getDoctorStatus(doctorId);
    sendSuccess(res, status);
  });

  setDoctorStatus = asyncHandler(async (req: Request, res: Response) => {
    const doctorId = req.user!.id;
    const status = await QueueService.setDoctorStatus(doctorId, req.body.status);
    RealtimeService.emitDoctorStatusChanged({
      doctorId,
      status: (status as any).status || req.body.status,
    });
    sendSuccess(res, status, { message: 'Doctor status updated successfully' });
  });
}

export const queueController = new QueueController();
