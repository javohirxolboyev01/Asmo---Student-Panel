import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { asyncRoute, idSchema, requireAuth, requireRole, validate } from "../../middleware/index.js";
import { newId } from "../../utils/ids.js";
import { uid, assertHomework } from "../../utils/teacherScope.js";
import { STORED_LINK, fileCaption, storeDataUrl } from "../files/files.store.js";
import { TelegramApiError } from "../telegram/telegram.api.js";
import { logger } from "../../lib/logger.js";

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
        // within express.json's 3mb limit). A data: URL is moved to the Telegram archive channel.
        attachmentUrl: z
          .string()
          .max(2_900_000)
          .refine(
            (v) => /^(https?:\/\/|data:[\w.+-]+\/[\w.+-]+;base64,)/.test(v) || STORED_LINK.test(v),
            "Invalid attachment",
          )
          .optional(),
        /** Original file name, for the download. */
        attachmentName: z.string().max(200).optional(),
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
    // One answer per homework: once it's sent it can't be changed.
    const existing = await prisma.submission.findUnique({
      where: { homeworkId_studentId: { homeworkId: homework.id, studentId: uid(req) } },
      select: { id: true },
    });
    if (existing)
      return res.status(409).json({ error: "This homework is already submitted", code: "ALREADY_SUBMITTED" });

    const student = await prisma.user.findUniqueOrThrow({ where: { id: uid(req) } });
    let attachmentUrl: string | null = req.body.attachmentUrl ?? null;
    if (attachmentUrl) {
      try {
        attachmentUrl = await storeDataUrl(attachmentUrl, {
          kind: "homework",
          ownerId: student.id,
          name: req.body.attachmentName,
          caption: fileCaption("📎 Uy vazifasi", [
            `${student.firstName} ${student.lastName}`,
            `${homework.Lesson.Group.name} · ${homework.Lesson.topic}`,
            homework.title,
          ]),
        });
      } catch (error) {
        logger.warn("Homework file upload to Telegram failed", { error });
        return res.status(502).json({
          error: "The file couldn't be saved, try again",
          code: error instanceof TelegramApiError ? "FILE_STORE_FAILED" : "FILE_STORE_ERROR",
        });
      }
    }
    let item;
    try {
      item = await prisma.submission.create({
        data: {
          id: newId(),
          homeworkId: homework.id,
          studentId: uid(req),
          content: req.body.content,
          attachmentUrl,
        },
      });
    } catch (error: any) {
      // Two taps at once: the other request already saved it.
      if (error?.code === "P2002")
        return res.status(409).json({ error: "This homework is already submitted", code: "ALREADY_SUBMITTED" });
      throw error;
    }
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
