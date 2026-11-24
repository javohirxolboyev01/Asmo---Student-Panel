import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { asyncRoute, requireAuth, requireRole, validate } from "../../middleware/index.js";
import { newId } from "../../utils/ids.js";
import { assertStudent } from "../../utils/teacherScope.js";

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
    const student = await assertStudent(req, req.body.studentId);
    // Ledger entry and balance change together, same as POST /students/:id/coins
    // (the balance never goes below zero).
    const transaction = await prisma.$transaction(async (tx) => {
      // Relative update in SQL, so a mission claim or purchase landing at the
      // same moment isn't overwritten by a stale balance. The ledger records the
      // amount actually applied (a penalty is clipped at 0).
      const [row] = await tx.$queryRaw<{ applied: number }[]>`
        UPDATE "User" u SET "coinBalance" = GREATEST(0, old."coinBalance" + ${req.body.amount})
        FROM (SELECT id, "coinBalance" FROM "User" WHERE id = ${student.id} FOR UPDATE) old
        WHERE u.id = old.id
        RETURNING (u."coinBalance" - old."coinBalance") AS applied`;
      return tx.coinTransaction.create({ data: { id: newId(), ...req.body, amount: Number(row!.applied) } });
    });
    res.status(201).json(transaction);
  }),
);
