// src/teacher/i18n/index.ts
// Teacher-panel ("Ustoz paneli") strings, one file per area like
// src/student/i18n. Every file here default-exports { uz, ru, en } and is
// merged into the shared dictionary automatically. Keys use the "us." prefix.
import type { Language } from "@/i18n/translations";

type Dict = Record<string, string>;
export type TeacherDict = Record<Language, Dict>;

const modules = import.meta.glob<{ default: TeacherDict }>("./*.ts", { eager: true });

export const teacherTranslations: TeacherDict = { uz: {}, ru: {}, en: {} };
for (const [path, mod] of Object.entries(modules)) {
  if (path.endsWith("/index.ts")) continue;
  for (const lang of ["uz", "ru", "en"] as const) Object.assign(teacherTranslations[lang], mod.default[lang]);
}
