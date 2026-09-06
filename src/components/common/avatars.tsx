// src/components/common/avatars.tsx
// A small hand-crafted set of flat, friendly bust-style avatars — an
// alternative to generic default-person icons for the profile picker.
export interface AvatarOption {
  id: string;
  gender: "boy" | "girl";
  label: string;
  svg: string;
}

const clip = `<clipPath id="c"><circle cx="80" cy="80" r="80"/></clipPath>`;

const face = (skin: string) => `<circle cx="80" cy="70" r="34" fill="${skin}"/>`;

const smile = `<path d="M67 82 Q80 92 93 82" stroke="#7A4B3A" stroke-width="3" stroke-linecap="round" fill="none"/>`;

const eyes = (spacing = 12) =>
  `<circle cx="${80 - spacing}" cy="68" r="3.2" fill="#3B2A22"/><circle cx="${80 + spacing}" cy="68" r="3.2" fill="#3B2A22"/>`;

const blush = `<circle cx="58" cy="80" r="6" fill="#FF9E9E" opacity="0.45"/><circle cx="102" cy="80" r="6" fill="#FF9E9E" opacity="0.45"/>`;

const shoulders = (color: string, d = "M14 160 Q18 108 80 102 Q142 108 146 160 Z") =>
  `<path d="${d}" fill="${color}"/>`;

const wrap = (bg: string, inner: string) => `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160">
  <defs>${clip}</defs>
  <circle cx="80" cy="80" r="80" fill="${bg}"/>
  <g clip-path="url(#c)">${inner}</g>
</svg>`.trim();

const BOY_SKIN = "#F0B98A";
const GIRL_SKIN = "#F3C29B";

const boys: AvatarOption[] = [
  {
    id: "boy-spiky",
    gender: "boy",
    label: "Ozod",
    svg: wrap(
      "#DCEEFF",
      `${shoulders("#3B82F6")}
       ${face(BOY_SKIN)}
       <path d="M48 56 Q52 24 80 26 Q108 24 112 56 Q104 40 92 44 Q84 30 80 42 Q76 30 68 44 Q56 40 48 56 Z" fill="#2B2118"/>
       ${eyes()}${smile}${blush}
       <circle cx="64" cy="90" r="2" fill="#D98A5F" opacity=".6"/><circle cx="96" cy="90" r="2" fill="#D98A5F" opacity=".6"/>`,
    ),
  },
  {
    id: "boy-buzz",
    gender: "boy",
    label: "Aziz",
    svg: wrap(
      "#E4F7E9",
      `${shoulders("#16A34A")}
       ${face(BOY_SKIN)}
       <path d="M46 54 Q48 28 80 28 Q112 28 114 54 Q80 44 46 54 Z" fill="#4A3527"/>
       ${eyes()}
       <rect x="58" y="62" width="44" height="14" rx="7" fill="none" stroke="#1F2937" stroke-width="2.5"/>
       <line x1="80" y1="69" x2="80" y2="69" stroke="#1F2937" stroke-width="2.5"/>
       ${smile}${blush}`,
    ),
  },
  {
    id: "boy-curly",
    gender: "boy",
    label: "Bekzod",
    svg: wrap(
      "#FFF3DC",
      `${shoulders("#D97706")}
       ${face(BOY_SKIN)}
       <circle cx="52" cy="46" r="12" fill="#3B2A1F"/><circle cx="66" cy="34" r="13" fill="#3B2A1F"/>
       <circle cx="82" cy="30" r="13" fill="#3B2A1F"/><circle cx="98" cy="34" r="13" fill="#3B2A1F"/>
       <circle cx="110" cy="46" r="12" fill="#3B2A1F"/><circle cx="80" cy="42" r="16" fill="#3B2A1F"/>
       ${eyes()}${smile}${blush}`,
    ),
  },
  {
    id: "boy-swoop",
    gender: "boy",
    label: "Davron",
    svg: wrap(
      "#FDE3E3",
      `${shoulders("#EF4444")}
       <path d="M20 150 Q80 132 140 150 L140 160 L20 160 Z" fill="#111827"/>
       ${face(BOY_SKIN)}
       <path d="M46 52 Q50 22 84 24 Q114 26 112 50 Q96 36 80 40 Q62 34 46 52 Z" fill="#C99A4B"/>
       ${eyes()}${smile}${blush}`,
    ),
  },
  {
    id: "boy-beanie",
    gender: "boy",
    label: "Eldor",
    svg: wrap(
      "#E6E6FA",
      `${shoulders("#7C3AED")}
       ${face(BOY_SKIN)}
       <path d="M42 54 Q42 14 80 14 Q118 14 118 54 L104 54 Q104 30 80 30 Q56 30 56 54 Z" fill="#0F766E"/>
       <rect x="42" y="48" width="76" height="12" rx="6" fill="#0F766E"/>
       <circle cx="80" cy="16" r="6" fill="#F8FAFC"/>
       ${eyes()}${smile}${blush}`,
    ),
  },
];

const girls: AvatarOption[] = [
  {
    id: "girl-straight",
    gender: "girl",
    label: "Malika",
    svg: wrap(
      "#FFE4F0",
      `<path d="M40 70 Q34 140 46 160 L36 160 Q26 130 34 66 Z" fill="#2B2118"/>
       <path d="M120 70 Q126 140 114 160 L124 160 Q134 130 126 66 Z" fill="#2B2118"/>
       ${shoulders("#EC4899")}
       ${face(GIRL_SKIN)}
       <path d="M44 58 Q46 22 80 22 Q114 22 116 58 Q106 34 80 36 Q54 34 44 58 Z" fill="#2B2118"/>
       <circle cx="98" cy="34" r="5" fill="#F472B6"/>
       ${eyes()}${smile}${blush}`,
    ),
  },
  {
    id: "girl-wavy",
    gender: "girl",
    label: "Nilufar",
    svg: wrap(
      "#FFF6D9",
      `<path d="M42 66 Q30 110 44 150 L34 150 Q20 108 34 62 Z" fill="#8B4A2B"/>
       <path d="M118 66 Q130 110 116 150 L126 150 Q140 108 126 62 Z" fill="#8B4A2B"/>
       ${shoulders("#F59E0B")}
       ${face(GIRL_SKIN)}
       <path d="M44 56 Q48 24 80 24 Q112 24 116 56 Q100 38 80 40 Q60 38 44 56 Z" fill="#8B4A2B"/>
       <rect x="46" y="38" width="68" height="9" rx="4.5" fill="#FDE68A"/>
       ${eyes()}${smile}${blush}`,
    ),
  },
  {
    id: "girl-ponytail",
    gender: "girl",
    label: "Sevinch",
    svg: wrap(
      "#DFF7F1",
      `<path d="M108 44 Q140 54 132 100 Q126 118 112 112 Q126 88 118 62 Z" fill="#4A3527"/>
       ${shoulders("#0EA5A0")}
       ${face(GIRL_SKIN)}
       <path d="M46 54 Q48 24 80 24 Q112 24 114 54 Q98 38 80 40 Q62 38 46 54 Z" fill="#4A3527"/>
       <circle cx="60" cy="72" r="2.5" fill="#4A3527" opacity=".7"/><circle cx="100" cy="72" r="2.5" fill="#4A3527" opacity=".7"/>
       ${eyes()}${smile}${blush}`,
    ),
  },
  {
    id: "girl-curly",
    gender: "girl",
    label: "Zarina",
    svg: wrap(
      "#F1E9FF",
      `${shoulders("#8B5CF6")}
       <circle cx="46" cy="56" r="14" fill="#2B2118"/><circle cx="60" cy="38" r="15" fill="#2B2118"/>
       <circle cx="80" cy="30" r="15" fill="#2B2118"/><circle cx="100" cy="38" r="15" fill="#2B2118"/>
       <circle cx="114" cy="56" r="14" fill="#2B2118"/><circle cx="46" cy="76" r="10" fill="#2B2118"/>
       <circle cx="114" cy="76" r="10" fill="#2B2118"/>
       ${face(GIRL_SKIN)}
       <rect x="56" y="62" width="48" height="14" rx="7" fill="none" stroke="#4C1D95" stroke-width="2.5"/>
       ${eyes()}${smile}${blush}`,
    ),
  },
  {
    id: "girl-buns",
    gender: "girl",
    label: "Gulnora",
    svg: wrap(
      "#E6F9E9",
      `<circle cx="42" cy="40" r="14" fill="#3B2A1F"/><circle cx="118" cy="40" r="14" fill="#3B2A1F"/>
       ${shoulders("#22C55E")}
       ${face(GIRL_SKIN)}
       <path d="M46 56 Q48 26 80 26 Q112 26 114 56 Q98 40 80 42 Q62 40 46 56 Z" fill="#3B2A1F"/>
       <path d="M80 18 L86 30 L74 30 Z" fill="#EF4444"/>
       ${eyes()}${smile}${blush}
       <circle cx="64" cy="90" r="2" fill="#D98A5F" opacity=".6"/><circle cx="96" cy="90" r="2" fill="#D98A5F" opacity=".6"/>`,
    ),
  },
];

export const AVATAR_OPTIONS: AvatarOption[] = [...boys, ...girls];

export const avatarSvgToDataUri = (svg: string): string =>
  `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svg)))}`;
