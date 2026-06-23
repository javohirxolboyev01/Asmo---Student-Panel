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
  status: "submitted" | "not_submitted" | "pending";
  deadline: string;
  isOverdue: boolean;
  score: number;
  maxScore: number;
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
