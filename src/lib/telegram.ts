// src/lib/telegram.ts — Telegram Mini App detection and launch data.
//
// Telegram opens the app with "#tgWebAppData=<initData>&…" in the URL. That
// signed initData is the student's login: the server checks its signature
// with the bot token. It's kept in sessionStorage so in-app reloads and
// client-side navigation (which drop the hash) still have it.
//
// Also the native bits that make the Mini App behave like the phone app:
// Telegram's own back button (and Android's hardware back) steps back inside
// the app instead of closing it, the Telegram header takes the app's colour,
// a close confirmation while a test or an answer is in progress, haptics, and
// opening files/links the way Telegram allows.
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

type HapticStyle = "light" | "medium" | "heavy" | "rigid" | "soft";
type WebApp = {
  ready: () => void;
  expand: () => void;
  close: () => void;
  platform?: string;
  disableVerticalSwipes?: () => void;
  isVersionAtLeast?: (v: string) => boolean;
  setHeaderColor?: (color: string) => void;
  setBackgroundColor?: (color: string) => void;
  setBottomBarColor?: (color: string) => void;
  enableClosingConfirmation?: () => void;
  disableClosingConfirmation?: () => void;
  openLink?: (url: string) => void;
  BackButton?: {
    show: () => void;
    hide: () => void;
    onClick: (cb: () => void) => void;
  };
  HapticFeedback?: {
    impactOccurred: (style: HapticStyle) => void;
    notificationOccurred: (type: "error" | "success" | "warning") => void;
    selectionChanged: () => void;
  };
};
const webApp = (): WebApp | undefined => (isTelegram() ? (window as any).Telegram?.WebApp : undefined);
const atLeast = (v: string) => {
  try {
    return Boolean(webApp()?.isVersionAtLeast?.(v));
  } catch {
    return false;
  }
};
/** Runs a Telegram call; an old client without it just skips it. */
const safely = (fn: (app: WebApp) => void) => {
  const app = webApp();
  if (!app) return;
  try {
    fn(app);
  } catch {
    /* unsupported in this Telegram version */
  }
};

/**
 * Loads Telegram's SDK (only inside Telegram) and tells Telegram the app is
 * ready. Resolves after at most 3s, so a slow SDK never blocks the app.
 */
export const initTelegram = (): Promise<void> => {
  if (!isTelegram()) return Promise.resolve();
  return new Promise<void>((resolve) => {
    let finished = false;
    const done = () => {
      if (finished) return;
      finished = true;
      safely((app) => {
        app.ready();
        app.expand();
        // Scrolling a page shouldn't swipe the whole app closed.
        if (atLeast("7.7")) app.disableVerticalSwipes?.();
        if (atLeast("6.1")) app.BackButton?.onClick(runBack);
      });
      syncBackButton();
      syncClosingConfirmation();
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

// ── Back button ──
// A stack of "back" handlers: the page registers "go to the previous page",
// an open sheet registers "close me" on top of it. Telegram's back button
// (and Android's hardware back inside Telegram) runs the top one; with an
// empty stack the button is hidden and Telegram's "Close" is shown instead.
const backStack: { fn: () => void }[] = [];

function runBack() {
  backStack[backStack.length - 1]?.fn();
}
function syncBackButton() {
  if (!atLeast("6.1")) return;
  safely((app) => (backStack.length ? app.BackButton?.show() : app.BackButton?.hide()));
}

/** Registers a back handler; returns the function that removes it. */
export const pushTelegramBack = (fn: () => void): (() => void) => {
  if (!isTelegram()) return () => undefined;
  const entry = { fn };
  backStack.push(entry);
  syncBackButton();
  return () => {
    const i = backStack.lastIndexOf(entry);
    if (i >= 0) backStack.splice(i, 1);
    syncBackButton();
  };
};

// ── Close confirmation ──
// Asked before closing the Mini App while something would be lost (a running
// test, an unsent answer). Counted, so two screens can ask at once.
let confirmCount = 0;
function syncClosingConfirmation() {
  if (!atLeast("6.2")) return;
  safely((app) => (confirmCount > 0 ? app.enableClosingConfirmation?.() : app.disableClosingConfirmation?.()));
}
export const holdClosingConfirmation = (): (() => void) => {
  if (!isTelegram()) return () => undefined;
  confirmCount++;
  syncClosingConfirmation();
  let released = false;
  return () => {
    if (released) return;
    released = true;
    confirmCount--;
    syncClosingConfirmation();
  };
};

// ── Colours ──
/** Telegram's header / background / bottom bar take the app's page colour. */
export const setTelegramColors = (color: string) => {
  if (!atLeast("6.1")) return;
  safely((app) => {
    app.setHeaderColor?.(color);
    app.setBackgroundColor?.(color);
    if (atLeast("7.10")) app.setBottomBarColor?.(color);
  });
};

// ── Haptics ──
export const haptic = {
  /** A light tap: buttons. */
  tap: (style: HapticStyle = "light") => atLeast("6.1") && safely((app) => app.HapticFeedback?.impactOccurred(style)),
  /** Picking one of several (tab, option, switch). */
  select: () => atLeast("6.1") && safely((app) => app.HapticFeedback?.selectionChanged()),
  notify: (type: "error" | "success" | "warning") =>
    atLeast("6.1") && safely((app) => app.HapticFeedback?.notificationOccurred(type)),
};

// ── Links ──
/**
 * Opens a file or an external page. Inside Telegram a `target="_blank"` link
 * often does nothing (iOS) or replaces the app, so Telegram's own browser is
 * used; elsewhere it's a new tab. Returns false when it didn't handle it.
 */
export const openExternal = (url: string): boolean => {
  const app = webApp();
  if (!app?.openLink || url.startsWith("data:")) return false;
  try {
    app.openLink(new URL(url, window.location.href).href);
    return true;
  } catch {
    return false;
  }
};
