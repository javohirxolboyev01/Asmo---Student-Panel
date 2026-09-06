// src/types/teacher.ts — types for the teacher/admin panel
export interface Direction {
  id: string;
  name: string;
  color: string;
  groupsCount: number;
}

export interface TeacherProfile {
  id: string;
  fullName: string;
  avatar: string | null;
  email?: string;
  userId?: string | null;
  groupsCount: number;
}

export interface StudentGroupRef {
  id: string;
  name: string;
}

export interface StudentSummary {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  phone: string | null;
  status: "active" | "inactive";
  coinBalance: number;
  groups: StudentGroupRef[];
  attendancePercentage: number;
}

export interface AttendanceRecordEntry {
  id: string;
  userId?: string;
  lessonId: string;
  lessonTopic?: string;
  lessonDate?: string;
  groupId?: string;
  status: "present" | "absent" | "late" | "excused";
  markedAt: string;
}

export interface CoinTransactionEntry {
  id: string;
  amount: number;
  reason: string;
  createdAt: string;
}

export interface StudentSubmissionEntry {
  id: string;
  homeworkTitle: string;
  lessonTopic: string;
  score: number | null;
  maxScore: number;
  status: "submitted" | "graded";
  submittedAt: string;
}

export interface StudentDetail {
  student: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string | null;
    avatar: string | null;
    status: "active" | "inactive";
    coinBalance: number;
    createdAt: string;
  };
  groups: StudentGroupRef[];
  attendance: {
    stats: { total: number; present: number; percentage: number };
    records: AttendanceRecordEntry[];
  };
  coinTransactions: CoinTransactionEntry[];
  payments: TeacherPayment[];
  submissions: StudentSubmissionEntry[];
}

export interface TeacherPayment {
  id: string;
  orderNumber: number;
  amountNumber: number;
  status: "paid" | "pending" | "overdue" | "cancelled";
  paymentType: string;
  paidAt: string | null;
  teacherName: string;
  description?: string;
  receiptNumber?: string;
  userId?: string;
  studentName?: string;
}

export interface LessonRosterEntry {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  attendanceStatus: "present" | "absent" | "late" | "excused" | null;
  submission: {
    id: string;
    content?: string | null;
    attachmentUrl?: string | null;
    submittedAt?: string;
    score: number;
    feedback?: string | null;
    status: "submitted" | "graded";
  } | null;
}

export interface TeacherDashboardData {
  user: { id: string; firstName: string; lastName: string; email: string; avatar: string | null };
  stats: {
    groupsCount: number;
    studentsCount: number;
    todayLessonsCount: number;
    pendingGradingCount: number;
  };
  upcomingLessons: { id: string; topic: string; lessonDate: string; time: string; groupName: string }[];
}

export interface TeacherCoinTransaction {
  id: string;
  userId: string;
  studentName: string;
  amount: number;
  reason: string;
  createdAt: string;
}

export interface SubmissionWithContext {
  id: string;
  content: string | null;
  attachmentUrl: string | null;
  submittedAt: string;
  score: number | null;
  feedback: string | null;
  status: "submitted" | "graded";
  student: { id: string; firstName: string; lastName: string; avatar: string | null };
  homework: { id: string; title: string; description?: string; maxScore: number; deadline: string };
  lesson: { id: string; topic: string; groupId: string; groupName: string };
}

export interface WeeklyAttendanceLesson {
  id: string;
  topic: string;
  lessonDate: string;
}

export interface WeeklyAttendanceStudent {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  coinBalance: number;
  attendance: Record<string, "present" | "absent" | "late" | "excused">;
}

export interface WeeklyAttendanceData {
  weekStart: string;
  weekEnd: string;
  lessons: WeeklyAttendanceLesson[];
  roster: WeeklyAttendanceStudent[];
}
