// src/modules/missions/missions.routes.ts
// Student: GET /missions/today, POST /missions/:id/claim, POST /chest/open.
// Staff:   GET/POST /missions, PATCH/DELETE /missions/:id.
import { Router } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { asyncRoute, requireAuth, requireRole, validate } from "../../middleware/index.js";
import { newId } from "../../utils/ids.js";
import { uid } from "../../utils/teacherScope.js";
import {
  CHEST_REWARDS,
  MISSION_TYPES,
  awardCoins,
  dayKey,
  httpError,
  missionsForStudent,
  streakFor,
  todayEvidence,
} from "./missions.service.js";

const staff = ["TEACHER", "ADMIN"];
const isUniqueViolation = (e: unknown) => e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";

export const missionsRouter = Router();

// ── Student ──

missionsRouter.get(
  "/missions/today",
  requireAuth,
  requireRole("STUDENT"),
  asyncRoute(async (req: any, res: any) => {
    const studentId = uid(req);
    const day = dayKey();
    const [missions, check, completions, chest, streak] = await Promise.all([
      missionsForStudent(studentId, day),
      todayEvidence(studentId, day),
      prisma.missionCompletion.findMany({ where: { studentId, day }, select: { missionId: true } }),
      prisma.dailyChest.findUnique({ where: { studentId_day: { studentId, day } } }),
      streakFor(studentId, day),
    ]);
    const claimed = new Set(completions.map((c) => c.missionId));
    const items = missions.map((m) => ({
      id: m.id,
      title: m.title,
      description: m.description,
      emoji: m.emoji,
      type: m.type,
      target: m.target,
      coinReward: m.coinReward,
      groupId: m.groupId,
      quizId: m.quizId,
      status: claimed.has(m.id) ? "CLAIMED" : check(m) ? "READY" : "PENDING",
    }));
    res.json({
      day,
      missions: items,
      completed: items.filter((m) => m.status === "CLAIMED").length,
      total: items.length,
      streak,
      chest: { opened: Boolean(chest), reward: chest?.reward ?? null },
    });
  }),
);

missionsRouter.post(
  "/missions/:id/claim",
  requireAuth,
  requireRole("STUDENT"),
  validate(z.object({ body: z.object({}).passthrough().default({}), params: z.object({ id: z.string().min(1) }), query: z.object({}) })),
  asyncRoute(async (req: any, res: any) => {
    const studentId = uid(req);
    const day = dayKey();
    const [missions, check] = await Promise.all([missionsForStudent(studentId, day), todayEvidence(studentId, day)]);
    const mission = missions.find((m) => m.id === req.params.id);
    if (!mission) throw httpError(404, "Mission not found");
    if (!check(mission)) throw httpError(400, "Mission condition is not met yet");
    // A test mission pays once ever, not once a day.
    if (
      mission.type === "PASS_QUIZ" &&
      (await prisma.missionCompletion.findFirst({ where: { missionId: mission.id, studentId }, select: { id: true } }))
    )
      throw httpError(409, "Mission already claimed");
    try {
      const balance = await prisma.$transaction(async (tx) => {
        await tx.missionCompletion.create({
          data: { id: newId(), missionId: mission.id, studentId, day, coins: mission.coinReward },
        });
        return awardCoins(tx, studentId, mission.coinReward, `Missiya: ${mission.title}`, "MISSION");
      });
      res.status(201).json({ missionId: mission.id, coins: mission.coinReward, balance, streak: await streakFor(studentId, day) });
    } catch (e) {
      if (isUniqueViolation(e)) throw httpError(409, "Mission already claimed today");
      throw e;
    }
  }),
);

missionsRouter.post(
  "/chest/open",
  requireAuth,
  requireRole("STUDENT"),
  validate(z.object({ body: z.object({ pick: z.number().int().min(0).max(2) }), params: z.object({}), query: z.object({}) })),
  asyncRoute(async (req: any, res: any) => {
    const studentId = uid(req);
    const day = dayKey();
    // The server decides what's in each capsule; the pick only chooses which one opens.
    const rewards: number[] = [...CHEST_REWARDS];
    // Fisher–Yates: every order equally likely (sort(random) is biased).
    for (let i = rewards.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [rewards[i], rewards[j]] = [rewards[j]!, rewards[i]!];
    }
    const reward: number = rewards[req.body.pick as 0 | 1 | 2] ?? CHEST_REWARDS[0];
    try {
      const balance = await prisma.$transaction(async (tx) => {
        await tx.dailyChest.create({ data: { id: newId(), studentId, day, reward } });
        return awardCoins(tx, studentId, reward, "Kunlik sandiq", "CHEST");
      });
      res.status(201).json({ reward, rewards, pick: req.body.pick, balance, streak: await streakFor(studentId, day) });
    } catch (e) {
      if (isUniqueViolation(e)) throw httpError(409, "Daily chest already opened");
      throw e;
    }
  }),
);

// ── Staff ──

const USES_TARGET = new Set(["GOOD_GRADE", "PASS_QUIZ"]);

const missionBody = z
  .object({
    title: z.string().trim().min(1).max(100),
    description: z.string().trim().max(200).nullable().optional(),
    emoji: z.string().trim().min(1).max(8).default("⭐"),
    type: z.enum(MISSION_TYPES),
    target: z.number().int().min(1).max(100).nullable().optional(),
    // Capped so a typo can't flood the coin economy.
    coinReward: z.number().int().min(1).max(100),
    groupId: z.string().min(1).nullable().optional(),
    quizId: z.string().min(1).nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .refine((b) => !USES_TARGET.has(b.type) || (b.target ?? 0) > 0, {
    message: "This mission type needs a target percentage",
    path: ["target"],
  })
  .refine((b) => b.type !== "PASS_QUIZ" || Boolean(b.quizId), {
    message: "PASS_QUIZ missions need a quiz",
    path: ["quizId"],
  });

/** Request body → mission columns; fields that only make sense for some types are cleared for the others. */
const missionData = ({ quizId, ...body }: any) => ({
  ...body,
  target: USES_TARGET.has(body.type) ? body.target : null,
  quizId: body.type === "PASS_QUIZ" ? quizId : null,
});

/** Relations every staff mission response includes. */
const missionInclude = { Group: { select: { name: true } }, Quiz: { select: { title: true } } };

const assertGroup = async (groupId?: string | null) => {
  if (groupId && !(await prisma.group.findUnique({ where: { id: groupId }, select: { id: true } })))
    throw httpError(404, "Group not found");
};

const assertQuiz = async (body: any) => {
  if (body.type === "PASS_QUIZ" && !(await prisma.quiz.findUnique({ where: { id: body.quizId }, select: { id: true } })))
    throw httpError(404, "Quiz not found");
};

const serializeMission = (m: any, completedToday = 0) => ({
  id: m.id,
  title: m.title,
  description: m.description,
  emoji: m.emoji,
  type: m.type,
  target: m.target,
  coinReward: m.coinReward,
  groupId: m.groupId,
  groupName: m.Group?.name ?? null,
  quizId: m.quizId,
  quizTitle: m.Quiz?.title ?? null,
  isActive: m.isActive,
  createdAt: m.createdAt,
  completedToday,
});

missionsRouter.get(
  "/missions",
  requireAuth,
  requireRole(...staff),
  asyncRoute(async (_req: any, res: any) => {
    const [missions, counts] = await Promise.all([
      prisma.mission.findMany({ orderBy: { createdAt: "desc" }, include: missionInclude }),
      prisma.missionCompletion.groupBy({ by: ["missionId"], where: { day: dayKey() }, _count: { _all: true } }),
    ]);
    const today = new Map(counts.map((c) => [c.missionId, c._count._all]));
    res.json(missions.map((m) => serializeMission(m, today.get(m.id) ?? 0)));
  }),
);

missionsRouter.post(
  "/missions",
  requireAuth,
  requireRole(...staff),
  validate(z.object({ body: missionBody, params: z.object({}), query: z.object({}) })),
  asyncRoute(async (req: any, res: any) => {
    await assertGroup(req.body.groupId);
    await assertQuiz(req.body);
    const mission = await prisma.mission.create({
      data: { id: newId(), ...missionData(req.body) },
      include: missionInclude,
    });
    res.status(201).json(serializeMission(mission));
  }),
);

missionsRouter.patch(
  "/missions/:id",
  requireAuth,
  requireRole(...staff),
  validate(z.object({ body: missionBody, params: z.object({ id: z.string().min(1) }), query: z.object({}) })),
  asyncRoute(async (req: any, res: any) => {
    if (!(await prisma.mission.findUnique({ where: { id: req.params.id }, select: { id: true } })))
      throw httpError(404, "Mission not found");
    await assertGroup(req.body.groupId);
    await assertQuiz(req.body);
    const mission = await prisma.mission.update({
      where: { id: req.params.id },
      data: {
        ...missionData(req.body),
        groupId: req.body.groupId ?? null,
        description: req.body.description ?? null,
      },
      include: missionInclude,
    });
    res.json(serializeMission(mission));
  }),
);

missionsRouter.delete(
  "/missions/:id",
  requireAuth,
  requireRole(...staff),
  asyncRoute(async (req: any, res: any) => {
    const deleted = await prisma.mission.deleteMany({ where: { id: req.params.id } });
    if (!deleted.count) throw httpError(404, "Mission not found");
    res.status(204).end();
  }),
);
