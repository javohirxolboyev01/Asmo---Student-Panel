// src/student/i18n/index.ts
// Student-panel strings live in one file per area (dashboard.ts, groups.ts, …)
// so parallel work never collides on the big shared dictionary. Every file
// here default-exports { uz, ru, en } and is merged in automatically.
import type { Language } from "@/i18n/translations";

type Dict = Record<string, string>;
export type StudentDict = Record<Language, Dict>;

const modules = import.meta.glob<{ default: StudentDict }>("./*.ts", { eager: true });

export const studentTranslations: StudentDict = { uz: {}, ru: {}, en: {} };
for (const [path, mod] of Object.entries(modules)) {
  if (path.endsWith("/index.ts")) continue;
  for (const lang of ["uz", "ru", "en"] as const) Object.assign(studentTranslations[lang], mod.default[lang]);
}
