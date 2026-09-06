import { Router } from "express";
import { z } from "zod";
import {
  AttendanceRecord,
  Direction,
  Group,
  Homework,
  Notification,
  Payment,
  Product,
  Submission,
  Teacher,
  User,
} from "@prisma/client";
import { prisma } from "./lib/prisma";
import {
  comparePassword,
  hashPassword,
  issueTokenPair,
  RefreshTokenError,
  Role,
  ROLES,
  revokeAllRefreshTokens,
  rotateRefreshToken,
} from "./auth";
import { AppError, asyncHandler, authenticate, requireRole } from "./middleware";

export const router = Router();

// ── Serializers ──────────────────────────────────────────────────────────
// Prisma models store enums in UPPER_CASE; the frontend types use lower_case
// string literals, so every response funnels through these helpers.

const serializeUser = (user: User) => ({
  id: user.id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  phone: user.phone,
  avatar: user.avatar,
  role: user.role.toLowerCase(),
  status: user.status.toLowerCase(),
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
});

type GroupWithRelations = Group & {
  direction: { id: string; name: string; color: string };
  teacher: { id: string; fullName: string; avatar: string | null };
  _count: { enrollments: number };
};

const serializeGroup = (group: GroupWithRelations) => ({
  id: group.id,
  name: group.name,
  direction: group.direction,
  teacher: { id: group.teacher.id, fullName: group.teacher.fullName, avatar: group.teacher.avatar },
  studentCount: group._count.enrollments,
  status: group.status.toLowerCase(),
});

const serializeGroupDetail = (group: GroupWithRelations) => ({
  id: group.id,
  name: group.name,
  courseName: group.courseName,
  directionName: group.direction.name,
  teacherName: group.teacher.fullName,
  studentCount: group._count.enrollments,
  maxStudents: group.maxStudents,
  schedule: {
    days: group.scheduleDays.split(",").map((d) => d.trim()).filter(Boolean),
    time: group.scheduleTime,
  },
});

const homeworkSummary = (homework: Homework | null, submission: Submission | null | undefined) => {
  if (!homework) return undefined;
  const status = !submission ? "not_submitted" : submission.status === "GRADED" ? "submitted" : "pending";
  return {
    id: homework.id,
    title: homework.title,
    status,
    deadline: homework.deadline,
    isOverdue: new Date() > homework.deadline,
    score: submission?.score ?? 0,
    maxScore: homework.maxScore,
  };
};

const serializeHomeworkDetail = (homework: Homework) => ({
  id: homework.id,
  title: homework.title,
  description: homework.description,
  maxScore: homework.maxScore,
  deadline: homework.deadline,
  isOverdue: new Date() > homework.deadline,
  status: homework.status.toLowerCase(),
});

const serializeSubmission = (submission: Submission | null) => {
  if (!submission) return null;
  return {
    id: submission.id,
    content: submission.content,
    attachmentUrl: submission.attachmentUrl,
    submittedAt: submission.submittedAt,
    score: submission.score ?? 0,
    feedback: submission.feedback,
    status: submission.status.toLowerCase(),
  };
};

const serializeNotification = (notification: Notification) => ({
  id: notification.id,
  title: notification.title,
  message: notification.message,
  type: notification.type.toLowerCase(),
  isRead: notification.isRead,
  createdAt: notification.createdAt,
});

const serializeProduct = (product: Product) => ({
  id: product.id,
  name: product.name,
  description: product.description,
  price: product.price,
  originalPrice: product.originalPrice ?? undefined,
  category: product.category,
  image: product.image,
  rating: product.rating,
  reviews: product.reviews,
  isPopular: product.isPopular,
  isNew: product.isNew,
  isLimited: product.isLimited,
});

const PAYMENT_TYPE_LABELS: Record<string, string> = {
  CASH: "naqd",
  CLICK: "click",
  PAYME: "payme",
  BANK: "bank",
  UZUM: "uzum",
};

const serializePayment = (payment: Payment) => ({
  id: payment.id,
  orderNumber: payment.orderNumber,
  amountNumber: payment.amountNumber,
  status: payment.status.toLowerCase(),
  paymentType: PAYMENT_TYPE_LABELS[payment.paymentType] ?? payment.paymentType.toLowerCase(),
  paidAt: payment.paidAt,
  teacherName: payment.teacherName,
  description: payment.description ?? undefined,
  receiptNumber: payment.receiptNumber ?? undefined,
});

const serializeDirection = (direction: Direction & { _count?: { groups: number } }) => ({
  id: direction.id,
  name: direction.name,
  color: direction.color,
  groupsCount: direction._count?.groups ?? 0,
});

const serializeTeacherProfile = (
  teacher: Teacher & { user?: { id: string; email: string } | null; _count?: { groups: number } },
) => ({
  id: teacher.id,
  fullName: teacher.fullName,
  avatar: teacher.avatar,
  email: teacher.user?.email,
  userId: teacher.userId,
  groupsCount: teacher._count?.groups ?? 0,
});

const attendancePercentage = (present: number, total: number): number =>
  total > 0 ? Math.round((present / total) * 100) : 0;

const serializeStudentSummary = (student: {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  phone: string | null;
  status: string;
  coinBalance: number;
  enrollments: { group: { id: string; name: string } }[];
  attendanceRecords: { status: string }[];
}) => ({
  id: student.id,
  firstName: student.firstName,
  lastName: student.lastName,
  avatar: student.avatar,
  phone: student.phone,
  status: student.status.toLowerCase(),
  coinBalance: student.coinBalance,
  groups: student.enrollments.map((e) => ({ id: e.group.id, name: e.group.name })),
  attendancePercentage: attendancePercentage(
    student.attendanceRecords.filter((r) => r.status === "PRESENT").length,
    student.attendanceRecords.length,
  ),
});

const serializeAttendanceRecord = (record: AttendanceRecord & { lesson: { topic: string; lessonDate: Date; groupId: string } }) => ({
  id: record.id,
  userId: record.userId,
  lessonId: record.lessonId,
  lessonTopic: record.lesson.topic,
  lessonDate: record.lesson.lessonDate,
  groupId: record.lesson.groupId,
  status: record.status.toLowerCase(),
  markedAt: record.markedAt,
});

const getTeacherDisplayName = async (userId: string): Promise<string> => {
  const user = await prisma.user.findUnique({ where: { id: userId }, include: { teacherProfile: true } });
  return user?.teacherProfile?.fullName ?? `${user?.firstName ?? ""} ${user?.lastName ?? ""}`.trim();
};

const AVATAR_PREFIXES: Record<string, string> = {
  "data:image/png;base64,": "png",
  "data:image/jpeg;base64,": "jpeg",
  "data:image/jpg;base64,": "jpg",
  "data:image/webp;base64,": "webp",
  "data:image/svg+xml;base64,": "svg",
};
const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

const validateAvatar = (avatar: string): void => {
  if (/^https?:\/\//.test(avatar)) return;

  const prefix = Object.keys(AVATAR_PREFIXES).find((p) => avatar.startsWith(p));
  if (!prefix) {
    throw new AppError(400, "Avatar PNG, JPG, WEBP yoki SVG formatida bo'lishi kerak");
  }

  const base64Data = avatar.slice(prefix.length);
  const approxBytes = Math.ceil((base64Data.length * 3) / 4);
  if (approxBytes > MAX_AVATAR_BYTES) {
    throw new AppError(400, "Avatar hajmi 2 MB dan oshmasligi kerak");
  }
};

// ── Auth ─────────────────────────────────────────────────────────────────

// Emails are matched with a unique DB lookup, so register/login/lookup must
// all normalize the same way or a valid account becomes unfindable (e.g. a
// mobile keyboard auto-capitalizing the first letter on a later login).
const emailField = z.string().trim().toLowerCase().email("Email manzil noto'g'ri");

const registerSchema = z.object({
  email: emailField,
  password: z.string().min(6, "Parol kamida 6 belgidan iborat bo'lishi kerak"),
  firstName: z.string().min(1, "Ism kiritilishi shart"),
  lastName: z.string().min(1, "Familiya kiritilishi shart"),
  phone: z.string().optional(),
});

// Public self-registration only ever creates STUDENT accounts. Teacher
// accounts are provisioned out-of-band (seed / an existing teacher via
// POST /teachers) so a student can't grant themselves teacher access by
// just picking a role on the sign-up form.
router.post(
  "/auth/register",
  asyncHandler(async (req, res) => {
    const data = registerSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) {
      throw new AppError(409, "Bu email allaqachon ro'yxatdan o'tgan");
    }

    const passwordHash = await hashPassword(data.password);

    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: ROLES.STUDENT,
      },
    });

    const tokens = await issueTokenPair(user.id, user.role as Role);
    res.status(201).json({ user: serializeUser(user), ...tokens });
  }),
);

const loginSchema = z.object({
  email: emailField,
  password: z.string().min(1, "Parol kiritilishi shart"),
});

router.post(
  "/auth/login",
  asyncHandler(async (req, res) => {
    const data = loginSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user || !(await comparePassword(data.password, user.passwordHash))) {
      throw new AppError(401, "Email yoki parol noto'g'ri");
    }

    const tokens = await issueTokenPair(user.id, user.role as Role);
    res.json({ user: serializeUser(user), ...tokens });
  }),
);

const refreshSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token kiritilishi shart"),
});

router.post(
  "/auth/refresh",
  asyncHandler(async (req, res) => {
    const { refreshToken } = refreshSchema.parse(req.body);
    try {
      const tokens = await rotateRefreshToken(refreshToken);
      res.json(tokens);
    } catch (err) {
      if (err instanceof RefreshTokenError) {
        throw new AppError(401, err.message);
      }
      throw err;
    }
  }),
);

router.get(
  "/auth/me",
  authenticate,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user) throw new AppError(401, "Foydalanuvchi topilmadi");
    res.json(serializeUser(user));
  }),
);

// ── Profile ──────────────────────────────────────────────────────────────

const profileSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().nullable().optional(),
  avatar: z.string().nullable().optional(),
});

router.patch(
  "/profile",
  authenticate,
  asyncHandler(async (req, res) => {
    const data = profileSchema.parse(req.body);
    if (data.avatar) validateAvatar(data.avatar);

    const user = await prisma.user.update({
      where: { id: req.user!.id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        avatar: data.avatar,
      },
    });

    res.json(serializeUser(user));
  }),
);

// ── Settings ─────────────────────────────────────────────────────────────

const emailSchema = z.object({
  email: emailField,
});

router.patch(
  "/settings/email",
  authenticate,
  asyncHandler(async (req, res) => {
    const { email } = emailSchema.parse(req.body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.id !== req.user!.id) {
      throw new AppError(409, "Bu email allaqachon band");
    }

    const user = await prisma.user.update({ where: { id: req.user!.id }, data: { email } });
    await revokeAllRefreshTokens(user.id);

    res.json({ user: serializeUser(user), message: "Email muvaffaqiyatli yangilandi" });
  }),
);

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Joriy parol kiritilishi shart"),
  newPassword: z.string().min(6, "Yangi parol kamida 6 belgidan iborat bo'lishi kerak"),
});

router.patch(
  "/settings/password",
  authenticate,
  asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = passwordSchema.parse(req.body);

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user || !(await comparePassword(currentPassword, user.passwordHash))) {
      throw new AppError(400, "Joriy parol noto'g'ri");
    }

    const passwordHash = await hashPassword(newPassword);
    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });
    await revokeAllRefreshTokens(user.id);

    res.json({ message: "Parol muvaffaqiyatli yangilandi" });
  }),
);

// ── Dashboard ────────────────────────────────────────────────────────────

router.get(
  "/dashboard",
  authenticate,
  asyncHandler(async (req, res) => {
    const userId = req.user!.id;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError(401, "Foydalanuvchi topilmadi");

    if (user.role !== ROLES.STUDENT) {
      const now = new Date();
      const todayStart = new Date(now);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(now);
      todayEnd.setHours(23, 59, 59, 999);

      const [groupsCount, studentsCount, todayLessonsCount, pendingGradingCount, upcomingLessonsRaw] =
        await Promise.all([
          prisma.group.count(),
          prisma.user.count({ where: { role: ROLES.STUDENT } }),
          prisma.lesson.count({ where: { lessonDate: { gte: todayStart, lte: todayEnd } } }),
          prisma.submission.count({ where: { status: "SUBMITTED" } }),
          prisma.lesson.findMany({
            where: { lessonDate: { gte: now }, status: "PLANNED" },
            orderBy: { lessonDate: "asc" },
            take: 5,
            include: { group: true },
          }),
        ]);

      res.json({
        user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email, avatar: user.avatar },
        stats: { groupsCount, studentsCount, todayLessonsCount, pendingGradingCount },
        upcomingLessons: upcomingLessonsRaw.map((lesson) => ({
          id: lesson.id,
          topic: lesson.topic,
          lessonDate: lesson.lessonDate,
          time: lesson.lessonDate.toISOString().slice(11, 16),
          groupName: lesson.group.name,
        })),
      });
      return;
    }

    const enrollments = await prisma.enrollment.findMany({
      where: { userId },
      include: { group: { include: { direction: true, teacher: true } } },
    });

    const now = new Date();
    const groups = await Promise.all(
      enrollments.map(async ({ group }) => {
        const [totalLessons, completedLessons, nextLesson] = await Promise.all([
          prisma.lesson.count({ where: { groupId: group.id } }),
          prisma.lesson.count({ where: { groupId: group.id, status: "COMPLETED" } }),
          prisma.lesson.findFirst({
            where: { groupId: group.id, lessonDate: { gte: now } },
            orderBy: { lessonDate: "asc" },
          }),
        ]);

        return {
          id: group.id,
          name: group.name,
          groupName: group.name,
          courseName: group.courseName,
          directionName: group.direction.name,
          directionColor: group.direction.color,
          totalLessons,
          completedLessons,
          progress: totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0,
          nextLessonDate: nextLesson?.lessonDate,
          teacherName: group.teacher.fullName,
        };
      }),
    );

    const [recentTransactions, unreadNotifications, upcomingLessonsRaw] = await Promise.all([
      prisma.coinTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        take: 10,
      }),
      prisma.notification.count({ where: { userId, isRead: false } }),
      prisma.lesson.findMany({
        where: {
          groupId: { in: enrollments.map((e) => e.groupId) },
          lessonDate: { gte: now },
          status: "PLANNED",
        },
        orderBy: { lessonDate: "asc" },
        take: 5,
        include: { group: true },
      }),
    ]);

    res.json({
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        avatar: user.avatar,
      },
      groups,
      coinBalance: user.coinBalance,
      recentTransactions: recentTransactions.map((t) => ({
        id: t.id,
        amount: t.amount,
        reason: t.reason,
        createdAt: t.createdAt,
      })),
      unreadNotifications,
      upcomingLessons: upcomingLessonsRaw.map((lesson) => ({
        id: lesson.id,
        topic: lesson.topic,
        lessonDate: lesson.lessonDate,
        time: lesson.lessonDate.toISOString().slice(11, 16),
        groupName: lesson.group.name,
      })),
    });
  }),
);

router.get(
  "/leaderboard",
  authenticate,
  asyncHandler(async (_req, res) => {
    const students = await prisma.user.findMany({
      where: { role: ROLES.STUDENT, status: "ACTIVE" },
      orderBy: { coinBalance: "desc" },
      take: 100,
    });

    res.json(
      students.map((s) => ({
        id: s.id,
        firstName: s.firstName,
        lastName: s.lastName,
        avatar: s.avatar,
        balance: s.coinBalance,
      })),
    );
  }),
);

// ── Groups & Lessons ─────────────────────────────────────────────────────

const groupInclude = {
  direction: true,
  teacher: true,
  _count: { select: { enrollments: true } },
} as const;

router.get(
  "/groups",
  authenticate,
  asyncHandler(async (req, res) => {
    const groups =
      req.user!.role === ROLES.STUDENT
        ? await prisma.group.findMany({
            where: { enrollments: { some: { userId: req.user!.id } } },
            include: groupInclude,
          })
        : await prisma.group.findMany({ include: groupInclude });

    res.json({ groups: groups.map((g) => serializeGroup(g as GroupWithRelations)) });
  }),
);

router.get(
  "/groups/:id",
  authenticate,
  asyncHandler(async (req, res) => {
    const group = await prisma.group.findUnique({
      where: { id: req.params.id },
      include: groupInclude,
    });
    if (!group) throw new AppError(404, "Guruh topilmadi");

    if (req.user!.role === ROLES.STUDENT) {
      const enrolled = await prisma.enrollment.findUnique({
        where: { userId_groupId: { userId: req.user!.id, groupId: group.id } },
      });
      if (!enrolled) throw new AppError(403, "Siz ushbu guruhga a'zo emassiz");
    }

    const isStudent = req.user!.role === ROLES.STUDENT;

    const lessons = await prisma.lesson.findMany({
      where: { groupId: group.id },
      orderBy: { lessonOrder: "asc" },
      include: {
        homework: {
          include: { submissions: isStudent ? { where: { userId: req.user!.id } } : true },
        },
      },
    });

    let students: ReturnType<typeof serializeStudentSummary>[] | undefined;
    if (!isStudent) {
      const enrollments = await prisma.enrollment.findMany({
        where: { groupId: group.id },
        include: {
          user: {
            include: {
              enrollments: { include: { group: { select: { id: true, name: true } } } },
              attendanceRecords: { select: { status: true } },
            },
          },
        },
      });
      students = enrollments.map((e) => serializeStudentSummary(e.user));
    }

    res.json({
      group: serializeGroupDetail(group as GroupWithRelations),
      students,
      lessons: lessons.map((lesson) => ({
        id: lesson.id,
        topic: lesson.topic,
        lessonOrder: lesson.lessonOrder,
        lessonDate: lesson.lessonDate,
        homework: isStudent
          ? homeworkSummary(lesson.homework, lesson.homework?.submissions[0])
          : lesson.homework
            ? {
                id: lesson.homework.id,
                title: lesson.homework.title,
                deadline: lesson.homework.deadline,
                isOverdue: new Date() > lesson.homework.deadline,
                submittedCount: lesson.homework.submissions.filter(
                  (s) => s.status === "SUBMITTED" || s.status === "GRADED",
                ).length,
                gradedCount: lesson.homework.submissions.filter((s) => s.status === "GRADED").length,
              }
            : undefined,
      })),
    });
  }),
);

const groupWriteSchema = z.object({
  name: z.string().min(1, "Guruh nomi kiritilishi shart"),
  courseName: z.string().min(1, "Kurs nomi kiritilishi shart"),
  directionId: z.string().min(1, "Yo'nalish tanlanishi shart"),
  teacherId: z.string().min(1, "O'qituvchi tanlanishi shart"),
  maxStudents: z.number().int().positive().optional(),
  scheduleDays: z.string().min(1, "Dars kunlari kiritilishi shart"),
  scheduleTime: z.string().min(1, "Dars vaqti kiritilishi shart"),
  status: z.enum(["ACTIVE", "COMPLETED"]).optional(),
});

router.post(
  "/groups",
  authenticate,
  requireRole(ROLES.TEACHER, ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const data = groupWriteSchema.parse(req.body);
    const group = await prisma.group.create({ data, include: groupInclude });
    res.status(201).json(serializeGroup(group as GroupWithRelations));
  }),
);

router.patch(
  "/groups/:id",
  authenticate,
  requireRole(ROLES.TEACHER, ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const data = groupWriteSchema.partial().parse(req.body);
    const group = await prisma.group.update({
      where: { id: req.params.id },
      data,
      include: groupInclude,
    });
    res.json(serializeGroup(group as GroupWithRelations));
  }),
);

router.delete(
  "/groups/:id",
  authenticate,
  requireRole(ROLES.TEACHER, ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const group = await prisma.group.findUnique({ where: { id: req.params.id } });
    if (!group) throw new AppError(404, "Guruh topilmadi");

    // Enrollment/Lesson (and, transitively, Homework/Submission/AttendanceRecord)
    // all cascade on Group deletion via onDelete: Cascade in the schema.
    await prisma.group.delete({ where: { id: req.params.id } });
    res.status(204).send();
  }),
);

const enrollSchema = z.object({ userId: z.string().min(1, "Talaba tanlanishi shart") });

router.post(
  "/groups/:id/students",
  authenticate,
  requireRole(ROLES.TEACHER, ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const { userId } = enrollSchema.parse(req.body);
    const [group, student] = await Promise.all([
      prisma.group.findUnique({ where: { id: req.params.id } }),
      prisma.user.findUnique({ where: { id: userId } }),
    ]);
    if (!group) throw new AppError(404, "Guruh topilmadi");
    if (!student || student.role !== ROLES.STUDENT) throw new AppError(404, "Talaba topilmadi");

    await prisma.enrollment.upsert({
      where: { userId_groupId: { userId, groupId: group.id } },
      create: { userId, groupId: group.id },
      update: {},
    });
    res.status(201).json({ message: "Talaba guruhga qo'shildi" });
  }),
);

router.delete(
  "/groups/:id/students/:userId",
  authenticate,
  requireRole(ROLES.TEACHER, ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    await prisma.enrollment.deleteMany({
      where: { groupId: req.params.id, userId: req.params.userId },
    });
    res.status(204).send();
  }),
);

// ── Directions ───────────────────────────────────────────────────────────

router.get(
  "/directions",
  authenticate,
  asyncHandler(async (_req, res) => {
    const directions = await prisma.direction.findMany({
      include: { _count: { select: { groups: true } } },
      orderBy: { name: "asc" },
    });
    res.json({ directions: directions.map(serializeDirection) });
  }),
);

const directionSchema = z.object({
  name: z.string().min(1, "Yo'nalish nomi kiritilishi shart"),
  color: z.string().optional(),
});

router.post(
  "/directions",
  authenticate,
  requireRole(ROLES.TEACHER, ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const data = directionSchema.parse(req.body);
    const direction = await prisma.direction.create({ data });
    res.status(201).json(serializeDirection({ ...direction, _count: { groups: 0 } }));
  }),
);

router.patch(
  "/directions/:id",
  authenticate,
  requireRole(ROLES.TEACHER, ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const data = directionSchema.partial().parse(req.body);
    const direction = await prisma.direction.update({
      where: { id: req.params.id },
      data,
      include: { _count: { select: { groups: true } } },
    });
    res.json(serializeDirection(direction));
  }),
);

router.delete(
  "/directions/:id",
  authenticate,
  requireRole(ROLES.TEACHER, ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const groupCount = await prisma.group.count({ where: { directionId: req.params.id } });
    if (groupCount > 0) {
      throw new AppError(400, "Bu yo'nalishda guruhlar mavjud, avval ularni boshqa yo'nalishga o'tkazing");
    }
    await prisma.direction.delete({ where: { id: req.params.id } });
    res.status(204).send();
  }),
);

// ── Teachers ─────────────────────────────────────────────────────────────

router.get(
  "/teachers",
  authenticate,
  requireRole(ROLES.TEACHER, ROLES.ADMIN),
  asyncHandler(async (_req, res) => {
    const teachers = await prisma.teacher.findMany({
      include: { user: { select: { id: true, email: true } }, _count: { select: { groups: true } } },
      orderBy: { fullName: "asc" },
    });
    res.json({ teachers: teachers.map(serializeTeacherProfile) });
  }),
);

const teacherWriteSchema = z.object({
  fullName: z.string().min(1, "Ism-familiya kiritilishi shart"),
  avatar: z.string().optional(),
  email: emailField.optional(),
  password: z.string().min(6, "Parol kamida 6 belgidan iborat bo'lishi kerak").optional(),
});

router.post(
  "/teachers",
  authenticate,
  requireRole(ROLES.TEACHER, ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const data = teacherWriteSchema.parse(req.body);

    if (data.email && !data.password) {
      throw new AppError(400, "Login yaratish uchun parol kiritilishi shart");
    }
    if (data.email) {
      const existing = await prisma.user.findUnique({ where: { email: data.email } });
      if (existing) throw new AppError(409, "Bu email allaqachon ro'yxatdan o'tgan");
    }

    const teacher = await prisma.$transaction(async (tx) => {
      let userId: string | undefined;
      if (data.email && data.password) {
        const passwordHash = await hashPassword(data.password);
        const [firstName, ...rest] = data.fullName.split(" ");
        const user = await tx.user.create({
          data: {
            email: data.email,
            passwordHash,
            firstName: firstName || data.fullName,
            lastName: rest.join(" ") || "-",
            role: ROLES.TEACHER,
            avatar: data.avatar,
          },
        });
        userId = user.id;
      }

      return tx.teacher.create({
        data: { fullName: data.fullName, avatar: data.avatar, userId },
        include: { user: { select: { id: true, email: true } }, _count: { select: { groups: true } } },
      });
    });

    res.status(201).json(serializeTeacherProfile(teacher));
  }),
);

router.patch(
  "/teachers/:id",
  authenticate,
  requireRole(ROLES.TEACHER, ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const data = teacherWriteSchema.omit({ email: true, password: true }).partial().parse(req.body);
    const teacher = await prisma.teacher.update({
      where: { id: req.params.id },
      data,
      include: { user: { select: { id: true, email: true } }, _count: { select: { groups: true } } },
    });
    res.json(serializeTeacherProfile(teacher));
  }),
);

router.delete(
  "/teachers/:id",
  authenticate,
  requireRole(ROLES.TEACHER, ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const groupCount = await prisma.group.count({ where: { teacherId: req.params.id } });
    if (groupCount > 0) {
      throw new AppError(400, "Bu o'qituvchida guruhlar mavjud, avval ularni boshqa o'qituvchiga bering");
    }
    await prisma.teacher.delete({ where: { id: req.params.id } });
    res.status(204).send();
  }),
);

router.get(
  "/lessons/:id",
  authenticate,
  asyncHandler(async (req, res) => {
    const isStudent = req.user!.role === ROLES.STUDENT;
    const lesson = await prisma.lesson.findUnique({
      where: { id: req.params.id },
      include: {
        group: { include: { teacher: true } },
        homework: {
          include: { submissions: isStudent ? { where: { userId: req.user!.id } } : true },
        },
      },
    });
    if (!lesson) throw new AppError(404, "Dars topilmadi");

    if (isStudent) {
      const enrolled = await prisma.enrollment.findUnique({
        where: { userId_groupId: { userId: req.user!.id, groupId: lesson.groupId } },
      });
      if (!enrolled) throw new AppError(403, "Siz ushbu darsga a'zo emassiz");
    }

    let roster:
      | {
          id: string;
          firstName: string;
          lastName: string;
          avatar: string | null;
          attendanceStatus: string | null;
          submission: ReturnType<typeof serializeSubmission>;
        }[]
      | undefined;

    if (!isStudent) {
      const [enrollments, attendanceRecords] = await Promise.all([
        prisma.enrollment.findMany({ where: { groupId: lesson.groupId }, include: { user: true } }),
        prisma.attendanceRecord.findMany({ where: { lessonId: lesson.id } }),
      ]);
      const attendanceByUser = new Map(attendanceRecords.map((r) => [r.userId, r.status.toLowerCase()]));
      const submissionsByUser = new Map((lesson.homework?.submissions ?? []).map((s) => [s.userId, s]));
      roster = enrollments.map(({ user }) => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        attendanceStatus: attendanceByUser.get(user.id) ?? null,
        submission: serializeSubmission(submissionsByUser.get(user.id) ?? null),
      }));
    }

    res.json({
      lesson: {
        id: lesson.id,
        groupId: lesson.groupId,
        topic: lesson.topic,
        description: lesson.description ?? undefined,
        lessonDate: lesson.lessonDate,
        lessonOrder: lesson.lessonOrder,
        groupName: lesson.group.name,
        teacherName: lesson.group.teacher.fullName,
        status: lesson.status.toLowerCase(),
      },
      homework: lesson.homework ? serializeHomeworkDetail(lesson.homework) : null,
      submission: isStudent ? serializeSubmission(lesson.homework?.submissions[0] ?? null) : undefined,
      roster,
    });
  }),
);

const lessonWriteSchema = z.object({
  topic: z.string().min(1, "Mavzu kiritilishi shart"),
  description: z.string().optional(),
  lessonDate: z.coerce.date(),
});

router.post(
  "/groups/:id/lessons",
  authenticate,
  requireRole(ROLES.TEACHER, ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const data = lessonWriteSchema.parse(req.body);
    const group = await prisma.group.findUnique({ where: { id: req.params.id } });
    if (!group) throw new AppError(404, "Guruh topilmadi");

    const lastLesson = await prisma.lesson.findFirst({
      where: { groupId: group.id },
      orderBy: { lessonOrder: "desc" },
    });

    const lesson = await prisma.lesson.create({
      data: {
        groupId: group.id,
        topic: data.topic,
        description: data.description,
        lessonDate: data.lessonDate,
        lessonOrder: (lastLesson?.lessonOrder ?? 0) + 1,
      },
    });

    res.status(201).json({
      id: lesson.id,
      topic: lesson.topic,
      lessonOrder: lesson.lessonOrder,
      lessonDate: lesson.lessonDate,
    });
  }),
);

const lessonUpdateSchema = z.object({
  topic: z.string().min(1).optional(),
  description: z.string().optional(),
  lessonDate: z.coerce.date().optional(),
  status: z.enum(["PLANNED", "COMPLETED", "CANCELLED"]).optional(),
});

router.patch(
  "/lessons/:id",
  authenticate,
  requireRole(ROLES.TEACHER, ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const data = lessonUpdateSchema.parse(req.body);
    const lesson = await prisma.lesson.update({ where: { id: req.params.id }, data });
    res.json({
      id: lesson.id,
      topic: lesson.topic,
      description: lesson.description ?? undefined,
      lessonDate: lesson.lessonDate,
      status: lesson.status.toLowerCase(),
    });
  }),
);

router.delete(
  "/lessons/:id",
  authenticate,
  requireRole(ROLES.TEACHER, ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    await prisma.lesson.delete({ where: { id: req.params.id } });
    res.status(204).send();
  }),
);

const homeworkWriteSchema = z.object({
  title: z.string().min(1, "Sarlavha kiritilishi shart"),
  description: z.string().min(1, "Tavsif kiritilishi shart"),
  maxScore: z.number().int().positive().optional(),
  deadline: z.coerce.date(),
});

router.post(
  "/lessons/:id/homework",
  authenticate,
  requireRole(ROLES.TEACHER, ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const data = homeworkWriteSchema.parse(req.body);
    const lesson = await prisma.lesson.findUnique({ where: { id: req.params.id } });
    if (!lesson) throw new AppError(404, "Dars topilmadi");

    const existing = await prisma.homework.findUnique({ where: { lessonId: lesson.id } });
    if (existing) throw new AppError(409, "Bu darsda uyga vazifa allaqachon mavjud");

    const homework = await prisma.homework.create({ data: { lessonId: lesson.id, ...data } });

    const enrollments = await prisma.enrollment.findMany({ where: { groupId: lesson.groupId } });
    if (enrollments.length > 0) {
      await prisma.notification.createMany({
        data: enrollments.map((e) => ({
          userId: e.userId,
          title: "Yangi uyga vazifa",
          message: `"${lesson.topic}" darsi uchun "${homework.title}" uyga vazifasi berildi`,
          type: "HOMEWORK",
        })),
      });
    }

    res.status(201).json(serializeHomeworkDetail(homework));
  }),
);

router.patch(
  "/homework/:id",
  authenticate,
  requireRole(ROLES.TEACHER, ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const data = homeworkWriteSchema
      .partial()
      .extend({ status: z.enum(["ACTIVE", "CLOSED"]).optional() })
      .parse(req.body);
    const homework = await prisma.homework.update({ where: { id: req.params.id }, data });
    res.json(serializeHomeworkDetail(homework));
  }),
);

router.delete(
  "/homework/:id",
  authenticate,
  requireRole(ROLES.TEACHER, ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    await prisma.homework.delete({ where: { id: req.params.id } });
    res.status(204).send();
  }),
);

const gradeSchema = z.object({
  score: z.number().int().min(0),
  feedback: z.string().optional(),
});

router.patch(
  "/submissions/:id/grade",
  authenticate,
  requireRole(ROLES.TEACHER, ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const data = gradeSchema.parse(req.body);
    const submission = await prisma.submission.findUnique({
      where: { id: req.params.id },
      include: { homework: true },
    });
    if (!submission) throw new AppError(404, "Topshiriq topilmadi");

    const updated = await prisma.submission.update({
      where: { id: submission.id },
      data: { score: data.score, feedback: data.feedback, status: "GRADED" },
    });

    await prisma.notification.create({
      data: {
        userId: submission.userId,
        title: "Uyga vazifa baholandi",
        message: `"${submission.homework.title}" vazifangiz ${data.score}/${submission.homework.maxScore} ball bilan baholandi`,
        type: "GRADE",
      },
    });

    res.json(serializeSubmission(updated));
  }),
);

// ── Submissions (grading) ───────────────────────────────────────────────

const serializeSubmissionWithContext = (
  submission: Submission & {
    user: { id: string; firstName: string; lastName: string; avatar: string | null };
    homework: Homework & { lesson: { id: string; topic: string; groupId: string; group: { name: string } } };
  },
) => ({
  id: submission.id,
  content: submission.content,
  attachmentUrl: submission.attachmentUrl,
  submittedAt: submission.submittedAt,
  score: submission.score,
  feedback: submission.feedback,
  status: submission.status.toLowerCase(),
  student: {
    id: submission.user.id,
    firstName: submission.user.firstName,
    lastName: submission.user.lastName,
    avatar: submission.user.avatar,
  },
  homework: {
    id: submission.homework.id,
    title: submission.homework.title,
    description: submission.homework.description,
    maxScore: submission.homework.maxScore,
    deadline: submission.homework.deadline,
  },
  lesson: {
    id: submission.homework.lesson.id,
    topic: submission.homework.lesson.topic,
    groupId: submission.homework.lesson.groupId,
    groupName: submission.homework.lesson.group.name,
  },
});

router.get(
  "/submissions",
  authenticate,
  requireRole(ROLES.TEACHER, ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const statusParam = typeof req.query.status === "string" ? req.query.status.toUpperCase() : undefined;
    const submissions = await prisma.submission.findMany({
      where: statusParam ? { status: statusParam } : undefined,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        homework: { include: { lesson: { include: { group: { select: { name: true } } } } } },
      },
      orderBy: { submittedAt: "asc" },
    });

    res.json({ submissions: submissions.map(serializeSubmissionWithContext) });
  }),
);

router.get(
  "/submissions/:id",
  authenticate,
  requireRole(ROLES.TEACHER, ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const submission = await prisma.submission.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, avatar: true } },
        homework: { include: { lesson: { include: { group: { select: { name: true } } } } } },
      },
    });
    if (!submission) throw new AppError(404, "Topshiriq topilmadi");

    res.json(serializeSubmissionWithContext(submission));
  }),
);

// ── Homework ─────────────────────────────────────────────────────────────

const submitHomeworkSchema = z.object({
  content: z.string().min(1, "Uyga vazifa matni kiritilishi shart"),
  attachmentUrl: z.string().optional(),
});

router.post(
  "/homework/:id/submit",
  authenticate,
  requireRole(ROLES.STUDENT),
  asyncHandler(async (req, res) => {
    const data = submitHomeworkSchema.parse(req.body);
    const homework = await prisma.homework.findUnique({
      where: { id: req.params.id },
      include: {
        lesson: { include: { group: { include: { teacher: true } } } },
        submissions: { where: { userId: req.user!.id } },
      },
    });
    if (!homework) throw new AppError(404, "Uyga vazifa topilmadi");

    const enrolled = await prisma.enrollment.findUnique({
      where: { userId_groupId: { userId: req.user!.id, groupId: homework.lesson.groupId } },
    });
    if (!enrolled) throw new AppError(403, "Faqat o'z guruhingizdagi vazifani topshira olasiz");

    if (new Date() > homework.deadline) {
      throw new AppError(400, "Topshirish muddati tugagan");
    }

    const existing = homework.submissions[0];
    if (existing?.status === "GRADED") {
      throw new AppError(400, "Ushbu vazifa allaqachon baholangan");
    }

    const submission = await prisma.submission.upsert({
      where: { homeworkId_userId: { homeworkId: homework.id, userId: req.user!.id } },
      create: {
        homeworkId: homework.id,
        userId: req.user!.id,
        content: data.content,
        attachmentUrl: data.attachmentUrl,
      },
      update: {
        content: data.content,
        attachmentUrl: data.attachmentUrl,
        submittedAt: new Date(),
      },
    });

    const teacherUserId = homework.lesson.group.teacher.userId;
    if (teacherUserId) {
      const student = await prisma.user.findUnique({
        where: { id: req.user!.id },
        select: { firstName: true, lastName: true },
      });
      await prisma.notification.create({
        data: {
          userId: teacherUserId,
          title: "Yangi topshiriq",
          message: `${student?.firstName ?? ""} ${student?.lastName ?? ""}`.trim() +
            ` "${homework.title}" vazifasini topshirdi`,
          type: "SUBMISSION",
        },
      });
    }

    res.json({
      message: "Uyga vazifa muvaffaqiyatli topshirildi",
      submission: serializeSubmission(submission),
    });
  }),
);

// ── Attendance ───────────────────────────────────────────────────────────

router.get(
  "/attendance",
  authenticate,
  asyncHandler(async (req, res) => {
    const groupId = typeof req.query.groupId === "string" ? req.query.groupId : undefined;
    const lessonId = typeof req.query.lessonId === "string" ? req.query.lessonId : undefined;
    const isStudent = req.user!.role === ROLES.STUDENT;
    const queryUserId = typeof req.query.userId === "string" ? req.query.userId : undefined;
    const userId = isStudent ? req.user!.id : queryUserId;

    const records = await prisma.attendanceRecord.findMany({
      where: { userId, lessonId, lesson: groupId ? { groupId } : undefined },
      include: { lesson: true },
      orderBy: { markedAt: "desc" },
    });

    const total = records.length;
    const present = records.filter((r) => r.status === "PRESENT").length;

    res.json({
      records: records.map((r) => serializeAttendanceRecord(r)),
      stats: {
        total,
        present,
        percentage: attendancePercentage(present, total),
      },
    });
  }),
);

const attendanceBulkSchema = z.object({
  records: z
    .array(
      z.object({
        userId: z.string().min(1),
        status: z.enum(["PRESENT", "ABSENT", "LATE", "EXCUSED"]),
      }),
    )
    .min(1, "Kamida bitta talaba belgilanishi shart"),
});

router.post(
  "/lessons/:id/attendance",
  authenticate,
  requireRole(ROLES.TEACHER, ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const { records } = attendanceBulkSchema.parse(req.body);
    const lesson = await prisma.lesson.findUnique({ where: { id: req.params.id } });
    if (!lesson) throw new AppError(404, "Dars topilmadi");

    await prisma.$transaction(
      records.map((r) =>
        prisma.attendanceRecord.upsert({
          where: { userId_lessonId: { userId: r.userId, lessonId: lesson.id } },
          create: { userId: r.userId, lessonId: lesson.id, status: r.status },
          update: { status: r.status, markedAt: new Date() },
        }),
      ),
    );

    res.json({ message: "Davomat saqlandi" });
  }),
);

const getWeekRange = (reference: Date): { start: Date; end: Date } => {
  const dayIndex = (reference.getDay() + 6) % 7; // Monday = 0 ... Sunday = 6
  const start = new Date(reference);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - dayIndex);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
};

router.get(
  "/groups/:id/attendance/week",
  authenticate,
  requireRole(ROLES.TEACHER, ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const group = await prisma.group.findUnique({ where: { id: req.params.id } });
    if (!group) throw new AppError(404, "Guruh topilmadi");

    const dateParam = typeof req.query.date === "string" ? new Date(req.query.date) : new Date();
    const reference = Number.isNaN(dateParam.getTime()) ? new Date() : dateParam;
    const { start, end } = getWeekRange(reference);

    const [lessons, enrollments] = await Promise.all([
      prisma.lesson.findMany({
        where: { groupId: group.id, lessonDate: { gte: start, lte: end } },
        orderBy: { lessonDate: "asc" },
      }),
      prisma.enrollment.findMany({ where: { groupId: group.id }, include: { user: true } }),
    ]);

    const lessonIds = lessons.map((l) => l.id);
    const attendanceRecords = lessonIds.length
      ? await prisma.attendanceRecord.findMany({ where: { lessonId: { in: lessonIds } } })
      : [];

    const attendanceByUser = new Map<string, Map<string, string>>();
    attendanceRecords.forEach((r) => {
      if (!attendanceByUser.has(r.userId)) attendanceByUser.set(r.userId, new Map());
      attendanceByUser.get(r.userId)!.set(r.lessonId, r.status.toLowerCase());
    });

    res.json({
      weekStart: start,
      weekEnd: end,
      lessons: lessons.map((l) => ({ id: l.id, topic: l.topic, lessonDate: l.lessonDate })),
      roster: enrollments.map(({ user }) => ({
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        coinBalance: user.coinBalance,
        attendance: Object.fromEntries(attendanceByUser.get(user.id) ?? []),
      })),
    });
  }),
);

// ── Coins ────────────────────────────────────────────────────────────────

router.get(
  "/coins",
  authenticate,
  asyncHandler(async (req, res) => {
    if (req.user!.role !== ROLES.STUDENT) {
      const transactions = await prisma.coinTransaction.findMany({
        orderBy: { createdAt: "desc" },
        take: 100,
        include: { user: { select: { firstName: true, lastName: true } } },
      });
      res.json({
        transactions: transactions.map((t) => ({
          id: t.id,
          userId: t.userId,
          studentName: `${t.user.firstName} ${t.user.lastName}`.trim(),
          amount: t.amount,
          reason: t.reason,
          createdAt: t.createdAt,
        })),
      });
      return;
    }

    const [user, transactions] = await Promise.all([
      prisma.user.findUnique({ where: { id: req.user!.id } }),
      prisma.coinTransaction.findMany({
        where: { userId: req.user!.id },
        orderBy: { createdAt: "desc" },
      }),
    ]);
    if (!user) throw new AppError(401, "Foydalanuvchi topilmadi");

    res.json({
      balance: user.coinBalance,
      transactions: transactions.map((t) => ({
        id: t.id,
        amount: t.amount,
        reason: t.reason,
        createdAt: t.createdAt,
      })),
    });
  }),
);

const coinAwardSchema = z.object({
  amount: z.number().int().refine((n) => n !== 0, "Miqdor 0 bo'lishi mumkin emas"),
  reason: z.string().min(1, "Sabab kiritilishi shart"),
});

router.post(
  "/students/:id/coins",
  authenticate,
  requireRole(ROLES.TEACHER, ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const data = coinAwardSchema.parse(req.body);
    const student = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!student || student.role !== ROLES.STUDENT) throw new AppError(404, "Talaba topilmadi");

    const newBalance = Math.max(0, student.coinBalance + data.amount);

    const [updated] = await prisma.$transaction([
      prisma.user.update({ where: { id: student.id }, data: { coinBalance: newBalance } }),
      prisma.coinTransaction.create({
        data: { userId: student.id, amount: data.amount, reason: data.reason },
      }),
      prisma.notification.create({
        data: {
          userId: student.id,
          title: data.amount > 0 ? "Coin qo'shildi" : "Coin yechildi",
          message: `${data.reason}: ${data.amount > 0 ? "+" : ""}${data.amount} coin`,
          type: "SYSTEM",
        },
      }),
    ]);

    res.status(201).json({ balance: updated.coinBalance });
  }),
);

// ── Students ─────────────────────────────────────────────────────────────

router.get(
  "/students",
  authenticate,
  requireRole(ROLES.TEACHER, ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const search = typeof req.query.search === "string" ? req.query.search.toLowerCase() : undefined;
    const groupId = typeof req.query.groupId === "string" ? req.query.groupId : undefined;

    const students = await prisma.user.findMany({
      where: {
        role: ROLES.STUDENT,
        enrollments: groupId ? { some: { groupId } } : undefined,
      },
      include: {
        enrollments: { include: { group: { select: { id: true, name: true } } } },
        attendanceRecords: { select: { status: true } },
      },
      orderBy: { firstName: "asc" },
    });

    const filtered = search
      ? students.filter((s) => `${s.firstName} ${s.lastName} ${s.email}`.toLowerCase().includes(search))
      : students;

    res.json({ students: filtered.map(serializeStudentSummary) });
  }),
);

const createStudentSchema = z.object({
  email: emailField,
  password: z.string().min(6, "Parol kamida 6 belgidan iborat bo'lishi kerak"),
  firstName: z.string().min(1, "Ism kiritilishi shart"),
  lastName: z.string().min(1, "Familiya kiritilishi shart"),
  phone: z.string().optional(),
});

router.post(
  "/students",
  authenticate,
  requireRole(ROLES.TEACHER, ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const data = createStudentSchema.parse(req.body);
    const existing = await prisma.user.findUnique({ where: { email: data.email } });
    if (existing) throw new AppError(409, "Bu email allaqachon ro'yxatdan o'tgan");

    const passwordHash = await hashPassword(data.password);
    const student = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: ROLES.STUDENT,
      },
      include: {
        enrollments: { include: { group: { select: { id: true, name: true } } } },
        attendanceRecords: { select: { status: true } },
      },
    });

    res.status(201).json(serializeStudentSummary(student));
  }),
);

router.get(
  "/students/:id",
  authenticate,
  requireRole(ROLES.TEACHER, ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const student = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: {
        enrollments: { include: { group: { select: { id: true, name: true } } } },
        attendanceRecords: { include: { lesson: true }, orderBy: { markedAt: "desc" } },
        coinTransactions: { orderBy: { createdAt: "desc" } },
        payments: { orderBy: { createdAt: "desc" } },
        submissions: {
          include: { homework: { include: { lesson: true } } },
          orderBy: { submittedAt: "desc" },
        },
      },
    });
    if (!student || student.role !== ROLES.STUDENT) throw new AppError(404, "Talaba topilmadi");

    const total = student.attendanceRecords.length;
    const present = student.attendanceRecords.filter((r) => r.status === "PRESENT").length;

    res.json({
      student: {
        id: student.id,
        email: student.email,
        firstName: student.firstName,
        lastName: student.lastName,
        phone: student.phone,
        avatar: student.avatar,
        status: student.status.toLowerCase(),
        coinBalance: student.coinBalance,
        createdAt: student.createdAt,
      },
      groups: student.enrollments.map((e) => ({ id: e.group.id, name: e.group.name })),
      attendance: {
        stats: { total, present, percentage: attendancePercentage(present, total) },
        records: student.attendanceRecords.map((r) => serializeAttendanceRecord(r)),
      },
      coinTransactions: student.coinTransactions.map((t) => ({
        id: t.id,
        amount: t.amount,
        reason: t.reason,
        createdAt: t.createdAt,
      })),
      payments: student.payments.map(serializePayment),
      submissions: student.submissions.map((s) => ({
        id: s.id,
        homeworkTitle: s.homework.title,
        lessonTopic: s.homework.lesson.topic,
        score: s.score ?? 0,
        maxScore: s.homework.maxScore,
        status: s.status.toLowerCase(),
        submittedAt: s.submittedAt,
      })),
    });
  }),
);

const updateStudentSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().nullable().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).optional(),
});

router.patch(
  "/students/:id",
  authenticate,
  requireRole(ROLES.TEACHER, ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const data = updateStudentSchema.parse(req.body);
    const student = await prisma.user.update({ where: { id: req.params.id }, data });
    res.json(serializeUser(student));
  }),
);

router.delete(
  "/students/:id",
  authenticate,
  requireRole(ROLES.TEACHER, ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const student = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!student || student.role !== ROLES.STUDENT) throw new AppError(404, "Talaba topilmadi");

    await prisma.user.delete({ where: { id: req.params.id } });
    res.status(204).send();
  }),
);

// ── Notifications ────────────────────────────────────────────────────────

router.get(
  "/notifications",
  authenticate,
  asyncHandler(async (req, res) => {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
    });
    res.json({ notifications: notifications.map(serializeNotification) });
  }),
);

router.patch(
  "/notifications/read-all",
  authenticate,
  asyncHandler(async (req, res) => {
    await prisma.notification.updateMany({
      where: { userId: req.user!.id, isRead: false },
      data: { isRead: true },
    });
    res.json({ message: "Barcha bildirishnomalar o'qilgan deb belgilandi" });
  }),
);

router.patch(
  "/notifications/:id/read",
  authenticate,
  asyncHandler(async (req, res) => {
    const notification = await prisma.notification.findUnique({ where: { id: req.params.id } });
    if (!notification || notification.userId !== req.user!.id) {
      throw new AppError(404, "Bildirishnoma topilmadi");
    }

    const updated = await prisma.notification.update({
      where: { id: notification.id },
      data: { isRead: true },
    });
    res.json(serializeNotification(updated));
  }),
);

// ── Shop ─────────────────────────────────────────────────────────────────

router.get(
  "/products",
  asyncHandler(async (req, res) => {
    const category = typeof req.query.category === "string" ? req.query.category : undefined;
    const search = typeof req.query.search === "string" ? req.query.search.toLowerCase() : undefined;

    let products = await prisma.product.findMany({ orderBy: { createdAt: "desc" } });
    if (category) {
      products = products.filter((p) => p.category.toLowerCase() === category.toLowerCase());
    }
    if (search) {
      products = products.filter(
        (p) => p.name.toLowerCase().includes(search) || p.description.toLowerCase().includes(search),
      );
    }

    res.json({ products: products.map(serializeProduct) });
  }),
);

const productWriteSchema = z.object({
  name: z.string().min(1, "Mahsulot nomi kiritilishi shart"),
  description: z.string().min(1, "Tavsif kiritilishi shart"),
  price: z.number().int().positive("Narx kiritilishi shart"),
  originalPrice: z.number().int().positive().optional(),
  category: z.string().min(1, "Kategoriya tanlanishi shart"),
  image: z.string().min(1, "Rasm kiritilishi shart"),
  isPopular: z.boolean().optional(),
  isNew: z.boolean().optional(),
  isLimited: z.boolean().optional(),
});

router.post(
  "/products",
  authenticate,
  requireRole(ROLES.TEACHER, ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const data = productWriteSchema.parse(req.body);
    const product = await prisma.product.create({ data });
    res.status(201).json(serializeProduct(product));
  }),
);

router.patch(
  "/products/:id",
  authenticate,
  requireRole(ROLES.TEACHER, ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const data = productWriteSchema.partial().parse(req.body);
    const product = await prisma.product.update({ where: { id: req.params.id }, data });
    res.json(serializeProduct(product));
  }),
);

router.delete(
  "/products/:id",
  authenticate,
  requireRole(ROLES.TEACHER, ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const purchaseCount = await prisma.purchase.count({ where: { productId: req.params.id } });
    if (purchaseCount > 0) {
      throw new AppError(400, "Bu mahsulot xarid qilingan, uni o'chirib bo'lmaydi");
    }
    await prisma.wishlistItem.deleteMany({ where: { productId: req.params.id } });
    await prisma.product.delete({ where: { id: req.params.id } });
    res.status(204).send();
  }),
);

router.get(
  "/wishlist",
  authenticate,
  asyncHandler(async (req, res) => {
    const items = await prisma.wishlistItem.findMany({
      where: { userId: req.user!.id },
      include: { product: true },
      orderBy: { createdAt: "desc" },
    });
    res.json({ wishlist: items.map((i) => serializeProduct(i.product)) });
  }),
);

router.post(
  "/wishlist/:productId",
  authenticate,
  asyncHandler(async (req, res) => {
    const product = await prisma.product.findUnique({ where: { id: req.params.productId } });
    if (!product) throw new AppError(404, "Mahsulot topilmadi");

    await prisma.wishlistItem.upsert({
      where: { userId_productId: { userId: req.user!.id, productId: product.id } },
      create: { userId: req.user!.id, productId: product.id },
      update: {},
    });

    res.status(201).json({ message: "Sevimlilarga qo'shildi" });
  }),
);

router.delete(
  "/wishlist/:productId",
  authenticate,
  asyncHandler(async (req, res) => {
    await prisma.wishlistItem.deleteMany({
      where: { userId: req.user!.id, productId: req.params.productId },
    });
    res.status(204).send();
  }),
);

const checkoutSchema = z.union([
  z.object({ productIds: z.array(z.string()).min(1, "Kamida bitta mahsulot tanlang") }),
  z.object({
    items: z
      .array(z.object({ productId: z.string(), quantity: z.number().int().positive().default(1) }))
      .min(1, "Kamida bitta mahsulot tanlang"),
  }),
]);

router.post(
  "/shop/checkout",
  authenticate,
  requireRole(ROLES.STUDENT),
  asyncHandler(async (req, res) => {
    const parsed = checkoutSchema.parse(req.body);
    const productIds: string[] =
      "productIds" in parsed
        ? parsed.productIds
        : parsed.items.flatMap((item) => Array(item.quantity).fill(item.productId));

    const products = await prisma.product.findMany({ where: { id: { in: productIds } } });
    const productMap = new Map(products.map((p) => [p.id, p]));

    const purchasedUnits = productIds.map((id) => {
      const product = productMap.get(id);
      if (!product) throw new AppError(404, `Mahsulot topilmadi: ${id}`);
      return product;
    });

    const totalCost = purchasedUnits.reduce((sum, p) => sum + p.price, 0);

    const user = await prisma.user.findUnique({ where: { id: req.user!.id } });
    if (!user || user.coinBalance < totalCost) {
      throw new AppError(400, "Coin balansi yetarli emas");
    }

    const result = await prisma.$transaction(async (tx) => {
      const purchases = await Promise.all(
        purchasedUnits.map((product) =>
          tx.purchase.create({
            data: { userId: user.id, productId: product.id, price: product.price },
          }),
        ),
      );

      await tx.coinTransaction.create({
        data: { userId: user.id, amount: -totalCost, reason: "Do'kondan xarid" },
      });

      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { coinBalance: { decrement: totalCost } },
      });

      return { purchases, balance: updatedUser.coinBalance };
    });

    res.status(201).json({
      message: "Xarid muvaffaqiyatli amalga oshirildi",
      purchaseIds: result.purchases.map((p) => p.id),
      balance: result.balance,
    });
  }),
);

// ── Payments ─────────────────────────────────────────────────────────────

router.get(
  "/payments",
  authenticate,
  asyncHandler(async (req, res) => {
    if (req.user!.role !== ROLES.STUDENT) {
      const payments = await prisma.payment.findMany({
        orderBy: { createdAt: "desc" },
        include: { user: { select: { firstName: true, lastName: true } } },
      });
      res.json({
        payments: payments.map((p) => ({
          ...serializePayment(p),
          userId: p.userId,
          studentName: `${p.user.firstName} ${p.user.lastName}`.trim(),
        })),
      });
      return;
    }

    const payments = await prisma.payment.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
    });
    res.json({ payments: payments.map(serializePayment) });
  }),
);

const paymentWriteSchema = z.object({
  amountNumber: z.number().int().positive("Summani kiriting"),
  status: z.enum(["PAID", "PENDING", "OVERDUE", "CANCELLED"]).optional(),
  paymentType: z.enum(["CASH", "CLICK", "PAYME", "BANK", "UZUM"]),
  description: z.string().optional(),
  receiptNumber: z.string().optional(),
});

router.post(
  "/students/:id/payments",
  authenticate,
  requireRole(ROLES.TEACHER, ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const data = paymentWriteSchema.parse(req.body);
    const student = await prisma.user.findUnique({ where: { id: req.params.id } });
    if (!student || student.role !== ROLES.STUDENT) throw new AppError(404, "Talaba topilmadi");

    const orderCount = await prisma.payment.count({ where: { userId: student.id } });
    const teacherName = await getTeacherDisplayName(req.user!.id);

    const payment = await prisma.payment.create({
      data: {
        userId: student.id,
        orderNumber: orderCount + 1,
        amountNumber: data.amountNumber,
        status: data.status ?? "PENDING",
        paymentType: data.paymentType,
        paidAt: data.status === "PAID" ? new Date() : null,
        description: data.description,
        receiptNumber: data.receiptNumber,
        teacherName,
      },
    });

    res.status(201).json(serializePayment(payment));
  }),
);

const paymentUpdateSchema = z.object({
  amountNumber: z.number().int().positive().optional(),
  status: z.enum(["PAID", "PENDING", "OVERDUE", "CANCELLED"]).optional(),
  paymentType: z.enum(["CASH", "CLICK", "PAYME", "BANK", "UZUM"]).optional(),
  description: z.string().optional(),
  receiptNumber: z.string().optional(),
});

router.patch(
  "/payments/:id",
  authenticate,
  requireRole(ROLES.TEACHER, ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    const data = paymentUpdateSchema.parse(req.body);
    const existing = await prisma.payment.findUnique({ where: { id: req.params.id } });
    if (!existing) throw new AppError(404, "To'lov topilmadi");

    const payment = await prisma.payment.update({
      where: { id: req.params.id },
      data: {
        ...data,
        paidAt:
          data.status === "PAID" ? existing.paidAt ?? new Date() : data.status ? null : undefined,
      },
    });
    res.json(serializePayment(payment));
  }),
);

router.delete(
  "/payments/:id",
  authenticate,
  requireRole(ROLES.TEACHER, ROLES.ADMIN),
  asyncHandler(async (req, res) => {
    await prisma.payment.delete({ where: { id: req.params.id } });
    res.status(204).send();
  }),
);
