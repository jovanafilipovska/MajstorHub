import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { HttpTransportType, HubConnectionBuilder, LogLevel } from '@microsoft/signalr';
import type { HubConnection } from '@microsoft/signalr';
import { API_ORIGIN } from '../api/client';
import { getConversations } from '../api/messages';
import { useAuth } from './AuthContext';
import type { MessageResponse } from '../types/api';

interface ChatContextValue {
  connection: HubConnection | null;
  unreadByBooking: Record<string, number>;
  totalUnread: number;
  refreshUnread: () => Promise<void>;
  clearUnread: (bookingId: string) => void;
  subscribe: (handler: (message: MessageResponse) => void) => () => void;
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { token, user } = useAuth();
  const [connection, setConnection] = useState<HubConnection | null>(null);
  const [unreadByBooking, setUnreadByBooking] = useState<Record<string, number>>({});
  const listenersRef = useRef(new Set<(message: MessageResponse) => void>());

  const refreshUnread = useCallback(async () => {
    if (!token) return;
    const conversations = await getConversations(token);
    const next: Record<string, number> = {};
    for (const c of conversations) next[c.bookingId] = c.unreadCount;
    setUnreadByBooking(next);
  }, [token]);

  useEffect(() => {
    if (!token || !user || !API_ORIGIN) {
      setConnection((prev) => {
        prev?.stop();
        return null;
      });
      setUnreadByBooking({});
      return;
    }

    const hub = new HubConnectionBuilder()
      .withUrl(`${API_ORIGIN}/hubs/chat`, {
        accessTokenFactory: () => token,
        transport: HttpTransportType.WebSockets,
        skipNegotiation: true,
      })
      .withAutomaticReconnect()
      .configureLogging(LogLevel.Warning)
      .build();

    hub.on('ReceiveMessage', (message: MessageResponse) => {
      listenersRef.current.forEach((fn) => fn(message));
      if (message.senderId !== user.id) {
        setUnreadByBooking((prev) => ({ ...prev, [message.bookingId]: (prev[message.bookingId] ?? 0) + 1 }));
      }
    });

    hub
      .start()
      .then(() => refreshUnread())
      .catch(() => {
        // Automatic reconnect covers transient drops; a failed initial
        // connect just leaves the badge stale until the next refresh.
      });
    setConnection(hub);

    return () => {
      hub.stop();
    };
  }, [token, user, refreshUnread]);

  const clearUnread = useCallback((bookingId: string) => {
    setUnreadByBooking((prev) => ({ ...prev, [bookingId]: 0 }));
  }, []);

  const subscribe = useCallback((handler: (message: MessageResponse) => void) => {
    listenersRef.current.add(handler);
    return () => {
      listenersRef.current.delete(handler);
    };
  }, []);

  const totalUnread = useMemo(
    () => Object.values(unreadByBooking).reduce((sum, n) => sum + n, 0),
    [unreadByBooking],
  );

  const value = useMemo<ChatContextValue>(
    () => ({ connection, unreadByBooking, totalUnread, refreshUnread, clearUnread, subscribe }),
    [connection, unreadByBooking, totalUnread, refreshUnread, clearUnread, subscribe],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat(): ChatContextValue {
  const context = useContext(ChatContext);
  if (!context) throw new Error('useChat must be used within a ChatProvider');
  return context;
}