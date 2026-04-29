import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

import viCommon from '@/locales/vi/common.json';
import viAuth from '@/locales/vi/auth.json';
import viDashboard from '@/locales/vi/dashboard.json';
import enCommon from '@/locales/en/common.json';
import enAuth from '@/locales/en/auth.json';
import enDashboard from '@/locales/en/dashboard.json';

export const SUPPORTED_LANGUAGES = ['vi', 'en'] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

const resources = {
  vi: { common: viCommon, auth: viAuth, dashboard: viDashboard },
  en: { common: enCommon, auth: enAuth, dashboard: enDashboard },
};

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'vi',
    supportedLngs: SUPPORTED_LANGUAGES,
    ns: ['common', 'auth', 'dashboard'],
    defaultNS: 'common',
    interpolation: { escapeValue: false },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'afanta_lang',
    },
  });

export default i18n;
