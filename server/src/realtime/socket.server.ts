import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { TicketStore } from './ticket-store';
import { config } from '../config/env';

export interface SocketUser {
  id: string;
  role: 'ADMIN' | 'DOCTOR' | 'RECEPTION';
  name: string;
}

export class RealtimeService {
  private static io: SocketIOServer | null = null;

  static initialize(httpServer: HttpServer): SocketIOServer {
    if (this.io) {
      return this.io;
    }

    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: (origin, callback) => {
          // Permissive CORS on local LAN for desktop workstations
          callback(null, true);
        },
        credentials: true,
      },
      pingInterval: 10000,
      pingTimeout: 5000,
      transports: ['websocket', 'polling'],
    });

    // Authentication middleware
    this.io.use((socket: Socket, next) => {
      try {
        const ticket = socket.handshake.auth?.ticket || socket.handshake.query?.ticket;
        const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');

        // 1. Authenticate via one-time ticket (Preferred)
        if (ticket && typeof ticket === 'string') {
          const entry = TicketStore.consumeTicket(ticket);
          if (entry) {
            (socket as any).user = {
              id: entry.userId,
              role: entry.role,
              name: entry.name,
            };
            return next();
          }
        }

        // 2. Fallback: Authenticate via JWT access token
        if (token && typeof token === 'string') {
          const secret = config.jwt.accessSecret;
          const payload = jwt.verify(token, secret) as any;
          if (payload && payload.sub) {
            (socket as any).user = {
              id: payload.sub,
              role: payload.role || 'RECEPTION',
              name: payload.name || payload.username || 'User',
            };
            return next();
          }
        }

        console.warn('⚠️ [SOCKET] Connection rejected: Invalid or expired authentication credentials');
        return next(new Error('Authentication failed: Invalid or expired ticket/token'));
      } catch (err: any) {
        console.warn('⚠️ [SOCKET] Auth error:', err?.message || err);
        return next(new Error('Authentication error'));
      }
    });

    this.io.on('connection', (socket: Socket) => {
      const user: SocketUser = (socket as any).user;
      console.log(`🔌 [SOCKET] Client connected: ${socket.id} (User: ${user.name}, Role: ${user.role})`);

      // Join standard rooms based on role
      socket.join('clinic:global');
      socket.join('clinic:queue');
      socket.join(`user:${user.id}`);

      if (user.role === 'ADMIN' || user.role === 'DOCTOR') {
        socket.join('clinic:medical');
      }

      if (user.role === 'ADMIN' || user.role === 'RECEPTION') {
        socket.join('clinic:finance');
      }

      socket.on('disconnect', (reason) => {
        console.log(`👋 [SOCKET] Client disconnected: ${socket.id} (Reason: ${reason})`);
      });
    });

    console.log('⚡ [SOCKET] Socket.IO Server initialized successfully');
    return this.io;
  }

  static getIO(): SocketIOServer | null {
    return this.io;
  }

  // ─── Dispatch Methods ────────────────────────────────────────────────────────

  static emitQueueUpdate(payload: {
    clinicDate?: string;
    doctorId?: string;
    appointmentId?: string;
    action?: string;
  }) {
    if (!this.io) return;
    this.io.emit('queue:updated', {
      ...payload,
      timestamp: new Date().toISOString(),
    });
  }

  static emitNextPatient(payload: {
    appointmentId: string;
    patientId: string;
    patientName: string;
    queueNumber: number;
    doctorId: string;
  }) {
    if (!this.io) return;
    this.io.emit('queue:next_patient', {
      ...payload,
      timestamp: new Date().toISOString(),
    });
  }

  static emitAppointmentCreated(payload: {
    appointmentId: string;
    patientId: string;
    patientName: string;
    clinicDate: string;
    doctorId: string;
    queueNumber: number;
  }) {
    if (!this.io) return;
    this.io.emit('appointment:created', {
      ...payload,
      timestamp: new Date().toISOString(),
    });
    // Invalidate queue board
    this.emitQueueUpdate({ clinicDate: payload.clinicDate, doctorId: payload.doctorId, appointmentId: payload.appointmentId });
  }

  static emitAppointmentStatusChanged(payload: {
    appointmentId: string;
    patientId: string;
    status: string;
    clinicDate: string;
    doctorId: string;
  }) {
    if (!this.io) return;
    this.io.emit('appointment:status_changed', {
      ...payload,
      timestamp: new Date().toISOString(),
    });
    this.emitQueueUpdate({ clinicDate: payload.clinicDate, doctorId: payload.doctorId, appointmentId: payload.appointmentId });
  }

  static emitAppointmentUpdated(payload: {
    appointmentId: string;
    patientId?: string;
    doctorId?: string;
    clinicDate?: string;
    type?: string;
    status?: string;
  }) {
    if (!this.io) return;
    this.io.emit('appointment:updated', {
      ...payload,
      timestamp: new Date().toISOString(),
    });
    this.emitQueueUpdate({ clinicDate: payload.clinicDate, doctorId: payload.doctorId, appointmentId: payload.appointmentId });
  }

  static emitDoctorStatusChanged(payload: {
    doctorId: string;
    status: 'AVAILABLE' | 'WITH_PATIENT' | 'BREAK';
  }) {
    if (!this.io) return;
    this.io.to('clinic:global').emit('doctor:status_changed', {
      ...payload,
      timestamp: new Date().toISOString(),
    });
  }

  static emitChatMessage(payload: any) {
    if (!this.io) return;
    this.io.to('clinic:global').emit('chat:message', {
      ...payload,
      timestamp: new Date().toISOString(),
    });
  }

  static emitExaminationCompleted(payload: {
    visitId: string;
    appointmentId: string;
    patientId: string;
    doctorId: string;
  }) {
    if (!this.io) return;
    this.io.to('clinic:medical').emit('examination:completed', {
      ...payload,
      timestamp: new Date().toISOString(),
    });
    // Signal queue update so reception can proceed to checkout
    this.emitQueueUpdate({ appointmentId: payload.appointmentId, doctorId: payload.doctorId });
  }

  static emitPatientUpdated(payload: {
    patientId: string;
    fileNumber?: string;
    code?: string;
    fullName?: string;
  }) {
    if (!this.io) return;
    this.io.emit('patient:updated', {
      ...payload,
      timestamp: new Date().toISOString(),
    });
    this.emitQueueUpdate({});
  }

  static emitPaymentRecorded(payload: {
    paymentId: string;
    appointmentId: string;
    patientId: string;
    amount: number;
  }) {
    if (!this.io) return;
    this.io.to('clinic:finance').emit('payment:recorded', {
      ...payload,
      timestamp: new Date().toISOString(),
    });
    this.emitQueueUpdate({ appointmentId: payload.appointmentId });
  }
}

export const realtimeService = RealtimeService;

