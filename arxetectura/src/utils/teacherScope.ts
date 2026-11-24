// src/utils/teacherScope.ts — who may see what among staff.
//
// Roles: STUDENT, TEACHER, ADMIN.
// - ADMIN sees and manages everything (an ADMIN may have no Teacher profile,
//   so teacherId() is never called for an ADMIN on a scoping path).
// - TEACHER only sees and manages their own groups and what hangs off them
//   (lessons, homework, submissions, attendance, group quizzes/missions), plus
//   the students enrolled in those groups and students with no group at all
//   ("Guruhsiz": the teacher panel creates a student first, then enrolls them).
//
// The scope helpers return Prisma `where` fragments; the assert* guards load a
// single record inside the caller's scope or throw a 404 (out-of-scope records
// look exactly like missing ones).
import type { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

export const uid = (req: any) => req.user.id;

// The authenticated user's id + role straight from the verified JWT, for
// routes that only need to branch on role — saves a DB round-trip per request.
export const currentUser = (req: any) => ({ id: req.user.id as string, role: req.user.role as string });

export const isAdmin = (req: any) => req.user?.role === "ADMIN";

export const httpError = (status: number, message: string) => Object.assign(new Error(message), { status });

/** The requesting TEACHER's Teacher profile id (403 when the account has none). */
export const teacherId = async (req: any) => {
  if (req._teacherId) return req._teacherId as string;
  const teacher = await prisma.teacher.findUnique({ where: { userId: uid(req) } });
  if (!teacher) throw httpError(403, "Teacher profile not found");
  req._teacherId = teacher.id;
  return teacher.id;
};

/** Groups the caller may see: all for ADMIN, own for TEACHER. */
export const groupScope = async (req: any): Promise<Prisma.GroupWhereInput> =>
  isAdmin(req) ? {} : { teacherId: await teacherId(req) };

/** Students the caller may see: all for ADMIN; own groups' + unassigned for TEACHER. */
export const studentScope = async (req: any): Promise<Prisma.UserWhereInput> =>
  isAdmin(req)
    ? {}
    : {
        OR: [
          { Enrollment: { some: { Group: { teacherId: await teacherId(req) } } } },
          { Enrollment: { none: {} } },
        ],
      };

/** Quizzes: ADMIN all; TEACHER = own groups' quizzes + global quizzes they created. */
export const quizScope = async (req: any): Promise<Prisma.QuizWhereInput> =>
  isAdmin(req)
    ? {}
    : { OR: [{ Group: { teacherId: await teacherId(req) } }, { groupId: null, createdById: uid(req) }] };

/**
 * Missions a TEACHER may change: their groups' missions. Global missions
 * (groupId null) have no owner column, so only an ADMIN may change them.
 */
export const missionWriteScope = async (req: any): Promise<Prisma.MissionWhereInput> =>
  isAdmin(req) ? {} : { Group: { teacherId: await teacherId(req) } };

/** Missions a TEACHER may see: their groups' missions + global ones (read-only). */
export const missionReadScope = async (req: any): Promise<Prisma.MissionWhereInput> =>
  isAdmin(req) ? {} : { OR: [{ groupId: null }, { Group: { teacherId: await teacherId(req) } }] };

export const teacherGroup = async (req: any, groupId: string) =>
  prisma.group.findFirst({ where: { id: groupId, ...(await groupScope(req)) } });

// ── Guards: the record in the caller's scope, or a 404 ──

export const assertGroup = async (req: any, groupId: string) => {
  const group = await teacherGroup(req, groupId);
  if (!group) throw httpError(404, "Group not found");
  return group;
};

export const assertLesson = async (req: any, lessonId: string) => {
  const lesson = await prisma.lesson.findFirst({ where: { id: lessonId, Group: await groupScope(req) } });
  if (!lesson) throw httpError(404, "Lesson not found");
  return lesson;
};

export const assertHomework = async (req: any, homeworkId: string) => {
  const homework = await prisma.homework.findFirst({
    where: { id: homeworkId, Lesson: { Group: await groupScope(req) } },
  });
  if (!homework) throw httpError(404, "Homework not found");
  return homework;
};

export const assertSubmission = async (req: any, submissionId: string) => {
  const submission = await prisma.submission.findFirst({
    where: { id: submissionId, Homework: { Lesson: { Group: await groupScope(req) } } },
    include: { Homework: true },
  });
  if (!submission) throw httpError(404, "Submission not found");
  return submission;
};

export const assertStudent = async (req: any, studentId: string) => {
  const student = await prisma.user.findFirst({
    where: { id: studentId, role: "STUDENT", ...(await studentScope(req)) },
  });
  if (!student) throw httpError(404, "Student not found");
  return student;
};

export const assertQuiz = async (req: any, quizId: string) => {
  const quiz = await prisma.quiz.findFirst({ where: { id: quizId, ...(await quizScope(req)) }, select: { id: true } });
  if (!quiz) throw httpError(404, "Quiz not found");
  return quiz;
};

export const assertMission = async (req: any, missionId: string) => {
  const mission = await prisma.mission.findFirst({
    where: { id: missionId, ...(await missionWriteScope(req)) },
    select: { id: true },
  });
  if (!mission) throw httpError(404, "Mission not found");
  return mission;
};
