import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Localization from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import gn from "./locales/gn.json"; // or gn

// Load saved language or fallback to device locale
const languageDetector = {
  type: "languageDetector",
  async: true,
  detect: async (callback) => {
    try {
      const savedLang = await AsyncStorage.getItem("appLang");
      if (savedLang) {
        callback(savedLang);
      } else {
        const locale = Localization.getLocales?.()[0]?.languageCode || "en";
        callback(locale);
      }
    } catch (error) {
      console.error("Failed to detect language", error);
      callback("en");
    }
  },
  init: () => {},
  cacheUserLanguage: async (lng) => {
    try {
      await AsyncStorage.setItem("appLang", lng);
    } catch (error) {
      console.error("Failed to cache language", error);
    }
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    compatibilityJSON: "v3",
    fallbackLng: "en",
    resources: {
      en: { translation: en },
      gn: { translation: gn },
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
