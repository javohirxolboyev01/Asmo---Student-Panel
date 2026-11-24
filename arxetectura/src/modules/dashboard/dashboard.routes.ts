import { Router } from "express";
import { prisma } from "../../lib/prisma.js";
import { asyncRoute, requireAuth } from "../../middleware/index.js";
import { userSummary } from "../../utils/serializers.js";
import { uid, groupScope, liveEnrollment } from "../../utils/teacherScope.js";

export const dashboardRouter = Router();

dashboardRouter.get(
  "/dashboard",
  requireAuth,
  asyncRoute(async (req: any, res: any) => {
    const userId = uid(req);

    if (req.user.role === "STUDENT") {
      // Independent reads, so fetch them in parallel rather than one by one.
      const [current, upcoming, enrollments, coins, unreadNotifications] = await Promise.all([
        prisma.user.findUniqueOrThrow({ where: { id: userId } }),
        prisma.lesson.findMany({
          where: {
            Group: { Enrollment: { some: { studentId: userId, status: "ACTIVE" } } },
            lessonDate: { gte: new Date() },
            status: "PLANNED",
          },
          orderBy: { lessonDate: "asc" },
          take: 5,
          include: { Group: { select: { name: true } } },
        }),
        prisma.enrollment.findMany({ where: { studentId: userId, status: "ACTIVE" }, include: { Group: true } }),
        prisma.coinTransaction.findMany({
          where: { studentId: userId },
          orderBy: { createdAt: "desc" },
          take: 10,
        }),
        prisma.notification.count({ where: { userId, isRead: false } }),
      ]);
      // Load each group's direction, teacher and lessons side by side instead of
      // through a nested include, which Prisma resolves one level at a time.
      const groupRows = enrollments.map((enrollment) => enrollment.Group);
      const [directions, teachers, groupLessons] = await Promise.all([
        prisma.direction.findMany({ where: { id: { in: groupRows.map((g) => g.directionId) } } }),
        prisma.teacher.findMany({ where: { id: { in: groupRows.map((g) => g.teacherId) } } }),
        prisma.lesson.findMany({
          where: { groupId: { in: groupRows.map((g) => g.id) } },
          // Only what the progress numbers below need.
          select: { groupId: true, status: true, lessonDate: true },
        }),
      ]);
      const directionById = new Map(directions.map((d) => [d.id, d]));
      const teacherById = new Map(teachers.map((x) => [x.id, x]));
      const groupsWithRelations = groupRows.map((group) => ({
        ...group,
        Direction: directionById.get(group.directionId)!,
        Teacher: teacherById.get(group.teacherId)!,
        Lesson: groupLessons.filter((lesson) => lesson.groupId === group.id),
      }));
      return res.json({
        user: userSummary(current),
        groups: groupsWithRelations.map((group) => {
          const completed = group.Lesson.filter((lesson) => lesson.status === "COMPLETED").length;
          return {
            id: group.id,
            name: group.name,
            groupName: group.name,
            courseName: group.courseName,
            directionName: group.Direction.name,
            directionColor: group.Direction.color,
            totalLessons: group.Lesson.length,
            completedLessons: completed,
            progress: group.Lesson.length ? Math.round((completed / group.Lesson.length) * 100) : 0,
            nextLessonDate: group.Lesson.filter((lesson) => lesson.lessonDate >= new Date()).sort(
              (a, b) => a.lessonDate.getTime() - b.lessonDate.getTime(),
            )[0]?.lessonDate,
            teacherName: group.Teacher.fullName,
          };
        }),
        coinBalance: current.coinBalance,
        recentTransactions: coins,
        unreadNotifications,
        upcomingLessons: upcoming.map((lesson) => ({
          id: lesson.id,
          topic: lesson.topic,
          lessonDate: lesson.lessonDate,
          time: lesson.lessonDate.toISOString().slice(11, 16),
          groupName: lesson.Group.name,
        })),
      });
    }

    // Staff: an ADMIN sees every group; a TEACHER only their own groups.
    const scope = await groupScope(req);
    const [current, owned, pendingGradingCount, upcoming] = await Promise.all([
      prisma.user.findUniqueOrThrow({ where: { id: userId } }),
      prisma.group.findMany({ where: scope, select: { id: true } }),
      prisma.submission.count({ where: { status: "SUBMITTED", Homework: { Lesson: { Group: scope } } } }),
      prisma.lesson.findMany({
        where: { lessonDate: { gte: new Date() }, status: "PLANNED", Group: scope },
        orderBy: { lessonDate: "asc" },
        take: 5,
        include: { Group: { select: { name: true } } },
      }),
    ]);
    const ownedIds = owned.map((x) => x.id);
    const [studentsCount, todayLessonsCount] = await Promise.all([
      prisma.enrollment.count({ where: { groupId: { in: ownedIds }, ...liveEnrollment } }),
      prisma.lesson.count({
        where: {
          groupId: { in: ownedIds },
          lessonDate: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
            lt: new Date(new Date().setHours(24, 0, 0, 0)),
          },
        },
      }),
    ]);

    res.json({
      user: userSummary(current),
      stats: {
        groupsCount: owned.length,
        studentsCount,
        todayLessonsCount,
        pendingGradingCount,
      },
      upcomingLessons: upcoming.map((lesson) => ({
        id: lesson.id,
        topic: lesson.topic,
        lessonDate: lesson.lessonDate,
        time: lesson.lessonDate.toISOString().slice(11, 16),
        groupName: lesson.Group.name,
      })),
    });
  }),
);
