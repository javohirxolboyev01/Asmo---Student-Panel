// src/modules/avatar/avatar.routes.ts — student character editor.
// GET /avatar/items          → owned paid items + coin balance
// POST /avatar/items/purchase → buy one item with coins (price from the catalog)
// PUT /avatar/character       → save the character (paid items must be owned)
import { Router } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { asyncRoute, requireAuth, requireRole, validate } from "../../middleware/index.js";
import { newId } from "../../utils/ids.js";
import { uid } from "../../utils/teacherScope.js";
import { publicUser } from "../../utils/serializers.js";
import { paidItemsOf, priceOfKey } from "./avatar.catalog.js";

export const avatarRouter = Router();

const httpError = (status: number, message: string) => Object.assign(new Error(message), { status });
const isUniqueViolation = (e: unknown) => e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";

const ownedKeys = async (studentId: string) =>
  (await prisma.avatarPurchase.findMany({ where: { studentId }, select: { itemKey: true } })).map((p) => p.itemKey);

avatarRouter.get(
  "/avatar/items",
  requireAuth,
  requireRole("STUDENT"),
  asyncRoute(async (req: any, res: any) => {
    const studentId = uid(req);
    const [owned, user] = await Promise.all([
      ownedKeys(studentId),
      prisma.user.findUniqueOrThrow({ where: { id: studentId }, select: { coinBalance: true } }),
    ]);
    res.json({ owned, coinBalance: user.coinBalance });
  }),
);

avatarRouter.post(
  "/avatar/items/purchase",
  requireAuth,
  requireRole("STUDENT"),
  validate(z.object({ body: z.object({ key: z.string().min(1).max(40) }), params: z.object({}), query: z.object({}) })),
  asyncRoute(async (req: any, res: any) => {
    const studentId = uid(req);
    const key: string = req.body.key;
    const price = priceOfKey(key);
    if (price === null) throw httpError(404, "Item not found");
    if (price === 0) throw httpError(400, "Item is free");
    try {
      const coinBalance = await prisma.$transaction(async (tx) => {
        // Conditional decrement: never goes negative even under concurrent requests.
        const { count } = await tx.user.updateMany({
          where: { id: studentId, coinBalance: { gte: price } },
          data: { coinBalance: { decrement: price } },
        });
        if (count === 0) throw httpError(400, "Insufficient coin balance");
        await tx.avatarPurchase.create({ data: { id: newId(), studentId, itemKey: key, price } });
        await tx.coinTransaction.create({
          data: { id: newId(), studentId, amount: -price, reason: "Qahramon uchun xarid", sourceType: "AVATAR" },
        });
        const user = await tx.user.findUniqueOrThrow({ where: { id: studentId }, select: { coinBalance: true } });
        return user.coinBalance;
      });
      res.status(201).json({ owned: await ownedKeys(studentId), coinBalance });
    } catch (e) {
      if (isUniqueViolation(e)) throw httpError(409, "Item already owned");
      throw e;
    }
  }),
);

const idx = z.number().int().min(0).max(20);
const characterSchema = z.object({
  body: z.object({
    config: z.object({
      g: z.enum(["m", "f"]),
      skin: idx,
      hair: idx,
      hc: idx,
      eyes: idx,
      beard: idx,
      outfit: idx,
      hat: idx,
      glasses: idx,
      bg: idx,
    }),
    // The rendered character (drawn by the client from the same catalog).
    svg: z.string().min(20).max(40_000),
  }),
  params: z.object({}),
  query: z.object({}),
});

// Shown via <img>, where SVG scripts never run — still, refuse anything active
// or external so the stored image stays a plain drawing.
const UNSAFE_SVG = /<script|<foreignObject|<iframe|<image|\son[a-z]+\s*=|javascript:|href\s*=\s*["']?(?!#)|url\(\s*["']?(?!#)/i;

avatarRouter.put(
  "/avatar/character",
  requireAuth,
  requireRole("STUDENT"),
  validate(characterSchema),
  asyncRoute(async (req: any, res: any) => {
    const studentId = uid(req);
    const { config, svg } = req.body;
    if (!svg.trimStart().startsWith("<svg") || UNSAFE_SVG.test(svg)) throw httpError(400, "Invalid character image");
    const paid = paidItemsOf(config);
    if ("error" in paid) throw httpError(400, paid.error);
    const owned = new Set(await ownedKeys(studentId));
    if (paid.keys.some((k) => !owned.has(k))) throw httpError(403, "Item not owned");
    const avatar = `data:image/svg+xml;base64,${Buffer.from(svg, "utf8").toString("base64")}`;
    const user = await prisma.user.update({ where: { id: studentId }, data: { avatar }, select: publicUser });
    res.json(user);
  }),
);
