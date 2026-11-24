import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { asyncRoute, idSchema, requireAuth, requireRole, validate } from "../../middleware/index.js";
import { lower, paymentSummary, userSummary } from "../../utils/serializers.js";
import { avatarSchema, studentCreate } from "../../utils/schemas.js";
import { newId } from "../../utils/ids.js";
import { uid, assertStudent, studentScope, liveEnrollment } from "../../utils/teacherScope.js";
import { register } from "../auth/auth.service.js";
import { parsePage, setTotalCount } from "../../utils/pagination.js";
import type { Prisma } from "@prisma/client";

const staff = ["TEACHER", "ADMIN"];

export const studentsRouter = Router();

/**
 * Archives a student instead of deleting them: the login is disabled, sessions
 * are revoked and they leave every group (enrollments become DROPPED, so the
 * former teachers still see them in the archive), but payments, coin history,
 * submissions and attendance stay for the records.
 */
export const archiveStudent = (studentId: string) =>
  prisma.$transaction([
    prisma.user.update({ where: { id: studentId }, data: { status: "INACTIVE", updatedAt: new Date() } }),
    prisma.refreshToken.updateMany({ where: { userId: studentId, revokedAt: null }, data: { revokedAt: new Date() } }),
    prisma.enrollment.updateMany({ where: { studentId }, data: { status: "DROPPED" } }),
  ]);

const listQuery = z.object({
  search: z.string().max(100).optional(),
  groupId: z.string().max(100).optional(),
  // Default: active students only. "INACTIVE" = archived, "all" = both.
  status: z.enum(["ACTIVE", "INACTIVE", "all"]).optional(),
});

const queryString = (value: unknown) => (typeof value === "string" ? value : undefined);

studentsRouter.get(
  "/students",
  requireAuth,
  requireRole(...staff),
  asyncRoute(async (req: any, res: any) => {
    const parsed = listQuery.safeParse({
      search: queryString(req.query.search),
      groupId: queryString(req.query.groupId),
      status: queryString(req.query.status),
    });
    if (!parsed.success) return res.status(400).json({ error: "Invalid query" });
    const { search, groupId, status = "ACTIVE" } = parsed.data;
    // Optional ?limit=&offset=; without them the full list, as before.
    const page = parsePage(req);
    const where = {
      role: "STUDENT",
      ...(status === "all" ? {} : { status }),
      AND: [
        await studentScope(req),
        search
          ? {
              OR: [
                { firstName: { contains: search } },
                { lastName: { contains: search } },
                { email: { contains: search } },
              ],
            }
          : {},
      ],
      ...(groupId ? { Enrollment: { some: { groupId, ...liveEnrollment } } } : {}),
    } satisfies Prisma.UserWhereInput;
    const rows = await prisma.user.findMany({
      where,
      ...(page ? { orderBy: [{ createdAt: "desc" as const }, { id: "asc" as const }], ...page } : {}),
      include: { Enrollment: { where: liveEnrollment, include: { Group: { select: { id: true, name: true } } } } },
    });
    if (page) setTotalCount(res, await prisma.user.count({ where }));
    // Count attendance per student/status in the DB instead of loading every record.
    const counts = await prisma.attendanceRecord.groupBy({
      by: ["studentId", "status"],
      where: { studentId: { in: rows.map((u) => u.id) } },
      _count: { _all: true },
    });
    const attendance = new Map<string, { total: number; present: number }>();
    for (const row of counts) {
      const entry = attendance.get(row.studentId) ?? { total: 0, present: 0 };
      entry.total += row._count._all;
      if (row.status === "PRESENT") entry.present += row._count._all;
      attendance.set(row.studentId, entry);
    }
    res.json({
      students: rows.map((u) => {
        const stats = attendance.get(u.id);
        return {
          ...userSummary(u),
          groups: u.Enrollment.map((e) => ({ id: e.Group.id, name: e.Group.name })),
          attendancePercentage: stats?.total ? Math.round((stats.present / stats.total) * 100) : 0,
        };
      }),
    });
  }),
);

studentsRouter.post(
  "/students",
  requireAuth,
  requireRole(...staff),
  validate(studentCreate),
  asyncRoute(async (req: any, res: any) => {
    const result = await register({ ...req.body, role: "student" });
    res.status(201).json(result.user);
  }),
);

studentsRouter.get(
  "/students/:id",
  requireAuth,
  requireRole(...staff),
  validate(idSchema),
  asyncRoute(async (req: any, res: any) => {
    const user = await prisma.user.findFirst({
      where: { id: req.params.id, role: "STUDENT", ...(await studentScope(req)) },
      include: {
        Enrollment: { where: liveEnrollment, include: { Group: true } },
        AttendanceRecord: { include: { Lesson: true } },
        CoinTransaction: true,
        Payment: true,
        Submission: { include: { Homework: { include: { Lesson: true } } } },
      },
    });
    if (!user) return res.status(404).json({ error: "Student not found" });
    const present = user.AttendanceRecord.filter((a) => a.status === "PRESENT").length;
    res.json({
      student: userSummary(user),
      groups: user.Enrollment.map((e) => ({ id: e.Group.id, name: e.Group.name })),
      attendance: {
        stats: {
          total: user.AttendanceRecord.length,
          present,
          percentage: user.AttendanceRecord.length ? Math.round((present / user.AttendanceRecord.length) * 100) : 0,
        },
        records: user.AttendanceRecord,
      },
      coinTransactions: user.CoinTransaction,
      payments: user.Payment.map((p) => paymentSummary(p)),
      submissions: user.Submission.map((s) => ({
        id: s.id,
        homeworkTitle: s.Homework.title,
        lessonTopic: s.Homework.Lesson.topic,
        score: s.score,
        maxScore: s.Homework.maxScore,
        status: lower(s.status),
        submittedAt: s.submittedAt,
      })),
    });
  }),
);

studentsRouter.patch(
  "/students/:id",
  requireAuth,
  requireRole(...staff),
  validate(
    z.object({
      body: z.object({
        firstName: z.string().min(2).optional(),
        lastName: z.string().min(2).optional(),
        phone: z.string().nullable().optional(),
        avatar: avatarSchema.optional(),
        status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
      }),
      params: z.object({ id: z.string() }),
      query: z.object({}),
    }),
  ),
  asyncRoute(async (req: any, res: any) => {
    const user = await prisma.user.updateMany({
      where: { id: req.params.id, role: "STUDENT", ...(await studentScope(req)) },
      data: req.body,
    });
    if (!user.count) return res.status(404).json({ error: "Student not found" });
    res.json(userSummary(await prisma.user.findUniqueOrThrow({ where: { id: req.params.id } })));
  }),
);

// "Delete" archives the student (see archiveStudent): a hard delete would
// cascade away their payments and coin history.
studentsRouter.delete(
  "/students/:id",
  requireAuth,
  requireRole(...staff),
  validate(idSchema),
  asyncRoute(async (req: any, res: any) => {
    const student = await assertStudent(req, req.params.id);
    await archiveStudent(student.id);
    res.status(204).send();
  }),
);

studentsRouter.post(
  "/students/:id/coins",
  requireAuth,
  requireRole(...staff),
  validate(
    z.object({
      body: z.object({
        amount: z.number().int().min(-100_000).max(100_000).refine((x) => x !== 0),
        reason: z.string().trim().min(1).max(200),
      }),
      params: z.object({ id: z.string() }),
      query: z.object({}),
    }),
  ),
  asyncRoute(async (req: any, res: any) => {
    const student = await assertStudent(req, req.params.id);
    const result = await prisma.$transaction(async (tx) => {
      // Relative update in SQL (see teacherCoins.routes.ts): never writes a stale balance.
      // The ledger records what was actually applied (a penalty is clipped at 0),
      // so the sum of transactions always matches the balance.
      const [row] = await tx.$queryRaw<{ coinBalance: number; applied: number }[]>`
        UPDATE "User" u SET "coinBalance" = GREATEST(0, old."coinBalance" + ${req.body.amount})
        FROM (SELECT id, "coinBalance" FROM "User" WHERE id = ${student.id} FOR UPDATE) old
        WHERE u.id = old.id
        RETURNING u."coinBalance", (u."coinBalance" - old."coinBalance") AS applied`;
      const balance = row!.coinBalance;
      await tx.coinTransaction.create({
        data: {
          id: newId(),
          studentId: student.id,
          amount: Number(row!.applied),
          reason: req.body.reason,
          sourceType: req.body.amount > 0 ? "BONUS" : "PENALTY",
        },
      });
      await tx.notification.create({
        data: { id: newId(), userId: student.id, type: "SYSTEM", title: "Coin balance updated", message: req.body.reason },
      });
      return balance;
    });
    res.status(201).json({ balance: result });
  }),
);

const payCreate = z.object({
  body: z.object({
    amountNumber: z.number().int().positive().max(1_000_000_000),
    paymentType: z.enum(["CASH", "CLICK", "PAYME", "BANK", "UZUM"]),
    status: z.enum(["PAID", "PENDING", "OVERDUE", "CANCELLED"]).optional(),
    description: z.string().optional(),
    receiptNumber: z.string().optional(),
  }),
  params: z.object({ id: z.string() }),
  query: z.object({}),
});

studentsRouter.post(
  "/students/:id/payments",
  requireAuth,
  requireRole(...staff),
  validate(payCreate),
  asyncRoute(async (req: any, res: any) => {
    const student = await assertStudent(req, req.params.id);
    const teacher =await prisma.teacher.findUnique({ where: { userId: uid(req) } });
    const status = req.body.status ?? "PENDING";
    const actor = teacher ?? (await prisma.user.findUniqueOrThrow({ where: { id: uid(req) } }));
    const payment = await prisma.payment.create({
      data: {
        id: newId(),
        studentId: student.id,
        amount: req.body.amountNumber,
        amountNumber: req.body.amountNumber,
        orderNumber: (await prisma.payment.count({ where: { studentId: student.id } })) + 1,
        status,
        paymentType: req.body.paymentType,
        description: req.body.description,
        receiptNumber: req.body.receiptNumber,
        dueDate: new Date(),
        teacherName: teacher?.fullName ?? `${(actor as any).firstName} ${(actor as any).lastName}`,
        paidAt: status === "PAID" ? new Date() : null,
      },
    });
    res.status(201).json(paymentSummary(payment));
  }),
);
