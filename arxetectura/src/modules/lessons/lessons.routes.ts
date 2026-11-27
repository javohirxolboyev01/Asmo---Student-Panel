import { Router } from "express";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { asyncRoute, idSchema, requireAuth, requireRole, validate } from "../../middleware/index.js";
import { lower } from "../../utils/serializers.js";
import { newId } from "../../utils/ids.js";
import { currentUser, assertLesson, groupScope, liveEnrollment } from "../../utils/teacherScope.js";
import { homeworkMessage, notifyAttendance, notifyStudents } from "../telegram/telegram.notify.js";
import { resetLessonReminder } from "./lesson.reminders.js";

const staff = ["TEACHER", "ADMIN"];

export const lessonsRouter = Router();

lessonsRouter.get(
  "/lessons/:id",
  requireAuth,
  validate(idSchema),
  asyncRoute(async (req: any, res: any) => {
    const current = currentUser(req);
    const isStaff = current.role !== "STUDENT";
    const lesson = await prisma.lesson.findFirst({
      where: {
        id: req.params.id,
        Group:
          current.role === "STUDENT"
            ? { Enrollment: { some: { studentId: current.id, status: "ACTIVE" } } }
            : await groupScope(req),
      },
      include: {
        Group: {
          include: {
            Teacher: true,
            ...(isStaff ? { Enrollment: { where: liveEnrollment, include: { User: true } } } : {}),
          },
        },
        Homework: {
          include: {
            // The staff roster only shows status/score per student, so skip the
            // heavy content/attachment columns there.
            Submission: isStaff
              ? { omit: { content: true, attachmentUrl: true } }
              : { where: { studentId: current.id } },
          },
        },
        AttendanceRecord: true,
      },
    });
    if (!lesson)
      return res.status(current.role === "STUDENT" ? 403 : 404).json({ error: "Lesson not found or access denied" });
    const homework = lesson.Homework;
    const submission = isStaff ? null : homework?.Submission[0] ?? null;

    let roster;
    if (isStaff) {
      const attendanceByStudent = new Map(lesson.AttendanceRecord.map((a) => [a.studentId, a]));
      const submissionByStudent = new Map((homework?.Submission ?? []).map((s: any) => [s.studentId, s]));
      roster = ((lesson.Group as any).Enrollment ?? []).map((enrollment: any) => {
        const record = attendanceByStudent.get(enrollment.studentId);
        const studentSubmission = submissionByStudent.get(enrollment.studentId) as any;
        return {
          id: enrollment.User.id,
          firstName: enrollment.User.firstName,
          lastName: enrollment.User.lastName,
          avatar: enrollment.User.avatar,
          attendanceStatus: record ? lower(record.status) : null,
          submission: studentSubmission
            ? { ...studentSubmission, status: lower(studentSubmission.status) }
            : null,
        };
      });
    }

    res.json({
      lesson: {
        id: lesson.id,
        groupId: lesson.groupId,
        topic: lesson.topic,
        description: lesson.description,
        lessonDate: lesson.lessonDate,
        lessonOrder: lesson.lessonOrder,
        groupName: lesson.Group.name,
        teacherName: lesson.Group.Teacher.fullName,
        status: lower(lesson.status),
      },
      homework: homework
        ? {
            id: homework.id,
            title: homework.title,
            description: homework.description,
            maxScore: homework.maxScore,
            deadline: homework.deadline,
            isOverdue: homework.deadline < new Date(),
            status: lower(homework.status),
          }
        : null,
      ...(isStaff ? { roster } : { submission: submission ? { ...submission, status: lower(submission.status) } : null }),
    });
  }),
);

lessonsRouter.patch(
  "/lessons/:id",
  requireAuth,
  requireRole(...staff),
  validate(
    z.object({
      body: z.object({
        topic: z.string().optional(),
        description: z.string().nullable().optional(),
        lessonDate: z.coerce.date().optional(),
        status: z.enum(["PLANNED", "COMPLETED", "CANCELLED"]).optional(),
      }),
      params: z.object({ id: z.string() }),
      query: z.object({}),
    }),
  ),
  asyncRoute(async (req: any, res: any) => {
    const lesson = await assertLesson(req, req.params.id);
    const updated = await prisma.lesson.update({ where: { id: lesson.id }, data: req.body });
    if (req.body.lessonDate && updated.lessonDate.getTime() !== lesson.lessonDate.getTime())
      await resetLessonReminder(lesson.id);
    res.json(updated);
  }),
);

lessonsRouter.delete(
  "/lessons/:id",
  requireAuth,
  requireRole(...staff),
  validate(idSchema),
  asyncRoute(async (req: any, res: any) => {
    const lesson = await assertLesson(req, req.params.id);
    await prisma.lesson.delete({ where: { id: lesson.id } });
    res.status(204).send();
  }),
);

lessonsRouter.post(
  "/lessons/:id/homework",
  requireAuth,
  requireRole(...staff),
  validate(
    z.object({
      body: z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        maxScore: z.number().int().positive().optional(),
        deadline: z.coerce.date(),
      }),
      params: z.object({ id: z.string() }),
      query: z.object({}),
    }),
  ),
  asyncRoute(async (req: any, res: any) => {
    const lesson = await prisma.lesson.findFirst({
      where: { id: req.params.id, Group: await groupScope(req) },
      include: { Group: { include: { Enrollment: { where: liveEnrollment } } }, Homework: true },
    });
    if (!lesson) return res.status(404).json({ error: "Lesson not found" });
    if (lesson.Homework) return res.status(409).json({ error: "Lesson already has homework" });
    const homework = await prisma.homework.create({ data: { id: newId(), lessonId: lesson.id, ...req.body } });
    await prisma.notification.createMany({
      data: lesson.Group.Enrollment.map((e) => ({
        id: newId(),
        userId: e.studentId,
        type: "HOMEWORK",
        title: "New homework",
        message: homework.title,
        // Lesson id: tapping the notification opens that lesson's page.
        relatedId: lesson.id,
      })),
    });
    notifyStudents(lesson.Group.Enrollment.map((e) => homeworkMessage(e.studentId, homework, lesson.Group.name)));
    res.status(201).json(homework);
  }),
);

lessonsRouter.post(
  "/lessons/:id/attendance",
  requireAuth,
  requireRole(...staff),
  validate(
    z.object({
      body: z.object({
        records: z
          .array(z.object({ userId: z.string(), status: z.enum(["PRESENT", "ABSENT"]) }))
          .max(500),
      }),
      params: z.object({ id: z.string() }),
      query: z.object({}),
    }),
  ),
  asyncRoute(async (req: any, res: any) => {
    const lesson = await assertLesson(req, req.params.id);
    // Only students enrolled in this lesson's group can get an attendance mark.
    const enrolled = new Set(
      (
        await prisma.enrollment.findMany({
          where: {
            groupId: lesson.groupId,
            studentId: { in: req.body.records.map((r: any) => r.userId) },
            ...liveEnrollment,
          },
          select: { studentId: true },
        })
      ).map((e) => e.studentId),
    );
    const records = req.body.records.filter((r: any) => enrolled.has(r.userId));
    // Only new or changed marks are sent to Telegram (re-saving sends nothing).
    const before = new Map(
      (
        await prisma.attendanceRecord.findMany({
          where: { lessonId: lesson.id, studentId: { in: records.map((r: any) => r.userId) } },
          select: { studentId: true, status: true },
        })
      ).map((r) => [r.studentId, r.status]),
    );
    await prisma.$transaction(
      records.map((record: any) =>
        prisma.attendanceRecord.upsert({
          where: { lessonId_studentId: { lessonId: req.params.id, studentId: record.userId } },
          update: { status: record.status, markedAt: new Date() },
          create: { id: newId(), lessonId: req.params.id, studentId: record.userId, status: record.status },
        }),
      ),
    );
    const changed = records.filter((r: any) => before.get(r.userId) !== r.status);
    if (changed.length) void notifyAttendance(lesson.id, changed.map((r: any) => ({ studentId: r.userId, status: r.status })));
    res.json({ message: "Attendance updated" });
  }),
);
