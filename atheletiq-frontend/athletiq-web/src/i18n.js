import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import en from "./locales/en/translation.json";
import np from "./locales/np/translation.json";
import ne from "./locales/ne/translation.json";

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      np: { translation: np },
      ne: { translation: ne }
    },
    lng: "en", // default language
    fallbackLng: "en",
    debug: process.env.NODE_ENV === 'development',
    interpolation: { 
      escapeValue: false 
    },
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage']
    }
  });

export default i18n;
