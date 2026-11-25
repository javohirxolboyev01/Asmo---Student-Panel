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

// ── Drawing helpers ──

/** Mixes a #rrggbb colour toward white (amt > 0) or black (amt < 0). Output is always #rrggbb. */
const shade = (hex: string, amt: number) => {
  const n = parseInt(hex.slice(1), 16);
  const target = amt < 0 ? 0 : 255;
  const p = Math.abs(amt);
  const ch = (v: number) => Math.round(v + (target - v) * p);
  return "#" + ((1 << 24) | (ch(n >> 16) << 16) | (ch((n >> 8) & 255) << 8) | ch(n & 255)).toString(16).slice(1);
};

const circles = (c: string, a: number[][]) => a.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${c}"/>`).join("");
const line = (stroke: string, d: string, w = 1.6, op = 0.55) =>
  `<path d="${d}" stroke="${stroke}" stroke-width="${w}" opacity="${op}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
/** Mirrors a drawing across the face's vertical centre line (x = 100). */
const mirror = (svg: string) => `<g transform="matrix(-1 0 0 1 200 0)">${svg}</g>`;
const both = (svg: string) => svg + mirror(svg);

/** Hair paint: gradient fill + lighter / darker strand colours. */
interface Ink {
  f: string;
  l: string;
  d: string;
}

const fill = (h: Ink, d: string, extra = "") => `<path d="${d}" fill="${h.f}"${extra}/>`;
/** Round curls with a light rim on top — curly hair, afro texture. */
const curls = (h: Ink, a: number[][]) =>
  a
    .map(
      ([x, y, r]) =>
        `<circle cx="${x}" cy="${y}" r="${r}" fill="${h.f}"/>` +
        line(h.l, `M${x - r * 0.55} ${y - r * 0.05}Q${x} ${y - r * 0.8} ${x + r * 0.55} ${y - r * 0.05}`, 1.5, 0.6),
    )
    .join("");

// ── Hair: [back layer (behind head), front layer (over forehead)] ──

const BANGS = (h: Ink) =>
  fill(h, "M58 98Q52 50 88 40Q122 33 141 56Q148 74 142 98L138 98Q136 78 126 66Q114 77 94 73Q78 70 70 60Q63 76 62 98Z") +
  line(h.l, "M72 54Q90 44 112 44M78 62Q96 67 116 52M118 46Q132 52 138 66") +
  line(h.d, "M84 46Q98 56 118 50", 1.3, 0.35);
const CAP_BACK = (h: Ink) => fill(h, "M56 96Q48 36 100 33Q152 36 144 96Z");
/** A long side lock falling past the ear (left side; mirror for the right). */
const LOCK = (h: Ink, y: number) =>
  fill(h, `M62 92Q55 ${y - 40} 66 ${y}Q56 ${y + 4} 47 ${y - 4}Q43 ${y - 40} 56 90Z`) + line(h.l, `M57 100Q52 ${y - 40} 56 ${y - 8}`, 1.3, 0.45);
const BRAID = (h: Ink) => {
  let s = "";
  for (let y = 102; y <= 162; y += 10)
    s +=
      `<ellipse cx="54" cy="${y}" rx="8.5" ry="7" fill="${h.f}"/>` +
      line(h.d, `M46 ${y + 2}Q54 ${y + 8} 62 ${y + 2}`, 1.2, 0.5) +
      line(h.l, `M50 ${y - 3}Q54 ${y - 6} 58 ${y - 3}`, 1.2, 0.6);
  return s + fill(h, "M49 172Q54 190 59 172Z") + `<ellipse cx="54" cy="170" rx="6" ry="3.5" fill="#ff5fa8"/>`;
};

const HAIR: Record<Gender, Item<(h: Ink) => [string, string]>[]> = {
  m: [
    [
      "Qisqa",
      0,
      (h) => [
        "",
        fill(h, "M58 94Q52 58 66 46Q80 34 102 35Q126 36 138 50Q148 64 142 94L138 94Q137 76 128 66Q114 71 100 65Q86 71 72 65Q63 76 62 94Z") +
          line(h.l, "M70 54Q84 42 100 43M104 42Q120 43 132 56M86 50Q96 54 100 62") +
          line(h.d, "M92 38Q106 46 114 64", 1.4, 0.4),
      ],
    ],
    [
      "Tikka",
      0,
      (h) => [
        "",
        fill(h, "M58 94Q54 72 57 58L50 46L67 47L64 30L81 40L87 22L100 35L113 21L119 38L136 28L135 45L151 42L143 58Q148 74 142 94L138 94Q136 76 127 66Q100 75 73 66Q64 76 62 94Z") +
          line(h.l, "M62 50L76 60M70 34L84 54M88 28L94 54M112 26L108 52M132 34L122 56M146 46L132 60"),
      ],
    ],
    [
      "Yon bo'lak",
      0,
      (h) => [
        "",
        fill(h, "M58 94Q50 56 70 42Q92 30 120 37Q146 47 142 94L138 94Q137 74 125 62Q106 77 80 71Q67 69 62 94Z") +
          line(h.d, "M80 38Q76 48 78 60", 1.8, 0.6) +
          line(h.l, "M84 45Q110 42 132 60M86 54Q108 53 124 64M72 50Q68 60 66 72"),
      ],
    ],
    [
      "Kalta",
      0,
      (h) => [
        "",
        fill(h, "M60 90Q58 47 100 42Q142 47 140 90Q138 72 131 64Q116 58 100 58Q84 58 69 64Q62 72 60 90Z", ' opacity=".92"') +
          line(h.l, "M74 52Q100 42 126 52", 1.2, 0.35),
      ],
    ],
    [
      "Jingalak",
      5,
      (h) => [
        "",
        fill(h, "M60 90Q56 46 100 40Q144 46 140 90Q136 72 126 66Q100 70 74 66Q64 72 60 90Z") +
          curls(h, [
            [62, 84, 8],
            [138, 84, 8],
            [64, 68, 11],
            [136, 68, 11],
            [74, 52, 13],
            [126, 52, 13],
            [90, 42, 14],
            [110, 42, 14],
            [84, 60, 9],
            [100, 55, 10],
            [116, 60, 9],
          ]),
      ],
    ],
    [
      "Afro",
      8,
      (h) => [
        `<circle cx="100" cy="68" r="52" fill="${h.f}"/>` +
          [...Array(16).keys()]
            .map((i) => {
              const a = (i * Math.PI) / 8 + (i % 2) * 0.2;
              const r = i % 2 ? 40 : 30;
              const x = 100 + r * Math.cos(a);
              const y = 68 + r * Math.sin(a);
              return line(i % 3 ? h.l : h.d, `M${(x - 5).toFixed(1)} ${y.toFixed(1)}q5 -6 10 0`, 1.4, 0.45);
            })
            .join(""),
        fill(h, "M60 92Q55 42 100 38Q145 42 140 92Q134 70 100 66Q66 70 60 92Z") + line(h.l, "M70 62Q84 50 100 50M130 62Q116 50 100 50", 1.4, 0.45),
      ],
    ],
  ],
  f: [
    [
      "Uzun",
      0,
      (h) => [
        fill(h, "M56 92Q48 36 100 33Q152 36 144 92Q150 130 158 172Q130 184 100 180Q70 184 42 172Q50 130 56 92Z") + line(h.d, "M60 120Q58 150 64 172M140 120Q142 150 136 172", 1.4, 0.35),
        BANGS(h) + both(LOCK(h, 170)),
      ],
    ],
    ["Ikki o'rim", 0, (h) => [CAP_BACK(h), BANGS(h) + both(BRAID(h))]],
    [
      "Quyruq",
      0,
      (h) => [
        CAP_BACK(h) +
          fill(h, "M132 48Q182 58 170 124Q164 152 148 166Q158 124 140 94Q134 72 128 60Z") +
          line(h.l, "M146 62Q172 80 160 140", 1.5, 0.5) +
          line(h.d, "M140 70Q160 92 152 150", 1.3, 0.35),
        BANGS(h) + `<ellipse cx="136" cy="54" rx="6" ry="8.5" fill="#ff5fa8"/><ellipse cx="134" cy="52" rx="2" ry="3.5" fill="#fff" opacity=".45"/>`,
      ],
    ],
    [
      "Karre",
      0,
      (h) => [
        fill(h, "M54 94Q48 36 100 33Q152 36 146 94L150 134Q144 142 130 140H70Q56 142 50 134Z"),
        fill(h, "M60 86Q58 41 100 39Q142 41 140 86Q136 80 128 79L120 78L110 80L100 78L90 80L80 78L72 79Q64 80 60 86Z") +
          line(h.l, "M70 56Q100 42 130 56M84 66L82 78M100 64V77M116 66L118 78", 1.3, 0.45) +
          both(fill(h, "M62 88Q58 116 66 138Q56 140 50 134Q48 110 56 88Z")),
      ],
    ],
    [
      "Bo'g'ma",
      5,
      (h) => [
        CAP_BACK(h) + `<circle cx="100" cy="30" r="17" fill="${h.f}"/>` + line(h.d, "M86 26Q100 18 114 28M85 34Q100 26 115 36", 1.4, 0.45) + line(h.l, "M90 20Q100 15 110 20", 1.4, 0.6),
        fill(h, "M60 92Q56 46 100 41Q144 46 140 92Q134 68 100 62Q66 68 60 92Z") + line(h.l, "M68 72Q82 50 100 46M132 72Q118 50 100 46M80 64Q90 52 100 50", 1.4, 0.5),
      ],
    ],
    [
      "Jingalak",
      8,
      (h) => [
        fill(h, "M54 92Q44 36 100 30Q156 36 146 92Q156 130 150 160Q100 170 50 160Q44 130 54 92Z") +
          curls(h, [
            [50, 150, 11],
            [150, 150, 11],
            [80, 162, 10],
            [120, 162, 10],
            [100, 164, 10],
          ]),
        curls(h, [
          [56, 140, 10],
          [144, 140, 10],
          [52, 118, 10],
          [148, 118, 10],
          [56, 96, 10],
          [144, 96, 10],
          [66, 70, 11],
          [134, 70, 11],
          [80, 54, 13],
          [120, 54, 13],
          [100, 48, 14],
        ]),
      ],
    ],
  ],
};

// ── Beard (drawn in the hair colour, under the mouth) ──

const MOUSTACHE = (c: string) =>
  `<path d="M83 114Q88 104 100 108Q112 104 117 114Q110 110.5 100 112Q90 110.5 83 114Z" fill="${c}"/>` + line(shade(c, 0.3), "M89 108.5Q94 107 99 109M101 109Q106 107 111 108.5", 1, 0.5);
const BEARD: Item<(c: string) => string>[] = [
  ["Yo'q", 0, () => ""],
  ["Mo'ylov", 3, MOUSTACHE],
  ["Echki soqol", 5, (c) => `<path d="M89 128Q100 125 111 128Q111 142 100 145Q89 142 89 128Z" fill="${c}"/>` + line(shade(c, -0.3), "M96 132L95 140M100 132V143M104 132L105 140", 1, 0.4) + MOUSTACHE(c)],
  [
    "To'liq soqol",
    8,
    (c) =>
      `<path d="M62 94Q61 122 74 132Q86 144 100 144Q114 144 126 132Q139 122 138 94Q136 108 130 114Q124 111 116 113Q108 110 100 111Q92 110 84 113Q76 111 70 114Q64 108 62 94Z" fill="${c}"/>` +
      `<path d="M62 94Q61 122 74 132Q86 144 100 144Q114 144 126 132Q139 122 138 94" fill="none" stroke="${shade(c, -0.25)}" stroke-width="1.5" opacity=".5"/>` +
      line(shade(c, 0.3), "M72 120L74 128M80 126L82 134M92 132L93 140M108 132L107 140M120 126L118 134M128 120L126 128", 1.1, 0.4) +
      MOUSTACHE(c),
  ],
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

// ── Glasses (eyes are centred at x 84 / 116, y 92) ──

const glare = `<path d="M76 86l6-4M108 86l6-4" stroke="#fff" stroke-width="2.4" opacity=".7" stroke-linecap="round"/>`;
const GLASSES: Item<string>[] = [
  ["Yo'q", 0, ""],
  [
    "Dumaloq",
    0,
    `<g fill="#d8ecff" fill-opacity=".22" stroke="#2b2b3a" stroke-width="3"><circle cx="84" cy="92" r="14"/><circle cx="116" cy="92" r="14"/></g><path d="M97.5 90Q100 86.5 102.5 90M70 90L60 87M130 90L140 87" stroke="#2b2b3a" stroke-width="2.6" fill="none" stroke-linecap="round"/>${glare}`,
  ],
  [
    "Kvadrat",
    3,
    `<g fill="#ffe0e0" fill-opacity=".2" stroke="#d93a32" stroke-width="3.2" stroke-linejoin="round"><rect x="69" y="81" width="30" height="23" rx="5"/><rect x="101" y="81" width="30" height="23" rx="5"/></g><path d="M99 89h2M69 88L60 86M131 88L140 86" stroke="#d93a32" stroke-width="2.6" stroke-linecap="round"/><path d="M69 83h30M101 83h30" stroke="#a8221c" stroke-width="2"/>${glare}`,
  ],
  [
    "Quyosh",
    5,
    `<path d="M68 82Q84 79 99 83Q99 100 86 104Q70 104 68 90Z M132 82Q116 79 101 83Q101 100 114 104Q130 104 132 90Z" fill="#1d2230" stroke="#9aa0ad" stroke-width="2"/><path d="M99 84Q100 82 101 84M68 85L60 85M132 85L140 85" stroke="#9aa0ad" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M73 86l9-3M107 86l9-3" stroke="#fff" stroke-width="2.6" opacity=".35" stroke-linecap="round"/><path d="M70 95Q84 103 97 92M103 92Q116 103 130 95" stroke="#5a6aa0" stroke-width="2" opacity=".5" fill="none"/>`,
  ],
  [
    "Yulduz",
    10,
    `<g fill="#ffc83d" stroke="#e08a00" stroke-width="2.5" stroke-linejoin="round"><polygon points="${star(84, 92, 17, 8)}"/><polygon points="${star(116, 92, 17, 8)}"/></g><circle cx="84" cy="92" r="5" fill="#fff4"/><circle cx="116" cy="92" r="5" fill="#fff4"/>`,
  ],
];

// ── Hats. `cover`: hair above this y is hidden under the hat (0 = an
// accessory that sits on the hair and hides nothing). ──

type Hat = [name: string, price: number, draw: (p: string) => string, cover: number];
const HATS: Hat[] = [
  ["Yo'q", 0, () => "", 0],
  [
    "Kepka",
    0,
    (p) =>
      `<path d="M60 80Q100 70 140 80Q100 88 60 86Z" fill="#000" opacity=".14"/>` +
      `<path d="M56 80Q51 27 100 25Q149 27 144 80Q122 71 100 71Q78 71 56 80Z" fill="url(#${p}-hat)"/>` +
      `<path d="M100 26Q95 50 100 72M78 31Q68 52 70 75M122 31Q132 52 130 75" stroke="#000" stroke-width="1.4" opacity=".18" fill="none"/>` +
      `<path d="M66 44Q82 30 100 29" stroke="#fff" stroke-width="3" opacity=".25" fill="none" stroke-linecap="round"/>` +
      `<path d="M56 80Q78 71 100 71Q122 71 144 80" stroke="#a51e1e" stroke-width="3" fill="none"/>` +
      `<path d="M98 73Q138 62 170 79Q169 89 148 89Q122 87 98 81Z" fill="#b71c1c"/><path d="M98 73Q138 62 170 79" stroke="#e04848" stroke-width="2" fill="none"/>` +
      `<ellipse cx="100" cy="26" rx="5" ry="3" fill="#a51e1e"/>`,
    74,
  ],
  [
    "Qalpoq",
    5,
    (p) =>
      `<path d="M57 76Q53 24 100 22Q147 24 143 76Z" fill="url(#${p}-hat)"/>` +
      `<path d="M72 30V62M86 25V62M100 23V62M114 25V62M128 30V62" stroke="#000" stroke-width="2" opacity=".1"/>` +
      `<rect x="55" y="58" width="90" height="18" rx="8" fill="#d9820c"/>` +
      `<path d="M62 60V74M70 60V74M78 60V74M86 60V74M94 60V74M102 60V74M110 60V74M118 60V74M126 60V74M134 60V74" stroke="#000" stroke-width="2" opacity=".13"/>` +
      `<path d="M58 80Q100 72 142 80Q100 84 58 82Z" fill="#000" opacity=".12"/>` +
      `<circle cx="100" cy="20" r="11" fill="#fff8ee"/>` +
      circles("#e8dccb", [[95, 17, 2.5], [104, 22, 2.5], [99, 25, 2], [106, 15, 2]]),
    72,
  ],
  [
    "Panama",
    5,
    (p) =>
      `<path d="M50 70Q100 82 150 70Q100 90 50 70Z" fill="#000" opacity=".12"/>` +
      `<ellipse cx="100" cy="64" rx="64" ry="13" fill="#d9b067"/><ellipse cx="100" cy="62" rx="62" ry="11" fill="url(#${p}-hat)"/>` +
      `<path d="M68 62Q66 27 100 27Q134 27 132 62Q100 68 68 62Z" fill="url(#${p}-hat)"/>` +
      `<path d="M68 52Q100 58 132 52V60Q100 66 68 60Z" fill="#c0552e"/>` +
      `<path d="M76 36Q90 30 100 30" stroke="#fff" stroke-width="3" opacity=".3" fill="none" stroke-linecap="round"/>` +
      `<path d="M84 40Q100 46 116 40" stroke="#000" stroke-width="1.4" opacity=".15" fill="none"/>`,
    62,
  ],
  [
    "Bitiruvchi",
    10,
    () =>
      `<path d="M63 72Q61 50 100 48Q139 50 137 72Q100 82 63 72Z" fill="#23232f"/>` +
      `<path d="M60 76Q100 86 140 76Q100 90 60 78Z" fill="#000" opacity=".14"/>` +
      `<path d="M34 50L100 26L166 50L100 74Z" fill="#343448"/><path d="M34 50L100 74L166 50V53L100 77L34 53Z" fill="#1b1b26"/>` +
      `<path d="M52 48L100 31L120 38" stroke="#fff" stroke-width="2" opacity=".18" fill="none"/>` +
      `<path d="M100 50Q130 52 152 58V92" stroke="#ffc83d" stroke-width="2.4" fill="none"/>` +
      `<path d="M148 90H156L158 106H146Z" fill="#ffc83d"/><path d="M149 94V106M152 94V106M155 94V106" stroke="#d99b12" stroke-width="1"/>` +
      `<ellipse cx="100" cy="50" rx="5" ry="3" fill="#ffc83d"/>`,
    66,
  ],
  [
    "Toj",
    20,
    (p) =>
      `<path d="M66 52L69 20L85 36L100 13L115 36L131 20L134 52Q100 60 66 52Z" fill="url(#${p}-hat)" stroke="#c98a00" stroke-width="2" stroke-linejoin="round"/>` +
      `<path d="M67 46Q100 54 133 46V52Q100 60 67 52Z" fill="#e0a010"/>` +
      `<circle cx="69" cy="20" r="3" fill="#fff3b0"/><circle cx="100" cy="13" r="3.5" fill="#fff3b0"/><circle cx="131" cy="20" r="3" fill="#fff3b0"/>` +
      `<circle cx="100" cy="38" r="5" fill="#e53950"/><circle cx="98.5" cy="36.5" r="1.6" fill="#fff" opacity=".7"/>` +
      `<circle cx="80" cy="44" r="3.2" fill="#2f8fe8"/><circle cx="120" cy="44" r="3.2" fill="#2fa05a"/>`,
    0,
  ],
  [
    "Bantik",
    0,
    () =>
      `<path d="M128 46Q140 30 154 32Q158 46 154 60Q140 62 128 46Z M128 46Q116 30 102 32Q98 46 102 60Q116 62 128 46Z" fill="#ff5fa8"/>` +
      `<path d="M128 46Q142 38 150 40M128 46Q114 38 106 40" stroke="#fff" stroke-width="2" opacity=".35" fill="none" stroke-linecap="round"/>` +
      `<ellipse cx="128" cy="46" rx="6" ry="7" fill="#e03a88"/>`,
    0,
  ],
  [
    "Gul",
    5,
    () =>
      [0, 1, 2, 3, 4]
        .map((i) => `<ellipse cx="${(126 + 10 * Math.cos(i * 1.2566)).toFixed(1)}" cy="${(48 + 10 * Math.sin(i * 1.2566)).toFixed(1)}" rx="7.5" ry="6.5" fill="#ff7aa8" stroke="#e0507f" stroke-width="1"/>`)
        .join("") + `<circle cx="126" cy="48" r="6" fill="#ffd93d"/><circle cx="124.5" cy="46.5" r="2" fill="#fff" opacity=".6"/>`,
    0,
  ],
  [
    "Do'ppi",
    5,
    (p) =>
      `<path d="M64 66Q100 76 136 66Q100 80 64 70Z" fill="#000" opacity=".13"/>` +
      `<path d="M64 63Q60 33 100 31Q140 33 136 63Q100 71 64 63Z" fill="url(#${p}-hat)"/>` +
      line("#fff", "M82 34Q78 48 80 66M118 34Q122 48 120 66", 1.2, 0.18) +
      [72, 100, 128]
        .map((x) => {
          const y = x === 100 ? 47 : 50;
          const k = x === 100 ? 1 : 0.8;
          return (
            `<path d="M${x} ${y - 10 * k}Q${x + 7.5 * k} ${y} ${x} ${y + 9 * k}Q${x - 7.5 * k} ${y} ${x} ${y - 10 * k}Z" fill="#f4f1e8"/>` +
            line("#f4f1e8", `M${x} ${y - 10 * k}q${4 * k} ${-4 * k} ${7 * k} ${-1 * k}`, 1.4, 1) +
            line("#1a1a22", `M${x} ${y - 5 * k}V${y + 5 * k}`, 1, 0.8)
          );
        })
        .join("") +
      `<path d="M64 63Q100 71 136 63V68Q100 76 64 68Z" fill="#f4f1e8"/>` +
      `<path d="M64 65.5Q100 73.5 136 65.5" stroke="#1a1a22" stroke-width="1.4" stroke-dasharray="3 2.5" fill="none"/>`,
    60,
  ],
  [
    "Shlyapa",
    8,
    (p) =>
      `<path d="M58 66Q100 78 142 66Q100 82 58 70Z" fill="#000" opacity=".14"/>` +
      `<ellipse cx="100" cy="63" rx="54" ry="11" fill="#43474f"/><ellipse cx="100" cy="61" rx="52" ry="9" fill="url(#${p}-hat)"/>` +
      `<path d="M70 61Q67 34 84 28Q100 35 116 28Q133 34 130 61Q100 66 70 61Z" fill="url(#${p}-hat)"/>` +
      line("#2a2c33", "M84 30Q92 40 100 36Q108 40 116 30", 1.6, 0.45) +
      `<path d="M70 52Q100 57 130 52V60Q100 65 70 60Z" fill="#2a2c33"/>` +
      `<path d="M124 55Q132 40 144 36Q138 48 126 58Z" fill="#c0552e"/>` +
      line("#fff", "M76 40Q80 32 86 31", 2.4, 0.25),
    60,
  ],
  [
    "Qishki shapka",
    8,
    (p) =>
      `<path d="M60 64Q56 24 100 22Q144 24 140 64Z" fill="url(#${p}-hat)"/>` +
      line("#fff", "M72 36Q84 26 100 25", 2.6, 0.25) +
      both(
        `<path d="M57 64Q50 90 57 114Q64 119 70 113Q71 88 68 64Z" fill="#efe6d8" stroke="#d6c9b4" stroke-width="1.2"/>` +
          line("#d6c9b4", "M58 78q3 -3 6 0M57 90q3 -3 6 0M58 102q3 -3 6 0", 1.2, 0.9) +
          line("#c8b89e", "M63 116V130", 1.6, 1) +
          `<circle cx="63" cy="132" r="3.2" fill="#efe6d8"/>`,
      ) +
      `<path d="M55 58Q100 46 145 58V73Q100 61 55 73Z" fill="#efe6d8"/>` +
      line("#d6c9b4", "M62 62q3 -3 6 0M74 59q3 -3 6 0M86 57q3 -3 6 0M98 56q3 -3 6 0M110 57q3 -3 6 0M122 59q3 -3 6 0M134 62q3 -3 6 0", 1.2, 1) +
      `<path d="M58 74Q100 64 142 74Q100 80 58 78Z" fill="#000" opacity=".1"/>`,
    66,
  ],
  [
    "Peshona bog'ich",
    3,
    () =>
      `<path d="M59 62Q100 47 141 62V72Q100 57 59 72Z" fill="#fafafa" stroke="#dcdde3" stroke-width="1"/>` +
      `<path d="M59 67Q100 52 141 67" stroke="#e53950" stroke-width="2.6" fill="none"/>` +
      `<path d="M59 72Q100 57 141 72Q100 62 59 75Z" fill="#000" opacity=".1"/>`,
    0,
  ],
  [
    "Kovboy",
    10,
    (p) =>
      `<path d="M60 72Q100 82 140 72Q100 86 60 76Z" fill="#000" opacity=".15"/>` +
      `<path d="M36 56Q44 70 70 66Q100 72 130 66Q156 70 164 56Q168 76 140 79Q100 87 60 79Q32 76 36 56Z" fill="#7a4a24"/>` +
      line("#a8703c", "M40 62Q50 74 70 70Q100 77 130 70Q150 74 160 62", 1.4, 0.8) +
      `<path d="M68 67Q64 30 84 25Q100 33 116 25Q136 30 132 67Q100 73 68 67Z" fill="url(#${p}-hat)"/>` +
      line("#5c3519", "M86 28Q94 38 100 34Q106 38 114 28M100 34V52", 1.5, 0.5) +
      `<path d="M68 58Q100 64 132 58V66Q100 72 68 66Z" fill="#3a2414"/><rect x="95" y="60" width="10" height="8" rx="1.5" fill="#d9b45a" stroke="#a8842e" stroke-width="1"/>` +
      line("#fff", "M74 40Q78 31 86 29", 2.4, 0.22),
    62,
  ],
  [
    "Oshpaz qalpog'i",
    10,
    () =>
      `<g fill="#fff" stroke="#e1e4ec" stroke-width="1.4">${circles("#fff", [[76, 36, 15], [124, 36, 15], [100, 26, 18], [88, 42, 14], [112, 42, 14]])}</g>` +
      line("#e1e4ec", "M84 30q6 -6 12 -2M108 22q6 -4 10 2", 1.4, 1) +
      `<path d="M64 68Q62 48 100 46Q138 48 136 68Q100 74 64 68Z" fill="#fff" stroke="#e1e4ec" stroke-width="1.4"/>` +
      line("#dfe2ea", "M78 50V70M90 48V72M100 47V72M110 48V72M122 50V70", 1.4, 1) +
      `<path d="M62 70Q100 80 138 70Q100 84 62 74Z" fill="#000" opacity=".12"/>`,
    62,
  ],
  [
    "Quloqchin",
    12,
    (p) =>
      `<path d="M55 94Q50 24 100 22Q150 24 145 94" stroke="#2b2b35" stroke-width="7" fill="none"/>` +
      `<path d="M58 90Q54 28 100 26Q146 28 142 90" stroke="#5a5a68" stroke-width="1.6" fill="none"/>` +
      `<path d="M82 25Q100 20 118 25" stroke="#3c3c48" stroke-width="10" fill="none" stroke-linecap="round"/>` +
      both(`<rect x="44" y="80" width="17" height="30" rx="8" fill="url(#${p}-hat)"/><rect x="56" y="84" width="8" height="22" rx="3.5" fill="#1a1a20"/>` + line("#fff", "M48 86V100", 2, 0.35)),
    0,
  ],
  [
    "Mushuk quloqlari",
    5,
    () =>
      `<path d="M62 74Q58 38 100 36Q142 38 138 74" stroke="#2b2b35" stroke-width="4" fill="none"/>` +
      both(`<path d="M65 52L70 20L92 40Z" fill="#2b2b35"/><path d="M70 47L72.5 30L85 41Z" fill="#ff8fb8"/>`),
    0,
  ],
];
const HAT_COLORS: (readonly [string, string] | null)[] = [
  null,
  ["#f45b5b", "#c62828"],
  ["#ffb43d", "#ea8a10"],
  ["#f6dca0", "#dcb36a"],
  null,
  ["#ffe27a", "#f0b020"],
  null,
  null,
  ["#2c2c36", "#141418"],
  ["#7a7f8c", "#535865"],
  ["#4a62a8", "#2a3a72"],
  null,
  ["#b07842", "#7d4f25"],
  null,
  ["#ff6a88", "#d9304f"],
  null,
];

/** Hats offered per gender (indexes into HATS). */
export const HATS_FOR: Record<Gender, number[]> = { m: [0, 1, 2, 3, 4, 5, 8, 9, 10, 11, 12, 13, 14], f: [0, 6, 7, 1, 2, 3, 4, 5, 8, 9, 10, 11, 12, 13, 14, 15] };

// ── Outfits ──

type OutfitKind = "tee" | "hood" | "uni" | "swe" | "jer" | "astro" | "dress" | "plaid" | "denim" | "leather" | "hero" | "cardigan" | "princess";
const OUTFITS: Record<Gender, [name: string, price: number, kind: OutfitKind, color: string][]> = {
  m: [
    ["Ko'k futbolka", 0, "tee", "#2f7de8"],
    ["Xudi", 0, "hood", "#8a4de0"],
    ["Maktab formasi", 0, "uni", "#2c3a6b"],
    ["Sviter", 5, "swe", "#2fa05a"],
    ["Futbol formasi", 10, "jer", "#ee4b4b"],
    ["Kosmonavt", 15, "astro", "#f4f6fb"],
    ["Katak ko'ylak", 5, "plaid", "#c0392b"],
    ["Jinsi kurtka", 8, "denim", "#4a78b8"],
    ["Charm kurtka", 12, "leather", "#2e2e34"],
    ["Supergeroy", 20, "hero", "#2f5de8"],
  ],
  f: [
    ["Pushti ko'ylak", 0, "dress", "#f060a8"],
    ["Xudi", 0, "hood", "#ff7a9a"],
    ["Maktab formasi", 0, "uni", "#7a2c6b"],
    ["Sviter", 5, "swe", "#f0a020"],
    ["Sport formasi", 10, "jer", "#2fa5e8"],
    ["Kosmonavt", 15, "astro", "#f4f6fb"],
    ["Katak ko'ylak", 5, "plaid", "#7a4fd0"],
    ["Jinsi kurtka", 8, "denim", "#6a98d8"],
    ["Kardigan", 10, "cardigan", "#f6a6c1"],
    ["Malika libosi", 20, "princess", "#b58cf0"],
  ],
};

const BODY_D = "M24 222Q26 166 70 154Q86 150 100 150Q114 150 130 154Q174 166 176 222Z";
const body = (p: string, c: string) =>
  `<path d="${BODY_D}" fill="url(#${p}-cl)"/>` +
  // arm / torso folds
  `<path d="M52 186Q55 204 52 222M148 186Q145 204 148 222" stroke="${shade(c, -0.35)}" stroke-width="2" opacity=".35" fill="none" stroke-linecap="round"/>`;
/** Skin showing at the neckline (open collar). */
const neckline = (sk: string, w = 20, depth = 168) => `<path d="M${100 - w} 151Q100 ${depth} ${100 + w} 151Z" fill="${sk}"/><path d="M${100 - w} 151Q100 ${depth} ${100 + w} 151Z" fill="#000" opacity=".1"/>`;

function outfit(t: OutfitKind, c: string, sk: string, p: string) {
  const dk = shade(c, -0.25);
  switch (t) {
    case "tee":
      return body(p, c) + neckline(sk) + `<path d="M79 151Q100 171 121 151" stroke="${dk}" stroke-width="5" fill="none" stroke-linecap="round"/>` + line(dk, "M60 162Q64 176 62 186M140 162Q136 176 138 186", 1.6, 0.5);
    case "hood":
      return (
        body(p, c) +
        neckline(sk, 18, 164) +
        `<path d="M64 158Q100 202 136 158Q130 148 120 150Q100 176 80 150Q70 148 64 158Z" fill="${shade(c, -0.12)}"/>` +
        line(dk, "M70 160Q100 194 130 160", 1.6, 0.6) +
        `<path d="M92 172Q90 188 93 200M108 172Q110 188 107 200" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round"/><rect x="90.5" y="198" width="5" height="7" rx="1.5" fill="#ddd"/><rect x="104.5" y="198" width="5" height="7" rx="1.5" fill="#ddd"/>` +
        `<path d="M64 222V204Q64 198 72 198H128Q136 198 136 204V222" fill="${shade(c, -0.06)}" stroke="${dk}" stroke-width="1.6"/>`
      );
    case "uni":
      return (
        body(p, c) +
        `<path d="M80 152L100 204L120 152Z" fill="#fff"/>` +
        neckline(sk, 12, 160) +
        `<path d="M86 152L80 162L96 168ZM114 152L120 162L104 168Z" fill="#f1f1f4" stroke="#cfd2dc" stroke-width="1"/>` +
        `<path d="M95 160H105L103 168H97Z" fill="#b81f2e"/><path d="M97 168L93 198L100 207L107 198L103 168Z" fill="#d62839"/>` +
        line("#fff", "M95 178L104 172M94 188L106 180M95 198L106 191", 1.4, 0.35) +
        `<path d="M80 152L66 166L80 174L72 182L100 212L84 162Z" fill="${shade(c, 0.1)}" stroke="${dk}" stroke-width="1.4"/>` +
        mirror(`<path d="M80 152L66 166L80 174L72 182L100 212L84 162Z" fill="${shade(c, 0.1)}" stroke="${dk}" stroke-width="1.4"/>`) +
        `<circle cx="100" cy="216" r="2.6" fill="${shade(c, 0.35)}"/><path d="M128 190H150" stroke="${dk}" stroke-width="1.6"/><path d="M136 184L140 180L144 184L140 190Z" fill="#ffc83d"/>`
      );
    case "swe":
      return (
        body(p, c) +
        `<path d="M40 194l7-7 7 7 7-7 7 7 7-7 7 7 7-7 7 7 7-7 7 7 7-7 7 7 7-7 7 7 7-7 7 7 7-7" stroke="#fff" stroke-width="3" opacity=".5" fill="none" stroke-linejoin="round"/>` +
        circles("#fff", [[47, 204, 2], [61, 204, 2], [75, 204, 2], [89, 204, 2], [103, 204, 2], [117, 204, 2], [131, 204, 2], [145, 204, 2]]).replace(/fill="#fff"/g, 'fill="#fff" opacity=".45"') +
        line(dk, "M36 180H164", 2, 0.4) +
        `<ellipse cx="100" cy="153" rx="24" ry="12" fill="${sk}" stroke="${shade(c, -0.08)}" stroke-width="7"/><ellipse cx="100" cy="153" rx="20" ry="8.5" fill="#000" opacity=".1"/>` +
        `<ellipse cx="100" cy="153" rx="24" ry="12" fill="none" stroke="${dk}" stroke-width="1" stroke-dasharray="2 2.5" opacity=".6"/>`
      );
    case "jer":
      return (
        body(p, c) +
        `<path d="M26 222Q28 172 54 158L62 222Z M174 222Q172 172 146 158L138 222Z" fill="#fff" opacity=".92"/>` +
        line(dk, "M58 160L64 222M142 160L136 222", 1.4, 0.4) +
        neckline(sk, 14, 176) +
        `<path d="M86 151L100 176L114 151" stroke="#fff" stroke-width="4" fill="none" stroke-linejoin="round"/>` +
        `<text x="100" y="212" text-anchor="middle" font-size="34" font-weight="800" fill="#fff" stroke="${dk}" stroke-width="1.2" font-family="Baloo 2,Nunito,sans-serif">10</text>`
      );
    case "astro":
      return (
        body(p, c) +
        `<path d="M26 222Q30 162 52 156L58 222Z M174 222Q170 162 148 156L142 222Z" fill="#ff8a1f"/>` +
        line("#9aa1b5", "M70 170Q72 196 68 222M130 170Q128 196 132 222", 1.6, 0.6) +
        `<rect x="84" y="180" width="32" height="22" rx="4" fill="#dfe3ee" stroke="#9aa1b5" stroke-width="1.4"/><circle cx="92" cy="191" r="3" fill="#ee4b4b"/><circle cx="100" cy="191" r="3" fill="#2fa05a"/><circle cx="108" cy="191" r="3" fill="#2f8fe8"/>` +
        `<circle cx="148" cy="186" r="9" fill="#1d2a6b"/><circle cx="148" cy="186" r="6" fill="none" stroke="#fff" stroke-width="1.2"/><path d="M143 188L148 181L153 188" stroke="#ff5a4a" stroke-width="1.6" fill="none"/>` +
        `<rect x="44" y="178" width="20" height="13" rx="2" fill="#2f5de8"/><rect x="44" y="182" width="20" height="4" fill="#fff"/>` +
        `<ellipse cx="100" cy="154" rx="28" ry="14" fill="${sk}"/><ellipse cx="100" cy="154" rx="28" ry="14" fill="#000" opacity=".1"/><ellipse cx="100" cy="155" rx="30" ry="14" fill="none" stroke="#c4c9d6" stroke-width="7"/><ellipse cx="100" cy="153" rx="30" ry="13" fill="none" stroke="#eef0f6" stroke-width="2"/>`
      );
    case "dress":
      return (
        body(p, c) +
        neckline(sk, 14, 164) +
        `<path d="M86 151Q74 152 72 162Q78 172 98 166Z" fill="#fff" stroke="#e8d8e4" stroke-width="1"/>` +
        mirror(`<path d="M86 151Q74 152 72 162Q78 172 98 166Z" fill="#fff" stroke="#e8d8e4" stroke-width="1"/>`) +
        `<circle cx="100" cy="176" r="2.6" fill="#fff"/><circle cx="100" cy="190" r="2.6" fill="#fff"/><circle cx="100" cy="204" r="2.6" fill="#fff"/>` +
        `<path d="M30 206Q40 196 52 200M170 206Q160 196 148 200" stroke="#fff" stroke-width="3" opacity=".55" fill="none" stroke-linecap="round"/>` +
        line(dk, "M100 168V222", 1.2, 0.3)
      );
    case "plaid": {
      let stripes = "";
      for (let x = 22; x < 180; x += 18) stripes += `<rect x="${x}" y="148" width="6" height="76" fill="#000" opacity=".18"/><rect x="${x + 11}" y="148" width="1.5" height="76" fill="#fff" opacity=".35"/>`;
      for (let y = 156; y < 224; y += 18) stripes += `<rect x="20" y="${y}" width="160" height="6" fill="#000" opacity=".18"/><rect x="20" y="${y + 11}" width="160" height="1.5" fill="#fff" opacity=".35"/>`;
      const collar = `<path d="M86 150L78 167L98 163Z" fill="${shade(c, -0.05)}" stroke="${dk}" stroke-width="1.2" stroke-linejoin="round"/>`;
      return (
        body(p, c) +
        `<g clip-path="url(#${p}-bd)">${stripes}</g>` +
        neckline(sk, 12, 162) +
        collar +
        mirror(collar) +
        line(dk, "M100 164V222", 1.6, 0.6) +
        circles("#fff", [[100, 178, 2], [100, 194, 2], [100, 210, 2]])
      );
    }
    case "denim": {
      const flap = `<path d="M82 151L68 160L78 176L90 160Z" fill="${shade(c, 0.1)}" stroke="${dk}" stroke-width="1.2" stroke-linejoin="round"/>`;
      const side =
        `<rect x="60" y="182" width="20" height="15" rx="2" fill="${shade(c, -0.05)}" stroke="#e8b860" stroke-width="1" stroke-dasharray="2.5 2"/>` +
        `<path d="M60 182H80V188Q70 191 60 188Z" fill="${shade(c, 0.06)}" stroke="${dk}" stroke-width="1"/><circle cx="70" cy="189" r="1.8" fill="#c98a3a"/>` +
        `<path d="M86 160L90 222" stroke="#e8b860" stroke-width="1.1" stroke-dasharray="3 2.5" fill="none"/>`;
      return (
        body(p, c) +
        `<path d="M80 152Q100 172 120 152L114 222H86Z" fill="#f4f4f6"/>` +
        neckline(sk, 16, 166) +
        line("#d6d6de", "M82 152Q100 170 118 152", 2.2, 1) +
        line(dk, "M84 158L88 222M116 158L112 222", 2.2, 0.9) +
        side +
        mirror(side) +
        flap +
        mirror(flap)
      );
    }
    case "leather": {
      const lapel = `<path d="M84 151L62 164L76 176L68 186L92 222H100L88 160Z" fill="${shade(c, 0.14)}" stroke="#000" stroke-width="1" stroke-opacity=".5" stroke-linejoin="round"/>`;
      return (
        body(p, c) +
        `<path d="M84 152Q100 168 116 152L112 222H88Z" fill="#8a8f9c"/>` +
        neckline(sk, 14, 164) +
        lapel +
        mirror(lapel) +
        `<path d="M110 166L106 222" stroke="#c9ccd4" stroke-width="2.2" stroke-dasharray="1.6 1.6"/>` +
        line("#fff", "M38 200Q42 178 60 166M162 200Q158 178 140 166", 2.4, 0.22) +
        circles("#c9ccd4", [[74, 172, 1.6], [126, 172, 1.6]])
      );
    }
    case "hero":
      return (
        `<path d="M14 222Q16 166 62 153L138 153Q184 166 186 222Z" fill="#e53935"/>` +
        line("#b71c1c", "M18 222Q22 180 50 162M182 222Q178 180 150 162", 2, 0.7) +
        body(p, c) +
        neckline(sk, 14, 160) +
        `<path d="M86 151Q100 166 114 151" stroke="#ffc83d" stroke-width="3" fill="none"/>` +
        `<path d="M84 174H116L113 196Q100 208 87 196Z" fill="#ffc83d" stroke="#e0a010" stroke-width="1.6" stroke-linejoin="round"/>` +
        `<polygon points="${star(100, 187, 9, 4)}" fill="#e53935"/>` +
        circles("#ffc83d", [[70, 158, 4.5], [130, 158, 4.5]])
      );
    case "cardigan":
      return (
        body(p, c) +
        `<path d="M82 152L100 204L118 152Z" fill="#fff"/>` +
        neckline(sk, 14, 164) +
        `<path d="M82 152L100 206L118 152" stroke="${shade(c, -0.15)}" stroke-width="5" fill="none" stroke-linejoin="round"/>` +
        line("#fff", "M48 176V222M64 168V222M136 168V222M152 176V222", 1.2, 0.35) +
        `<circle cx="100" cy="212" r="2.6" fill="#fff" stroke="${dk}" stroke-width="1"/>` +
        `<path d="M52 196H74V212Q63 215 52 212Z" fill="${shade(c, -0.05)}" stroke="${dk}" stroke-width="1"/>` +
        line(dk, "M28 214H172", 3, 0.25)
      );
    case "princess": {
      const sleeve = `<ellipse cx="46" cy="172" rx="22" ry="17" fill="${shade(c, 0.18)}"/>` + line(dk, "M30 168Q46 182 62 166M36 160Q46 170 58 160", 1.3, 0.4);
      const pearls = [0.1, 0.25, 0.4, 0.5, 0.6, 0.75, 0.9]
        .map((t) => {
          const x = (1 - t) ** 2 * 84 + 2 * (1 - t) * t * 100 + t * t * 116;
          const y = (1 - t) ** 2 * 156 + 2 * (1 - t) * t * 172 + t * t * 156;
          return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${t === 0.5 ? 3 : 1.8}" fill="${t === 0.5 ? "#ff8fd0" : "#fff"}"/>`;
        })
        .join("");
      return (
        body(p, c) +
        `<path d="M66 156Q70 176 86 172Q96 170 100 178Q104 170 114 172Q130 176 134 156Q100 146 66 156Z" fill="${sk}"/>` +
        `<path d="M66 156Q70 176 86 172Q96 170 100 178Q104 170 114 172Q130 176 134 156" stroke="#fff" stroke-width="2.2" fill="none" opacity=".8"/>` +
        sleeve +
        mirror(sleeve) +
        pearls +
        circles("#fff", [[72, 200, 1.6], [128, 194, 1.4], [110, 212, 1.6], [86, 214, 1.2]]) +
        line("#fff", "M100 184V222", 1.2, 0.3)
      );
    }
  }
}

export const FACE_VB = "30 10 140 140";
export const OUTFIT_VB = "14 60 172 160";
export const FULL_VB = "0 0 200 220";

let gradientSeq = 0;

const HEAD_D = "M61 88Q61 46 100 45Q139 46 139 88Q139 114 125 125Q113 135 100 135Q87 135 75 125Q61 114 61 88Z";

export function renderCharacter(s: Character, vb = FULL_VB, o: { nobg?: boolean; anim?: boolean; className?: string } = {}) {
  const sk = SKIN[s.skin];
  const hc = HAIR_COLORS[s.hc];
  const ec = EYE_COLORS[s.eyes];
  const f = s.g === "f";
  const bg = BACKGROUNDS[s.bg];
  const p = `ch${++gradientSeq}`;
  const ink: Ink = { f: `url(#${p}-hr)`, l: shade(hc, 0.35), d: shade(hc, -0.4) };
  const [back, front] = HAIR[s.g][s.hair][2](ink);
  const od = OUTFITS[s.g][s.outfit];
  const hat = HATS[s.hat];
  const hatColors = HAT_COLORS[s.hat];
  const skD = shade(sk, -0.3);

  // Hair under a hat is clipped to below its brim, so nothing pokes through.
  const hairWrap = (svg: string) => (svg && hat[3] ? `<g clip-path="url(#${p}-hc)">${svg}</g>` : svg);

  // Eyes: almond-shaped whites, gradient iris clipped to the opening, lids.
  const w = f ? 11 : 10;
  const top = f ? 79 : 81;
  const bot = f ? 103 : 101;
  const eyeD = (x: number) => `M${x - w} 92Q${x} ${top} ${x + w} 92Q${x} ${bot} ${x - w} 92Z`;
  const eyes =
    [84, 116].map((x) => `<path d="${eyeD(x)}" fill="#fff"/>`).join("") +
    `<g clip-path="url(#${p}-ey)">` +
    [84, 116]
      .map(
        (x) =>
          `<circle cx="${x}" cy="92" r="${f ? 6 : 5.6}" fill="url(#${p}-ir)"/><circle cx="${x}" cy="92" r="2.7" fill="#120a10"/>` +
          `<circle cx="${x + 2}" cy="89.8" r="1.7" fill="#fff"/><circle cx="${x - 1.8}" cy="94.4" r=".8" fill="#fff" opacity=".7"/>`,
      )
      .join("") +
    `<path d="M60 80H140V90Q100 84 60 90Z" fill="#000" opacity=".08"/></g>` +
    [84, 116]
      .map(
        (x) =>
          `<path d="M${x - w} 92Q${x} ${top} ${x + w} 92" stroke="#2a1812" stroke-width="${f ? 2.6 : 2.1}" fill="none" stroke-linecap="round"/>` +
          line(skD, `M${x - w + 2} 86.5Q${x} ${top - 4} ${x + w - 2} 86.5`, 1, 0.5) +
          line(skD, `M${x - w + 3} 94Q${x} ${bot - 1.5} ${x + w - 3} 94`, 0.8, 0.45),
      )
      .join("") +
    (f ? both(line("#2a1812", "M73 92L68 89.5M74.5 89L70.5 85.5M77 87L74.5 82.5", 1.6, 1)) : "");

  const brow = f ? "M73 80Q83 73 95 77Q83 76 73 81.5Z" : "M71 80Q82 71.5 95 76.5Q83 75 71 83Z";
  const lip = f ? "#c9566a" : shade(sk, -0.38);
  const stars = s.bg === 5 ? circles("#fff", [[20, 30, 1.5], [170, 20, 2], [150, 70, 1.5], [30, 110, 2], [180, 120, 1.5]]) : "";
  const cls = o.className ? ` class="${o.className}"` : "";
  const outfitColor = od[3];

  const defs =
    `<linearGradient id="${p}-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${bg[0]}"/><stop offset="1" stop-color="${bg[1]}"/></linearGradient>` +
    `<radialGradient id="${p}-sk" cx=".45" cy=".4" r=".7"><stop offset="0" stop-color="${shade(sk, 0.12)}"/><stop offset=".6" stop-color="${sk}"/><stop offset="1" stop-color="${shade(sk, -0.14)}"/></radialGradient>` +
    `<linearGradient id="${p}-hr" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="${shade(hc, 0.2)}"/><stop offset=".5" stop-color="${hc}"/><stop offset="1" stop-color="${shade(hc, -0.25)}"/></linearGradient>` +
    `<radialGradient id="${p}-ir" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${shade(ec, 0.35)}"/><stop offset=".6" stop-color="${ec}"/><stop offset="1" stop-color="${shade(ec, -0.45)}"/></radialGradient>` +
    `<linearGradient id="${p}-cl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${shade(outfitColor, 0.12)}"/><stop offset="1" stop-color="${shade(outfitColor, -0.18)}"/></linearGradient>` +
    (hatColors ? `<linearGradient id="${p}-hat" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${hatColors[0]}"/><stop offset="1" stop-color="${hatColors[1]}"/></linearGradient>` : "") +
    `<clipPath id="${p}-bd"><path d="${BODY_D}"/></clipPath>` +
    `<clipPath id="${p}-ey">${[84, 116].map((x) => `<path d="${eyeD(x)}"/>`).join("")}</clipPath>` +
    (hat[3] ? `<clipPath id="${p}-hc"><rect x="-60" y="${hat[3]}" width="320" height="400"/></clipPath>` : "");

  return (
    `<svg xmlns="http://www.w3.org/2000/svg"${cls} viewBox="${vb}" preserveAspectRatio="xMidYMid meet" data-char="${encodeCharacter(s)}">` +
    `<defs>${defs}</defs>` +
    (o.nobg ? "" : `<rect x="-60" y="-60" width="320" height="340" fill="url(#${p}-bg)"/>${stars}`) +
    hairWrap(back) +
    // neck with the chin's shadow
    `<rect x="86" y="116" width="28" height="44" fill="${sk}"/><path d="M86 122Q100 146 114 122V144Q100 150 86 144Z" fill="#000" opacity=".13"/>` +
    outfit(od[2], outfitColor, sk, p) +
    // ears
    both(`<ellipse cx="61" cy="95" rx="7.5" ry="10.5" fill="${sk}"/>` + line(skD, "M63 89Q57 95 62 102", 1.6, 0.55)) +
    `<path d="${HEAD_D}" fill="url(#${p}-sk)"/>` +
    `<circle cx="75" cy="109" r="8" fill="#ff6b8a" opacity=".12"/><circle cx="125" cy="109" r="8" fill="#ff6b8a" opacity=".12"/>` +
    (f ? "" : BEARD[s.beard][2](hc)) +
    // nose
    line(skD, "M98 95Q95 103 97 105.5Q100 107.5 103 105.5", 1.8, 0.7) +
    `<circle cx="100.5" cy="102" r="2" fill="#fff" opacity=".22"/>` +
    // mouth: open smile with teeth, tongue and lips
    `<path d="M87 115Q100 113 113 115Q109 127 100 127Q91 127 87 115Z" fill="#6e2226"/>` +
    `<path d="M89 115.4Q100 114 111 115.4Q109.5 119 100 119.5Q90.5 119 89 115.4Z" fill="#fff"/>` +
    `<ellipse cx="100" cy="124" rx="6" ry="2.6" fill="#e46f7a"/>` +
    `<path d="M87 115Q100 113 113 115Q109 127 100 127Q91 127 87 115Z" fill="none" stroke="${lip}" stroke-width="${f ? 2.2 : 1.7}" stroke-linejoin="round"/>` +
    (f ? line(lip, "M91 127.5Q100 131 109 127.5", 1.8, 0.6) : "") +
    `<g${o.anim ? ' class="sp-ce-eyes"' : ""}>${eyes}</g>` +
    both(`<path d="${brow}" fill="${shade(hc, -0.1)}" stroke="${shade(hc, -0.1)}" stroke-width="1" stroke-linejoin="round"/>`) +
    hairWrap(front) +
    GLASSES[s.glasses][2] +
    hat[2](p) +
    `</svg>`
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
