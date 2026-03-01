'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { navigation } from '@/lib/navigation';
import { usePermissions } from '@/hooks/use-permissions';
import { useFeatures } from '@/contexts/feature-context';
import { useFocusTrap } from '@/hooks/use-focus-trap';
import { useTheme } from 'next-themes';
import type { Permission } from '@hrplatform/shared';
import {
  Search, ArrowRight, Moon, Sun, LogOut, HelpCircle, Compass,
} from 'lucide-react';

interface CommandItem {
  id: string;
  label: string;
  description?: string;
  icon: any;
  category: 'Navigation' | 'Actions' | 'Settings';
  action: () => void;
  keywords?: string[];
}

export function CommandPalette() {
  const router = useRouter();
  const { hasAnyPermission } = usePermissions();
  const { hasFeature } = useFeatures();
  const { theme, setTheme } = useTheme();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useFocusTrap(dialogRef, open);

  // Build command items from navigation
  const commands = useMemo<CommandItem[]>(() => {
    const navCommands: CommandItem[] = navigation
      .filter((item) => {
        if (item.alwaysVisible) return true;
        if (item.requiredPermissions && item.requiredPermissions.length > 0) {
          if (!hasAnyPermission(item.requiredPermissions as Permission[])) return false;
        }
        if (item.requiredFeature) {
          if (!hasFeature(item.requiredFeature)) return false;
        }
        return true;
      })
      .map((item) => ({
        id: `nav-${item.href}`,
        label: item.name,
        description: `Go to ${item.name}`,
        icon: item.icon,
        category: 'Navigation' as const,
        action: () => router.push(item.href),
        keywords: [item.name.toLowerCase(), item.href.replace(/\//g, ' ').trim()],
      }));

    const actionCommands: CommandItem[] = [
      {
        id: 'toggle-theme',
        label: theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode',
        description: 'Toggle between dark and light themes',
        icon: theme === 'dark' ? Sun : Moon,
        category: 'Actions',
        action: () => { setTheme(theme === 'dark' ? 'light' : 'dark'); setOpen(false); },
        keywords: ['dark', 'light', 'theme', 'mode', 'toggle'],
      },
      {
        id: 'start-tour',
        label: 'Start Product Tour',
        description: 'Take a guided tour of HRPlatform',
        icon: Compass,
        category: 'Actions',
        action: () => {
          setOpen(false);
          localStorage.removeItem('hrplatform-tour-completed');
          document.dispatchEvent(new CustomEvent('start-product-tour'));
        },
        keywords: ['tour', 'guide', 'help', 'walkthrough'],
      },
      {
        id: 'shortcuts-help',
        label: 'Keyboard Shortcuts',
        description: 'View all keyboard shortcuts',
        icon: HelpCircle,
        category: 'Settings',
        action: () => {
          setOpen(false);
          document.dispatchEvent(new CustomEvent('show-shortcuts-help'));
        },
        keywords: ['keyboard', 'shortcut', 'hotkey', 'help'],
      },
    ];

    return [...navCommands, ...actionCommands];
  }, [hasAnyPermission, hasFeature, router, theme, setTheme]);

  // Filter commands
  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter((cmd) => {
      if (cmd.label.toLowerCase().includes(q)) return true;
      if (cmd.description?.toLowerCase().includes(q)) return true;
      if (cmd.keywords?.some((k) => k.includes(q))) return true;
      return false;
    });
  }, [commands, query]);

  // Group by category
  const grouped = useMemo(() => {
    const groups: Record<string, CommandItem[]> = {};
    for (const item of filtered) {
      if (!groups[item.category]) groups[item.category] = [];
      groups[item.category].push(item);
    }
    return groups;
  }, [filtered]);

  // Pre-compute flat items list to avoid mutable counter during render
  const flatItems = useMemo(() => {
    const items: CommandItem[] = [];
    for (const category of Object.keys(grouped)) {
      items.push(...grouped[category]);
    }
    return items;
  }, [grouped]);

  // Keyboard shortcuts to open/close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Arrow key navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setOpen(false);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      e.preventDefault();
      filtered[selectedIndex].action();
      setOpen(false);
    }
  }, [filtered, selectedIndex]);

  // Reset selection on query change
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scroll selected item into view
  useEffect(() => {
    if (listRef.current) {
      const selected = listRef.current.querySelector('[data-selected="true"]');
      if (selected) {
        selected.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  if (!open) return null;

  const activeItemId = flatItems[selectedIndex] ? `cmd-option-${flatItems[selectedIndex].id}` : undefined;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-50"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* Dialog */}
      <div
        ref={dialogRef}
        className="fixed inset-x-0 top-[20%] z-50 mx-auto w-full max-w-lg px-4"
        onKeyDown={handleKeyDown}
        role="dialog"
        aria-modal="true"
        aria-label="Command palette"
      >
        <div className="bg-card rounded-xl border border-border shadow-2xl overflow-hidden animate-scale-in">
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 border-b border-border">
            <Search className="w-5 h-5 text-muted-foreground flex-shrink-0" aria-hidden="true" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Type a command or search..."
              className="flex-1 h-12 bg-transparent text-foreground text-sm placeholder:text-muted-foreground outline-none"
              role="combobox"
              aria-expanded="true"
              aria-haspopup="listbox"
              aria-controls="command-palette-results"
              aria-activedescendant={activeItemId}
              aria-autocomplete="list"
            />
            <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono text-muted-foreground bg-muted border border-border">
              ESC
            </kbd>
          </div>

          {/* Live region for result count */}
          <span className="sr-only" aria-live="polite">
            {filtered.length} {filtered.length === 1 ? 'result' : 'results'}
          </span>

          {/* Results */}
          <div ref={listRef} id="command-palette-results" role="listbox" className="max-h-72 overflow-y-auto p-2">
            {filtered.length === 0 ? (
              <div className="py-8 text-center text-sm text-muted-foreground">
                No results found for &ldquo;{query}&rdquo;
              </div>
            ) : (
              Object.entries(grouped).map(([category, items]) => (
                <div key={category} role="group" aria-label={category}>
                  <div className="px-2 pt-2 pb-1">
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                      {category}
                    </span>
                  </div>
                  {items.map((item) => {
                    const idx = flatItems.indexOf(item);
                    const isSelected = idx === selectedIndex;
                    const Icon = item.icon;
                    return (
                      <button
                        key={item.id}
                        id={`cmd-option-${item.id}`}
                        role="option"
                        aria-selected={isSelected}
                        data-selected={isSelected}
                        onClick={() => { item.action(); setOpen(false); }}
                        onMouseEnter={() => setSelectedIndex(idx)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm transition-colors ${
                          isSelected
                            ? 'bg-primary/10 text-foreground'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium ${isSelected ? 'text-foreground' : ''}`}>{item.label}</p>
                          {item.description && (
                            <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                          )}
                        </div>
                        {isSelected && <ArrowRight className="w-4 h-4 flex-shrink-0 text-primary" aria-hidden="true" />}
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-border bg-muted/30">
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-muted border border-border font-mono">↑↓</kbd>
                navigate
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-muted border border-border font-mono">↵</kbd>
                select
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-muted border border-border font-mono">esc</kbd>
                close
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
