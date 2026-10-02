// src/types/quiz.ts — teacher-made tests (backend: modules/quizzes).

export interface QuizQuestionInput {
  text: string;
  options: string[];
  /** Index into `options`. */
  correctIndex: number;
}

export interface QuizInput {
  title: string;
  description?: string | null;
  groupId?: string | null;
  timeLimitMin?: number | null;
  isActive?: boolean;
  questions: QuizQuestionInput[];
}

/** Staff list row. */
export interface QuizSummary {
  id: string;
  title: string;
  description: string | null;
  groupId: string | null;
  groupName: string | null;
  timeLimitMin: number | null;
  isActive: boolean;
  createdAt: string;
  questionCount: number;
  attemptCount: number;
  finishedCount: number;
  avgPercent: number | null;
}

/** Staff editor view (with correct answers). */
export interface QuizDetail {
  id: string;
  title: string;
  description: string | null;
  groupId: string | null;
  timeLimitMin: number | null;
  isActive: boolean;
  attemptCount: number;
  questions: (QuizQuestionInput & { id: string })[];
}

export interface QuizResults {
  id: string;
  title: string;
  questionCount: number;
  attempts: {
    studentId: string;
    studentName: string;
    startedAt: string;
    finishedAt: string | null;
    score: number | null;
    total: number;
    percent: number | null;
  }[];
  questions: { id: string; text: string; answered: number; correct: number }[];
}

/** Student view: questions are shuffled and carry no answers. */
export interface PlayQuestion {
  id: string;
  text: string;
  /** `index` is the original option index — that's what gets submitted. */
  options: { index: number; text: string }[];
}

export interface QuizPlay {
  id: string;
  title: string;
  description: string | null;
  timeLimitMin: number | null;
  questionCount: number;
  attempt: {
    startedAt: string;
    finishedAt: string | null;
    deadline: string | null;
    score: number | null;
    total: number;
    percent: number | null;
    questions: PlayQuestion[] | null;
  } | null;
}
