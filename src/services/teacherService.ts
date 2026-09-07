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
    apiPost(`/groups/${groupId}/lessons`, payload),
  updateLesson: async (
    id: string,
    payload: Partial<{ topic: string; description: string; lessonDate: string; status: string }>,
  ) => apiPatch(`/lessons/${id}`, payload),
  deleteLesson: async (id: string) => apiDelete(`/lessons/${id}`),

  // ── Homework ──
  createHomework: async (
    lessonId: string,
    payload: { title: string; description: string; maxScore?: number; deadline: string },
  ) => apiPost(`/lessons/${lessonId}/homework`, payload),
  updateHomework: async (
    id: string,
    payload: Partial<{ title: string; description: string; maxScore: number; deadline: string; status: string }>,
  ) => apiPatch(`/homework/${id}`, payload),
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
