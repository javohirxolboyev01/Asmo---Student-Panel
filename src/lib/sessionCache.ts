// src/lib/sessionCache.ts
// Keeps the signed-in user and their query cache in localStorage, so reopening
// the app (e.g. the Telegram Mini App) shows the last data instantly instead of
// an auth round-trip plus skeletons; react-query then refreshes it in the background.
import { persistQueryClient, removeOldestQuery } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { queryClient } from "./queryClient";
import type { User } from "@/types/user";

const USER_KEY = "authUser";
const CACHE_KEY = "asmo-query-cache";
const MAX_AGE = 24 * 60 * 60 * 1000;

// Lesson details and submissions can carry multi-MB attachments, and the
// wishlist cart holds client-only quantities, so those stay in memory only.
const PERSISTED_ROOTS = new Set([
  "dashboard",
  "groups",
  "directions",
  "teachers",
  "students",
  "notifications",
  "coins",
  "payments",
  "products",
  "attendance",
]);

const persister = createSyncStoragePersister({
  storage: typeof window !== "undefined" ? window.localStorage : undefined,
  key: CACHE_KEY,
  retry: removeOldestQuery,
});

let activeUserId: string | null = null;
let stopPersisting: (() => void) | null = null;

export const readCachedUser = (): User | null => {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
};

export const writeCachedUser = (user: User) => {
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch {
    // storage full/blocked — the app still works, just without the instant start
  }
};

/** Mirrors the query cache for `user`; resolves once a saved cache is restored. */
export const startSessionCache = (user: User): Promise<void> => {
  if (activeUserId && activeUserId !== user.id) clearSessionCache();
  writeCachedUser(user);
  if (activeUserId === user.id) return Promise.resolve();
  activeUserId = user.id;
  const [unsubscribe, restored] = persistQueryClient({
    queryClient,
    persister,
    maxAge: MAX_AGE,
    // A cache saved for a different user is discarded instead of restored.
    buster: user.id,
    dehydrateOptions: {
      shouldDehydrateQuery: (query) =>
        query.state.status === "success" && PERSISTED_ROOTS.has(String(query.queryKey[0])),
    },
  });
  stopPersisting = unsubscribe;
  return restored.catch(() => undefined);
};

/** Drops the user and every cached query (logout / expired session). */
export const clearSessionCache = () => {
  stopPersisting?.();
  stopPersisting = null;
  activeUserId = null;
  queryClient.clear();
  try {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(CACHE_KEY);
  } catch {
    // ignore
  }
};
