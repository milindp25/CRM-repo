'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { apiClient, type Notification } from '@/lib/api-client';

interface UseNotificationsResult {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useNotifications(): UseNotificationsResult {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const pollInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const result = await apiClient.getUnreadNotificationCount();
      setUnreadCount(result.count);
    } catch {
      // Silently fail - don't disrupt the UI for notification count
    }
  }, []);

  const fetchNotifications = useCallback(async (pageNum: number, append: boolean = false) => {
    setLoading(true);
    try {
      const result = await apiClient.getNotifications({ page: pageNum, limit: 20 });
      if (append) {
        setNotifications((prev) => [...prev, ...result.data]);
      } else {
        setNotifications(result.data);
      }
      setHasMore(result.meta.hasNextPage);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setPage(1);
    await Promise.all([fetchNotifications(1, false), fetchUnreadCount()]);
  }, [fetchNotifications, fetchUnreadCount]);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    const nextPage = page + 1;
    setPage(nextPage);
    await fetchNotifications(nextPage, true);
  }, [loading, hasMore, page, fetchNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await apiClient.markNotificationAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true, readAt: new Date().toISOString() } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // Silently fail
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await apiClient.markAllNotificationsAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() })),
      );
      setUnreadCount(0);
    } catch {
      // Silently fail
    }
  }, []);

  // Initial fetch + polling every 30s
  useEffect(() => {
    fetchNotifications(1, false);
    fetchUnreadCount();

    pollInterval.current = setInterval(fetchUnreadCount, 30000);

    return () => {
      if (pollInterval.current) {
        clearInterval(pollInterval.current);
      }
    };
  }, [fetchNotifications, fetchUnreadCount]);

  return {
    notifications,
    unreadCount,
    loading,
    hasMore,
    loadMore,
    markAsRead,
    markAllAsRead,
    refresh,
  };
}
