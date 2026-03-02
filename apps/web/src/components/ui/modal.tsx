'use client';

import * as React from 'react';
import { cn } from '@/lib/cn';
import { X } from 'lucide-react';
import { useFocusTrap } from '@/hooks/use-focus-trap';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  className?: string;
  /** Prevent closing by clicking overlay */
  persistent?: boolean;
  /** Max width of modal */
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  /** ID of the element that labels this dialog (for aria-labelledby) */
  ariaLabelledBy?: string;
}

const sizeMap = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
  full: 'max-w-[calc(100vw-2rem)]',
};

export function Modal({ open, onClose, children, className, persistent = false, size = 'md', ariaLabelledBy }: ModalProps) {
  const modalRef = React.useRef<HTMLDivElement>(null);
  const autoLabelId = React.useId();
  const labelledBy = ariaLabelledBy || autoLabelId;
  useFocusTrap(modalRef, open);

  // Handle escape key
  React.useEffect(() => {
    if (!open) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !persistent) onClose();
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [open, onClose, persistent]);

  // Prevent body scroll when modal is open
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in-0 duration-200"
        onClick={persistent ? undefined : onClose}
        aria-hidden="true"
      />
      {/* Modal content */}
      <div
        ref={modalRef}
        className={cn(
          'relative z-50 w-full mx-4',
          sizeMap[size],
          'bg-card text-card-foreground rounded-xl border shadow-xl',
          'animate-in fade-in-0 zoom-in-95 duration-200',
          'max-h-[calc(100vh-2rem)] flex flex-col',
          className,
        )}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
      >
        {children}
      </div>
    </div>
  );
}

/* ─────────────── Sub-components ─────────────── */

export interface ModalHeaderProps {
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
  /** ID for the heading element (used by aria-labelledby) */
  id?: string;
}

export function ModalHeader({ children, onClose, className, id }: ModalHeaderProps) {
  return (
    <div className={cn('flex items-center justify-between px-6 py-4 border-b', className)}>
      <div id={id} className="font-semibold text-lg text-foreground">{children}</div>
      {onClose && (
        <div className="flex items-center gap-2">
          <kbd className="hidden sm:inline-block text-[10px] font-mono text-muted-foreground/60 bg-muted px-1.5 py-0.5 rounded border border-border">Esc</kbd>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
    </div>
  );
}

export interface ModalBodyProps {
  children: React.ReactNode;
  className?: string;
}

export function ModalBody({ children, className }: ModalBodyProps) {
  return (
    <div className={cn('px-6 py-4 overflow-y-auto flex-1', className)}>
      {children}
    </div>
  );
}

export interface ModalFooterProps {
  children: React.ReactNode;
  className?: string;
}

export function ModalFooter({ children, className }: ModalFooterProps) {
  return (
    <div className={cn('flex items-center justify-end gap-2 px-6 py-4 border-t', className)}>
      {children}
    </div>
  );
}
