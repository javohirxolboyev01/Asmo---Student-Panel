// src/types/attendance.ts
export interface AttendanceRecord {
  id: string;
  lessonId: string;
  lessonTopic: string;
  lessonDate: string;
  status: "present" | "absent" | "late" | "excused";
  markedAt: string;
}

export interface AttendanceSummary {
  totalLessons: number;
  present: number;
  absent: number;
  late: number;
  percentage: number;
}

export interface AttendanceData {
  summary: AttendanceSummary;
  records: AttendanceRecord[];
}
