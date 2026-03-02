'use client';

import * as React from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter } from './modal';
import { Loader2 } from 'lucide-react';

export interface ConfirmDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** 'destructive' renders a red confirm button */
  variant?: 'default' | 'destructive';
  /** Optional children rendered between description and footer (e.g. textarea) */
  children?: React.ReactNode;
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'default',
  children,
}: ConfirmDialogProps) {
  const [loading, setLoading] = React.useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    try {
      await onConfirm();
    } finally {
      setLoading(false);
    }
  };

  // Reset loading when dialog closes
  React.useEffect(() => {
    if (!open) setLoading(false);
  }, [open]);

  const confirmButtonClass =
    variant === 'destructive'
      ? 'inline-flex items-center gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90 h-9 px-4 rounded-lg text-sm font-medium transition-colors disabled:opacity-50'
      : 'inline-flex items-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 h-9 px-4 rounded-lg text-sm font-medium transition-colors disabled:opacity-50';

  return (
    <Modal open={open} onClose={onClose} size="sm">
      <ModalHeader onClose={onClose}>{title}</ModalHeader>
      <ModalBody>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
        {children}
      </ModalBody>
      <ModalFooter>
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="border border-input bg-background text-foreground hover:bg-muted h-9 px-4 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={handleConfirm}
          disabled={loading}
          className={confirmButtonClass}
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {confirmLabel}
        </button>
      </ModalFooter>
    </Modal>
  );
}
