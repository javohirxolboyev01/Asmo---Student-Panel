// src/types/lesson.ts
import { HomeworkSummary } from "./homework";

export interface Lesson {
  id: string;
  topic: string;
  description?: string;
  lessonDate: string;
  lessonOrder: number;
  groupName: string;
  teacherName: string;
  status: "planned" | "completed" | "cancelled";
}

export interface LessonListItem {
  id: string;
  topic: string;
  lessonOrder: number;
  lessonDate: string;
  homework?: HomeworkSummary;
}
