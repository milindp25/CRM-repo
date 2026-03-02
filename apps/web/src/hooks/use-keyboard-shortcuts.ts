'use client';

import { useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';

interface Shortcut {
  keys: string[];
  description: string;
  category: string;
  action: () => void;
}

export interface ShortcutDefinition {
  keys: string[];
  description: string;
  category: 'Global' | 'Navigation';
}

export const SHORTCUT_DEFINITIONS: ShortcutDefinition[] = [
  { keys: ['Ctrl/\u2318', 'K'], description: 'Open command palette', category: 'Global' },
  { keys: ['?'], description: 'Show keyboard shortcuts', category: 'Global' },
  { keys: ['g', 'd'], description: 'Go to Dashboard', category: 'Navigation' },
  { keys: ['g', 'e'], description: 'Go to Employees', category: 'Navigation' },
  { keys: ['g', 'a'], description: 'Go to Attendance', category: 'Navigation' },
  { keys: ['g', 'l'], description: 'Go to Leave', category: 'Navigation' },
  { keys: ['g', 'p'], description: 'Go to Payroll', category: 'Navigation' },
  { keys: ['g', 's'], description: 'Go to Settings', category: 'Navigation' },
];

export function useKeyboardShortcuts() {
  const router = useRouter();
  const sequenceRef = useRef<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const shortcuts = useMemo<Shortcut[]>(() => [
    { keys: ['g', 'd'], description: 'Go to Dashboard', category: 'Navigation', action: () => router.push('/dashboard') },
    { keys: ['g', 'e'], description: 'Go to Employees', category: 'Navigation', action: () => router.push('/employees') },
    { keys: ['g', 'a'], description: 'Go to Attendance', category: 'Navigation', action: () => router.push('/attendance') },
    { keys: ['g', 'l'], description: 'Go to Leave', category: 'Navigation', action: () => router.push('/leave') },
    { keys: ['g', 'p'], description: 'Go to Payroll', category: 'Navigation', action: () => router.push('/payroll') },
    { keys: ['g', 's'], description: 'Go to Settings', category: 'Navigation', action: () => router.push('/settings') },
  ], [router]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    // Skip if user is typing in an input
    const target = e.target as HTMLElement;
    if (
      target.tagName === 'INPUT' ||
      target.tagName === 'TEXTAREA' ||
      target.tagName === 'SELECT' ||
      target.isContentEditable
    ) {
      return;
    }

    // Skip if modifier keys are pressed (except for Cmd+K which is handled by command palette)
    if (e.metaKey || e.ctrlKey || e.altKey) return;

    // ? key for shortcuts help
    if (e.key === '?') {
      e.preventDefault();
      document.dispatchEvent(new CustomEvent('show-shortcuts-help'));
      return;
    }

    // Add to sequence
    sequenceRef.current.push(e.key.toLowerCase());

    // Clear timer
    if (timerRef.current) clearTimeout(timerRef.current);

    // Check for matching shortcuts
    const seq = sequenceRef.current;
    for (const shortcut of shortcuts) {
      if (shortcut.keys.length === seq.length &&
          shortcut.keys.every((k, i) => k === seq[i])) {
        e.preventDefault();
        shortcut.action();
        sequenceRef.current = [];
        return;
      }
    }

    // Check if any shortcut starts with current sequence
    const hasPartialMatch = shortcuts.some((s) =>
      s.keys.length > seq.length &&
      s.keys.slice(0, seq.length).every((k, i) => k === seq[i])
    );

    if (hasPartialMatch) {
      // Wait for next key
      timerRef.current = setTimeout(() => {
        sequenceRef.current = [];
      }, 500);
    } else {
      // No match, reset
      sequenceRef.current = [];
    }
  }, [shortcuts]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [handleKeyDown]);

  return shortcuts;
}
