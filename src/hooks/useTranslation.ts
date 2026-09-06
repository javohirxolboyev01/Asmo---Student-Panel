// src/hooks/useTranslation.ts
import { useCallback } from "react";
import { useSettingsStore } from "@/stores/settingsStore";
import { translations, TranslationKey } from "@/i18n/translations";

export const useTranslation = () => {
  const language = useSettingsStore((s) => s.language);
  const setLanguage = useSettingsStore((s) => s.setLanguage);

  const t = useCallback(
    (key: TranslationKey | string, vars?: Record<string, string | number>) => {
      let text = translations[language][key as TranslationKey] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          text = text.replace(`{{${k}}}`, String(v));
        }
      }
      return text;
    },
    [language],
  );

  return { t, language, setLanguage };
};
