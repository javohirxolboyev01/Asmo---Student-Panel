// src/i18n/translate.ts
// Non-hook translation accessor for use outside React components (e.g. zustand stores).
import { useSettingsStore } from "@/stores/settingsStore";
import { translations, TranslationKey } from "@/i18n/translations";

export const translate = (key: TranslationKey | string): string => {
  const language = useSettingsStore.getState().language;
  return translations[language][key as TranslationKey] ?? key;
};
