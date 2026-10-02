// src/services/quizService.ts
import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "./apiClient";
import type { QuizDetail, QuizInput, QuizPlay, QuizResults, QuizSummary } from "@/types/quiz";

export const quizService = {
  // student
  play: (id: string) => apiGet<QuizPlay>(`/quizzes/${id}/play`),
  start: (id: string) => apiPost<QuizPlay>(`/quizzes/${id}/start`, {}),
  submit: (id: string, answers: Record<string, number>) => apiPost<QuizPlay>(`/quizzes/${id}/submit`, { answers }),
  /** Autosave while answering; a timed-out attempt is scored on these. */
  saveAnswers: (id: string, answers: Record<string, number>) => apiPut<void>(`/quizzes/${id}/answers`, { answers }),

  // staff
  list: () => apiGet<QuizSummary[]>("/quizzes"),
  get: (id: string) => apiGet<QuizDetail>(`/quizzes/${id}`),
  results: (id: string) => apiGet<QuizResults>(`/quizzes/${id}/results`),
  create: (input: QuizInput) => apiPost<{ id: string }>("/quizzes", input),
  update: (id: string, input: QuizInput) => apiPut<{ id: string }>(`/quizzes/${id}`, input),
  setActive: (id: string, isActive: boolean) => apiPatch<{ id: string }>(`/quizzes/${id}/active`, { isActive }),
  remove: (id: string) => apiDelete<void>(`/quizzes/${id}`),
};
