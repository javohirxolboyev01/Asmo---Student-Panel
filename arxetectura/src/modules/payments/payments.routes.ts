import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { asyncRoute, idSchema, requireAuth, requireRole, validate } from "../../middleware/index.js";
import { paymentSummary } from "../../utils/serializers.js";
import { currentUser, studentScope } from "../../utils/teacherScope.js";
import { parsePage, setTotalCount } from "../../utils/pagination.js";

const staff = ["TEACHER", "ADMIN"];

export const paymentsRouter = Router();

/** A payment whose student is in the caller's scope, or null. */
const scopedPayment = async (req: any, id: string) =>
  prisma.payment.findFirst({ where: { id, User: await studentScope(req) } });

const payUpdate = z.object({
  body: z.object({
    amountNumber: z.number().int().positive().max(1_000_000_000).optional(),
    status: z.enum(["PAID", "PENDING", "OVERDUE", "CANCELLED"]).optional(),
    paymentType: z.enum(["CASH", "CLICK", "PAYME", "BANK", "UZUM"]).optional(),
    description: z.string().nullable().optional(),
    receiptNumber: z.string().nullable().optional(),
  }),
  params: z.object({ id: z.string().min(1) }),
  query: z.object({}),
});

paymentsRouter.get(
  "/payments",
  requireAuth,
  asyncRoute(async (req: any, res: any) => {
    const current = currentUser(req);
    // Optional ?limit=&offset= (staff only); without them the full list, as before.
    const page = current.role === "STUDENT" ? null : parsePage(req);
    // Staff: payments of students in their scope (archived students included,
    // so payment history survives archiving).
    const where = current.role === "STUDENT" ? { studentId: current.id } : { User: await studentScope(req) };
    const payments = await prisma.payment.findMany({
      where,
      // Only staff rows show the student's name.
      include: current.role === "STUDENT" ? undefined : { User: { select: { id: true, firstName: true, lastName: true } } },
      // A tiebreak keeps pages stable when timestamps collide.
      orderBy: page ? [{ createdAt: "desc" }, { id: "asc" }] : { createdAt: "desc" },
      ...(page ?? {}),
    });
    if (page) setTotalCount(res, await prisma.payment.count({ where }));
    res.json({ payments: payments.map((payment) => paymentSummary(payment, current.role !== "STUDENT")) });
  }),
);

paymentsRouter.patch(
  "/payments/:id",
  requireAuth,
  requireRole(...staff),
  validate(payUpdate),
  asyncRoute(async (req: any, res: any) => {
    const payment = await scopedPayment(req, req.params.id);
    if (!payment) return res.status(404).json({ error: "Payment not found" });
    const nextStatus = req.body.status ?? payment.status;
    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data: {
        ...req.body,
        ...(req.body.amountNumber ? { amount: req.body.amountNumber } : {}),
        paidAt: nextStatus === "PAID" ? (payment.paidAt ?? new Date()) : null,
      },
    });
    res.json(paymentSummary(updated));
  }),
);

paymentsRouter.delete(
  "/payments/:id",
  requireAuth,
  requireRole(...staff),
  validate(idSchema),
  asyncRoute(async (req: any, res: any) => {
    const payment = await scopedPayment(req, req.params.id);
    if (!payment) return res.status(404).json({ error: "Payment not found" });
    await prisma.payment.delete({ where: { id: payment.id } });
    res.status(204).send();
  }),
);
