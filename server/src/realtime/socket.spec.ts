import http from 'http';
import { io as Client, Socket as ClientSocket } from 'socket.io-client';
import app from '../app';
import { RealtimeService } from './socket.server';
import { TicketStore } from './ticket-store';

describe('Real-Time Socket.IO Server Integration Tests (Phase 5.2)', () => {
  let server: http.Server;
  let serverPort: number;

  beforeAll((done) => {
    server = http.createServer(app);
    RealtimeService.initialize(server);
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address() as any;
      serverPort = addr.port;
      done();
    });
  });

  afterAll((done) => {
    const io = RealtimeService.getIO();
    if (io) {
      io.close();
    }
    server.close(done);
  });

  it('1. Should reject connection without credentials', (done) => {
    const socket: ClientSocket = Client(`http://127.0.0.1:${serverPort}`, {
      transports: ['websocket'],
      autoConnect: true,
    });

    socket.on('connect_error', (err) => {
      expect(err.message).toContain('Authentication failed');
      socket.disconnect();
      done();
    });
  });

  it('2. Should accept connection with valid one-time ticket and consume it single-use', (done) => {
    const ticket = TicketStore.createTicket({
      id: 'doctor-uuid-123',
      role: 'DOCTOR',
      name: 'Dr. Test Doctor',
    });

    const socket: ClientSocket = Client(`http://127.0.0.1:${serverPort}`, {
      auth: { ticket },
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      expect(socket.connected).toBe(true);

      // Verify single-use consumption: ticket cannot be reused
      const secondConsume = TicketStore.consumeTicket(ticket);
      expect(secondConsume).toBeNull();

      socket.disconnect();
      done();
    });
  });

  it('3. Should receive queue:updated event across room', (done) => {
    const ticket = TicketStore.createTicket({
      id: 'reception-uuid-456',
      role: 'RECEPTION',
      name: 'Receptionist Test',
    });

    const socket: ClientSocket = Client(`http://127.0.0.1:${serverPort}`, {
      auth: { ticket },
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      // Listen for event
      socket.on('queue:updated', (payload) => {
        expect(payload).toHaveProperty('clinicDate', '2026-11-09');
        expect(payload).toHaveProperty('doctorId', 'doc-1');
        socket.disconnect();
        done();
      });

      // Server emits
      RealtimeService.emitQueueUpdate({
        clinicDate: '2026-11-09',
        doctorId: 'doc-1',
      });
    });
  });

  it('4. Should receive doctor:status_changed in clinic:global room', (done) => {
    const ticket = TicketStore.createTicket({
      id: 'doc-uuid-789',
      role: 'DOCTOR',
      name: 'Dr. Ahmed',
    });

    const socket: ClientSocket = Client(`http://127.0.0.1:${serverPort}`, {
      auth: { ticket },
      transports: ['websocket'],
    });

    socket.on('connect', () => {
      socket.on('doctor:status_changed', (payload) => {
        expect(payload).toHaveProperty('doctorId', 'doc-uuid-789');
        expect(payload).toHaveProperty('status', 'WITH_PATIENT');
        socket.disconnect();
        done();
      });

      RealtimeService.emitDoctorStatusChanged({
        doctorId: 'doc-uuid-789',
        status: 'WITH_PATIENT',
      });
    });
  });
});

