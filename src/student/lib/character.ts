// src/student/lib/character.ts
// Character editor ("Qahramoningni yarat"): item catalog + SVG renderer,
// ported 1:1 from the profile mock. Item order and prices must stay in sync
// with the backend catalog (arxetectura/src/modules/avatar/avatar.catalog.ts)
// — the server owns prices and checks ownership on purchase / save.
//
// Everything rendered here comes from the constant tables below indexed by
// validated integers, so the SVG strings are safe to inject.

export type Gender = "m" | "f";
export type Category = "skin" | "hair" | "eyes" | "beard" | "outfit" | "hat" | "glasses" | "bg";
export type ItemCategory = Exclude<Category, "skin" | "eyes">;

export interface Character {
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

export const DEFAULT_CHARACTER: Character = { g: "m", skin: 1, hair: 0, hc: 1, eyes: 0, beard: 0, outfit: 0, hat: 1, glasses: 0, bg: 0 };

export const SKIN = ["#fbd5b0", "#f0b98a", "#d09460", "#9a6238", "#63402a"];
export const HAIR_COLORS = ["#2b1d16", "#6b3f22", "#c98a3a", "#ecc76a", "#d8452b", "#8a8f9c", "#3a5bd9"];
export const EYE_COLORS = ["#5b3a22", "#2f7de8", "#2fa05a", "#a8793a", "#7c8590"];
export const BACKGROUNDS: [string, string][] = [
  ["#bfe3ff", "#8ec5ff"],
  ["#ffd9a8", "#ffb86b"],
  ["#d4f7c2", "#9be78a"],
  ["#e5d1ff", "#c3a1ff"],
  ["#ffc9dc", "#ff9bbd"],
  ["#1a1250", "#4a2fa0"],
];
const BG_PRICES = [0, 0, 0, 0, 0, 5];
const BG_NAMES = ["Osmon", "Quyosh botishi", "Maysa", "Binafsha", "Pushti", "Kosmos"];

type Item<T> = [name: string, price: number, draw: T];

const circles = (c: string, a: number[][]) => a.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`).join("");
const bang = (c: string) => `<path d="M60 86Q54 44 100 40Q146 44 140 86Q134 60 100 60Q66 60 60 86Z" fill="${c}"/>`;

// [back layer, front layer]
const HAIR: Record<Gender, Item<(c: string) => [string, string]>[]> = {
  m: [
    ["Qisqa", 0, (c) => ["", `<path d="M60 86Q54 44 100 40Q146 44 140 86Q132 62 100 62Q68 62 60 86Z" fill="${c}"/>`]],
    ["Tikka", 0, (c) => ["", `<path d="M60 86L56 50L74 58L80 36L96 52L112 34L122 56L142 46L140 86Q132 64 100 64Q68 64 60 86Z" fill="${c}"/>`]],
    ["Yon bo'lak", 0, (c) => ["", `<path d="M60 86Q50 40 100 38Q150 40 140 84Q138 66 122 56Q100 72 70 64Q64 72 60 86Z" fill="${c}"/>`]],
    ["Kalta", 0, (c) => ["", `<path d="M62 78Q62 48 100 46Q138 48 138 78Q120 60 100 60Q80 60 62 78Z" fill="${c}"/>`]],
    ["Jingalak", 5, (c) => ["", circles(c, [[70, 56, 16], [88, 46, 17], [110, 46, 17], [130, 56, 16], [62, 74, 11], [138, 74, 11]])]],
    ["Afro", 8, (c) => [`<circle cx="100" cy="68" r="50" fill="${c}"/>`, `<path d="M62 80Q64 58 100 56Q136 58 138 80Q120 66 100 66Q80 66 62 80Z" fill="${c}"/>`]],
  ],
  f: [
    ["Uzun", 0, (c) => [`<path d="M56 90Q50 36 100 36Q150 36 144 90L152 168Q100 180 48 168Z" fill="${c}"/>`, bang(c)]],
    [
      "Ikki o'rim",
      0,
      (c) => [
        `<ellipse cx="50" cy="118" rx="13" ry="32" fill="${c}"/><ellipse cx="150" cy="118" rx="13" ry="32" fill="${c}"/>`,
        bang(c) + `<circle cx="52" cy="84" r="5" fill="#ff5fa8"/><circle cx="148" cy="84" r="5" fill="#ff5fa8"/>`,
      ],
    ],
    ["Quyruq", 0, (c) => [`<path d="M136 66Q184 76 164 150Q154 112 134 98Z" fill="${c}"/>`, bang(c) + `<circle cx="138" cy="72" r="5" fill="#ff5fa8"/>`]],
    ["Karre", 0, (c) => [`<path d="M56 90Q52 36 100 36Q148 36 144 90L148 132Q100 144 52 132Z" fill="${c}"/>`, bang(c)]],
    ["Bo'g'ma", 5, (c) => [`<circle cx="100" cy="30" r="17" fill="${c}"/>`, bang(c)]],
    [
      "Jingalak",
      8,
      (c) => [
        circles(c, [[50, 96, 16], [150, 96, 16], [46, 122, 13], [154, 122, 13]]) + `<circle cx="100" cy="66" r="46" fill="${c}"/>`,
        `<path d="M62 84Q66 58 100 56Q134 58 138 84Q120 66 100 68Q80 66 62 84Z" fill="${c}"/>`,
      ],
    ],
  ],
};

const MOUSTACHE = (c: string) => `<path d="M82 108Q90 100 100 106Q110 100 118 108Q110 115 100 110Q90 115 82 108Z" fill="${c}"/>`;
const BEARD: Item<(c: string) => string>[] = [
  ["Yo'q", 0, () => ""],
  ["Mo'ylov", 3, MOUSTACHE],
  ["Echki soqol", 5, (c) => `<path d="M88 124Q100 118 112 124Q110 142 100 144Q90 142 88 124Z" fill="${c}"/>` + MOUSTACHE(c)],
  ["To'liq soqol", 8, (c) => `<path d="M61 92Q60 148 100 152Q140 148 139 92Q134 118 118 112Q100 106 82 112Q66 118 61 92Z" fill="${c}"/>`],
];

const star = (cx: number, cy: number, R: number, r: number) => {
  const p: string[] = [];
  for (let i = 0; i < 10; i++) {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const k = i % 2 ? r : R;
    p.push(`${(cx + k * Math.cos(a)).toFixed(1)},${(cy + k * Math.sin(a)).toFixed(1)}`);
  }
  return p.join(" ");
};

const GLASSES: Item<string>[] = [
  ["Yo'q", 0, ""],
  [
    "Dumaloq",
    0,
    `<g fill="#fff3" stroke="#2b2b3a" stroke-width="3.5"><circle cx="84" cy="92" r="15"/><circle cx="116" cy="92" r="15"/></g><path d="M99 91h2M69 90L61 88M131 90L139 88" stroke="#2b2b3a" stroke-width="3"/>`,
  ],
  [
    "Kvadrat",
    3,
    `<g fill="#fff3" stroke="#e8453c" stroke-width="3.5"><rect x="68" y="80" width="30" height="24" rx="6"/><rect x="102" y="80" width="30" height="24" rx="6"/></g><path d="M98 90h4M68 88L61 86M132 88L139 86" stroke="#e8453c" stroke-width="3"/>`,
  ],
  [
    "Quyosh",
    5,
    `<g fill="#161622"><rect x="68" y="80" width="30" height="24" rx="9"/><rect x="102" y="80" width="30" height="24" rx="9"/></g><path d="M98 88h4" stroke="#161622" stroke-width="4"/><path d="M74 86l8-3M108 86l8-3" stroke="#fff6" stroke-width="3" stroke-linecap="round"/>`,
  ],
  [
    "Yulduz",
    10,
    `<g fill="#ffc83d" stroke="#e08a00" stroke-width="2.5" stroke-linejoin="round"><polygon points="${star(84, 92, 17, 8)}"/><polygon points="${star(116, 92, 17, 8)}"/></g>`,
  ],
];

const HATS: Item<string>[] = [
  ["Yo'q", 0, ""],
  [
    "Kepka",
    0,
    `<path d="M58 76Q56 34 100 34Q144 34 142 76Q120 66 100 66Q80 66 58 76Z" fill="#ee4b4b"/><path d="M96 70Q140 62 164 80Q132 84 96 76Z" fill="#c93030"/><circle cx="100" cy="36" r="4" fill="#c93030"/>`,
  ],
  [
    "Qalpoq",
    5,
    `<path d="M58 80Q54 30 100 30Q146 30 142 80Z" fill="#f0a020"/><rect x="56" y="68" width="88" height="15" rx="7" fill="#d98910"/><path d="M76 40V68M100 34V68M124 40V68" stroke="#fff4" stroke-width="3"/><circle cx="100" cy="26" r="9" fill="#fff"/>`,
  ],
  [
    "Panama",
    5,
    `<ellipse cx="100" cy="66" rx="64" ry="12" fill="#e8c27a"/><path d="M66 66Q66 30 100 30Q134 30 134 66Z" fill="#f2d28f"/><rect x="66" y="54" width="68" height="8" fill="#c0552e"/>`,
  ],
  [
    "Bitiruvchi",
    10,
    `<path d="M64 62Q64 48 100 48Q136 48 136 62V70Q100 84 64 70Z" fill="#2a2a3a"/><path d="M36 52L100 28L164 52L100 76Z" fill="#363650"/><path d="M152 56V90" stroke="#ffc83d" stroke-width="3"/><circle cx="152" cy="92" r="4.5" fill="#ffc83d"/>`,
  ],
  [
    "Toj",
    20,
    `<path d="M64 62L68 28L84 46L100 22L116 46L132 28L136 62Z" fill="#ffc83d" stroke="#e0a010" stroke-width="2.5" stroke-linejoin="round"/><circle cx="100" cy="36" r="4.5" fill="#ee4b4b"/><circle cx="76" cy="50" r="3" fill="#2fa5e8"/><circle cx="124" cy="50" r="3" fill="#2fa05a"/>`,
  ],
  ["Bantik", 0, `<path d="M128 46L152 32V60Z M128 46L104 32V60Z" fill="#ff5fa8"/><circle cx="128" cy="46" r="6.5" fill="#e03a88"/>`],
  [
    "Gul",
    5,
    [0, 1, 2, 3, 4].map((i) => `<circle cx="${126 + 11 * Math.cos(i * 1.2566)}" cy="${48 + 11 * Math.sin(i * 1.2566)}" r="7" fill="#ff7aa8"/>`).join("") +
      `<circle cx="126" cy="48" r="6" fill="#ffd93d"/>`,
  ],
];
/** Hats offered per gender (indexes into HATS). */
export const HATS_FOR: Record<Gender, number[]> = { m: [0, 1, 2, 3, 4, 5], f: [0, 6, 7, 1, 2, 3, 4, 5] };

type OutfitKind = "tee" | "hood" | "uni" | "swe" | "jer" | "astro" | "dress";
const OUTFITS: Record<Gender, [name: string, price: number, kind: OutfitKind, color: string][]> = {
  m: [
    ["Ko'k futbolka", 0, "tee", "#2f7de8"],
    ["Xudi", 0, "hood", "#8a4de0"],
    ["Maktab formasi", 0, "uni", "#2c3a6b"],
    ["Sviter", 5, "swe", "#2fa05a"],
    ["Futbol formasi", 10, "jer", "#ee4b4b"],
    ["Kosmonavt", 15, "astro", "#f4f6fb"],
  ],
  f: [
    ["Pushti ko'ylak", 0, "dress", "#f060a8"],
    ["Xudi", 0, "hood", "#ff7a9a"],
    ["Maktab formasi", 0, "uni", "#7a2c6b"],
    ["Sviter", 5, "swe", "#f0a020"],
    ["Sport formasi", 10, "jer", "#2fa5e8"],
    ["Kosmonavt", 15, "astro", "#f4f6fb"],
  ],
};

const BODY = (c: string) => `<path d="M26 222Q30 158 100 150Q170 158 174 222Z" fill="${c}"/>`;
const NECK = (sk: string, rx = 22, ry = 11) =>
  `<ellipse cx="100" cy="153" rx="${rx}" ry="${ry}" fill="${sk}"/><ellipse cx="100" cy="153" rx="${rx}" ry="${ry}" fill="#000" opacity=".1"/>`;

function outfit(t: OutfitKind, c: string, sk: string) {
  switch (t) {
    case "tee":
      return BODY(c) + NECK(sk);
    case "hood":
      return (
        BODY(c) +
        NECK(sk, 24, 12) +
        `<path d="M70 154Q100 184 130 154" stroke="#000" opacity=".22" stroke-width="9" fill="none" stroke-linecap="round"/><path d="M92 176V204M108 176V204" stroke="#fff" stroke-width="3" stroke-linecap="round"/><rect x="64" y="196" width="72" height="26" rx="10" fill="#000" opacity=".15"/>`
      );
    case "uni":
      return (
        BODY(c) +
        `<path d="M80 152L100 196L120 152Z" fill="#fff"/><path d="M96 162H104L108 198L100 208L92 198Z" fill="#e63946"/><path d="M80 152L88 190L70 170ZM120 152L112 190L130 170Z" fill="#fff" opacity=".9"/><circle cx="142" cy="190" r="6" fill="#ffc83d"/>` +
        NECK(sk, 14, 8)
      );
    case "swe":
      return (
        BODY(c) +
        `<path d="M44 200H156M40 186H160M52 214H148" stroke="#fff" opacity=".35" stroke-width="5" stroke-dasharray="9 7"/><ellipse cx="100" cy="153" rx="24" ry="12" fill="${sk}" stroke="${c}" stroke-width="7"/><ellipse cx="100" cy="153" rx="20" ry="9" fill="#000" opacity=".1"/>`
      );
    case "jer":
      return (
        BODY(c) +
        `<path d="M26 222Q28 170 56 156L60 222Z" fill="#fff" opacity=".9"/><path d="M174 222Q172 170 144 156L140 222Z" fill="#fff" opacity=".9"/><text x="100" y="208" text-anchor="middle" font-size="40" font-weight="800" fill="#fff" font-family="Baloo 2,Nunito,sans-serif">10</text>` +
        NECK(sk, 20, 10)
      );
    case "astro":
      return (
        BODY(c) +
        `<path d="M26 222Q30 160 52 154L56 222Z M174 222Q170 160 148 154L144 222Z" fill="#ff8a1f"/><rect x="118" y="178" width="26" height="16" rx="3" fill="#2f5de8"/><rect x="118" y="182" width="26" height="4" fill="#fff"/><circle cx="76" cy="186" r="9" fill="#ee4b4b"/><circle cx="76" cy="186" r="4" fill="#fff"/><ellipse cx="100" cy="154" rx="27" ry="13" fill="${sk}" stroke="#d9dce8" stroke-width="8"/>`
      );
    case "dress":
      return (
        BODY("#fff") +
        `<path d="M44 222L58 172Q100 196 142 172L156 222Z" fill="${c}"/><path d="M72 156L64 188M128 156L136 188" stroke="${c}" stroke-width="10" stroke-linecap="round"/><circle cx="100" cy="188" r="3" fill="#fff"/><circle cx="100" cy="202" r="3" fill="#fff"/>` +
        NECK(sk, 18, 9)
      );
  }
}

export const FACE_VB = "30 10 140 140";
export const OUTFIT_VB = "14 60 172 160";
export const FULL_VB = "0 0 200 220";

let gradientSeq = 0;

export function renderCharacter(s: Character, vb = FULL_VB, o: { nobg?: boolean; anim?: boolean; className?: string } = {}) {
  const sk = SKIN[s.skin];
  const hc = HAIR_COLORS[s.hc];
  const ec = EYE_COLORS[s.eyes];
  const f = s.g === "f";
  const bg = BACKGROUNDS[s.bg];
  const id = `chg${++gradientSeq}`;
  const [back, front] = HAIR[s.g][s.hair][2](hc);
  const od = OUTFITS[s.g][s.outfit];
  const eyes = [84, 116]
    .map(
      (x) =>
        `<ellipse cx="${x}" cy="92" rx="${f ? 9.5 : 8.5}" ry="${f ? 11 : 10}" fill="#fff"/><circle cx="${x}" cy="93" r="6.2" fill="${ec}"/><circle cx="${x}" cy="93" r="3" fill="#1a1020"/><circle cx="${x + 2}" cy="90.5" r="1.8" fill="#fff"/>`,
    )
    .join("");
  const lash = f
    ? `<path d="M74 86L69 82M76 81L73 76M126 86L131 82M124 81L127 76" stroke="#1a1020" stroke-width="2.2" stroke-linecap="round"/>`
    : "";
  const stars = s.bg === 5 ? circles("#fff", [[20, 30, 1.5], [170, 20, 2], [150, 70, 1.5], [30, 110, 2], [180, 120, 1.5]]) : "";
  const cls = o.className ? ` class="${o.className}"` : "";
  return (
    `<svg xmlns="http://www.w3.org/2000/svg"${cls} viewBox="${vb}" preserveAspectRatio="xMidYMid meet" data-char="${encodeCharacter(s)}">` +
    `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bg[0]}"/><stop offset="1" stop-color="${bg[1]}"/></linearGradient></defs>` +
    (o.nobg ? "" : `<rect x="-60" y="-60" width="320" height="340" fill="url(#${id})"/>${stars}`) +
    `${back}<rect x="86" y="116" width="28" height="42" fill="${sk}"/><rect x="86" y="116" width="28" height="14" fill="#000" opacity=".1"/>` +
    outfit(od[2], od[3], sk) +
    `<circle cx="61" cy="94" r="8" fill="${sk}"/><circle cx="139" cy="94" r="8" fill="${sk}"/>` +
    `<ellipse cx="100" cy="88" rx="39" ry="43" fill="${sk}"/>` +
    `<circle cx="76" cy="106" r="7" fill="#ff6b8a" opacity=".3"/><circle cx="124" cy="106" r="7" fill="#ff6b8a" opacity=".3"/>` +
    (f ? "" : BEARD[s.beard][2](hc)) +
    `<path d="M86 112Q100 128 114 112Q100 117 86 112Z" fill="#fff" stroke="#7a2e2e" stroke-width="2.5" stroke-linejoin="round"/>` +
    `<path d="M97 100Q100 106 103 100" stroke="#000" opacity=".28" fill="none" stroke-width="2" stroke-linecap="round"/>` +
    `<g${o.anim ? ' class="sp-ce-eyes"' : ""}>${eyes}${lash}</g>` +
    `<path d="M74 78Q84 73 94 78M106 78Q116 73 126 78" stroke="${hc}" stroke-width="3.5" fill="none" stroke-linecap="round"/>` +
    `${front}${GLASSES[s.glasses][2]}${HATS[s.hat][2]}</svg>`
  );
}

/** Small face used as the "Teri" tab icon. */
export const faceIcon = (skin: number) =>
  `<svg viewBox="56 40 88 96" width="32" height="30"><ellipse cx="100" cy="88" rx="39" ry="43" fill="${SKIN[skin]}"/><circle cx="84" cy="88" r="5" fill="#1a1020"/><circle cx="116" cy="88" r="5" fill="#1a1020"/><circle cx="72" cy="104" r="6" fill="#ff6b8a" opacity=".35"/><circle cx="128" cy="104" r="6" fill="#ff6b8a" opacity=".35"/><path d="M86 108Q100 122 114 108" stroke="#7a2e2e" stroke-width="4" fill="none" stroke-linecap="round"/></svg>`;

// ── Catalog helpers ──

export const itemCount = (cat: ItemCategory, g: Gender) =>
  cat === "hair" ? HAIR[g].length : cat === "outfit" ? OUTFITS[g].length : cat === "beard" ? BEARD.length : cat === "glasses" ? GLASSES.length : cat === "bg" ? BACKGROUNDS.length : HATS.length;

/** Item indexes shown in a category's grid. */
export const itemsOf = (cat: ItemCategory, g: Gender) => (cat === "hat" ? HATS_FOR[g] : [...Array(itemCount(cat, g)).keys()]);

export const priceOf = (cat: Category, v: number, g: Gender): number => {
  switch (cat) {
    case "hair":
      return HAIR[g][v][1];
    case "outfit":
      return OUTFITS[g][v][1];
    case "hat":
      return HATS[v][1];
    case "glasses":
      return GLASSES[v][1];
    case "beard":
      return BEARD[v][1];
    case "bg":
      return BG_PRICES[v];
    default:
      return 0;
  }
};

export const nameOf = (cat: ItemCategory, v: number, g: Gender) =>
  cat === "hair" ? HAIR[g][v][0] : cat === "outfit" ? OUTFITS[g][v][0] : cat === "hat" ? HATS[v][0] : cat === "glasses" ? GLASSES[v][0] : cat === "beard" ? BEARD[v][0] : BG_NAMES[v];

export const itemKey = (cat: Category, v: number, g: Gender) =>
  cat === "hair" || cat === "outfit" || cat === "beard" ? `${cat}:${g}:${v}` : `${cat}:${v}`;

export const isOwned = (owned: readonly string[], cat: Category, v: number, g: Gender) =>
  priceOf(cat, v, g) === 0 || owned.includes(itemKey(cat, v, g));

// ── Persistence: the config rides inside the saved SVG as data-char ──

const FIELDS = ["skin", "hair", "hc", "eyes", "beard", "outfit", "hat", "glasses", "bg"] as const;

export const encodeCharacter = (s: Character) => [s.g, ...FIELDS.map((k) => s[k])].join(".");

const isValid = (c: Character) => {
  const ok = (v: number, n: number) => Number.isInteger(v) && v >= 0 && v < n;
  return (
    ok(c.skin, SKIN.length) &&
    ok(c.hc, HAIR_COLORS.length) &&
    ok(c.eyes, EYE_COLORS.length) &&
    ok(c.hair, HAIR[c.g].length) &&
    ok(c.outfit, OUTFITS[c.g].length) &&
    ok(c.beard, c.g === "m" ? BEARD.length : 1) &&
    HATS_FOR[c.g].includes(c.hat) &&
    ok(c.glasses, GLASSES.length) &&
    ok(c.bg, BACKGROUNDS.length)
  );
};

export function decodeCharacter(code: string): Character | null {
  const [g, ...rest] = code.split(".");
  if ((g !== "m" && g !== "f") || rest.length !== FIELDS.length) return null;
  const c = { g } as Character;
  FIELDS.forEach((k, i) => (c[k] = Number(rest[i])));
  return isValid(c) ? c : null;
}

const SVG_PREFIX = "data:image/svg+xml;base64,";

/** The character stored in a user's avatar, if the avatar is one. */
export function characterFromAvatar(avatar: string | null | undefined): Character | null {
  if (!avatar?.startsWith(SVG_PREFIX)) return null;
  try {
    const svg = atob(avatar.slice(SVG_PREFIX.length));
    const m = /data-char="([^"]+)"/.exec(svg);
    return m ? decodeCharacter(m[1]) : null;
  } catch {
    return null;
  }
}

/** The SVG saved as the avatar: face crop with background, no animation. */
export const avatarSvg = (s: Character) => renderCharacter(s, FACE_VB);

export const randomCharacter = (cur: Character, owned: readonly string[]): Character => {
  const r = (n: number) => Math.floor(Math.random() * n);
  const pickOwned = (cat: ItemCategory) => {
    const ok = itemsOf(cat, cur.g).filter((v) => isOwned(owned, cat, v, cur.g));
    return ok[r(ok.length)] ?? 0;
  };
  return {
    ...cur,
    skin: r(SKIN.length),
    hc: r(HAIR_COLORS.length),
    eyes: r(EYE_COLORS.length),
    hair: pickOwned("hair"),
    outfit: pickOwned("outfit"),
    hat: pickOwned("hat"),
    glasses: r(3) === 0 ? pickOwned("glasses") : 0,
    beard: 0,
    bg: pickOwned("bg"),
  };
};
