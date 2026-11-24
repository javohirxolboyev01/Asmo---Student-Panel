// src/lib/notificationTitle.ts
// The backend writes notification titles in English ("Coin balance updated").
// Known ones are shown in the user's language; anything else is shown as is.
// Strings: src/student/i18n/when.ts (merged into the global dictionary).
type T = (key: string, vars?: Record<string, string | number>) => string;

const KNOWN: Record<string, string> = {
  "coin balance updated": "notes.coins",
  "homework graded": "notes.graded",
  "new homework submission": "notes.submission",
  "new homework": "notes.homework",
};

export const notificationTitle = (title: string, t: T) => {
  const key = KNOWN[title.trim().toLowerCase()];
  return key ? t(key) : title;
};

/** True for "Coin balance updated" — shown with a coin icon instead of the generic bell. */
export const isCoinNotification = (title: string) => title.trim().toLowerCase() === "coin balance updated";
