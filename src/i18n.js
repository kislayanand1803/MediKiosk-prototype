import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import Backend from "i18next-http-backend";
import LanguageDetector from "i18next-browser-languagedetector";

i18n
  // Load translations using http (default public/locales)
  .use(Backend)
  // Detect user language and remember it on refresh
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    fallbackLng: "en", // If a translation is missing, safely fallback to English
    debug: false, // Set to true if you want to see translation loading logs in console
    interpolation: {
      escapeValue: false, // React already inherently protects from XSS
    },
    backend: {
      loadPath: "/locales/{{lng}}/translation.json", // Where to find the JSON files
    },
  });

export default i18n;
