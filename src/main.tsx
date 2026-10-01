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

// Restore a returning user's cached data before the first render, so pages
// open with it instead of skeletons (a synchronous localStorage read).
const cachedUser = tokenStorage.getAccessToken() ? readCachedUser() : null;
if (!cachedUser) clearSessionCache();
const sessionReady = cachedUser ? startSessionCache(cachedUser) : Promise.resolve();

sessionReady.finally(() => {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
        {import.meta.env.DEV && <ReactQueryDevtools initialIsOpen={false} />}
      </QueryClientProvider>
    </React.StrictMode>,
  );
});

if (import.meta.env.PROD) {
  initPWA();
}
