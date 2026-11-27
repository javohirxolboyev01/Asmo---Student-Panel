// src/services/teacherService.ts — admin/teacher management endpoints
import { apiGet, apiPost, apiPatch, apiDelete } from "./apiClient";
import {
  Direction,
  TeacherProfile,
  TeacherDashboardData,
  TeacherCoinTransaction,
  SubmissionWithContext,
  WeeklyAttendanceData,
} from "@/types/teacher";

/**
 * Date pickers give wall-clock values ("2026-11-27T14:00") with no zone. Sent
 * like that, the server reads them in ITS zone (UTC on Railway) and a 14:00
 * lesson becomes 19:00. Converted here, in the teacher's own zone, to a real
 * instant. Values that already carry a zone pass through untouched.
 */
const withZone = <T extends Record<string, unknown>>(payload: T, key: string): T => {
  const value = payload[key];
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d+)?)?$/.test(value)) return payload;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? payload : { ...payload, [key]: date.toISOString() };
};
import { Group } from "@/types/group";

interface GroupWritePayload {
  name: string;
  courseName: string;
  directionId: string;
  teacherId: string;
  maxStudents?: number;
  scheduleDays: string;
  scheduleTime: string;
}

export const teacherService = {
  // ── Dashboard ──
  getDashboard: async () => apiGet<TeacherDashboardData>("/dashboard"),

  // ── Directions ──
  getDirections: async () => {
    const data = await apiGet<{ directions: Direction[] }>("/directions");
    return data.directions ?? [];
  },
  createDirection: async (payload: { name: string; color?: string }) =>
    apiPost<Direction>("/directions", payload),
  updateDirection: async (id: string, payload: { name?: string; color?: string }) =>
    apiPatch<Direction>(`/directions/${id}`, payload),
  deleteDirection: async (id: string) => apiDelete(`/directions/${id}`),

  // ── Teachers ──
  getTeachers: async () => {
    const data = await apiGet<{ teachers: TeacherProfile[] }>("/teachers");
    return data.teachers ?? [];
  },
  createTeacher: async (payload: { fullName: string; avatar?: string; email?: string; password?: string }) =>
    apiPost<TeacherProfile>("/teachers", payload),
  updateTeacher: async (id: string, payload: { fullName?: string; avatar?: string }) =>
    apiPatch<TeacherProfile>(`/teachers/${id}`, payload),
  deleteTeacher: async (id: string) => apiDelete(`/teachers/${id}`),

  // ── Groups ──
  createGroup: async (payload: GroupWritePayload) => apiPost<Group>("/groups", payload),
  updateGroup: async (id: string, payload: Partial<GroupWritePayload> & { status?: string }) =>
    apiPatch<Group>(`/groups/${id}`, payload),
  deleteGroup: async (id: string) => apiDelete(`/groups/${id}`),
  enrollStudent: async (groupId: string, userId: string) =>
    apiPost(`/groups/${groupId}/students`, { userId }),
  unenrollStudent: async (groupId: string, userId: string) =>
    apiDelete(`/groups/${groupId}/students/${userId}`),

  // ── Lessons ──
  createLesson: async (groupId: string, payload: { topic: string; description?: string; lessonDate: string }) =>
    apiPost(`/groups/${groupId}/lessons`, withZone(payload, "lessonDate")),
  updateLesson: async (
    id: string,
    payload: Partial<{ topic: string; description: string; lessonDate: string; status: string }>,
  ) => apiPatch(`/lessons/${id}`, withZone(payload, "lessonDate")),
  deleteLesson: async (id: string) => apiDelete(`/lessons/${id}`),

  // ── Homework ──
  createHomework: async (
    lessonId: string,
    payload: { title: string; description: string; maxScore?: number; deadline: string },
  ) => apiPost(`/lessons/${lessonId}/homework`, withZone(payload, "deadline")),
  updateHomework: async (
    id: string,
    payload: Partial<{ title: string; description: string; maxScore: number; deadline: string; status: string }>,
  ) => apiPatch(`/homework/${id}`, withZone(payload, "deadline")),
  deleteHomework: async (id: string) => apiDelete(`/homework/${id}`),
  gradeSubmission: async (submissionId: string, payload: { score: number; feedback?: string }) =>
    apiPatch(`/submissions/${submissionId}/grade`, payload),

  // ── Attendance ──
  saveAttendance: async (lessonId: string, records: { userId: string; status: string }[]) =>
    apiPost(`/lessons/${lessonId}/attendance`, { records }),
  getWeeklyAttendance: async (groupId: string, date?: string) => {
    const query = date ? `?date=${encodeURIComponent(date)}` : "";
    return apiGet<WeeklyAttendanceData>(`/groups/${groupId}/attendance/week${query}`);
  },

  // ── Coins ──
  getTeacherCoins: async () => {
    const data = await apiGet<{ transactions: TeacherCoinTransaction[] }>("/coins");
    return data.transactions ?? [];
  },
  awardCoins: async (studentId: string, payload: { amount: number; reason: string }) =>
    apiPost<{ balance: number }>(`/students/${studentId}/coins`, payload),

  // ── Submissions (grading) ──
  getPendingSubmissions: async () => {
    const data = await apiGet<{ submissions: SubmissionWithContext[] }>("/submissions?status=submitted");
    return data.submissions ?? [];
  },
  getSubmission: async (id: string) => apiGet<SubmissionWithContext>(`/submissions/${id}`),
};
