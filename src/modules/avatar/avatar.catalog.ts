// src/modules/avatar/avatar.catalog.ts — the character editor's item catalog.
// Must stay in sync with the frontend's src/student/lib/character.ts (same
// item order and prices); the server is the source of truth for prices.

export type Gender = "m" | "f";

export const PRICES = {
  hair: { m: [0, 0, 0, 0, 5, 8], f: [0, 0, 0, 0, 5, 8] },
  outfit: { m: [0, 0, 0, 5, 10, 15], f: [0, 0, 0, 5, 10, 15] },
  beard: [0, 3, 5, 8],
  hat: [0, 0, 5, 5, 10, 20, 0, 5],
  glasses: [0, 0, 3, 5, 10],
  bg: [0, 0, 0, 0, 0, 5],
} as const;

/** Hats offered per gender (indexes into PRICES.hat). */
export const HATS: Record<Gender, readonly number[]> = { m: [0, 1, 2, 3, 4, 5], f: [0, 6, 7, 1, 2, 3, 4, 5] };

export const COLOR_COUNTS = { skin: 5, hc: 7, eyes: 5 } as const;

export type Category = "hair" | "outfit" | "beard" | "hat" | "glasses" | "bg";

export interface CharacterConfig {
  g: Gender;
  skin: number;
  hair: number;
  hc: number;
  eyes: number;
  beard: number;
  outfit: number;
  hat: number;
  glasses: number;
  bg: number;
}

const GENDERED: Category[] = ["hair", "outfit", "beard"];

export const itemKey = (cat: Category, v: number, g: Gender) => (GENDERED.includes(cat) ? `${cat}:${g}:${v}` : `${cat}:${v}`);

const listFor = (cat: Category, g: Gender): readonly number[] => {
  if (cat === "hair" || cat === "outfit") return PRICES[cat][g];
  return PRICES[cat];
};

/** Price of a catalog item, or null when the key isn't a real item. */
export function priceOfKey(key: string): number | null {
  const parts = key.split(":");
  const cat = parts[0] as Category;
  if (!(cat in PRICES)) return null;
  const gendered = GENDERED.includes(cat);
  if (parts.length !== (gendered ? 3 : 2)) return null;
  const g = (gendered ? parts[1] : "m") as Gender;
  if (g !== "m" && g !== "f") return null;
  if (cat === "beard" && g === "f") return null;
  const raw = parts[parts.length - 1] ?? "";
  if (!/^\d{1,2}$/.test(raw)) return null;
  const price = listFor(cat, g)[Number(raw)];
  return price === undefined ? null : price;
}

/**
 * Validates a config against the catalog. Returns the paid item keys it uses
 * (the caller checks they're owned) or an error message.
 */
export function paidItemsOf(c: CharacterConfig): { keys: string[] } | { error: string } {
  const inRange = (v: number, n: number) => Number.isInteger(v) && v >= 0 && v < n;
  if (!inRange(c.skin, COLOR_COUNTS.skin) || !inRange(c.hc, COLOR_COUNTS.hc) || !inRange(c.eyes, COLOR_COUNTS.eyes))
    return { error: "Invalid colour" };
  if (c.g === "f" && c.beard !== 0) return { error: "Invalid beard" };
  if (!HATS[c.g].includes(c.hat)) return { error: "Invalid hat" };
  const keys: string[] = [];
  for (const cat of ["hair", "outfit", "beard", "hat", "glasses", "bg"] as const) {
    const v = c[cat];
    const price = listFor(cat, c.g)[v];
    if (!Number.isInteger(v) || price === undefined) return { error: `Invalid ${cat}` };
    if (price > 0) keys.push(itemKey(cat, v, c.g));
  }
  return { keys };
}
