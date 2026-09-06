// src/stores/settingsStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Language } from "@/i18n/translations";

export type Theme = "light" | "dark";

interface SettingsState {
  language: Language;
  theme: Theme;
  setLanguage: (language: Language) => void;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const applyTheme = (theme: Theme) => {
  document.documentElement.classList.toggle("dark", theme === "dark");
};

const applyLanguage = (language: Language) => {
  document.documentElement.lang = language;
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      language: "uz",
      theme: "light",

      setLanguage: (language) => {
        applyLanguage(language);
        set({ language });
      },

      setTheme: (theme) => {
        applyTheme(theme);
        set({ theme });
      },

      toggleTheme: () => {
        const next: Theme = get().theme === "dark" ? "light" : "dark";
        applyTheme(next);
        set({ theme: next });
      },
    }),
    {
      name: "asmo-settings",
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        applyTheme(state.theme);
        applyLanguage(state.language);
      },
    },
  ),
);

// Sahifa birinchi marta yuklanganda (rehydrate tugashini kutmasdan) darhol
// qo'llash — aks holda bir lahzalik "yorug' flash" ko'rinadi.
const initial = useSettingsStore.getState();
applyTheme(initial.theme);
applyLanguage(initial.language);
