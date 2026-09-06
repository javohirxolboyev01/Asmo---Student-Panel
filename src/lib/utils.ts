// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Backend avatar bermasa (null), ism-familiya asosida generatsiya qilingan rasm ko'rsatiladi.
export function getAvatarUrl(avatar: string | null | undefined, seed: string) {
  return avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}`;
}

// Ba'zi maydonlar (avatar, mahsulot rasmi) emoji/initsial YOKI to'liq rasm URL bo'lishi mumkin —
// UI qaysi holatda <img> render qilishni shu bilan aniqlaydi.
export function isImageUrl(value: string | null | undefined): value is string {
  return typeof value === "string" && /^(https?:)?\/\//.test(value);
}
