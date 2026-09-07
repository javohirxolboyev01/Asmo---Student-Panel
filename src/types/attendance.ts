// src/types/attendance.ts
export interface AttendanceRecord {
  id: string;
  lessonId: string;
  lessonTopic: string;
  lessonDate: string;
  status: "present" | "absent";
  markedAt: string;
}

export interface AttendanceStats {
  total: number;
  present: number;
  percentage: number;
}

export interface AttendanceData {
  stats: AttendanceStats;
  records: AttendanceRecord[];
}
