// src/types/notification.ts
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "homework" | "lesson" | "grade" | "system" | "submission";
  isRead: boolean;
  createdAt: string;
}

// Haqiqiy backend /dashboard javobi (guruh/dars maydonlari hali aniq hujjatlanmagan
// bo'lgani uchun keng qamrovli, ixtiyoriy maydonlar bilan yozilgan).
export interface DashboardGroup {
  id: string;
  name?: string;
  groupName?: string;
  courseName?: string;
  directionName?: string;
  directionColor?: string;
  totalLessons?: number;
  completedLessons?: number;
  progress?: number;
  nextLessonDate?: string;
  teacherName?: string;
  [key: string]: unknown;
}

export interface DashboardTransaction {
  id: string;
  amount: number;
  reason?: string;
  description?: string;
  createdAt?: string;
  date?: string;
  [key: string]: unknown;
}

export interface DashboardUpcomingLesson {
  id: string;
  topic?: string;
  lessonDate?: string;
  time?: string;
  groupName?: string;
  [key: string]: unknown;
}

export interface DashboardData {
  user: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatar: string | null;
  };
  groups: DashboardGroup[];
  coinBalance: number;
  recentTransactions: DashboardTransaction[];
  unreadNotifications: number;
  upcomingLessons: DashboardUpcomingLesson[];
}
