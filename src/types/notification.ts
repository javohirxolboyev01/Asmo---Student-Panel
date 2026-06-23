// src/types/notification.ts
export interface Notification {
  id: string;
  title: string;
  message: string;
  type: "homework" | "lesson" | "grade" | "system";
  isRead: boolean;
  createdAt: string;
}

export interface DashboardData {
  activeCourse: {
    groupId: string;
    groupName: string;
    courseName: string;
    directionName: string;
    directionColor: string;
    totalLessons: number;
    completedLessons: number;
    progress: number;
    nextLessonDate: string;
    teacherName: string;
  };
  attendance: {
    thisWeek: {
      total: number;
      present: number;
      absent: number;
      percentage: number;
    };
  };
  coins: {
    balance: number;
    thisMonth: number;
  };
  upcomingLessons: Array<{
    id: string;
    time: string;
    groupName: string;
    topic: string;
  }>;
  notifications: Notification[];
}
