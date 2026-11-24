import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { asyncRoute, requireAuth } from "../../middleware/index.js";
import { uid, studentScope } from "../../utils/teacherScope.js";

export const coinsRouter = Router();

coinsRouter.get(
  "/coins",
  requireAuth,
  asyncRoute(async (req: any, res: any) => {
    if (req.user.role === "STUDENT") {
      const [current, transactions] = await Promise.all([
        prisma.user.findUniqueOrThrow({ where: { id: uid(req) }, select: { coinBalance: true } }),
        prisma.coinTransaction.findMany({
          where: { studentId: uid(req) },
          orderBy: { createdAt: "desc" },
        }),
      ]);
      return res.json({
        balance: current.coinBalance,
        transactions: transactions.map(({ id, amount, reason, createdAt }) => ({ id, amount, reason, createdAt })),
      });
    }
    const transactions = await prisma.coinTransaction.findMany({
      where: { User: await studentScope(req) },
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { User: { select: { firstName: true, lastName: true } } },
    });
    res.json({
      transactions: transactions.map(({ id, studentId, amount, reason, createdAt, User }) => ({
        id,
        userId: studentId,
        studentName: `${User.firstName} ${User.lastName}`,
        amount,
        reason,
        createdAt,
      })),
    });
  }),
);

coinsRouter.get(
  "/leaderboard",
  requireAuth,
  asyncRoute(async (req: any, res: any) => {
    // week/month = coins earned (net) in the last 7/30 days; anything else = all time.
    const days = req.query.filter === "week" ? 7 : req.query.filter === "month" ? 30 : null;
    const since = days ? new Date(Date.now() - days * 24 * 60 * 60 * 1000) : null;
    const [users, sums] = await Promise.all([
      prisma.user.findMany({
        where: { role: "STUDENT", status: "ACTIVE" },
        select: { id: true, firstName: true, lastName: true, avatar: true },
      }),
      prisma.coinTransaction.groupBy({
        by: ["studentId"],
        where: since ? { createdAt: { gte: since } } : undefined,
        _sum: { amount: true },
      }),
    ]);
    const balances = new Map(sums.map((row) => [row.studentId, row._sum.amount ?? 0]));
    res.json(
      users
        .map((u) => ({
          id: u.id,
          firstName: u.firstName,
          lastName: u.lastName,
          avatar: u.avatar,
          balance: balances.get(u.id) ?? 0,
        }))
        .sort((a, b) => b.balance - a.balance),
    );
  }),
);
