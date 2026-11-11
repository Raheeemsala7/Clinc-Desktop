import { Request, Response } from 'express';
import { AppointmentsService } from '../services/appointments.service';
import { RealtimeService } from '../realtime/socket.server';
import { asyncHandler } from '../middleware/asyncHandler';
import { sendSuccess, sendPaginated } from '../utils/response';

export class AppointmentsController {
  createAppointment = asyncHandler(async (req: Request, res: Response) => {
    const ip = req.ip || req.socket.remoteAddress || '';
    const result = await AppointmentsService.createAppointment(
      req.body,
      { id: req.user!.id },
      ip,
    );
    RealtimeService.emitAppointmentCreated({
      appointmentId: result.id,
      patientId: result.patientId,
      patientName: (result as any).patientName || '',
      clinicDate: result.clinicDate,
      doctorId: result.doctorId,
      queueNumber: result.queueNumber,
    });
    sendSuccess(res, result, { code: 201, message: 'Appointment created successfully' });
  });

  updateAppointment = asyncHandler(async (req: Request, res: Response) => {
    const ip = req.ip || req.socket.remoteAddress || '';
    const result = await AppointmentsService.updateAppointment(
      req.params.id,
      req.body,
      { id: req.user!.id },
      ip,
    );
    RealtimeService.emitAppointmentUpdated({
      appointmentId: req.params.id,
      patientId: result.patientId,
      doctorId: result.doctorId,
      clinicDate: result.clinicDate,
      type: result.type,
      status: result.status,
    });
    sendSuccess(res, result, { message: 'Appointment updated successfully' });
  });

  deleteAppointment = asyncHandler(async (req: Request, res: Response) => {
    const ip = req.ip || req.socket.remoteAddress || '';
    const result = await AppointmentsService.deleteAppointment(
      req.params.id,
      req.user!.id,
      ip,
    );
    RealtimeService.emitQueueUpdate({ appointmentId: req.params.id });
    sendSuccess(res, result, { message: 'Appointment deleted successfully' });
  });

  listAppointments = asyncHandler(async (req: Request, res: Response) => {
    const query = { ...req.query };
    if (req.user?.role === 'DOCTOR') {
      query.doctorId = req.user.id;
    }
    const result = await AppointmentsService.listAppointments(query);
    sendPaginated(res, result);
  });

  getCalendar = asyncHandler(async (req: Request, res: Response) => {
    const result = await AppointmentsService.getCalendarView(req.query, req.user);
    sendSuccess(res, result);
  });

  getAppointmentById = asyncHandler(async (req: Request, res: Response) => {
    const result = await AppointmentsService.getAppointmentById(req.params.id);
    sendSuccess(res, result);
  });

  transition = (action: 'arrive' | 'start' | 'finish-exam' | 'checkout' | 'complete' | 'cancel' | 'no-show' | 'postpone') =>
    asyncHandler(async (req: Request, res: Response) => {
      const ip = req.ip || req.socket.remoteAddress || '';
      const result = await AppointmentsService.transition(
        req.params.id,
        action,
        { id: req.user!.id, role: req.user!.role },
        ip,
      );
      RealtimeService.emitAppointmentStatusChanged({
        appointmentId: result.id,
        patientId: result.patientId,
        status: result.status,
        clinicDate: result.clinicDate,
        doctorId: result.doctorId,
      });
      sendSuccess(res, result, { message: `Appointment transitioned to ${action}` });
    });

  checkout = asyncHandler(async (req: Request, res: Response) => {
    const ip = req.ip || req.socket.remoteAddress || '';
    const result = await AppointmentsService.checkout(
      req.params.id,
      req.body,
      { id: req.user!.id },
      ip,
    );
    RealtimeService.emitAppointmentStatusChanged({
      appointmentId: result.id,
      patientId: result.patientId,
      status: result.status,
      clinicDate: result.clinicDate,
      doctorId: result.doctorId,
    });
    sendSuccess(res, result, { message: 'Appointment checked out successfully' });
  });

  payRemaining = asyncHandler(async (req: Request, res: Response) => {
    const ip = req.ip || req.socket.remoteAddress || '';
    const result = await AppointmentsService.payRemaining(
      req.params.id,
      req.body,
      { id: req.user!.id },
      ip,
    );
    RealtimeService.emitQueueUpdate({ appointmentId: req.params.id });
    sendSuccess(res, result, { message: 'Remaining balance paid successfully' });
  });
}

export const appointmentsController = new AppointmentsController();
