import crypto from 'crypto';

export interface SocketTicketEntry {
  userId: string;
  role: 'ADMIN' | 'DOCTOR' | 'RECEPTION';
  name: string;
  expiresAt: number;
}

export class TicketStore {
  private static tickets = new Map<string, SocketTicketEntry>();
  private static cleanupInterval: NodeJS.Timeout | null = null;

  private static startCleanup() {
    if (!this.cleanupInterval) {
      this.cleanupInterval = setInterval(() => {
        const now = Date.now();
        for (const [key, value] of this.tickets.entries()) {
          if (value.expiresAt < now) {
            this.tickets.delete(key);
          }
        }
      }, 30000);
      // Unref interval so it doesn't prevent Node process exit
      this.cleanupInterval.unref();
    }
  }

  static createTicket(user: { id: string; role: 'ADMIN' | 'DOCTOR' | 'RECEPTION'; name: string }): string {
    this.startCleanup();
    const ticket = crypto.randomBytes(32).toString('hex');
    this.tickets.set(ticket, {
      userId: user.id,
      role: user.role,
      name: user.name,
      expiresAt: Date.now() + 30000, // 30 seconds TTL
    });
    return ticket;
  }

  static consumeTicket(ticket: string): SocketTicketEntry | null {
    if (!ticket) return null;
    const entry = this.tickets.get(ticket);
    if (!entry) return null;

    // Single-use: delete immediately
    this.tickets.delete(ticket);

    if (entry.expiresAt < Date.now()) {
      return null;
    }

    return entry;
  }
}

