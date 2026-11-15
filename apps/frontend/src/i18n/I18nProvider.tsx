import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { translations, Locale, locales } from './translations';

export type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
};

const defaultLocale: Locale = 'en';

const defaultValue: I18nContextValue = {
  locale: defaultLocale,
  setLocale: () => {},
  t: (key) => key,
};

const I18nContext = createContext<I18nContextValue>(defaultValue);

function interpolate(value: string, params?: Record<string, string | number>) {
  if (!params) return value;
  return Object.entries(params).reduce((result, [key, paramValue]) => {
    return result.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'g'), String(paramValue));
  }, value);
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    if (typeof window === 'undefined') return defaultLocale;
    const stored = window.localStorage.getItem('locale') as Locale | null;
    return stored && locales.includes(stored) ? stored : defaultLocale;
  });

  useEffect(() => {
    window.localStorage.setItem('locale', locale);
  }, [locale]);

  const t = (key: string, params?: Record<string, string | number>) => {
    const value = translations[locale][key] ?? translations[defaultLocale][key] ?? key;
    return interpolate(value, params);
  };

  const value = useMemo(
    () => ({ locale, setLocale: setLocaleState, t }),
    [locale]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useTranslation() {
  return useContext(I18nContext);
}
