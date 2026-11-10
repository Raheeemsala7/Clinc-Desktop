'use client';

import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';

export type RealtimeStatus = 'connected' | 'connecting' | 'disconnected';

export function useClinicRealtime() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<RealtimeStatus>('connecting');
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    let active = true;

    async function initSocket() {
      try {
        // 1. Fetch one-time authentication ticket
        const ticketRes = await fetch('/api/realtime/ticket', { method: 'POST' });
        if (!ticketRes.ok) {
          setStatus('disconnected');
          return;
        }

        const ticketData = await ticketRes.json();
        const ticket = ticketData.payload?.ticket;

        if (!active) return;

        const socketUrl =
          process.env.NEXT_PUBLIC_SOCKET_URL ||
          (typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.hostname}:4000` : 'http://127.0.0.1:4000');

        const socket = io(socketUrl, {
          auth: { ticket },
          transports: ['websocket', 'polling'],
          reconnection: true,
          reconnectionAttempts: Infinity,
          reconnectionDelay: 1000,
          reconnectionDelayMax: 5000,
        });

        socketRef.current = socket;

        socket.on('connect', () => {
          if (active) setStatus('connected');
        });

        socket.on('disconnect', () => {
          if (active) setStatus('connecting');
        });

        socket.on('connect_error', () => {
          if (active) setStatus('disconnected');
        });

        // 2. Real-Time Event Handlers
        socket.on('queue:updated', () => {
          queryClient.invalidateQueries({ queryKey: ['queue'] });
          queryClient.invalidateQueries({ queryKey: ['appointments'] });
        });

        socket.on('queue:next_patient', (payload: any) => {
          queryClient.invalidateQueries({ queryKey: ['queue'] });
          queryClient.invalidateQueries({ queryKey: ['appointments'] });
          if (payload?.patientName) {
            toast.info(`المريض التالي: ${payload.patientName} (رقم ${payload.queueNumber})`, {
              duration: 5000,
            });
          }
        });

        socket.on('appointment:created', () => {
          queryClient.invalidateQueries({ queryKey: ['queue'] });
          queryClient.invalidateQueries({ queryKey: ['appointments'] });
        });

        socket.on('appointment:status_changed', () => {
          queryClient.invalidateQueries({ queryKey: ['queue'] });
          queryClient.invalidateQueries({ queryKey: ['appointments'] });
        });

        socket.on('doctor:status_changed', () => {
          queryClient.invalidateQueries({ queryKey: ['doctor-status'] });
          queryClient.invalidateQueries({ queryKey: ['doctors'] });
        });

        socket.on('examination:completed', () => {
          queryClient.invalidateQueries({ queryKey: ['queue'] });
          queryClient.invalidateQueries({ queryKey: ['appointments'] });
        });

        socket.on('payment:recorded', () => {
          queryClient.invalidateQueries({ queryKey: ['queue'] });
          queryClient.invalidateQueries({ queryKey: ['payments'] });
          queryClient.invalidateQueries({ queryKey: ['appointments'] });
        });
      } catch (err) {
        if (active) setStatus('disconnected');
      }
    }

    initSocket();

    return () => {
      active = false;
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    };
  }, [queryClient]);

  return { status };
}

