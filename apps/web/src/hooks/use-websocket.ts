'use client';

/**
 * WebSocket Hook
 * Connects to the NestJS WebSocket gateway for real-time updates
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { getToken } from '@/lib/token-sync';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000';

interface UseWebSocketOptions {
  enabled?: boolean;
  onNotification?: (data: any) => void;
  onLeaveUpdate?: (data: any) => void;
  onAttendanceUpdate?: (data: any) => void;
  onExpenseUpdate?: (data: any) => void;
  onWorkflowUpdate?: (data: any) => void;
}

interface UseWebSocketReturn {
  connected: boolean;
  error: string | null;
}

export function useWebSocket(options: UseWebSocketOptions = {}): UseWebSocketReturn {
  const {
    enabled = true,
    onNotification,
    onLeaveUpdate,
    onAttendanceUpdate,
    onExpenseUpdate,
    onWorkflowUpdate,
  } = options;

  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    const token = getToken();
    if (!token || !enabled) return;

    // Don't create a new connection if one already exists
    if (socketRef.current?.connected) return;

    const socket = io(`${WS_URL}/ws`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: maxReconnectAttempts,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    socket.on('connect', () => {
      setConnected(true);
      setError(null);
      reconnectAttempts.current = 0;
    });

    socket.on('connected', (data: any) => {
      // Server acknowledgment
      console.log('[WS] Connected:', data.message);
    });

    socket.on('disconnect', (reason) => {
      setConnected(false);
      if (reason === 'io server disconnect') {
        // Server disconnected us — don't auto-reconnect
        setError('Disconnected by server');
      }
    });

    socket.on('connect_error', (err) => {
      reconnectAttempts.current++;
      if (reconnectAttempts.current >= maxReconnectAttempts) {
        setError('Unable to connect to real-time updates');
      }
    });

    socket.on('error', (data: any) => {
      setError(data.message || 'WebSocket error');
    });

    // Event listeners
    socket.on('notification:new', (data: any) => {
      onNotification?.(data);
    });

    socket.on('leave:applied', (data: any) => {
      onLeaveUpdate?.(data);
    });

    socket.on('leave:approved', (data: any) => {
      onLeaveUpdate?.(data);
    });

    socket.on('leave:rejected', (data: any) => {
      onLeaveUpdate?.(data);
    });

    socket.on('leave:updated', (data: any) => {
      onLeaveUpdate?.(data);
    });

    socket.on('attendance:marked', (data: any) => {
      onAttendanceUpdate?.(data);
    });

    socket.on('expense:submitted', (data: any) => {
      onExpenseUpdate?.(data);
    });

    socket.on('expense:approved', (data: any) => {
      onExpenseUpdate?.(data);
    });

    socket.on('expense:updated', (data: any) => {
      onExpenseUpdate?.(data);
    });

    socket.on('workflow:step_completed', (data: any) => {
      onWorkflowUpdate?.(data);
    });

    socket.on('workflow:updated', (data: any) => {
      onWorkflowUpdate?.(data);
    });

    socketRef.current = socket;
  }, [enabled, onNotification, onLeaveUpdate, onAttendanceUpdate, onExpenseUpdate, onWorkflowUpdate]);

  useEffect(() => {
    connect();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
        setConnected(false);
      }
    };
  }, [connect]);

  return { connected, error };
}
