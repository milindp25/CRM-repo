/**
 * i18n Configuration
 * Lightweight internationalization system using React Context
 */

import en from './locales/en.json';
import es from './locales/es.json';
import hi from './locales/hi.json';
import ta from './locales/ta.json';
import te from './locales/te.json';
import kn from './locales/kn.json';
import ml from './locales/ml.json';
import bn from './locales/bn.json';
import mr from './locales/mr.json';
import gu from './locales/gu.json';

export type Locale = 'en' | 'es' | 'hi' | 'ta' | 'te' | 'kn' | 'ml' | 'bn' | 'mr' | 'gu';

export interface LocaleConfig {
  code: Locale;
  name: string;
  nativeName: string;
  dir: 'ltr' | 'rtl';
}

export const SUPPORTED_LOCALES: LocaleConfig[] = [
  { code: 'en', name: 'English', nativeName: 'English', dir: 'ltr' },
  { code: 'es', name: 'Spanish', nativeName: 'Espanol', dir: 'ltr' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', dir: 'ltr' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', dir: 'ltr' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', dir: 'ltr' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', dir: 'ltr' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', dir: 'ltr' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', dir: 'ltr' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', dir: 'ltr' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', dir: 'ltr' },
];

export const DEFAULT_LOCALE: Locale = 'en';

type TranslationData = typeof en;

const translations: Record<Locale, TranslationData> = {
  en,
  es: es as TranslationData,
  hi: hi as TranslationData,
  ta: ta as TranslationData,
  te: te as TranslationData,
  kn: kn as TranslationData,
  ml: ml as TranslationData,
  bn: bn as TranslationData,
  mr: mr as TranslationData,
  gu: gu as TranslationData,
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
