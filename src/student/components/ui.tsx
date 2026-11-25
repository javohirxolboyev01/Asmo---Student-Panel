// src/student/components/ui.tsx
// Shared building blocks of the student panel (iOS style). Every student
// page uses these so headers, empty / loading / error states, sheets and
// controls look the same everywhere.
import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import { ChevronLeft, CircleX, Search, WifiOff, type LucideIcon } from "lucide-react";
import { useGoBack } from "@/hooks/useNavigationHistory";

// ── Page header ──

/**
 * Back button of a nested page: "‹ Orqaga". Goes to the page the user came
 * from; `to` is the logical parent, used when there is no in-app history
 * (deep link, new tab).
 */
export const BackLink = ({ to }: { to: string }) => {
  const { t } = useTranslation();
  const goBack = useGoBack(to);
  return (
    <Link
      to={to}
      className="sp-back"
      onClick={(e) => {
        // Let ctrl/cmd-click open the parent in a new tab.
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        goBack();
      }}
    >
      <ChevronLeft aria-hidden="true" strokeWidth={2.75} />
      {t("common.back")}
    </Link>
  );
};

/**
 * iOS navigation bar + large title. The bar is sticky; once the large title
 * scrolls under it, the bar turns frosted and shows the title in the middle
 * (UINavigationBar large-title behaviour).
 */
export const PageHeader = ({
  title,
  subtitle,
  right,
  back,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  /** Back button in the bar; `to` = logical parent (see BackLink). */
  back?: { to: string; label?: ReactNode };
}) => {
  const titleRef = useRef<HTMLHeadingElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const el = titleRef.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    // The title counts as "gone" once it slides under the pinned bars
    // (on phones the HUD is pinned above the nav bar).
    const bar = barRef.current;
    const stuckTop = bar ? parseFloat(getComputedStyle(bar).top) || 0 : 0;
    const offset = Math.round(stuckTop + 52);
    const io = new IntersectionObserver(([entry]) => setCollapsed(!entry.isIntersecting), {
      rootMargin: `-${offset}px 0px 0px 0px`,
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <>
      <div ref={barRef} className={collapsed ? "sp-navbar sp-navbar-on" : "sp-navbar"}>
        <div className="sp-navbar-side">{back && <BackLink to={back.to} />}</div>
        <div className="sp-navbar-title" aria-hidden={!collapsed}>
          {title}
        </div>
        <div className="sp-navbar-side sp-navbar-end" />
      </div>
      <div className="sp-ph">
        <div className="min-w-0">
          <h1 className="sp-title" ref={titleRef}>
            {title}
          </h1>
          {subtitle && <p className="sp-sub">{subtitle}</p>}
        </div>
        {right}
      </div>
    </>
  );
};

// ── Empty / error / loading ──

/** iOS ContentUnavailableView: large grey symbol, bold title, grey text. */
export const EmptyState = ({
  icon: Icon,
  emoji,
  title,
  text,
  action,
  panel = true,
  className = "",
}: {
  icon?: LucideIcon;
  /** Legacy; prefer `icon`. */
  emoji?: string;
  title?: ReactNode;
  text?: ReactNode;
  action?: ReactNode;
  /** Wrap in a card (default) or render bare inside an existing card. */
  panel?: boolean;
  className?: string;
}) => (
  <div className={`${panel ? "sp-panel " : ""}sp-empty ${className}`}>
    <div className="sp-empty-ic" aria-hidden="true">
      {Icon ? <Icon strokeWidth={1.6} /> : emoji}
    </div>
    {title && <b>{title}</b>}
    {text}
    {action && <div>{action}</div>}
  </div>
);

export const ErrorState = ({ message, onRetry }: { message?: ReactNode; onRetry?: () => void }) => {
  const { t } = useTranslation();
  return (
    <EmptyState
      icon={WifiOff}
      title={message ?? t("common.error")}
      text={t("space.errorHint")}
      className="mt-4"
      action={
        onRetry && (
          <button className="sp-cta" onClick={onRetry}>
            {t("common.retry")}
          </button>
        )
      }
    />
  );
};

/** Full-area loader (route chunks, first load). */
export const SpaceLoader = ({ label }: { label?: ReactNode }) => {
  const { t } = useTranslation();
  return (
    <div className="sp-loader" role="status" aria-live="polite">
      <Spinner large />
      <span>{label ?? t("common.loading")}</span>
    </div>
  );
};

/** Pulsing placeholder block; size it with Tailwind (h-*, w-*, mt-*). */
export const Skel = ({ className = "" }: { className?: string }) => (
  <div className={`sp-skel ${className}`} aria-hidden="true" />
);

/** Header + N rows skeleton, the default for list pages. */
export const PageSkeleton = ({ rows = 4, rowClass = "h-20" }: { rows?: number; rowClass?: string }) => (
  <div aria-busy="true">
    <Skel className="mt-5 h-9 w-2/3" />
    <Skel className="mt-2 h-4 w-1/2" />
    <div className="mt-5 space-y-3">
      {Array.from({ length: rows }, (_, i) => (
        <Skel key={i} className={rowClass} />
      ))}
    </div>
  </div>
);

/** iOS activity indicator (UIActivityIndicatorView): 8 fading spokes. */
export const Spinner = ({ large = false }: { large?: boolean }) => (
  <span className={large ? "sp-spin sp-spin-lg" : "sp-spin"} aria-hidden="true">
    <svg viewBox="0 0 24 24">
      {Array.from({ length: 8 }, (_, i) => (
        <line
          key={i}
          x1="12"
          y1="3"
          x2="12"
          y2="7.5"
          transform={`rotate(${i * 45} 12 12)`}
          opacity={0.25 + (i * 0.75) / 7}
        />
      ))}
    </svg>
  </span>
);

// ── Controls ──

export const Segmented = <T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: ReactNode }[];
  onChange: (value: T) => void;
}) => (
  <div className="sp-seg" role="tablist">
    {options.map((o) => (
      <button
        key={o.value}
        role="tab"
        aria-selected={value === o.value}
        className={value === o.value ? "on" : undefined}
        onClick={() => onChange(o.value)}
      >
        {o.label}
      </button>
    ))}
  </div>
);

export const SearchBox = ({
  value,
  onChange,
  placeholder,
  className = "",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  className?: string;
}) => (
  <label className={`sp-search ${className}`}>
    <Search className="sp-search-ic" aria-hidden="true" strokeWidth={2.2} />
    <input
      type="search"
      enterKeyHint="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
    />
    {value && (
      <button type="button" className="sp-search-clear" onClick={() => onChange("")} aria-label="×">
        <CircleX aria-hidden="true" />
      </button>
    )}
  </label>
);

export const Switch = ({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  disabled?: boolean;
}) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    aria-label={label}
    disabled={disabled}
    className={checked ? "sp-sw on" : "sp-sw"}
    onClick={() => onChange(!checked)}
  />
);

// ── Modal ──

export const Modal = ({
  open,
  onClose,
  children,
  wide,
  labelledBy,
  sheet,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
  labelledBy?: string;
  /** iOS sheet: slides up from the bottom on phones (grabber on top). Default is a centred alert. */
  sheet?: boolean;
}) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;
  // Portal into the themed root so the `.sp` tokens still apply.
  const host = document.querySelector(".sp") ?? document.body;
  return createPortal(
    <div className={sheet ? "sp-modal sp-modal-sheet" : "sp-modal"} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div
        className={["sp-mb", wide && "sp-wide", sheet && "sp-sheet"].filter(Boolean).join(" ")}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
      >
        {children}
      </div>
    </div>,
    host,
  );
};

// ── Effects ──

// Small SVG glyphs for the reward burst (Lucide "gem" / "star" paths).
const BURST_GLYPH: Record<string, { tint: string; svg: string }> = {
  "💎": {
    tint: "var(--sp-cyan)",
    svg: '<path d="M6 3h12l4 6-10 13L2 9Z"/><path d="M11 3 8 9l4 13 4-13-3-6"/><path d="M2 9h20"/>',
  },
  "⭐": {
    tint: "var(--sp-sun)",
    svg: '<path d="M12 2.5l2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.3l-5.8 3.1 1.1-6.5L2.6 9.3l6.5-.9z"/>',
  },
};

/** Reward burst flying out of `el` (coins earned, etc.). `emoji` picks the glyph: "💎" coin or "⭐" star. */
export const burst = (el: Element | null, emoji = "💎", count = 6) => {
  if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const glyph = BURST_GLYPH[emoji] ?? BURST_GLYPH["💎"];
  const r = el.getBoundingClientRect();
  const host = document.querySelector(".sp") ?? document.body;
  for (let i = 0; i < count; i++) {
    const d = document.createElement("div");
    d.className = "sp-fx";
    d.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${glyph.svg}</svg>`;
    d.style.color = glyph.tint;
    d.style.left = `${r.left + r.width / 2 + Math.random() * 60 - 30}px`;
    d.style.top = `${r.top + r.height / 2}px`;
    d.style.setProperty("--dx", `${Math.random() * 160 - 80}px`);
    d.style.setProperty("--dy", `${-80 - Math.random() * 120}px`);
    host.appendChild(d);
    window.setTimeout(() => d.remove(), 1000);
  }
};

// ── Error boundary ──

export class SpaceErrorBoundary extends Component<{ children: ReactNode; fallback: (retry: () => void) => ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: unknown) {
    console.error(error);
  }
  render() {
    if (this.state.failed) return this.props.fallback(() => this.setState({ failed: false }));
    return this.props.children;
  }
}
