// src/lib/telegram.ts — Telegram Mini App detection and launch data.
//
// Telegram opens the app with "#tgWebAppData=<initData>&…" in the URL. That
// signed initData is the student's login: the server checks its signature
// with the bot token. It's kept in sessionStorage so in-app reloads and
// client-side navigation (which drop the hash) still have it.
const STORAGE_KEY = "tgInitData";

const readInitData = (): string => {
  try {
    const fromHash = new URLSearchParams(window.location.hash.slice(1)).get("tgWebAppData");
    if (fromHash) {
      sessionStorage.setItem(STORAGE_KEY, fromHash);
      return fromHash;
    }
    return sessionStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
};

const initData = readInitData();

/** True when running inside the Telegram Mini App. */
export const isTelegram = () => initData !== "";
export const getTelegramInitData = () => initData;

type WebApp = {
  ready: () => void;
  expand: () => void;
  close: () => void;
  disableVerticalSwipes?: () => void;
  isVersionAtLeast?: (v: string) => boolean;
};
const webApp = (): WebApp | undefined => (window as any).Telegram?.WebApp;

/**
 * Loads Telegram's SDK (only inside Telegram) and tells Telegram the app is
 * ready. Resolves after at most 3s, so a slow SDK never blocks the app.
 */
export const initTelegram = (): Promise<void> => {
  if (!isTelegram()) return Promise.resolve();
  return new Promise<void>((resolve) => {
    const done = () => {
      try {
        const app = webApp();
        app?.ready();
        app?.expand();
        // Scrolling a page shouldn't swipe the whole app closed.
        if (app?.isVersionAtLeast?.("7.7")) app.disableVerticalSwipes?.();
      } catch {
        /* the app works without the SDK */
      }
      resolve();
    };
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-web-app.js";
    script.onload = done;
    script.onerror = done;
    document.head.appendChild(script);
    setTimeout(done, 3000);
  });
};

export const closeTelegram = () => webApp()?.close();
