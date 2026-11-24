// src/types/homework.ts
export interface Homework {
  id: string;
  title: string;
  description: string;
  maxScore: number;
  deadline: string;
  isOverdue: boolean;
  status: "active" | "closed";
}

export interface HomeworkSummary {
  id: string;
  title: string;
  /** Student view: this student's own state ("graded" since the group detail returns it). */
  status?: "submitted" | "graded" | "not_submitted" | "pending";
  deadline: string;
  isOverdue: boolean;
  score?: number | null;
  submittedAt?: string | null;
  maxScore: number;
  submittedCount?: number;
  gradedCount?: number;
}

export interface HomeworkSubmission {
  id: string;
  content?: string;
  attachmentUrl?: string;
  submittedAt?: string;
  score: number;
  feedback?: string;
  status: "submitted" | "graded";
}

export interface LessonDetailData {
  // lesson: Lesson;
  homework: Homework;
  submission: HomeworkSubmission | null;
}
