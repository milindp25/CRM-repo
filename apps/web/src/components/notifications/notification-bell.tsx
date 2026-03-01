'use client';

import { useState, useRef, useEffect } from 'react';
import { useNotifications } from '@/hooks/use-notifications';
import { useRouter } from 'next/navigation';
import type { Notification } from '@/lib/api-client';

function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

function getNotificationIcon(type: string): string {
  const iconMap: Record<string, string> = {
    LEAVE_APPROVED: 'text-green-500',
    LEAVE_REJECTED: 'text-red-500',
    LEAVE_APPLIED: 'text-blue-500',
    LEAVE_CANCELLED: 'text-muted-foreground',
    ATTENDANCE_MARKED: 'text-indigo-500',
    PAYROLL_PROCESSED: 'text-emerald-500',
    PAYROLL_PAID: 'text-green-600',
    INVITATION_RECEIVED: 'text-purple-500',
    INVITATION_ACCEPTED: 'text-green-500',
    DOCUMENT_UPLOADED: 'text-amber-500',
    WELCOME: 'text-primary',
    SYSTEM: 'text-muted-foreground',
  };
  return iconMap[type] || 'text-muted-foreground';
}

function NotificationItem({
  notification,
  onRead,
  onClick,
}: {
  notification: Notification;
  onRead: (id: string) => void;
  onClick: (n: Notification) => void;
}) {
  return (
    <button
      onClick={() => {
        if (!notification.isRead) onRead(notification.id);
        onClick(notification);
      }}
      className={`w-full text-left px-4 py-3 hover:bg-muted transition-colors border-b border-border last:border-0 ${
        !notification.isRead ? 'bg-primary/5' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${
          notification.isRead ? 'bg-transparent' : 'bg-primary'
        }`} />
        <div className="flex-1 min-w-0">
          <p className={`text-sm ${notification.isRead ? 'text-muted-foreground' : 'text-foreground font-medium'}`}>
            {notification.title}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
            {notification.message}
          </p>
          <p className={`text-xs mt-1 ${getNotificationIcon(notification.type)}`}>
            {timeAgo(notification.createdAt)}
          </p>
        </div>
      </div>
    </button>
  );
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const {
    notifications,
    unreadCount,
    loading,
    hasMore,
    loadMore,
    markAsRead,
    markAllAsRead,
    refresh,
  } = useNotifications();

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    if (!isOpen) {
      refresh();
    }
    setIsOpen(!isOpen);
  };

  const handleNotificationClick = (n: Notification) => {
    setIsOpen(false);
    if (n.actionUrl) {
      router.push(n.actionUrl);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={handleToggle}
        className="relative text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 rounded-lg p-2"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-card rounded-xl shadow-xl border border-border z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h3 className="text-sm font-semibold text-foreground">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-xs text-primary hover:text-primary/80 font-medium"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Notification List */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 && !loading ? (
              <div className="px-4 py-8 text-center">
                <svg className="w-12 h-12 mx-auto text-muted-foreground mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <p className="text-sm text-muted-foreground">No notifications yet</p>
              </div>
            ) : (
              <>
                {notifications.map((n) => (
                  <NotificationItem
                    key={n.id}
                    notification={n}
                    onRead={markAsRead}
                    onClick={handleNotificationClick}
                  />
                ))}
                {hasMore && (
                  <button
                    onClick={loadMore}
                    disabled={loading}
                    className="w-full px-4 py-2 text-xs text-primary hover:bg-muted font-medium disabled:opacity-50"
                  >
                    {loading ? 'Loading...' : 'Load more'}
                  </button>
                )}
              </>
            )}
            {loading && notifications.length === 0 && (
              <div className="px-4 py-8 text-center">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-muted-foreground mt-2">Loading...</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
