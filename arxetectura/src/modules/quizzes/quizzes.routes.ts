// src/modules/quizzes/quizzes.routes.ts
// Student: GET /quizzes/:id/play, POST /quizzes/:id/start, POST /quizzes/:id/submit.
// Staff:   GET/POST /quizzes, GET/PUT/DELETE /quizzes/:id, GET /quizzes/:id/results.
import { Router } from "express";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { asyncRoute, idSchema, requireAuth, requireRole, validate } from "../../middleware/index.js";
import { newId } from "../../utils/ids.js";
import { uid, assertGroup as assertScopedGroup, quizScope } from "../../utils/teacherScope.js";
import { httpError } from "../missions/missions.service.js";
import {
  attemptDeadline,
  isExpired,
  percentOf,
  playableQuestions,
  scoreAnswers,
  visibleQuizWhere,
} from "./quizzes.service.js";

const staff = ["TEACHER", "ADMIN"];
const isUniqueViolation = (e: unknown) => e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002";

const questionSelect = { id: true, text: true, options: true, correctIndex: true } as const;
const orderedQuestions = { select: questionSelect, orderBy: { order: "asc" as const } };

export const quizzesRouter = Router();

// ── Student ──

/** The student's quiz, or 404 when it isn't theirs to see. */
const studentQuiz = async (studentId: string, quizId: string) => {
  const quiz = await prisma.quiz.findFirst({
    where: { id: quizId, ...(await visibleQuizWhere(studentId)) },
    include: { QuizQuestion: orderedQuestions },
  });
  if (!quiz) throw httpError(404, "Quiz not found");
  return quiz;
};

type StudentQuiz = Awaited<ReturnType<typeof studentQuiz>>;
type Attempt = NonNullable<Awaited<ReturnType<typeof prisma.quizAttempt.findUnique>>>;

const savedAnswers = (attempt: Attempt) => (attempt.answers ?? {}) as Record<string, number>;

/**
 * Out of time and never submitted (phone slept, tab closed) → score the
 * answers autosaved so far. Conditional, so it can't overwrite a submit that
 * landed in between.
 */
const closeIfExpired = async (quiz: StudentQuiz, attempt: Attempt) => {
  if (attempt.finishedAt || !isExpired(attemptDeadline(attempt.startedAt, quiz.timeLimitMin))) return attempt;
  await prisma.quizAttempt.updateMany({
    where: { id: attempt.id, finishedAt: null },
    data: { finishedAt: new Date(), score: scoreAnswers(quiz.QuizQuestion, savedAnswers(attempt)) },
  });
  return prisma.quizAttempt.findUniqueOrThrow({ where: { id: attempt.id } });
};

/** Only answers to this quiz's questions are kept. */
const knownAnswers = (quiz: StudentQuiz, answers: Record<string, number>) => {
  const known = new Set(quiz.QuizQuestion.map((q) => q.id));
  return Object.fromEntries(Object.entries(answers).filter(([id]) => known.has(id)));
};

const answersBody = z.object({
  body: z.object({ answers: z.record(z.string(), z.number().int().min(0).max(9)) }),
  params: z.object({ id: z.string().min(1) }),
  query: z.object({}),
});

const playView = (quiz: StudentQuiz, attempt: Attempt | null) => ({
  id: quiz.id,
  title: quiz.title,
  description: quiz.description,
  timeLimitMin: quiz.timeLimitMin,
  questionCount: quiz.QuizQuestion.length,
  attempt: attempt && {
    startedAt: attempt.startedAt,
    finishedAt: attempt.finishedAt,
    deadline: attemptDeadline(attempt.startedAt, quiz.timeLimitMin),
    score: attempt.score,
    total: attempt.total,
    percent: attempt.score == null ? null : percentOf(attempt.score, attempt.total),
    // Only while it's running; a finished test never reveals anything else.
    questions: attempt.finishedAt ? null : playableQuestions(quiz.QuizQuestion, attempt.id),
  },
});

const quizIdOnly = z.object({ body: z.object({}).passthrough().default({}), params: z.object({ id: z.string().min(1) }), query: z.object({}) });

quizzesRouter.get(
  "/quizzes/:id/play",
  requireAuth,
  requireRole("STUDENT"),
  validate(quizIdOnly),
  asyncRoute(async (req: any, res: any) => {
    const studentId = uid(req);
    const quiz = await studentQuiz(studentId, req.params.id);
    const found = await prisma.quizAttempt.findUnique({ where: { quizId_studentId: { quizId: quiz.id, studentId } } });
    res.json(playView(quiz, found && (await closeIfExpired(quiz, found))));
  }),
);

quizzesRouter.post(
  "/quizzes/:id/start",
  requireAuth,
  requireRole("STUDENT"),
  validate(quizIdOnly),
  asyncRoute(async (req: any, res: any) => {
    const studentId = uid(req);
    const quiz = await studentQuiz(studentId, req.params.id);
    if (quiz.QuizQuestion.length === 0) throw httpError(400, "Quiz has no questions");
    let attempt = await prisma.quizAttempt.findUnique({ where: { quizId_studentId: { quizId: quiz.id, studentId } } });
    if (!attempt) {
      try {
        attempt = await prisma.quizAttempt.create({
          data: { id: newId(), quizId: quiz.id, studentId, total: quiz.QuizQuestion.length },
        });
      } catch (e) {
        // Double tap: the other request already started it.
        if (!isUniqueViolation(e)) throw e;
        attempt = await prisma.quizAttempt.findUniqueOrThrow({ where: { quizId_studentId: { quizId: quiz.id, studentId } } });
      }
    }
    res.status(201).json(playView(quiz, await closeIfExpired(quiz, attempt)));
  }),
);

// Autosave while answering, so an attempt that runs out of time is scored
// on what the student had picked instead of zero.
quizzesRouter.put(
  "/quizzes/:id/answers",
  requireAuth,
  requireRole("STUDENT"),
  validate(answersBody),
  asyncRoute(async (req: any, res: any) => {
    const studentId = uid(req);
    const quiz = await studentQuiz(studentId, req.params.id);
    const found = await prisma.quizAttempt.findUnique({ where: { quizId_studentId: { quizId: quiz.id, studentId } } });
    if (!found) throw httpError(400, "Quiz is not started");
    if (found.finishedAt || isExpired(attemptDeadline(found.startedAt, quiz.timeLimitMin)))
      throw httpError(409, "Quiz already finished");
    await prisma.quizAttempt.updateMany({
      where: { id: found.id, finishedAt: null },
      data: { answers: knownAnswers(quiz, req.body.answers) },
    });
    res.status(204).end();
  }),
);

quizzesRouter.post(
  "/quizzes/:id/submit",
  requireAuth,
  requireRole("STUDENT"),
  validate(answersBody),
  asyncRoute(async (req: any, res: any) => {
    const studentId = uid(req);
    const quiz = await studentQuiz(studentId, req.params.id);
    const found = await prisma.quizAttempt.findUnique({ where: { quizId_studentId: { quizId: quiz.id, studentId } } });
    if (!found) throw httpError(400, "Quiz is not started");
    const attempt = await closeIfExpired(quiz, found);
    if (attempt.finishedAt) throw httpError(409, "Quiz already finished");

    const answers = knownAnswers(quiz, req.body.answers);
    // Conditional update: two parallel submits can't both score.
    const updated = await prisma.quizAttempt.updateMany({
      where: { id: attempt.id, finishedAt: null },
      data: { finishedAt: new Date(), score: scoreAnswers(quiz.QuizQuestion, answers), answers },
    });
    if (!updated.count) throw httpError(409, "Quiz already finished");
    const finished = await prisma.quizAttempt.findUniqueOrThrow({ where: { id: attempt.id } });
    res.json(playView(quiz, finished));
  }),
);

// ── Staff ──

const questionBody = z
  .object({
    text: z.string().trim().min(1).max(1000),
    options: z.array(z.string().trim().min(1).max(300)).min(2).max(6),
    correctIndex: z.number().int().min(0).max(5),
  })
  .refine((q) => q.correctIndex < q.options.length, { message: "Correct answer must be one of the options", path: ["correctIndex"] });

const quizBody = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(500).nullable().optional(),
  groupId: z.string().min(1).nullable().optional(),
  timeLimitMin: z.number().int().min(1).max(180).nullable().optional(),
  isActive: z.boolean().optional(),
  questions: z.array(questionBody).min(1).max(100),
});

type QuestionInput = z.infer<typeof questionBody>;

/** A quiz may only target a group in the caller's scope (null = every student). */
const assertGroup = async (req: any, groupId?: string | null) => {
  if (groupId) await assertScopedGroup(req, groupId);
};

const questionRows = (quizId: string, questions: QuestionInput[]) =>
  questions.map((q, order) => ({ id: newId(), quizId, order, text: q.text, options: q.options, correctIndex: q.correctIndex }));

const sameQuestions = (a: QuestionInput[], b: QuestionInput[]) =>
  a.length === b.length &&
  a.every((q, i) => {
    const other = b[i];
    return (
      other !== undefined &&
      q.text === other.text &&
      q.correctIndex === other.correctIndex &&
      q.options.length === other.options.length &&
      q.options.every((o, j) => o === other.options[j])
    );
  });

quizzesRouter.get(
  "/quizzes",
  requireAuth,
  requireRole(...staff),
  asyncRoute(async (req: any, res: any) => {
    const scope = await quizScope(req);
    const [quizzes, stats] = await Promise.all([
      prisma.quiz.findMany({
        where: scope,
        orderBy: { createdAt: "desc" },
        include: { Group: { select: { name: true } }, _count: { select: { QuizQuestion: true, QuizAttempt: true } } },
      }),
      prisma.quizAttempt.groupBy({
        by: ["quizId"],
        where: { finishedAt: { not: null }, Quiz: scope },
        _avg: { score: true, total: true },
        _count: { _all: true },
      }),
    ]);
    const byQuiz = new Map(stats.map((s) => [s.quizId, s]));
    res.json(
      quizzes.map((q) => {
        const s = byQuiz.get(q.id);
        return {
          id: q.id,
          title: q.title,
          description: q.description,
          groupId: q.groupId,
          groupName: q.Group?.name ?? null,
          timeLimitMin: q.timeLimitMin,
          isActive: q.isActive,
          createdAt: q.createdAt,
          questionCount: q._count.QuizQuestion,
          attemptCount: q._count.QuizAttempt,
          finishedCount: s?._count._all ?? 0,
          avgPercent: s?._avg.total ? Math.round(((s._avg.score ?? 0) * 100) / s._avg.total) : null,
        };
      }),
    );
  }),
);

quizzesRouter.get(
  "/quizzes/:id",
  requireAuth,
  requireRole(...staff),
  validate(idSchema),
  asyncRoute(async (req: any, res: any) => {
    const quiz = await prisma.quiz.findFirst({
      where: { id: req.params.id, ...(await quizScope(req)) },
      include: { QuizQuestion: orderedQuestions, _count: { select: { QuizAttempt: true } } },
    });
    if (!quiz) throw httpError(404, "Quiz not found");
    res.json({
      id: quiz.id,
      title: quiz.title,
      description: quiz.description,
      groupId: quiz.groupId,
      timeLimitMin: quiz.timeLimitMin,
      isActive: quiz.isActive,
      attemptCount: quiz._count.QuizAttempt,
      questions: quiz.QuizQuestion,
    });
  }),
);

quizzesRouter.post(
  "/quizzes",
  requireAuth,
  requireRole(...staff),
  validate(z.object({ body: quizBody, params: z.object({}), query: z.object({}) })),
  asyncRoute(async (req: any, res: any) => {
    const { questions, ...meta } = req.body as z.infer<typeof quizBody>;
    await assertGroup(req, meta.groupId);
    const id = newId();
    await prisma.$transaction([
      prisma.quiz.create({ data: { id, ...meta, createdById: uid(req) } }),
      prisma.quizQuestion.createMany({ data: questionRows(id, questions) }),
    ]);
    res.status(201).json({ id });
  }),
);

quizzesRouter.put(
  "/quizzes/:id",
  requireAuth,
  requireRole(...staff),
  validate(z.object({ body: quizBody, params: z.object({ id: z.string().min(1) }), query: z.object({}) })),
  asyncRoute(async (req: any, res: any) => {
    const { questions, ...meta } = req.body as z.infer<typeof quizBody>;
    const quiz = await prisma.quiz.findFirst({
      where: { id: req.params.id, ...(await quizScope(req)) },
      include: { QuizQuestion: orderedQuestions, _count: { select: { QuizAttempt: true } } },
    });
    if (!quiz) throw httpError(404, "Quiz not found");
    await assertGroup(req, meta.groupId);
    const changed = !sameQuestions(quiz.QuizQuestion, questions);
    const locked = () => httpError(409, "Quiz already has attempts; questions can't change");
    // Scores already given are only fair against the questions they were given for.
    if (changed && quiz._count.QuizAttempt > 0) throw locked();
    const data = {
      title: meta.title,
      description: meta.description ?? null,
      groupId: meta.groupId ?? null,
      timeLimitMin: meta.timeLimitMin ?? null,
      ...(meta.isActive !== undefined && { isActive: meta.isActive }),
    };
    await prisma.$transaction(async (tx) => {
      await tx.quiz.update({ where: { id: quiz.id }, data });
      if (!changed) return;
      // Re-check inside the transaction: a student may have started meanwhile.
      if (await tx.quizAttempt.count({ where: { quizId: quiz.id } })) throw locked();
      await tx.quizQuestion.deleteMany({ where: { quizId: quiz.id } });
      await tx.quizQuestion.createMany({ data: questionRows(quiz.id, questions) });
    });
    res.json({ id: quiz.id });
  }),
);

quizzesRouter.patch(
  "/quizzes/:id/active",
  requireAuth,
  requireRole(...staff),
  validate(z.object({ body: z.object({ isActive: z.boolean() }), params: z.object({ id: z.string().min(1) }), query: z.object({}) })),
  asyncRoute(async (req: any, res: any) => {
    const updated = await prisma.quiz.updateMany({
      where: { id: req.params.id, ...(await quizScope(req)) },
      data: { isActive: req.body.isActive },
    });
    if (!updated.count) throw httpError(404, "Quiz not found");
    res.json({ id: req.params.id, isActive: req.body.isActive });
  }),
);

quizzesRouter.delete(
  "/quizzes/:id",
  requireAuth,
  requireRole(...staff),
  validate(idSchema),
  asyncRoute(async (req: any, res: any) => {
    const deleted = await prisma.quiz.deleteMany({ where: { id: req.params.id, ...(await quizScope(req)) } });
    if (!deleted.count) throw httpError(404, "Quiz not found");
    res.status(204).end();
  }),
);

quizzesRouter.get(
  "/quizzes/:id/results",
  requireAuth,
  requireRole(...staff),
  validate(idSchema),
  asyncRoute(async (req: any, res: any) => {
    const quiz = await prisma.quiz.findFirst({
      where: { id: req.params.id, ...(await quizScope(req)) },
      include: {
        QuizQuestion: orderedQuestions,
        QuizAttempt: {
          orderBy: { startedAt: "desc" },
          include: { User: { select: { firstName: true, lastName: true } } },
        },
      },
    });
    if (!quiz) throw httpError(404, "Quiz not found");
    const finished = quiz.QuizAttempt.filter((a) => a.finishedAt);
    const answersOf = (a: (typeof finished)[number]) => (a.answers ?? {}) as Record<string, number>;
    res.json({
      id: quiz.id,
      title: quiz.title,
      questionCount: quiz.QuizQuestion.length,
      attempts: quiz.QuizAttempt.map((a) => ({
        studentId: a.studentId,
        studentName: `${a.User.firstName} ${a.User.lastName}`.trim(),
        startedAt: a.startedAt,
        finishedAt: a.finishedAt,
        score: a.score,
        total: a.total,
        percent: a.score == null ? null : percentOf(a.score, a.total),
      })),
      // Which questions the group got wrong most — the teacher's main takeaway.
      questions: quiz.QuizQuestion.map((q) => ({
        id: q.id,
        text: q.text,
        answered: finished.filter((a) => answersOf(a)[q.id] !== undefined).length,
        correct: finished.filter((a) => answersOf(a)[q.id] === q.correctIndex).length,
      })),
    });
  }),
);
