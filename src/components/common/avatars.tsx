// src/components/common/avatars.tsx
// Static bust-portrait illustrations (public/avatars/*.svg) — 10 boy + 10 girl.
// Square canvas framed as head+shoulders so the art reads clearly cropped into
// the app's small circular avatar slots (as small as 28px in lists/nav).
export interface AvatarOption {
  id: string;
  gender: "boy" | "girl";
  label: string;
  path: string;
}

const MALE_NAMES = ["Ozod", "Aziz", "Bekzod", "Davron", "Eldor", "Sardor", "Jasur", "Otabek", "Farrux", "Shohruh"];
const FEMALE_NAMES = ["Malika", "Nilufar", "Sevinch", "Zarina", "Gulnora", "Dilnoza", "Madina", "Shahnoza", "Feruza", "Kamola"];

const boys: AvatarOption[] = MALE_NAMES.map((label, idx) => ({
  id: `boy-${idx + 1}`,
  gender: "boy",
  label,
  path: `/avatars/boy-${String(idx + 1).padStart(2, "0")}.svg`,
}));

const girls: AvatarOption[] = FEMALE_NAMES.map((label, idx) => ({
  id: `girl-${idx + 1}`,
  gender: "girl",
  label,
  path: `/avatars/girl-${String(idx + 1).padStart(2, "0")}.svg`,
}));

export const AVATAR_OPTIONS: AvatarOption[] = [...boys, ...girls];
