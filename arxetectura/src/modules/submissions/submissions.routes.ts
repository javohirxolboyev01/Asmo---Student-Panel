import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { asyncRoute, idSchema, requireAuth, requireRole, validate } from "../../middleware/index.js";
import { publicUser, submissionSummary } from "../../utils/serializers.js";
import { gradeBody } from "../../utils/schemas.js";
import { groupScope, assertSubmission } from "../../utils/teacherScope.js";
import { newId } from "../../utils/ids.js";
import { gradeMessage, notifyStudents } from "../telegram/telegram.notify.js";

const staff = ["TEACHER", "ADMIN"];
const submissionInclude = {
  User: { select: publicUser },
  Homework: { include: { Lesson: { include: { Group: true } } } },
} as const;

export const submissionsRouter = Router();

submissionsRouter.get(
  "/submissions",
  requireAuth,
  requireRole(...staff),
  asyncRoute(async (req: any, res: any) => {
    const rows = await prisma.submission.findMany({
      where: {
        Homework: { Lesson: { Group: await groupScope(req) } },
        ...(req.query.status ? { status: String(req.query.status).toUpperCase() } : {}),
      },
      // The list never shows attachments (up to ~2MB each as data URLs), so
      // leave them out here; the detail route below still returns them.
      omit: { attachmentUrl: true },
      include: submissionInclude,
      orderBy: { submittedAt: "desc" },
    });
    res.json({ submissions: rows.map(submissionSummary) });
  }),
);

submissionsRouter.get(
  "/submissions/:id",
  requireAuth,
  requireRole(...staff),
  validate(idSchema),
  asyncRoute(async (req: any, res: any) => {
    const submission = await prisma.submission.findFirst({
      where: { id: req.params.id, Homework: { Lesson: { Group: await groupScope(req) } } },
      include: submissionInclude,
    });
    if (!submission) return res.status(404).json({ error: "Submission not found" });
    res.json(submissionSummary(submission));
  }),
);

submissionsRouter.patch(
  "/submissions/:id/grade",
  requireAuth,
  requireRole(...staff),
  validate(z.object({ body: gradeBody, params: z.object({ id: z.string() }), query: z.object({}) })),
  asyncRoute(async (req: any, res: any) => {
    const sub = await assertSubmission(req, req.params.id);
    if (req.body.score > sub.Homework.maxScore)
      return res.status(400).json({ error: "Score cannot exceed maxScore" });
    const updated = await prisma.submission.update({
      where: { id: sub.id },
      data: { score: req.body.score, feedback: req.body.feedback, status: "GRADED", gradedAt: new Date() },
    });
    if (sub.status !== "GRADED" || sub.score !== updated.score || sub.feedback !== updated.feedback)
      notifyStudents([
        gradeMessage(sub.studentId, sub.Homework.title, req.body.score, sub.Homework.maxScore, req.body.feedback),
      ]);
    await prisma.notification.create({
      data: {
        id: newId(),
        userId: sub.studentId,
        type: "GRADE",
        title: "Homework graded",
        message: `${req.body.score}/${sub.Homework.maxScore}`,
        // Lesson id: tapping the notification opens that lesson's page.
        relatedId: sub.Homework.lessonId,
      },
    });
    res.json(updated);
  }),
);
