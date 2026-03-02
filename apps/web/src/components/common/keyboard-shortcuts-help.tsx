'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { X, Keyboard } from 'lucide-react';
import { SHORTCUT_DEFINITIONS } from '@/hooks/use-keyboard-shortcuts';
import { useFocusTrap } from '@/hooks/use-focus-trap';

export function KeyboardShortcutsHelp() {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useFocusTrap(dialogRef, open);

  const shortcuts = useMemo(() => {
    const groups: Record<string, { keys: string[]; description: string }[]> = {};
    for (const def of SHORTCUT_DEFINITIONS) {
      if (!groups[def.category]) groups[def.category] = [];
      groups[def.category].push({ keys: def.keys, description: def.description });
    }
    return Object.entries(groups).map(([category, items]) => ({ category, items }));
  }, []);

  useEffect(() => {
    const handler = () => setOpen(true);
    document.addEventListener('show-shortcuts-help', handler);
    return () => document.removeEventListener('show-shortcuts-help', handler);
  }, []);

  // Close on escape
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-50" onClick={() => setOpen(false)} aria-hidden="true" />

      {/* Modal */}
      <div
        ref={dialogRef}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="keyboard-shortcuts-heading"
      >
        <div className="bg-card rounded-xl border border-border shadow-2xl w-full max-w-md animate-scale-in overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2.5">
              <Keyboard className="w-5 h-5 text-primary" aria-hidden="true" />
              <h2 id="keyboard-shortcuts-heading" className="text-base font-semibold text-foreground">Keyboard Shortcuts</h2>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Close keyboard shortcuts help"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="px-5 py-4 max-h-80 overflow-y-auto space-y-5">
            {shortcuts.map((group) => (
              <div key={group.category}>
                <h3 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {group.category}
                </h3>
                <div className="space-y-1.5">
                  {group.items.map((item) => (
                    <div key={item.description} className="flex items-center justify-between py-1">
                      <span className="text-sm text-foreground">{item.description}</span>
                      <div className="flex items-center gap-1">
                        {item.keys.map((key, i) => (
                          <span key={i}>
                            {i > 0 && <span className="text-[10px] text-muted-foreground mx-0.5">then</span>}
                            <kbd className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded bg-muted border border-border text-xs font-mono text-muted-foreground">
                              {key}
                            </kbd>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="px-5 py-3 border-t border-border bg-muted/30">
            <p className="text-[10px] text-muted-foreground text-center">
              Shortcuts are disabled when typing in text fields
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
