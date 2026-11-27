// src/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import App from "./App";
import { queryClient } from "./lib/queryClient";

// CSS import
import "./css/index.css";
import { initPWA } from "./lib/pwa";
import { tokenStorage } from "./services/apiClient";
import { clearSessionCache, readCachedUser, startSessionCache } from "./lib/sessionCache";
import { initTelegram } from "./lib/telegram";
import { startViewportTracking } from "./lib/viewport";

// Restore a returning user's cached data before the first render, so pages
// open with it instead of skeletons (a synchronous localStorage read).
const cachedUser = tokenStorage.getAccessToken() ? readCachedUser() : null;
if (!cachedUser) clearSessionCache();
const sessionReady = Promise.all([
  cachedUser ? startSessionCache(cachedUser) : Promise.resolve(),
  // Inside Telegram: load the Mini App SDK before the router touches the URL.
  initTelegram(),
]);

// Opt-in (dev only): its floating button sits on top of the student panel's
// bottom nav / chest button. Enable with localStorage.setItem("rq-devtools", "1").
const showQueryDevtools = (() => {
  try {
    return import.meta.env.DEV && localStorage.getItem("rq-devtools") === "1";
  } catch {
    return false;
  }
})();

// No page zoom on phones (it's an app, not a document). iOS ignores
// `user-scalable=no` in the viewport tag, so block its pinch gesture here;
// `touch-action: pan-x pan-y` in index.css covers pinch + double-tap too.
// No `touchmove` listener on purpose: a non-passive one makes every scroll
// frame wait for JavaScript, which made scrolling slow and jumpy.
const blockZoom = (e: Event) => e.preventDefault();
document.addEventListener("gesturestart", blockZoom, { passive: false });
document.addEventListener("gesturechange", blockZoom, { passive: false });

// Phone keyboard: hides the tab bar, keeps sheets and the focused field visible.
startViewportTracking();

sessionReady.finally(() => {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
        {showQueryDevtools && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </React.StrictMode>,
  );
});

if (import.meta.env.PROD) {
  initPWA();
}
