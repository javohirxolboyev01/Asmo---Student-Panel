// src/components/ui/Popover.tsx
// The one floating panel every picker uses (Select, DateField, TimeField,
// DateTimeField). It's portalled to <body> with fixed positioning, so a sheet's
// scroll area never clips it; it opens below its field, or above when there's
// no room, follows scrolling/resizing, and closes on an outside tap or Esc.
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

const GAP = 6;
const EDGE = 8;

interface Place {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  above: boolean;
}

export const Popover = ({
  anchor,
  open,
  onClose,
  children,
  className,
  minWidth = 0,
  maxHeight = 360,
  matchWidth = true,
  role,
  id,
  label,
  sheet = false,
}: {
  anchor: RefObject<HTMLElement>;
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
  /** At least this wide (a calendar needs ~300px even under a narrow field). */
  minWidth?: number;
  maxHeight?: number;
  /** Same width as the field (lists) or its own width (calendars). */
  matchWidth?: boolean;
  role?: string;
  id?: string;
  label?: string;
  /** On phones, open as a bottom sheet (calendars and time wheels need the room). */
  sheet?: boolean;
}) => {
  const panel = useRef<HTMLDivElement>(null);
  const [place, setPlace] = useState<Place | null>(null);

  const measure = useCallback(() => {
    const a = anchor.current;
    if (!a) return;
    const r = a.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.visualViewport?.height ?? window.innerHeight;
    const width = Math.min(vw - EDGE * 2, Math.max(minWidth, matchWidth ? r.width : 0) || r.width);
    const below = vh - r.bottom - GAP - EDGE;
    const aboveRoom = r.top - GAP - EDGE;
    const natural = Math.min(maxHeight, panel.current?.scrollHeight ?? maxHeight);
    // Flip up when the panel doesn't fit below and there's more room above.
    const above = below < natural && aboveRoom > below;
    const room = above ? aboveRoom : below;
    setPlace({
      top: above ? r.top - GAP : r.bottom + GAP,
      left: Math.min(Math.max(EDGE, r.left), vw - width - EDGE),
      width,
      maxHeight: Math.max(160, Math.min(maxHeight, room)),
      above,
    });
  }, [anchor, minWidth, maxHeight, matchWidth]);

  useLayoutEffect(() => {
    if (!open) return setPlace(null);
    measure();
    // Second pass once the panel has its real height (flip if it doesn't fit).
    const frame = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(frame);
  }, [open, measure]);

  useEffect(() => {
    if (!open) return;
    const onMove = () => measure();
    window.addEventListener("resize", onMove);
    window.visualViewport?.addEventListener("resize", onMove);
    // Capture: also scrolling inside a sheet. Scrolling the panel itself is fine.
    const onScroll = (e: Event) => {
      if (panel.current && e.target instanceof Node && panel.current.contains(e.target)) return;
      measure();
    };
    window.addEventListener("scroll", onScroll, true);
    const onDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (panel.current?.contains(target) || anchor.current?.contains(target)) return;
      onClose();
    };
    document.addEventListener("pointerdown", onDown, true);
    return () => {
      window.removeEventListener("resize", onMove);
      window.visualViewport?.removeEventListener("resize", onMove);
      window.removeEventListener("scroll", onScroll, true);
      document.removeEventListener("pointerdown", onDown, true);
    };
  }, [open, measure, onClose, anchor]);

  if (!open) return null;
  const escape = (e: React.KeyboardEvent) => {
    if (e.key !== "Escape") return;
    // Close the picker, not the sheet around it.
    e.stopPropagation();
    e.nativeEvent.stopImmediatePropagation();
    onClose();
    anchor.current?.focus();
  };
  if (sheet && window.innerWidth < 600)
    return createPortal(
      <div className="fixed inset-0 z-[200]" onKeyDown={escape}>
        <div className="u-overlay absolute inset-0 animate-overlay-in" onClick={onClose} aria-hidden="true" />
        <div
          ref={panel}
          id={id}
          role={role}
          aria-modal="true"
          aria-label={label}
          className={cn("u-pop u-popover u-pick-sheet", className)}
        >
          <span className="u-pick-grab" aria-hidden="true" />
          {label && <b className="u-pick-title">{label}</b>}
          {children}
        </div>
      </div>,
      document.body,
    );
  return createPortal(
    <div
      ref={panel}
      id={id}
      role={role}
      aria-label={label}
      className={cn("u-pop u-popover fixed z-[200] overflow-y-auto overscroll-contain p-1.5", className)}
      style={
        place
          ? {
              top: place.above ? undefined : place.top,
              bottom: place.above ? window.innerHeight - place.top : undefined,
              left: place.left,
              width: place.width,
              maxHeight: place.maxHeight,
              transformOrigin: place.above ? "bottom center" : "top center",
            }
          : { visibility: "hidden", top: 0, left: 0 }
      }
      onKeyDown={escape}
    >
      {children}
    </div>,
    document.body,
  );
};

/** Label + field + error, the same frame Input uses, for the custom pickers. */
export const FieldFrame = ({
  label,
  htmlFor,
  error,
  hint,
  className,
  children,
}: {
  label?: ReactNode;
  htmlFor: string;
  error?: string;
  hint?: ReactNode;
  className?: string;
  children: ReactNode;
}) => (
  <div className={cn("w-full", className)}>
    {label && (
      <label htmlFor={htmlFor} className="block text-[14px] font-bold text-u-tx mb-1.5">
        {label}
      </label>
    )}
    <div className="relative">{children}</div>
    {error ? (
      <p className="mt-1.5 text-[13px] font-bold text-u-er">{error}</p>
    ) : (
      hint && <p className="mt-1.5 text-[12.5px] font-semibold text-u-mu">{hint}</p>
    )}
  </div>
);
