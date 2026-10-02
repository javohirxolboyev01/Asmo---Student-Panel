// src/hooks/useNavigationHistory.ts
import { useCallback, useEffect, useRef } from "react";
import { useLocation, useNavigate, useNavigationType } from "react-router-dom";

const STORAGE_KEY = "asmo_nav_stack";
const MAX_STACK_SIZE = 50;

function readStack(): string[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function writeStack(stack: string[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stack));
  } catch {
    // sessionStorage unavailable — back button falls back to dashboard
  }
}

/**
 * Records every in-app route visited this tab session, independent of the
 * browser History API (which drifts on refresh/deep links). Mount once near
 * the root of the authenticated app.
 */
export const useTrackNavigationHistory = () => {
  const location = useLocation();
  const navigationType = useNavigationType();
  const lastKey = useRef<string | null>(null);

  useEffect(() => {
    const key = `${location.pathname}${location.search}`;
    if (key === lastKey.current) return;
    lastKey.current = key;

    const stack = readStack();
    if (stack[stack.length - 1] === key) return;
    // Browser / in-app "back" returns to the entry below the top: unwind
    // instead of pushing, so the stack mirrors the real history.
    if (navigationType === "POP" && stack[stack.length - 2] === key) {
      stack.pop();
    } else {
      stack.push(key);
      if (stack.length > MAX_STACK_SIZE) stack.shift();
    }
    writeStack(stack);
  }, [location.pathname, location.search, navigationType]);
};

/** The in-app page visited before the current one, or null (deep link / new tab). */
export const usePreviousPath = () => {
  const location = useLocation();
  const key = `${location.pathname}${location.search}`;
  const stack = readStack();
  // The tracker's effect may not have recorded the current page yet.
  const i = stack[stack.length - 1] === key ? stack.length - 2 : stack.length - 1;
  return stack[i] ?? null;
};

/**
 * "Back" for nested pages: returns to wherever the user actually came from
 * (a real history step, so the browser's back button stays in sync); with no
 * in-app page behind this one it replaces the entry with `fallback` — the
 * page's logical parent.
 */
export const useGoBack = (fallback = "/") => {
  const navigate = useNavigate();
  const previous = usePreviousPath();

  return useCallback(() => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    if (previous && idx > 0) navigate(-1);
    else navigate(fallback, { replace: true });
  }, [navigate, previous, fallback]);
};
