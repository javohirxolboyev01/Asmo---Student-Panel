// src/hooks/queries/useSubmissions.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { teacherService } from "@/services/teacherService";
import { queryKeys } from "@/lib/queryClient";

export const usePendingSubmissionsQuery = () =>
  useQuery({
    queryKey: queryKeys.pendingSubmissions,
    queryFn: teacherService.getPendingSubmissions,
  });

export const useSubmissionDetailQuery = (id: string | undefined) =>
  useQuery({
    queryKey: queryKeys.submissionDetail(id ?? ""),
    queryFn: () => teacherService.getSubmission(id as string),
    enabled: !!id,
  });

export const useGradeSubmissionMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Parameters<typeof teacherService.gradeSubmission>[1];
    }) => teacherService.gradeSubmission(id, payload),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.pendingSubmissions });
      queryClient.invalidateQueries({ queryKey: queryKeys.submissionDetail(id) });
    },
  });
};
