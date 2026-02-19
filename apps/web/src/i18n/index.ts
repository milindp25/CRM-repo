/**
 * i18n Configuration
 * Lightweight internationalization system using React Context
 */

import en from './locales/en.json';
import es from './locales/es.json';

export type Locale = 'en' | 'es';

export interface LocaleConfig {
  code: Locale;
  name: string;
  nativeName: string;
  dir: 'ltr' | 'rtl';
}

export const SUPPORTED_LOCALES: LocaleConfig[] = [
  { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr' },
  { code: 'es', name: 'Spanish', nativeName: 'Espanol', dir: 'ltr' },
];

export const DEFAULT_LOCALE: Locale = 'en';

type TranslationData = typeof en;

const translations: Record<Locale, TranslationData> = {
  en,
  es: es as TranslationData,
};

/**
 * Get translations for a locale
 */
export function getTranslations(locale: Locale): TranslationData {
  return translations[locale] || translations[DEFAULT_LOCALE];
}

/**
 * Get a nested translation value by dot-notation key
 * Example: t('dashboard.title') => 'Dashboard'
 */
export function getTranslation(
  locale: Locale,
  key: string,
  params?: Record<string, string>,
): string {
  const keys = key.split('.');
  let value: any = translations[locale] || translations[DEFAULT_LOCALE];

  for (const k of keys) {
    value = value?.[k];
    if (value === undefined) {
      // Fallback to English
      value = translations[DEFAULT_LOCALE];
      for (const fk of keys) {
        value = value?.[fk];
        if (value === undefined) return key;
      }
      break;
    }
  }

  if (typeof value !== 'string') return key;

  // Replace template parameters: {name} -> actual value
  if (params) {
    return value.replace(/\{(\w+)\}/g, (_, paramKey) => params[paramKey] || `{${paramKey}}`);
  }

  return value;
}
