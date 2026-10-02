// src/lib/lazyPage.ts
import { ComponentType, lazy } from "react";

const RELOAD_FLAG = "chunk-reload";

/**
 * After a deploy, an open tab still points at the old (now deleted) chunk
 * files. Reload once to pick up the new build; the flag stops a reload loop
 * when the network is really down (the error boundary shows "retry" then).
 */
const reloadOnStaleChunk = (error: unknown): never => {
  const stale = error instanceof Error && /dynamically imported module|Importing a module script failed|Loading chunk/i.test(error.message);
  let reloaded = false;
  try {
    reloaded = sessionStorage.getItem(RELOAD_FLAG) === "1";
    if (stale && !reloaded) sessionStorage.setItem(RELOAD_FLAG, "1");
  } catch {
    reloaded = true; // no storage → never risk a loop
  }
  if (stale && !reloaded) window.location.reload();
  throw error;
};

/** React.lazy for a named page export, plus `preload()` to fetch its chunk early. */
export const lazyPage = <K extends string>(load: () => Promise<Record<K, ComponentType>>, name: K) =>
  Object.assign(
    lazy(() =>
      load().then((module) => {
        try {
          sessionStorage.removeItem(RELOAD_FLAG);
        } catch {
          // ignore
        }
        return { default: module[name] };
      }, reloadOnStaleChunk),
    ),
    { preload: load },
  );

/**
 * Runs `task` once the current page has had a head start and the browser is
 * idle, so background work never competes with what the user is looking at
 * (Safari/Telegram iOS lack requestIdleCallback, hence the fallback).
 */
export const runWhenIdle = (task: () => void) =>
  setTimeout(() => {
    if ("requestIdleCallback" in window) window.requestIdleCallback(task, { timeout: 3000 });
    else task();
  }, 1200);

/**
 * Downloads the given pages' chunks once the browser is idle, so moving
 * between pages later doesn't wait on the network for code.
 */
export const preloadWhenIdle = (pages: Array<{ preload: () => Promise<unknown> }>) =>
  runWhenIdle(() => pages.forEach((page) => page.preload().catch(() => undefined)));
