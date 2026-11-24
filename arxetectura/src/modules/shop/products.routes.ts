import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { asyncRoute, idSchema, requireAuth, requireRole, validate } from "../../middleware/index.js";
import { newId } from "../../utils/ids.js";

const staff = ["TEACHER", "ADMIN"];

export const productsRouter = Router();

const productData = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  price: z.number().int().positive().max(100_000_000),
  originalPrice: z.number().int().positive().optional(),
  category: z.string().min(1),
  image: z.string().optional(),
  rating: z.number().min(0).max(5).optional(),
  reviews: z.number().int().min(0).optional(),
  isPopular: z.boolean().optional(),
  isNew: z.boolean().optional(),
  isLimited: z.boolean().optional(),
  // "Sotuvda / Yashirin": hidden products disappear from the student shop and can't be bought.
  isActive: z.boolean().optional(),
});

// Staff shop management: every product, hidden ones included, with isActive.
productsRouter.get(
  "/products/manage",
  requireAuth,
  requireRole(...staff),
  asyncRoute(async (_req: any, res: any) => {
    const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });
    res.json({ products });
  }),
);

productsRouter.get(
  "/products",
  asyncRoute(async (req: any, res: any) => {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        ...(req.query.category ? { category: String(req.query.category) } : {}),
        ...(req.query.search ? { name: { contains: String(req.query.search) } } : {}),
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ products: products.map(({ isActive, ...product }) => product) });
  }),
);

productsRouter.post(
  "/products",
  requireAuth,
  requireRole("ADMIN"),
  validate(z.object({ body: productData, params: z.object({}), query: z.object({}) })),
  asyncRoute(async (req: any, res: any) =>
    res.status(201).json(await prisma.product.create({ data: { id: newId(), ...req.body } })),
  ),
);

productsRouter.patch(
  "/products/:id",
  requireAuth,
  requireRole("ADMIN"),
  validate(z.object({ body: productData.partial(), params: z.object({ id: z.string() }), query: z.object({}) })),
  asyncRoute(async (req: any, res: any) =>
    res.json(await prisma.product.update({ where: { id: req.params.id }, data: req.body })),
  ),
);

productsRouter.delete(
  "/products/:id",
  requireAuth,
  requireRole("ADMIN"),
  validate(idSchema),
  asyncRoute(async (req: any, res: any) => {
    if (await prisma.purchase.count({ where: { productId: req.params.id } }))
      return res.status(400).json({ error: "Product has purchase history" });
    await prisma.wishlistItem.deleteMany({ where: { productId: req.params.id } });
    await prisma.product.delete({ where: { id: req.params.id } });
    res.status(204).send();
  }),
);
