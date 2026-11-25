import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { asyncRoute, idSchema, requireAuth, requireRole, validate } from "../../middleware/index.js";
import { publicUser } from "../../utils/serializers.js";
import { newId } from "../../utils/ids.js";
import { paymentData } from "../../utils/schemas.js";
import { assertStudent, studentScope } from "../../utils/teacherScope.js";
import { afterPaymentChange, dueDateFields } from "../payments/payments.tracking.js";

export const teacherPaymentsRouter = Router();

const paymentCreate = z.object({
  body: paymentData.extend({ studentId: z.string().min(1) }),
  params: z.object({}),
  query: z.object({}),
});

const paymentUpdate = z.object({
  body: paymentData.partial().refine((body) => Object.keys(body).length > 0, "At least one payment field is required"),
  params: z.object({ id: z.string().min(1) }),
  query: z.object({}),
});

/** A payment whose student is in the teacher's scope, or null. */
const scopedPayment = async (req: any, id: string) =>
  prisma.payment.findFirst({ where: { id, User: await studentScope(req) } });

teacherPaymentsRouter.get(
  "/teacher/payments",
  requireAuth,
  requireRole("TEACHER"),
  asyncRoute(async (req: any, res: any) => {
    const payments = await prisma.payment.findMany({
      where: {
        User: await studentScope(req),
        ...(typeof req.query.status === "string" ? { status: req.query.status } : {}),
      },
      include: { User: { select: publicUser } },
      orderBy: { createdAt: "desc" },
    });
    res.json(payments);
  }),
);

teacherPaymentsRouter.post(
  "/teacher/payments",
  requireAuth,
  requireRole("TEACHER"),
  validate(paymentCreate),
  asyncRoute(async (req: any, res: any) => {
    await assertStudent(req, req.body.studentId);
    const payment = await prisma.payment.create({
      data: { id: newId(), ...req.body, ...dueDateFields(req.body.dueDate) },
      include: { User: { select: publicUser } },
    });
    void afterPaymentChange(null, payment);
    res.status(201).json(payment);
  }),
);

teacherPaymentsRouter.patch(
  "/teacher/payments/:id",
  requireAuth,
  requireRole("TEACHER"),
  validate(paymentUpdate),
  asyncRoute(async (req: any, res: any) => {
    const payment = await scopedPayment(req, req.params.id);
    if (!payment) return res.status(404).json({ error: "Payment not found" });
    const updated = await prisma.payment.update({
      where: { id: payment.id },
      data: { ...req.body, ...(req.body.dueDate ? dueDateFields(req.body.dueDate) : {}) },
      include: { User: { select: publicUser } },
    });
    void afterPaymentChange(payment, updated);
    res.json(updated);
  }),
);

teacherPaymentsRouter.delete(
  "/teacher/payments/:id",
  requireAuth,
  requireRole("TEACHER"),
  validate(idSchema),
  asyncRoute(async (req: any, res: any) => {
    const payment = await scopedPayment(req, req.params.id);
    if (!payment) return res.status(404).json({ error: "Payment not found" });
    await prisma.payment.delete({ where: { id: payment.id } });
    res.status(204).send();
  }),
);
