// src/student/components/ui.tsx
// Shared building blocks of the "Kosmik maktab" student theme. Every student
// page uses these so empty / loading / error states look the same everywhere.
import { Component, useEffect, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { useTranslation } from "@/hooks/useTranslation";
import { ChevronLeft } from "lucide-react";
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

export const PageHeader = ({
  title,
  subtitle,
  right,
  back,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  right?: ReactNode;
  /** Back button above the header; `to` = logical parent (see BackLink). */
  back?: { to: string; label?: ReactNode };
}) => (
  <>
    {back && <BackLink to={back.to} />}
    <div className="sp-ph">
      <div className="min-w-0">
        <h1 className="sp-title">{title}</h1>
        {subtitle && <p className="sp-sub">{subtitle}</p>}
      </div>
      {right}
    </div>
  </>
);

// ── Empty / error / loading ──

export const EmptyState = ({
  emoji,
  title,
  text,
  action,
  panel = true,
  className = "",
}: {
  emoji: string;
  title?: ReactNode;
  text?: ReactNode;
  action?: ReactNode;
  /** Wrap in a card (default) or render bare inside an existing card. */
  panel?: boolean;
  className?: string;
}) => (
  <div className={`${panel ? "sp-panel " : ""}sp-empty ${className}`}>
    <div aria-hidden="true">{emoji}</div>
    {title && <b>{title}</b>}
    {text}
    {action && <div>{action}</div>}
  </div>
);

export const ErrorState = ({ message, onRetry }: { message?: ReactNode; onRetry?: () => void }) => {
  const { t } = useTranslation();
  return (
    <EmptyState
      emoji="🛰"
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
      <div className="sp-loader-rocket" aria-hidden="true">
        🚀
      </div>
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

export const Spinner = () => <span className="sp-spin" aria-hidden="true" />;

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
    <span aria-hidden="true">🔍</span>
    <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
    {value && (
      <button type="button" className="sp-mute-btn" onClick={() => onChange("")} aria-label="×">
        ✕
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
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  wide?: boolean;
  labelledBy?: string;
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
    <div className="sp-modal" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={wide ? "sp-mb sp-wide" : "sp-mb"} role="dialog" aria-modal="true" aria-labelledby={labelledBy}>
        {children}
      </div>
    </div>,
    host,
  );
};

// ── Effects ──

/** Emoji burst flying out of `el` (coins earned, etc.). */
export const burst = (el: Element | null, emoji = "💎", count = 6) => {
  if (!el || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const r = el.getBoundingClientRect();
  const host = document.querySelector(".sp") ?? document.body;
  for (let i = 0; i < count; i++) {
    const d = document.createElement("div");
    d.className = "sp-fx";
    d.textContent = emoji;
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
