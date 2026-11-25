// src/hooks/queries/useQuizzes.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { quizService } from "@/services/quizService";
import { queryKeys } from "@/lib/queryClient";
import type { QuizInput, QuizPlay } from "@/types/quiz";

// ── Student ──

/** The student's tests: open ones first, then finished (with score + coins). */
export const useMyQuizzesQuery = () =>
  useQuery({ queryKey: queryKeys.myQuizzes, queryFn: quizService.mine });

export const useQuizPlayQuery = (id: string | undefined) =>
  useQuery({
    queryKey: queryKeys.quizPlay(id ?? ""),
    queryFn: () => quizService.play(id!),
    enabled: Boolean(id),
    // The attempt is live state (timer, finished or not) — never show a stale copy.
    staleTime: 0,
  });

const usePlayMutation = <TArgs,>(id: string, fn: (args: TArgs) => Promise<QuizPlay>) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (play) => {
      queryClient.setQueryData(queryKeys.quizPlay(id), play);
      if (play.attempt?.finishedAt) {
        // The test list shows the result; a passed test pays coins.
        queryClient.invalidateQueries({ queryKey: queryKeys.myQuizzes });
        if (play.attempt.coins > 0) {
          queryClient.invalidateQueries({ queryKey: queryKeys.dashboard, exact: true });
          queryClient.invalidateQueries({ queryKey: queryKeys.coins });
        }
      } else {
        // Started: the list shows it as "in progress".
        queryClient.invalidateQueries({ queryKey: queryKeys.myQuizzes });
      }
    },
    // e.g. "already finished" from another tab — show the server's state.
    onError: () => queryClient.invalidateQueries({ queryKey: queryKeys.quizPlay(id) }),
  });
};

export const useStartQuizMutation = (id: string) => usePlayMutation(id, () => quizService.start(id));

export const useSubmitQuizMutation = (id: string) =>
  usePlayMutation(id, (answers: Record<string, number>) => quizService.submit(id, answers));

// ── Staff ──

export const useQuizzesQuery = (enabled = true) =>
  useQuery({ queryKey: queryKeys.quizzes, queryFn: quizService.list, enabled });

export const useQuizDetailQuery = (id: string | undefined) =>
  useQuery({
    queryKey: queryKeys.quizDetail(id ?? ""),
    queryFn: () => quizService.get(id!),
    enabled: Boolean(id),
    // The editor must start from the current test (active flag, attempt lock),
    // never a cached copy; dropping it on unmount also keeps the answer key
    // out of memory.
    gcTime: 0,
    refetchOnMount: "always",
  });

export const useQuizResultsQuery = (id: string | undefined) =>
  useQuery({
    queryKey: queryKeys.quizResults(id ?? ""),
    queryFn: () => quizService.results(id!),
    enabled: Boolean(id),
  });

const useQuizMutation = <TArgs, TResult>(fn: (args: TArgs) => Promise<TResult>) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["quizzes"] }),
  });
};

export const useSaveQuizMutation = () =>
  useQuizMutation(({ id, input }: { id?: string; input: QuizInput }) =>
    id ? quizService.update(id, input) : quizService.create(input),
  );

export const useSetQuizActiveMutation = () =>
  useQuizMutation(({ id, isActive }: { id: string; isActive: boolean }) => quizService.setActive(id, isActive));

export const useDeleteQuizMutation = () => useQuizMutation((id: string) => quizService.remove(id));
