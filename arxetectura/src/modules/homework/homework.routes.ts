import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { asyncRoute, idSchema, requireAuth, requireRole, validate } from "../../middleware/index.js";
import { newId } from "../../utils/ids.js";
import { uid, assertHomework } from "../../utils/teacherScope.js";

const staff = ["TEACHER", "ADMIN"];

export const homeworkRouter = Router();

homeworkRouter.post(
  "/homework/:id/submit",
  requireAuth,
  validate(
    idSchema.extend({
      body: z.object({
        content: z.string().min(1).max(10000),
        // Optional file: an http(s) link or a data: URL (client caps files at 2MB ≈ 2.8MB base64,
        // within express.json's 3mb limit). Omitted = keep the previously attached file.
        attachmentUrl: z
          .string()
          .max(2_900_000)
          .refine((v) => /^(https?:\/\/|data:[\w.+-]+\/[\w.+-]+;base64,)/.test(v), "Invalid attachment")
          .optional(),
      }),
    }),
  ),
  asyncRoute(async (req: any, res: any) => {
    const homework = await prisma.homework.findFirst({
      where: { id: req.params.id, Lesson: { Group: { Enrollment: { some: { studentId: uid(req), status: "ACTIVE" } } } } },
      include: { Lesson: { include: { Group: { include: { Teacher: true } } } } },
    });
    if (!homework) return res.status(404).json({ error: "Homework not found" });
    if (homework.deadline < new Date()) return res.status(400).json({ error: "Homework deadline has passed" });
    const student = await prisma.user.findUniqueOrThrow({ where: { id: uid(req) } });
    const item = await prisma.submission.upsert({
      where: { homeworkId_studentId: { homeworkId: homework.id, studentId: uid(req) } },
      update: {
        content: req.body.content,
        ...(req.body.attachmentUrl ? { attachmentUrl: req.body.attachmentUrl } : {}),
        // submittedAt stays the first submission: the SUBMIT_HOMEWORK mission
        // counts it, so re-sending one homework every day can't farm coins.
        status: "SUBMITTED",
        score: null,
        feedback: null,
        gradedAt: null,
      },
      create: {
        id: newId(),
        homeworkId: homework.id,
        studentId: uid(req),
        content: req.body.content,
        attachmentUrl: req.body.attachmentUrl ?? null,
      },
    });
    const teacherUserId = homework.Lesson.Group.Teacher.userId;
    if (teacherUserId) {
      await prisma.notification.create({
        data: {
          id: newId(),
          userId: teacherUserId,
          type: "SUBMISSION",
          title: "New homework submission",
          message: `${student.firstName} ${student.lastName} — ${homework.Lesson.topic}`,
          relatedId: item.id,
        },
      });
    }
    res.status(201).json(item);
  }),
);

homeworkRouter.patch(
  "/homework/:id",
  requireAuth,
  requireRole(...staff),
  validate(
    z.object({
      body: z.object({
        title: z.string().optional(),
        description: z.string().nullable().optional(),
        maxScore: z.number().int().positive().optional(),
        deadline: z.coerce.date().optional(),
        status: z.enum(["ACTIVE", "CLOSED"]).optional(),
      }),
      params: z.object({ id: z.string() }),
      query: z.object({}),
    }),
  ),
  asyncRoute(async (req: any, res: any) => {
    const homework = await assertHomework(req, req.params.id);
    res.json(await prisma.homework.update({ where: { id: homework.id }, data: req.body }));
  }),
);

homeworkRouter.delete(
  "/homework/:id",
  requireAuth,
  requireRole(...staff),
  validate(idSchema),
  asyncRoute(async (req: any, res: any) => {
    const homework = await assertHomework(req, req.params.id);
    await prisma.homework.delete({ where: { id: homework.id } });
    res.status(204).send();
  }),
);
