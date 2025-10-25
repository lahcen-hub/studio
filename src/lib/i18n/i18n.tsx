
'use client';

import { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from 'react';
import fr from '@/locales/fr.json';
import en from '@/locales/en.json';
import ar from '@/locales/ar.json';

export type Locale = 'fr' | 'en' | 'ar';
export type Direction = 'ltr' | 'rtl';

const translations: Record<Locale, any> = { fr, en, ar };

interface I18nContextType {
  locale: Locale;
  direction: Direction;
  setLocale: (locale: Locale) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('ar');
  const [direction, setDirection] = useState<Direction>('rtl');

  useEffect(() => {
    const storedLocale = localStorage.getItem('locale') as Locale | null;
    if (storedLocale && ['fr', 'en', 'ar'].includes(storedLocale)) {
      setLocaleState(storedLocale);
      setDirection(storedLocale === 'ar' ? 'rtl' : 'ltr');
      document.documentElement.lang = storedLocale;
      document.documentElement.dir = storedLocale === 'ar' ? 'rtl' : 'ltr';
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    const newDirection = newLocale === 'ar' ? 'rtl' : 'ltr';
    setDirection(newDirection);
    localStorage.setItem('locale', newLocale);
    document.documentElement.lang = newLocale;
    document.documentElement.dir = newDirection;
  };

  const t = useCallback((key: string, replacements?: Record<string, string | number>): string => {
      const translation = translations[locale]?.[key] || translations['fr'][key] || key;
      if (replacements) {
        return Object.entries(replacements).reduce((acc, [k, v]) => {
            return acc.replace(`{{${k}}}`, String(v));
        }, translation);
      }
      return translation;
    },
    [locale]
  );

  return (
    <I18nContext.Provider value={{ locale, direction, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
