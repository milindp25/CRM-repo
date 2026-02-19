'use client';

import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react';

type ToastType = 'success' | 'error' | 'warning' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  success: (title: string, message?: string) => void;
  error: (title: string, message?: string) => void;
  warning: (title: string, message?: string) => void;
  info: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

const toastConfig: Record<ToastType, { icon: typeof CheckCircle; bg: string; border: string; iconColor: string; progressColor: string }> = {
  success: { icon: CheckCircle, bg: 'bg-white', border: 'border-l-4 border-l-emerald-500', iconColor: 'text-emerald-500', progressColor: 'bg-emerald-500' },
  error:   { icon: XCircle,     bg: 'bg-white', border: 'border-l-4 border-l-red-500',     iconColor: 'text-red-500',     progressColor: 'bg-red-500' },
  warning: { icon: AlertTriangle, bg: 'bg-white', border: 'border-l-4 border-l-amber-500',   iconColor: 'text-amber-500',   progressColor: 'bg-amber-500' },
  info:    { icon: Info,         bg: 'bg-white', border: 'border-l-4 border-l-blue-500',    iconColor: 'text-blue-500',    progressColor: 'bg-blue-500' },
};

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();
  const duration = toast.duration || 4000;
  const config = toastConfig[toast.type];
  const Icon = config.icon;

  // Entrance animation
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  // Auto-dismiss timer
  useEffect(() => {
    timerRef.current = setTimeout(() => {
      handleDismiss();
    }, duration);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [duration]);

  const handleDismiss = () => {
    if (isExiting) return;
    setIsExiting(true);
    setIsVisible(false);
    setTimeout(() => onRemove(toast.id), 300);
  };

  return (
    <div
      className={`relative flex items-start gap-3 p-4 rounded-lg shadow-lg ring-1 ring-black/5 max-w-sm w-full cursor-pointer overflow-hidden transition-all duration-300 ease-out ${config.bg} ${config.border} ${
        isVisible && !isExiting
          ? 'opacity-100 translate-x-0 scale-100'
          : 'opacity-0 translate-x-8 scale-95'
      }`}
      onClick={handleDismiss}
      role="alert"
    >
      <div className={`flex-shrink-0 mt-0.5 ${config.iconColor}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0 pr-2">
        <p className="text-sm font-semibold text-gray-900">{toast.title}</p>
        {toast.message && (
          <p className="mt-0.5 text-sm text-gray-500 leading-relaxed">{toast.message}</p>
        )}
      </div>
      <button
        onClick={(e) => { e.stopPropagation(); handleDismiss(); }}
        className="flex-shrink-0 p-0.5 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gray-100">
        <div
          className={`h-full ${config.progressColor} transition-none`}
          style={{
            animation: `toast-progress ${duration}ms linear forwards`,
          }}
        />
      </div>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setToasts((prev) => [...prev.slice(-4), { ...toast, id }]);
  }, []);

  const success = useCallback((title: string, message?: string) => {
    addToast({ type: 'success', title, message });
  }, [addToast]);

  const error = useCallback((title: string, message?: string) => {
    addToast({ type: 'error', title, message, duration: 6000 });
  }, [addToast]);

  const warning = useCallback((title: string, message?: string) => {
    addToast({ type: 'warning', title, message, duration: 5000 });
  }, [addToast]);

  const info = useCallback((title: string, message?: string) => {
    addToast({ type: 'info', title, message });
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, success, error, warning, info }}>
      {children}
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-3 pointer-events-none" aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onRemove={removeToast} />
          </div>
        ))}
      </div>
      {/* Progress bar animation */}
      <style jsx global>{`
        @keyframes toast-progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
