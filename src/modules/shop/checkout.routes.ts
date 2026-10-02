import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { asyncRoute, requireAuth, validate } from "../../middleware/index.js";
import { newId } from "../../utils/ids.js";
import { uid } from "../../utils/teacherScope.js";

export const checkoutRouter = Router();

checkoutRouter.post(
  "/shop/checkout",
  requireAuth,
  validate(
    z.object({
      // `.or(z.undefined())` made the key required under zod v4, so every
      // `{ items }` checkout (what the app sends) was rejected with a 400.
      body: z
        .object({
          productIds: z.array(z.string()).min(1).optional(),
          items: z
            .array(z.object({ productId: z.string(), quantity: z.number().int().positive().max(100) }))
            .min(1)
            .optional(),
        })
        .refine((b) => b.items || b.productIds, { message: "Cart is empty" }),
      params: z.object({}),
      query: z.object({}),
    }),
  ),
  asyncRoute(async (req: any, res: any) => {
    // Quantity per product (legacy `productIds` = one of each, repeats allowed).
    const quantities = new Map<string, number>();
    const lines: { productId: string; quantity: number }[] =
      req.body.items ?? (req.body.productIds ?? []).map((productId: string) => ({ productId, quantity: 1 }));
    for (const { productId, quantity } of lines) quantities.set(productId, (quantities.get(productId) ?? 0) + quantity);
    const found = await prisma.product.findMany({ where: { id: { in: [...quantities.keys()] }, isActive: true } });
    if (found.length !== quantities.size) return res.status(400).json({ error: "Product not found" });
    // One entry per unit bought, so the purchase rows and total match the quantity.
    const products = found.flatMap((product) => Array(quantities.get(product.id)!).fill(product) as typeof found);
    const total = products.reduce((sum, product) => sum + product.price, 0);
    const studentId = uid(req);
    const result = await prisma.$transaction(async (tx) => {
      // Check and spend in one statement: two parallel checkouts can't both
      // pass a read-then-write balance check and push the balance below zero.
      const spent = await tx.user.updateMany({
        where: { id: studentId, coinBalance: { gte: total } },
        data: { coinBalance: { decrement: total } },
      });
      if (!spent.count) throw Object.assign(new Error("Insufficient coin balance"), { status: 400 });
      const purchases = await Promise.all(
        products.map((product) =>
          tx.purchase.create({ data: { id: newId(), studentId, productId: product.id, price: product.price } }),
        ),
      );
      await tx.coinTransaction.create({
        data: { id: newId(), studentId, amount: -total, reason: "Do'kondan xarid", sourceType: "SHOP" },
      });
      const user = await tx.user.findUniqueOrThrow({ where: { id: studentId }, select: { coinBalance: true } });
      return { purchases, balance: user.coinBalance };
    });
    res.status(201).json({
      message: "Purchase successful",
      purchaseIds: result.purchases.map((x) => x.id),
      balance: result.balance,
    });
  }),
);
