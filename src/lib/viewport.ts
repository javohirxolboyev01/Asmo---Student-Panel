// src/lib/viewport.ts — keeps the screen usable while the phone keyboard is up.
//
// Phones show the keyboard in two ways: Android (and Telegram on Android)
// shrinks the page, iOS (Safari and Telegram) slides the keyboard over it and
// only the "visual viewport" gets smaller. Either way, things pinned to the
// bottom (the tab bar) end up on top of the keyboard, sheets get their lower
// half hidden under it, and the field being typed in can end up behind the
// keyboard or the pinned top bar.
//
// This tracks the visual viewport and publishes it to CSS:
//   html.kb-open    — the keyboard is up (a text field has focus and the
//                     visible area shrank)
//   --vvh / --vv-top — the visible area's height and its offset from the top
// and scrolls the focused field into the visible area once the keyboard is up.
const EDITABLE =
  'textarea, select, [contenteditable=""], [contenteditable="true"], input:not([type="checkbox"]):not([type="radio"]):not([type="range"]):not([type="file"]):not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="color"])';

/** The visible area has to shrink at least this much to count as a keyboard. */
const KEYBOARD_MIN = 120;

const isEditable = (el: Element | null): el is HTMLElement =>
  el instanceof HTMLElement && el.matches(EDITABLE) && !(el as HTMLInputElement).readOnly;

export const startViewportTracking = () => {
  const vv = window.visualViewport;
  if (!vv || typeof document === "undefined") return;
  const root = document.documentElement;

  let fullHeight = 0;
  let width = 0;
  let frame = 0;
  let open = false;
  let revealTimer = 0;

  /** Brings the focused field into the visible area (above the keyboard, below the top bar). */
  const reveal = () => {
    const el = document.activeElement;
    if (!isEditable(el)) return;
    const rect = el.getBoundingClientRect();
    const top = vv.offsetTop;
    const bottom = vv.offsetTop + vv.height;
    // The pinned top bar covers the first ~120px of the page on phones.
    const topGuard = window.innerWidth < 900 ? 120 : 16;
    const hidden = rect.bottom > bottom - 12 || rect.top < top + Math.min(topGuard, vv.height / 3);
    if (hidden) el.scrollIntoView({ block: rect.height > vv.height / 2 ? "start" : "center", behavior: "smooth" });
  };
  const revealSoon = (delay: number) => {
    window.clearTimeout(revealTimer);
    revealTimer = window.setTimeout(reveal, delay);
  };

  const update = () => {
    frame = 0;
    // A new width (rotation) means a new full height to learn.
    if (window.innerWidth !== width) {
      width = window.innerWidth;
      fullHeight = 0;
    }
    fullHeight = Math.max(fullHeight, vv.height);
    root.style.setProperty("--vvh", `${Math.round(vv.height)}px`);
    root.style.setProperty("--vv-top", `${Math.round(vv.offsetTop)}px`);

    const nowOpen = isEditable(document.activeElement) && fullHeight - vv.height > KEYBOARD_MIN;
    if (nowOpen !== open) {
      open = nowOpen;
      root.classList.toggle("kb-open", open);
      // The keyboard just finished opening: make sure the field is in view.
      if (open) revealSoon(60);
    }
  };
  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };

  vv.addEventListener("resize", schedule);
  vv.addEventListener("scroll", schedule);
  window.addEventListener("orientationchange", schedule);
  document.addEventListener("focusin", (e) => {
    if (!isEditable(e.target as Element)) return;
    schedule();
    // The keyboard is already up (moving between fields) or is animating in.
    revealSoon(open ? 60 : 350);
  });
  // Focus leaving a field (to the page or another field): re-check a tick
  // later, once the new focus is known.
  document.addEventListener("focusout", () => window.setTimeout(schedule, 50));
  update();
};
