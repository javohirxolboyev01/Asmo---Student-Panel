// src/utils/schemas.ts — zod schemas shared across more than one module.
import { z } from "zod";

export const avatarSchema = z.preprocess(
  (value) => (value === "" ? null : value),
  z
    .string()
    // Avatars are sent in every list (leaderboard, rosters), so keep them small.
    // The in-app character SVG is a few KB; 300 KB leaves room for a photo URL/data.
    .max(300_000, "Avatar is too large")
    .nullable()
    .refine(
      (value) =>
        value === null ||
        /^https?:\/\/|^data:image\/[a-z0-9.+-]+;base64,/.test(value),
      "Avatar must be an http(s) URL or supported image data URL",
    )
    // SVG avatars only come from PUT /avatar/character, which checks the drawing
    // and that the paid items are owned; a raw SVG here would skip both.
    .refine((value) => value === null || !/^data:image\/svg/i.test(value), "Use the character editor for SVG avatars"),
);

export const gradeBody = z.object({
  score: z.coerce.number().int().min(0).max(1_000_000),
  feedback: z.string().max(5000).optional(),
});

export const paymentData = z.object({
  amount: z.number().int().positive().max(1_000_000_000),
  status: z.enum(["PAID", "PENDING", "OVERDUE", "CANCELLED"]).optional(),
  paymentType: z.enum(["CASH", "CLICK", "PAYME", "BANK", "UZUM"]),
  description: z.string().max(500).nullable().optional(),
  dueDate: z.coerce.date(),
  paidAt: z.coerce.date().nullable().optional(),
});

export const studentCreate = z.object({
  body: z.object({
    email: z.string().trim().toLowerCase().email().max(254),
    password: z.string().min(6).max(128),
    firstName: z.string().trim().min(2).max(60),
    lastName: z.string().trim().min(2).max(60),
    phone: z.string().trim().max(32).optional(),
  }),
  params: z.object({}),
  query: z.object({}),
});
