// src/student/components/icons.tsx
// iOS-style icon building blocks for the student panel. Lucide line icons
// stand in for SF Symbols (SF Symbols may only ship inside Apple-platform
// apps, so they can't be used on the web).
//  - IconTile: the coloured rounded square of iOS Settings rows.
//  - CoinGlyph: the coin currency mark, used wherever 💎 used to be.
import type { CSSProperties, ReactNode } from "react";
import { Gem, type LucideIcon } from "lucide-react";

/** iOS system tints (see --sp-tint-* in space.css). */
export type Tint =
  | "blue"
  | "green"
  | "orange"
  | "red"
  | "purple"
  | "teal"
  | "indigo"
  | "pink"
  | "yellow"
  | "gray"
  | "mint"
  | "brown";

export const TINTS: Tint[] = ["blue", "green", "orange", "red", "purple", "teal", "indigo", "pink", "mint", "brown"];

/** Stable tint for an id (groups, products…), so the same item keeps its colour. */
export const tintFor = (id: string): Tint => {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return TINTS[Math.abs(h) % TINTS.length];
};

export const IconTile = ({
  icon: Icon,
  children,
  tint = "blue",
  size = "md",
  soft = false,
  className = "",
}: {
  icon?: LucideIcon;
  /** Text content (e.g. a number) instead of an icon. */
  children?: ReactNode;
  tint?: Tint;
  /** sm = 29pt (Settings rows), md = 40, lg = 56 */
  size?: "sm" | "md" | "lg";
  /** Tinted glyph on a pale tile instead of white glyph on a solid tile. */
  soft?: boolean;
  className?: string;
}) => (
  <span
    className={`sp-tile sp-tile-${size}${soft ? " sp-tile-soft" : ""} ${className}`}
    style={{ "--tint": `var(--sp-tint-${tint})` } as CSSProperties}
    aria-hidden="true"
  >
    {Icon ? <Icon strokeWidth={2.1} /> : <span className="sp-tile-txt">{children}</span>}
  </span>
);

/** Inline coin mark; inherits font size. */
export const CoinGlyph = ({ className = "" }: { className?: string }) => (
  <Gem className={`sp-coin ${className}`} aria-hidden="true" strokeWidth={2.2} />
);

/** Inline symbol sized to the surrounding text (📅 ⏰ 👥 replacements). */
export const InlineIcon = ({ icon: Icon }: { icon: LucideIcon }) => (
  <Icon className="sp-ii" aria-hidden="true" strokeWidth={2.2} />
);
