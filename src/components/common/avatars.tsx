// src/components/common/avatars.tsx
// A parameterized SVG avatar generator — layered face/hair/clothing pieces
// combined with real gradients and shading (not flat single-tone blobs) to
// read as portrait-like illustrations rather than generic icon avatars.
// 10 distinct hairstyles per gender, each rendered across 2 skin tones with
// its own hair/clothing color pairing, yields 20 male + 20 female options.
export interface AvatarOption {
  id: string;
  gender: "boy" | "girl";
  label: string;
  svg: string;
}

const clip = `<clipPath id="c"><circle cx="80" cy="80" r="80"/></clipPath>`;

interface SkinTone {
  light: string;
  base: string;
  shadow: string;
}

const SKIN_TONES: SkinTone[] = [
  { light: "#FFE0C2", base: "#F5C08A", shadow: "#E0A268" },
  { light: "#F8D3AE", base: "#EBAE73", shadow: "#CE8E52" },
  { light: "#E9BB8C", base: "#D89A5F", shadow: "#B87940" },
  { light: "#C99468", base: "#B07740", shadow: "#8F5D2E" },
  { light: "#9C6B42", base: "#7E5230", shadow: "#603D22" },
];

const skinGradientDef = (tone: SkinTone) =>
  `<radialGradient id="skin" cx="40%" cy="30%" r="75%">
     <stop offset="0%" stop-color="${tone.light}"/>
     <stop offset="60%" stop-color="${tone.base}"/>
     <stop offset="100%" stop-color="${tone.shadow}"/>
   </radialGradient>`;

const faceOval =
  `<path d="M80 32 C112 32 122 58 120 86 C118 114 100 134 80 134 C60 134 42 114 40 86 C38 58 48 32 80 32 Z" fill="url(#skin)"/>`;

const faceShade =
  `<path d="M40 86 C42 110 58 128 80 132 C68 120 62 104 62 86 Z" fill="#000000" opacity="0.06"/>` +
  `<path d="M120 86 C118 110 102 128 80 132 C92 120 98 104 98 86 Z" fill="#000000" opacity="0.03"/>`;

const ears = `<ellipse cx="38" cy="88" rx="7" ry="11" fill="url(#skin)"/><ellipse cx="122" cy="88" rx="7" ry="11" fill="url(#skin)"/>`;

const neckAndShoulders = (cloth: string) => `
  <path d="M64 116 L64 142 Q80 150 96 142 L96 116 Z" fill="url(#skin)"/>
  <path d="M60 104 Q80 116 100 104 L100 112 Q80 122 60 112 Z" fill="#000000" opacity="0.08"/>
  <path d="M10 162 Q16 108 80 100 Q144 108 150 162 Z" fill="${cloth}"/>
  <path d="M62 108 Q80 118 98 108 L98 114 Q80 124 62 114 Z" fill="#ffffff" opacity="0.1"/>
`;

const brows = (color: string, arch: boolean) =>
  arch
    ? `<path d="M56 58 Q66 49 77 55" stroke="${color}" stroke-width="3" stroke-linecap="round" fill="none"/>
       <path d="M83 55 Q94 49 104 58" stroke="${color}" stroke-width="3" stroke-linecap="round" fill="none"/>`
    : `<path d="M56 58 Q68 53 77 57" stroke="${color}" stroke-width="3" stroke-linecap="round" fill="none"/>
       <path d="M83 57 Q92 53 104 58" stroke="${color}" stroke-width="3" stroke-linecap="round" fill="none"/>`;

const eyesFn = (iris: string, lash: boolean) => `
  <ellipse cx="65" cy="71" rx="7.5" ry="5.2" fill="#ffffff"/>
  <ellipse cx="95" cy="71" rx="7.5" ry="5.2" fill="#ffffff"/>
  <circle cx="65" cy="71" r="3.6" fill="${iris}"/><circle cx="95" cy="71" r="3.6" fill="${iris}"/>
  <circle cx="65" cy="71" r="1.6" fill="#1A1310"/><circle cx="95" cy="71" r="1.6" fill="#1A1310"/>
  <circle cx="63.3" cy="69.3" r="1" fill="#ffffff"/><circle cx="93.3" cy="69.3" r="1" fill="#ffffff"/>
  ${lash ? `<path d="M58 67 Q65 62.5 72 67" stroke="#2A1A12" stroke-width="1.4" fill="none" stroke-linecap="round"/>
             <path d="M88 67 Q95 62.5 102 67" stroke="#2A1A12" stroke-width="1.4" fill="none" stroke-linecap="round"/>` : ""}
`;

const nose =
  `<path d="M78 75 Q75.5 84 73.5 88 Q77 91.5 80.5 89.5" stroke="#000000" stroke-opacity="0.22" stroke-width="2" fill="none" stroke-linecap="round"/>`;

const lipsFn = (color: string) => `
  <path d="M67 98 Q80 95.5 93 98 Q80 105 67 98 Z" fill="${color}"/>
  <path d="M69 98 Q80 100.5 91 98" stroke="#000000" stroke-opacity="0.25" stroke-width="1" fill="none"/>
`;

const blush = `<ellipse cx="54" cy="90" rx="6.5" ry="4.2" fill="#FF9E9E" opacity="0.32"/><ellipse cx="106" cy="90" rx="6.5" ry="4.2" fill="#FF9E9E" opacity="0.32"/>`;

const wrap = (bg: string, tone: SkinTone, inner: string) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
  <defs>${clip}${skinGradientDef(tone)}</defs>
  <circle cx="80" cy="80" r="80" fill="${bg}"/>
  <g clip-path="url(#c)">${inner}</g>
</svg>`.trim();

interface HairLayers {
  back?: string;
  front: string;
}

type HairStyleFn = (c: string) => HairLayers;

// ── Male hairstyles ─────────────────────────────────────────────────────
const maleHair: HairStyleFn[] = [
  // short crop
  (c) => ({
    front: `<path d="M40 58 Q40 20 80 20 Q120 20 120 58 Q120 42 108 40 Q100 30 80 32 Q60 30 52 40 Q40 42 40 58 Z" fill="${c}"/>
            <path d="M52 34 Q60 28 70 30" stroke="#000000" stroke-opacity="0.2" stroke-width="1.5" fill="none"/>`,
  }),
  // side part
  (c) => ({
    front: `<path d="M40 56 Q42 22 80 22 Q118 22 120 56 Q116 34 90 30 L60 34 Q42 40 40 56 Z" fill="${c}"/>
            <path d="M60 24 L58 40" stroke="#000000" stroke-opacity="0.3" stroke-width="1.5"/>`,
  }),
  // buzz cut
  (c) => ({
    front: `<path d="M42 54 Q42 26 80 26 Q118 26 118 54 Q118 44 108 42 Q94 34 80 36 Q66 34 52 42 Q42 44 42 54 Z" fill="${c}"/>`,
  }),
  // curly top
  (c) => ({
    front: `<circle cx="52" cy="46" r="11" fill="${c}"/><circle cx="66" cy="34" r="12" fill="${c}"/>
            <circle cx="80" cy="30" r="12" fill="${c}"/><circle cx="94" cy="34" r="12" fill="${c}"/>
            <circle cx="108" cy="46" r="11" fill="${c}"/><circle cx="80" cy="40" r="14" fill="${c}"/>`,
  }),
  // quiff
  (c) => ({
    front: `<path d="M42 56 Q44 24 80 18 Q90 26 84 34 Q108 26 118 56 Q112 38 96 36 Q104 24 86 24 Q70 20 56 32 Q44 38 42 56 Z" fill="${c}"/>`,
  }),
  // undercut, textured top
  (c) => ({
    front: `<path d="M50 50 Q52 22 80 20 Q108 22 110 50 Q112 34 96 28 Q106 40 92 34 Q80 24 68 34 Q54 28 64 28 Q48 34 50 50 Z" fill="${c}"/>`,
  }),
  // fuller rounded top
  (c) => ({
    front: `<path d="M38 56 Q34 16 80 16 Q126 16 122 56 Q126 40 110 34 Q116 20 80 20 Q44 20 50 34 Q34 40 38 56 Z" fill="${c}"/>`,
  }),
  // short sides + small bun
  (c) => ({
    back: `<circle cx="80" cy="13" r="9" fill="${c}"/>`,
    front: `<path d="M46 54 Q48 24 80 24 Q112 24 114 54 Q112 40 98 36 Q106 26 80 28 Q54 26 62 36 Q48 40 46 54 Z" fill="${c}"/>`,
  }),
  // short crop + light stubble
  (c) => ({
    front: `<path d="M42 54 Q44 22 80 22 Q116 22 118 54 Q114 38 100 36 Q108 26 80 28 Q52 26 60 36 Q46 38 42 54 Z" fill="${c}"/>
            <path d="M56 100 Q80 116 104 100 Q100 112 80 118 Q60 112 56 100 Z" fill="#000000" opacity="0.14"/>`,
  }),
  // side part + mustache
  (c) => ({
    front: `<path d="M40 56 Q42 24 80 24 Q118 24 120 56 Q114 36 88 32 L58 36 Q42 42 40 56 Z" fill="${c}"/>
            <path d="M68 92 Q80 96 92 92 Q86 90 80 91 Q74 90 68 92 Z" fill="#2A1A12"/>`,
  }),
];

const MALE_NAMES = [
  "Ozod", "Aziz", "Bekzod", "Davron", "Eldor", "Sardor", "Jasur", "Otabek", "Farrux", "Shohruh",
  "Islom", "Bobur", "Sanjar", "Rustam", "Akmal", "Diyor", "Jahongir", "Nodir", "Ulug'bek", "Xurshid",
];

// ── Female hairstyles ────────────────────────────────────────────────────
const femaleHair: HairStyleFn[] = [
  // long straight
  (c) => ({
    back: `<path d="M38 64 Q30 140 44 158 L34 158 Q22 130 30 60 Z" fill="${c}"/>
           <path d="M122 64 Q130 140 116 158 L126 158 Q138 130 130 60 Z" fill="${c}"/>`,
    front: `<path d="M42 56 Q46 20 80 20 Q114 20 118 56 Q104 32 80 34 Q56 32 42 56 Z" fill="${c}"/>`,
  }),
  // long wavy
  (c) => ({
    back: `<path d="M40 62 Q26 108 42 148 L32 148 Q16 106 30 58 Z" fill="${c}"/>
           <path d="M120 62 Q134 108 118 148 L128 148 Q144 106 130 58 Z" fill="${c}"/>`,
    front: `<path d="M44 54 Q48 22 80 22 Q112 22 116 54 Q98 36 80 38 Q62 36 44 54 Z" fill="${c}"/>`,
  }),
  // chin-length bob
  (c) => ({
    front: `<path d="M38 60 Q36 20 80 20 Q124 20 122 60 Q118 90 106 100 L106 60 Q100 32 80 32 Q60 32 54 60 L54 100 Q42 90 38 60 Z" fill="${c}"/>`,
  }),
  // high ponytail
  (c) => ({
    back: `<path d="M96 30 Q126 34 118 80 Q112 96 100 90 Q112 66 100 40 Z" fill="${c}"/>`,
    front: `<path d="M44 54 Q48 22 80 22 Q112 22 114 54 Q98 36 80 38 Q62 36 44 54 Z" fill="${c}"/>`,
  }),
  // low ponytail
  (c) => ({
    back: `<path d="M100 60 Q130 70 120 130 Q114 150 100 140 Q112 110 98 74 Z" fill="${c}"/>`,
    front: `<path d="M44 54 Q48 22 80 22 Q112 22 114 54 Q98 36 80 38 Q62 36 44 54 Z" fill="${c}"/>`,
  }),
  // voluminous curls
  (c) => ({
    back: `<circle cx="36" cy="70" r="14" fill="${c}"/><circle cx="34" cy="94" r="13" fill="${c}"/>
           <circle cx="124" cy="70" r="14" fill="${c}"/><circle cx="126" cy="94" r="13" fill="${c}"/>`,
    front: `<circle cx="50" cy="46" r="13" fill="${c}"/><circle cx="66" cy="32" r="14" fill="${c}"/>
            <circle cx="80" cy="28" r="14" fill="${c}"/><circle cx="94" cy="32" r="14" fill="${c}"/>
            <circle cx="110" cy="46" r="13" fill="${c}"/>`,
  }),
  // side braid
  (c) => ({
    back: `<path d="M100 50 Q114 60 106 76 Q118 82 108 96 Q120 102 110 116 Q100 108 100 96 Q106 84 98 78 Q106 68 96 60 Z" fill="${c}"/>`,
    front: `<path d="M44 54 Q48 22 80 22 Q112 22 114 54 Q98 36 80 38 Q62 36 44 54 Z" fill="${c}"/>`,
  }),
  // double space buns
  (c) => ({
    front: `<path d="M44 54 Q48 22 80 22 Q112 22 114 54 Q98 36 80 38 Q62 36 44 54 Z" fill="${c}"/>
            <circle cx="48" cy="28" r="10" fill="${c}"/><circle cx="112" cy="28" r="10" fill="${c}"/>`,
  }),
  // short pixie
  (c) => ({
    front: `<path d="M44 52 Q48 24 80 24 Q112 24 116 52 Q106 36 80 34 Q54 36 44 52 Z" fill="${c}"/>`,
  }),
  // simple hijab
  (c) => ({
    back: `<path d="M30 96 Q34 140 56 158 L44 158 Q24 138 22 100 Z" fill="${c}"/>
           <path d="M130 96 Q126 140 104 158 L116 158 Q136 138 138 100 Z" fill="${c}"/>`,
    front: `<path d="M34 70 Q30 20 80 16 Q130 20 126 70 Q126 100 116 112 L116 70 Q110 34 80 32 Q50 34 44 70 L44 112 Q34 100 34 70 Z" fill="${c}"/>`,
  }),
];

const FEMALE_NAMES = [
  "Malika", "Nilufar", "Sevinch", "Zarina", "Gulnora", "Dilnoza", "Madina", "Shahnoza", "Feruza", "Kamola",
  "Nigora", "Sabina", "Umida", "Zilola", "Mohira", "Gulbahor", "Yulduz", "Robiya", "Shirin", "Lola",
];

const HAIR_COLORS = ["#1C1410", "#3B2A1F", "#5C4033", "#2B2118", "#4A3527", "#6B4226", "#1A1512", "#3E2C22"];
const IRIS_COLORS = ["#3B2A22", "#5C4033", "#4A3020", "#2E2E2E", "#6B4423"];

// 20 unique entries each (not a divisor of the 10-hairstyle cycle) so the
// two passes through each hairstyle never repeat the same shirt/background.
const CLOTH_COLORS_M = [
  "#2563EB", "#16A34A", "#D97706", "#DC2626", "#7C3AED", "#0F766E", "#475569", "#B45309", "#0891B2", "#9333EA",
  "#1D4ED8", "#15803D", "#EA580C", "#B91C1C", "#6D28D9", "#0E7490", "#334155", "#92400E", "#0369A1", "#7E22CE",
];
const CLOTH_COLORS_F = [
  "#DB2777", "#F59E0B", "#0EA5A0", "#8B5CF6", "#EF4444", "#22C55E", "#EC4899", "#06B6D4", "#F97316", "#A855F7",
  "#BE185D", "#D97706", "#0D9488", "#7C3AED", "#DC2626", "#16A34A", "#DB2777", "#0891B2", "#C2410C", "#9333EA",
];
const BG_COLORS = [
  "#DCEEFF", "#E4F7E9", "#FFF3DC", "#FDE3E3", "#E6E6FA", "#DFF7F1", "#F1E9FF", "#E6F9E9", "#FFE4F0", "#FFF6D9",
  "#E0F2FE", "#DCFCE7", "#FEF3C7", "#FEE2E2", "#EDE9FE", "#CCFBF1", "#F5E8FF", "#D1FAE5", "#FCE7F3", "#FEF9C3",
];

const buildFace = (browColor: string, arch: boolean, iris: string, lash: boolean) => `
  ${faceOval}
  ${faceShade}
  ${ears}
  ${brows(browColor, arch)}
  ${eyesFn(iris, lash)}
  ${nose}
  ${lipsFn(lash ? "#C2685E" : "#B5735A")}
  ${lash ? blush : ""}
`;

const buildOption = (
  gender: "boy" | "girl",
  idx: number,
  hairFn: HairStyleFn,
  name: string,
): AvatarOption => {
  const tone = SKIN_TONES[idx % SKIN_TONES.length];
  const hairColor = HAIR_COLORS[idx % HAIR_COLORS.length];
  const iris = IRIS_COLORS[idx % IRIS_COLORS.length];
  const bg = BG_COLORS[idx % BG_COLORS.length];
  const cloth = (gender === "boy" ? CLOTH_COLORS_M : CLOTH_COLORS_F)[idx % 20];
  const hair = hairFn(hairColor);

  const inner = `
    ${hair.back ?? ""}
    ${neckAndShoulders(cloth)}
    ${buildFace(hairColor, gender === "girl", iris, gender === "girl")}
    ${hair.front}
  `;

  return {
    id: `${gender}-${idx}`,
    gender,
    label: name,
    svg: wrap(bg, tone, inner),
  };
};

// 10 hairstyles × 2 passes (each pass shifted through skin/hair/cloth/bg
// palettes) = 20 visually distinct avatars per gender.
const buildSet = (gender: "boy" | "girl", styles: HairStyleFn[], names: string[]): AvatarOption[] =>
  names.map((name, idx) => buildOption(gender, idx, styles[idx % styles.length], name));

const boys: AvatarOption[] = buildSet("boy", maleHair, MALE_NAMES);
const girls: AvatarOption[] = buildSet("girl", femaleHair, FEMALE_NAMES);

export const AVATAR_OPTIONS: AvatarOption[] = [...boys, ...girls];

export const avatarSvgToDataUri = (svg: string): string =>
  `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
