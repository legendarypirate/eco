"use client";

import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import { LOCALE_CODES, LOCALE_FLAGS, LOCALE_LABELS, LOCALES, Locale } from '../i18n';

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (next: Locale) => {
    setLocale(next);
    setOpen(false);
  };

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors"
        aria-label={t('language')}
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span className="text-base leading-none" aria-hidden="true">{LOCALE_FLAGS[locale]}</span>
        <span className="text-xs font-semibold tracking-wide">{LOCALE_CODES[locale]}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>

      {open && (
        <div
          className="absolute top-full right-0 mt-2 w-48 bg-white border border-gray-200 shadow-lg rounded-lg z-50 py-1"
          role="listbox"
          aria-label={t('language')}
        >
          {LOCALES.map((code) => (
            <button
              key={code}
              type="button"
              role="option"
              aria-selected={locale === code}
              onClick={() => handleSelect(code)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
                locale === code
                  ? 'bg-gray-100 text-gray-900 font-medium'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="text-lg leading-none" aria-hidden="true">{LOCALE_FLAGS[code]}</span>
              <span className="flex-1 text-left">{LOCALE_LABELS[code]}</span>
              <span className="text-xs text-gray-400 font-medium">{LOCALE_CODES[code]}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
