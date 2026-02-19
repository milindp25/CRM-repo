'use client';

/**
 * Theme Toggle Component
 * Cycles between light, dark, and system themes
 */

import { useState, useEffect } from 'react';
import { useTheme } from 'next-themes';
import { Sun, Moon, Monitor } from 'lucide-react';

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button className="p-2 rounded-lg bg-muted text-muted-foreground" aria-label="Toggle theme">
        <Monitor className="w-4 h-4" />
      </button>
    );
  }

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const icon =
    theme === 'dark' ? <Moon className="w-4 h-4" /> :
    theme === 'light' ? <Sun className="w-4 h-4" /> :
    <Monitor className="w-4 h-4" />;

  const label =
    theme === 'dark' ? 'Dark mode' :
    theme === 'light' ? 'Light mode' :
    'System theme';

  return (
    <button
      onClick={cycleTheme}
      className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
      aria-label={label}
      title={label}
    >
      {icon}
    </button>
  );
}
