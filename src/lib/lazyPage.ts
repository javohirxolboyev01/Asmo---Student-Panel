// src/lib/lazyPage.ts
import { ComponentType, lazy } from "react";

/** React.lazy for a named page export, plus `preload()` to fetch its chunk early. */
export const lazyPage = <K extends string>(load: () => Promise<Record<K, ComponentType>>, name: K) =>
  Object.assign(
    lazy(() => load().then((module) => ({ default: module[name] }))),
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
