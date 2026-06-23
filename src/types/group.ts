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
  direction: Direction;
  teacher: Teacher;
  studentCount: number;
  status: "active" | "completed";
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
}
