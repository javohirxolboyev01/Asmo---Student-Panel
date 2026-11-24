// src/teacher/components/ui.tsx
// Building blocks of the teacher panel (iOS style; classes in
// theme/ustoz.css, `u-` prefix). Pages compose these so headers, tags,
// avatars and empty states look the same everywhere.
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useTopBar } from "./topBar";
import { Link } from "react-router-dom";
import { Check, ChevronLeft, Coins } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { useGoBack } from "@/hooks/useNavigationHistory";
import { cn } from "@/lib/utils";

// ── Colours ──

/** Avatar monograms (bg, text): soft iOS system tints; picked by a stable hash of the seed. */
const AV_COLORS: [string, string][] = [
  ["#dbe9f9", "#0058b0"],
  ["#ffe8cc", "#a14a00"],
  ["#d9f2df", "#1b6e31"],
  ["#ffdfe2", "#b0001a"],
  ["#ecdcf5", "#7a3a99"],
  ["#d5eef2", "#0b6a7a"],
];
/** Group accent colours: iOS system tints (used when a direction has no colour). */
export const GROUP_COLORS = ["#0066cc", "#e07800", "#1e8e3e", "#c41c5f", "#8944ab"];

export const hashOf = (seed: string) => {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return Math.abs(h);
};

/** Accent of a group: its direction colour, else a stable mock colour. */
export const groupColor = (id: string, directionColor?: string | null) =>
  directionColor && /^#[0-9a-f]{6}$/i.test(directionColor) ? directionColor : GROUP_COLORS[hashOf(id) % GROUP_COLORS.length];

export const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "?";

// ── Avatar ──

/** Round avatar: the user's picture when there is one, else coloured initials (mock `.av`). */
export const Avatar = ({
  name,
  src,
  seed,
  size,
  className,
}: {
  name: string;
  src?: string | null;
  /** Stable colour seed (user id); defaults to the name. */
  seed?: string;
  size?: "s" | "xl";
  className?: string;
}) => {
  const [bg, fg] = AV_COLORS[hashOf(seed ?? name) % AV_COLORS.length];
  // A broken picture link falls back to the initials instead of a broken-image icon.
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  return (
    <span
      className={cn("u-av", size, className)}
      style={{ "--c": bg, "--t": fg } as CSSProperties}
      aria-hidden="true"
    >
      {src && !failed ? <img src={src} alt="" loading="lazy" onError={() => setFailed(true)} /> : initials(name)}
    </span>
  );
};

// ── Page header ──

/** "‹ Orqaga" link: goes to the page the user came from, else to `to`. */
export const BackLink = ({ to, label }: { to: string; label?: ReactNode }) => {
  const { t } = useTranslation();
  const goBack = useGoBack(to);
  return (
    <Link
      to={to}
      className="u-back"
      onClick={(e) => {
        // Let ctrl/cmd-click open the parent in a new tab.
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
        e.preventDefault();
        goBack();
      }}
    >
      <ChevronLeft className="u-i m" strokeWidth={2} aria-hidden="true" />
      {label ?? t("common.back")}
    </Link>
  );
};

/**
 * Back button of a page without a PageHeader (hero pages): inside the
 * teacher layout it moves into the top bar, otherwise it renders inline.
 */
export const BackButton = ({ to, label }: { to: string; label?: ReactNode }) => {
  const bar = useTopBar();
  useEffect(() => {
    if (!bar) return;
    bar.set({ title: null, back: { to, label }, collapsed: false });
    return () => bar.set(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bar, to]);
  return bar ? null : <BackLink to={to} label={label} />;
};

/**
 * Large title + subtitle on the left, actions on the right. The back button
 * and the compact title live in the shared top bar (UINavigationBar style,
 * see topBar.tsx); without the layout it falls back to an inline back link.
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
  back?: { to: string; label?: ReactNode };
}) => {
  const bar = useTopBar();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const titleKey = typeof title === "string" || typeof title === "number" ? title : null;

  useEffect(() => {
    if (!bar) return;
    const el = titleRef.current;
    let collapsed = false;
    const push = () => bar.set({ title, back, collapsed });
    push();
    let io: IntersectionObserver | undefined;
    if (el && typeof IntersectionObserver !== "undefined") {
      // The bar is ~52px tall; the title counts as gone once it slides under it.
      io = new IntersectionObserver(
        ([entry]) => {
          collapsed = !entry.isIntersecting;
          push();
        },
        { rootMargin: "-56px 0px 0px 0px" },
      );
      io.observe(el);
    }
    return () => {
      io?.disconnect();
      bar.set(null);
    };
    // title/back are re-read when their identity-stable parts change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bar, titleKey, back?.to]);

  return (
    <>
      {back && !bar && <BackLink to={back.to} label={back.label} />}
      <div className="u-hd">
        <div>
          <h1 className="break-words" ref={titleRef}>
            {title}
          </h1>
          {subtitle && <p className="u-sub">{subtitle}</p>}
        </div>
        {right && <div className="u-hd-r">{right}</div>}
      </div>
    </>
  );
};

/** Mock `.sech`: section title + action on the right. */
export const SectionHead = ({
  title,
  right,
  level = 2,
  className,
}: {
  title: ReactNode;
  right?: ReactNode;
  level?: 2 | 3;
  className?: string;
}) => (
  <div className={cn("u-sech", className)}>
    {level === 2 ? <h2>{title}</h2> : <h3>{title}</h3>}
    {right}
  </div>
);

// ── Small pieces ──

export type Tone = "ok" | "er" | "gd" | "pr" | "mu";

export const Tag = ({ tone = "pr", children, className }: { tone?: Tone; children: ReactNode; className?: string }) => (
  <span className={cn("u-tag", tone, className)}>{children}</span>
);

/** Gold coin pill (mock `.coin`). */
export const CoinTag = ({ n, className }: { n: ReactNode; className?: string }) => (
  <span className={cn("u-coin", className)}>
    <Coins className="u-i s" strokeWidth={2} aria-hidden="true" />
    {n}
  </span>
);

/** Mock `.empty`: round icon, title, text, optional action. */
export const EmptyBox = ({
  title,
  text,
  icon: Icon = Check,
  tone = "ok",
  action,
  card = true,
  className,
}: {
  title: ReactNode;
  text?: ReactNode;
  icon?: typeof Check;
  tone?: "ok" | "mu" | "er";
  action?: ReactNode;
  /** Wrap in a `.card` (default) or render bare inside an existing card. */
  card?: boolean;
  className?: string;
}) => (
  <div className={cn(card && "u-card", className)}>
    <div className="u-empty">
      <div className={cn("em", tone !== "ok" && tone)}>
        <Icon className="u-i l" strokeWidth={2} aria-hidden="true" />
      </div>
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {action && <div className="mt-4 flex justify-center">{action}</div>}
    </div>
  </div>
);

/** Mock `.seg`: segmented control. An option's `tone` colours it when selected (Keldi = ok, Yo'q = er). */
export const Seg = <T extends string>({
  value,
  options,
  onChange,
  small,
  className,
  label,
}: {
  value: T | null | undefined;
  options: { value: T; label: ReactNode; tone?: "ok" | "er" }[];
  onChange: (value: T) => void;
  small?: boolean;
  className?: string;
  label?: string;
}) => (
  <div className={cn("u-seg", small && "s", className)} role="radiogroup" aria-label={label}>
    {options.map((o) => (
      <button
        key={o.value}
        type="button"
        role="radio"
        aria-checked={value === o.value}
        className={value === o.value ? cn("on", o.tone) : undefined}
        onClick={() => onChange(o.value)}
      >
        {o.label}
      </button>
    ))}
  </div>
);

/** Mock `.ring`: percentage ring; red under 50, green otherwise, grey when unknown. */
export const Ring = ({ percent }: { percent: number | null | undefined }) => {
  const known = percent !== null && percent !== undefined;
  const color = !known ? "var(--ln)" : percent < 50 ? "var(--er)" : "var(--ok)";
  return (
    <span className="u-ring" style={{ "--p": known ? percent : 0, "--rc": color } as CSSProperties}>
      <b>{known ? `${Math.round(percent)}%` : "—"}</b>
    </span>
  );
};

/** Mock `.tgl` switch. */
export const Toggle = ({ on }: { on: boolean }) => <span className={cn("u-tgl", on && "on")} aria-hidden="true" />;

/** Mock `.bar` progress (0–100), coloured by `--g` (defaults to primary). */
export const Bar = ({ value, color }: { value: number; color?: string }) => (
  <div className="u-bar" style={color ? ({ "--g": color } as CSSProperties) : undefined}>
    <i style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
  </div>
);

// ── Dates & schedule ──

const MONTHS = ["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avg", "sen", "okt", "noy", "dek"];
/** Mon..Sat short labels (mock shows Du–Ju; Shanba appears only when a group uses it). */
export const DAY_SHORT = ["Du", "Se", "Cho", "Pay", "Ju", "Sha"];

/** Mock `.db` date box: day number over the short month. */
export const DateBox = ({ date }: { date: string | Date }) => {
  const d = new Date(date);
  const valid = !Number.isNaN(d.getTime());
  return (
    <span className="u-db" aria-hidden="true">
      <b>{valid ? d.getDate() : "—"}</b>
      <small>{valid ? MONTHS[d.getMonth()] : ""}</small>
    </span>
  );
};

export const formatDate = (date: string | Date) => {
  const d = new Date(date);
  return Number.isNaN(d.getTime()) ? "" : d.toLocaleDateString("ru-RU");
};

// Day-name stems in uz/ru/en, Monday = 0.
const DAY_STEMS: string[][] = [
  ["dush", "du", "пн", "пон", "mon"],
  ["sesh", "se", "вт", "вто", "tue"],
  ["chor", "cho", "ср", "сре", "wed"],
  ["pay", "чт", "чет", "thu"],
  ["jum", "ju", "пт", "пят", "fri"],
  ["shan", "sha", "сб", "суб", "sat"],
];

/**
 * Weekday indexes (Mon = 0 … Sat = 5) of a free-text schedule such as
 * ["dush-juma"], ["dush","chor","jum"] or ["Mon, Wed"]. A two-day range
 * ("dush-juma") means every day between them, like in the mock.
 */
export const parseScheduleDays = (days: string[] | undefined | null): number[] => {
  if (!days?.length) return [];
  const text = days.join(",").toLowerCase();
  const tokens = text.split(/[\s,;/]+/).filter(Boolean);
  const indexOf = (token: string) => DAY_STEMS.findIndex((stems) => stems.some((stem) => token.startsWith(stem)));
  const found = new Set<number>();
  for (const token of tokens) {
    const range = token.split(/[-–—]/);
    if (range.length === 2) {
      const a = indexOf(range[0]);
      const b = indexOf(range[1]);
      if (a >= 0 && b >= a) {
        for (let i = a; i <= b; i++) found.add(i);
        continue;
      }
    }
    const i = indexOf(token);
    if (i >= 0) found.add(i);
  }
  return [...found].sort((a, b) => a - b);
};

/** Mock `.wk`: Du–Sha dots (lessons run Mon–Sat), the group's days filled with its colour. */
export const WeekDots = ({ days, color }: { days: number[]; color?: string }) => {
  return (
    <div className="u-wk" style={color ? ({ "--g": color } as CSSProperties) : undefined}>
      {DAY_SHORT.map((d, i) => (
        <i key={d} className={days.includes(i) ? "on" : undefined}>
          {d}
        </i>
      ))}
    </div>
  );
};

// ── Loading ──

/** Pulsing placeholder; size with Tailwind (h-*, w-*). */
export const Skel = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse rounded-[22px] bg-u-sf2", className)} aria-hidden="true" />
);

/** Header + rows skeleton, the default for list pages. */
export const PageSkeleton = ({ rows = 4, rowClass = "h-20" }: { rows?: number; rowClass?: string }) => (
  <div aria-busy="true">
    <Skel className="mt-2 h-8 w-1/2 rounded-xl" />
    <Skel className="mt-2 h-4 w-1/3 rounded-lg" />
    <div className="mt-6 grid gap-3">
      {Array.from({ length: rows }, (_, i) => (
        <Skel key={i} className={rowClass} />
      ))}
    </div>
  </div>
);
