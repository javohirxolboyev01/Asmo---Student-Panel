import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { asyncRoute, requireAuth, requireRole, validate } from "../../middleware/index.js";
import { newId } from "../../utils/ids.js";
import { assertLesson, liveEnrollment } from "../../utils/teacherScope.js";
import { homeworkMessage, notifyStudents } from "../telegram/telegram.notify.js";
import { homeworkReminderField } from "../homework/homework.reminders.js";

export const teacherHomeworkRouter = Router();

teacherHomeworkRouter.post(
  "/teacher/homework",
  requireAuth,
  requireRole("TEACHER", "ADMIN"),
  validate(
    z.object({
      body: z.object({
        lessonId: z.string(),
        title: z.string().min(1).max(200),
        description: z.string().max(10000).optional(),
        deadline: z.coerce.date(),
        maxScore: z.number().int().positive().optional(),
      }),
      params: z.object({}),
      query: z.object({}),
    }),
  ),
  asyncRoute(async (req: any, res: any) => {
    await assertLesson(req, req.body.lessonId);
    const homework = await prisma.homework.create({ data: { id: newId(), ...req.body, ...homeworkReminderField(req.body.deadline) } });
    const lesson = await prisma.lesson.findUniqueOrThrow({
      where: { id: homework.lessonId },
      include: { Group: { include: { Enrollment: { where: liveEnrollment, select: { studentId: true } } } } },
    });
    notifyStudents(lesson.Group.Enrollment.map((e) => homeworkMessage(e.studentId, homework, lesson.Group.name)));
    res.status(201).json(homework);
  }),
);
