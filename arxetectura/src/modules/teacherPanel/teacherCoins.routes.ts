import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { asyncRoute, requireAuth, requireRole, validate } from "../../middleware/index.js";
import { newId } from "../../utils/ids.js";

export const teacherCoinsRouter = Router();

teacherCoinsRouter.post(
  "/teacher/coins",
  requireAuth,
  requireRole("TEACHER", "ADMIN"),
  validate(
    z.object({
      body: z.object({
        studentId: z.string(),
        amount: z.number().int().min(-1000).max(1000).refine((x) => x !== 0),
        reason: z.string().min(1).max(200),
        sourceType: z.enum(["ATTENDANCE", "HOMEWORK", "BONUS", "PENALTY"]),
      }),
      params: z.object({}),
      query: z.object({}),
    }),
  ),
  asyncRoute(async (req: any, res: any) => {
    const student = await prisma.user.findFirst({ where: { id: req.body.studentId, role: "STUDENT" } });
    if (!student) return res.status(404).json({ error: "Student not found" });
    // Ledger entry and balance change together, same as POST /students/:id/coins
    // (the balance never goes below zero).
    const transaction = await prisma.$transaction(async (tx) => {
      const created = await tx.coinTransaction.create({ data: { id: newId(), ...req.body } });
      // Relative update in SQL, so a mission claim or purchase landing at the
      // same moment isn't overwritten by a stale balance.
      await tx.$executeRaw`UPDATE "User" SET "coinBalance" = GREATEST(0, "coinBalance" + ${req.body.amount}) WHERE id = ${student.id}`;
      return created;
    });
    res.status(201).json(transaction);
  }),
);
