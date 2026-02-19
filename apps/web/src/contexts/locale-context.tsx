'use client';

/**
 * Locale Context Provider
 * Provides i18n translation functions throughout the app
 */

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import {
  type Locale,
  DEFAULT_LOCALE,
  SUPPORTED_LOCALES,
  getTranslation,
} from '@/i18n';

interface LocaleContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string>) => string;
  supportedLocales: typeof SUPPORTED_LOCALES;
}

const LocaleContext = createContext<LocaleContextValue | undefined>(undefined);

const LOCALE_STORAGE_KEY = 'hrplatform_locale';

export function LocaleProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(DEFAULT_LOCALE);

  // Load locale from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
      if (stored && SUPPORTED_LOCALES.some(l => l.code === stored)) {
        setLocaleState(stored as Locale);
      } else {
        // Try browser language
        const browserLang = navigator.language.split('-')[0] as Locale;
        if (SUPPORTED_LOCALES.some(l => l.code === browserLang)) {
          setLocaleState(browserLang);
        }
      }
    } catch {
      // localStorage not available (SSR), use default
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, newLocale);
    } catch {
      // localStorage not available
    }
    // Update document lang attribute
    document.documentElement.lang = newLocale;
    const localeConfig = SUPPORTED_LOCALES.find(l => l.code === newLocale);
    if (localeConfig) {
      document.documentElement.dir = localeConfig.dir;
    }
  }, []);

  const t = useCallback((key: string, params?: Record<string, string>) => {
    return getTranslation(locale, key, params);
  }, [locale]);

  return (
    <LocaleContext.Provider value={{ locale, setLocale, t, supportedLocales: SUPPORTED_LOCALES }}>
      {children}
    </LocaleContext.Provider>
  );
}

/**
 * Hook to access the locale context
 */
export function useLocale(): LocaleContextValue {
  const context = useContext(LocaleContext);
  if (!context) {
    throw new Error('useLocale must be used within a LocaleProvider');
  }
  return context;
}
