// src/services/lessonService.ts
import { apiGet, apiPost } from "./apiClient";
import { useAuthStore } from "@/stores/authStore";
import { groupService } from "./groupService";
import { LessonRosterEntry } from "@/types/teacher";

interface RawLessonInfo {
  id: string;
  groupId: string;
  topic: string;
  description: string | null;
  lessonDate: string;
  lessonOrder: number;
  groupName: string;
  teacherName: string;
  status: string;
}

interface RawHomeworkInfo {
  id: string;
  title: string;
  description: string | null;
  maxScore: number;
  deadline: string;
  isOverdue: boolean;
  status: string;
}

interface RawSubmissionInfo {
  id: string;
  content: string;
  attachmentUrl: string | null;
  submittedAt: string;
  score: number | null;
  feedback: string | null;
  status: string;
}

interface RawRosterEntry {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  attendanceStatus: string | null;
  submission: RawSubmissionInfo | null;
}

interface RawLessonResponse {
  lesson: RawLessonInfo;
  homework: RawHomeworkInfo | null;
  submission?: RawSubmissionInfo | null;
  roster?: RawRosterEntry[];
}

const mapHomework = (hw: RawHomeworkInfo) => ({
  id: hw.id,
  title: hw.title,
  description: hw.description ?? "",
  maxScore: hw.maxScore,
  deadline: hw.deadline,
  isOverdue: hw.isOverdue,
  status: hw.status as "active" | "closed",
});

const mapSubmission = (s: RawSubmissionInfo) => ({
  id: s.id,
  content: s.content,
  attachmentUrl: s.attachmentUrl ?? undefined,
  submittedAt: s.submittedAt,
  score: s.score ?? 0,
  feedback: s.feedback ?? undefined,
  status: s.status.toLowerCase() as "submitted" | "graded",
});

const isTeacherRole = () => {
  const role = useAuthStore.getState().user?.role;
  return role === "teacher" || role === "admin";
};

export const lessonService = {
  getLesson: async (id: string) => {
    const raw = await apiGet<RawLessonResponse>(`/lessons/${id}`);
    const isTeacher = isTeacherRole();

    let teacherName = raw.lesson.teacherName;
    if (!teacherName) {
      try {
        const groupDetail = await groupService.getGroupDetail(raw.lesson.groupId);
        teacherName = groupDetail.group.teacherName;
      } catch {
        // cosmetic fallback — ignore failures
      }
    }

    const roster: LessonRosterEntry[] | undefined = isTeacher
      ? (raw.roster ?? []).map((entry) => ({
          id: entry.id,
          firstName: entry.firstName,
          lastName: entry.lastName,
          avatar: entry.avatar,
          attendanceStatus: entry.attendanceStatus as LessonRosterEntry["attendanceStatus"],
          submission: entry.submission ? mapSubmission(entry.submission) : null,
        }))
      : undefined;

    return {
      lesson: { ...raw.lesson, teacherName, description: raw.lesson.description ?? undefined },
      homework: raw.homework ? mapHomework(raw.homework) : null,
      submission: raw.submission ? mapSubmission(raw.submission) : isTeacher ? undefined : null,
      roster,
    };
  },

  submitHomework: async (homeworkId: string, content: string, attachmentUrl?: string) => {
    return apiPost(`/homework/${homeworkId}/submit`, { content, attachmentUrl });
  },
};
