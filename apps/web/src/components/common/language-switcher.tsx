'use client';

/**
 * Language Switcher Component
 * Dropdown to switch between supported locales
 */

import { useState, useRef, useEffect } from 'react';
import { useLocale } from '@/contexts/locale-context';
import { Globe } from 'lucide-react';

export function LanguageSwitcher() {
  const { locale, setLocale, supportedLocales } = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const currentLocale = supportedLocales.find(l => l.code === locale);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
        aria-label="Change language"
        title={`Language: ${currentLocale?.nativeName}`}
      >
        <Globe className="w-4 h-4" />
        <span className="text-xs font-medium uppercase">{locale}</span>
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-44 bg-card rounded-lg shadow-lg border border-border z-50">
          {supportedLocales.map((loc) => (
            <button
              key={loc.code}
              onClick={() => {
                setLocale(loc.code);
                setOpen(false);
              }}
              className={`w-full text-left px-4 py-2.5 text-sm transition-colors first:rounded-t-lg last:rounded-b-lg ${
                locale === loc.code
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-foreground hover:bg-muted'
              }`}
            >
              <div className="flex items-center justify-between">
                <span>{loc.nativeName}</span>
                <span className="text-xs text-muted-foreground">{loc.name}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
