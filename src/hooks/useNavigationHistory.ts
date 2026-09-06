// src/hooks/useNavigationHistory.ts
import { useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";

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
  const lastKey = useRef<string | null>(null);

  useEffect(() => {
    const key = `${location.pathname}${location.search}`;
    if (key === lastKey.current) return;
    lastKey.current = key;

    const stack = readStack();
    if (stack[stack.length - 1] !== key) {
      stack.push(key);
      if (stack.length > MAX_STACK_SIZE) stack.shift();
      writeStack(stack);
    }
  }, [location.pathname, location.search]);
};

/**
 * Returns a function that navigates exactly one step back to the previous
 * in-app page, falling back to the dashboard only when there is none.
 */
export const useGoBack = () => {
  const navigate = useNavigate();

  return () => {
    const stack = readStack();
    stack.pop(); // current page
    const previous = stack.pop();
    writeStack(stack);
    navigate(previous ?? "/");
  };
};
