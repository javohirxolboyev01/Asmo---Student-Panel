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
  /** Coins for finishing with ≥ passPercent % (0 = none). */
  coinReward?: number;
  passPercent?: number;
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
  coinReward: number;
  passPercent: number;
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
  coinReward: number;
  passPercent: number;
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
    coins: number;
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
  coinReward: number;
  passPercent: number;
  attempt: {
    startedAt: string;
    finishedAt: string | null;
    deadline: string | null;
    score: number | null;
    total: number;
    percent: number | null;
    /** Coins paid when it finished (0 = below passPercent / no reward). */
    coins: number;
    questions: PlayQuestion[] | null;
  } | null;
}

/** Student's test list row (GET /quizzes/mine). */
export interface MyQuiz {
  id: string;
  title: string;
  description: string | null;
  groupName: string | null;
  timeLimitMin: number | null;
  questionCount: number;
  coinReward: number;
  passPercent: number;
  createdAt: string;
  status: "new" | "running" | "finished";
  percent: number | null;
  coins: number;
}
