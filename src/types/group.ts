// src/types/group.ts
export interface Direction {
  id: string;
  name: string;
  color: string;
}

export interface Teacher {
  id: string;
  fullName: string;
  avatar: string;
}

export interface Group {
  id: string;
  name: string;
  direction?: Direction;
  teacher?: Teacher;
  studentCount?: number;
  status: "active" | "completed";
  // Staff list extras (2026-10): schedule + capacity for the group cards.
  courseName?: string | null;
  maxStudents?: number;
  schedule?: { days: string[]; time: string };
  studentsPreview?: { id: string; firstName: string; lastName: string; avatar: string | null }[];
}

export interface GroupDetail {
  id: string;
  name: string;
  courseName: string;
  directionName: string;
  teacherName: string;
  studentCount: number;
  maxStudents: number;
  schedule: {
    days: string[];
    time: string;
  };
  status?: "active" | "completed";
  directionId?: string;
  directionColor?: string;
  teacherId?: string;
}
