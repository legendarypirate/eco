import cn from './locales/cn';
import en from './locales/en';
import jp from './locales/jp';
import kr from './locales/kr';
import mn from './locales/mn';
import { DEFAULT_LOCALE, LOCALES, Locale, Translations } from './types';

export {
  DEFAULT_LOCALE,
  HTML_LANG,
  LOCALE_CODES,
  LOCALE_FLAGS,
  LOCALE_LABELS,
  LOCALES,
} from './types';
export type { Locale, TranslationKeys, Translations } from './types';

export const translations: Translations = {
  en,
  mn,
  cn,
  kr,
  jp,
};

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}

export function getStoredLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  const stored = localStorage.getItem('locale');
  return stored && isLocale(stored) ? stored : DEFAULT_LOCALE;
}
