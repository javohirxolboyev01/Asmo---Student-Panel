// src/hooks/queries/useLessons.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { lessonService } from "@/services/lessonService";
import { teacherService } from "@/services/teacherService";
import { queryKeys } from "@/lib/queryClient";

export const useLessonDetailQuery = (id: string | undefined) =>
  useQuery({
    queryKey: queryKeys.lesson(id ?? ""),
    queryFn: () => lessonService.getLesson(id as string),
    enabled: !!id,
  });

export const useSubmitHomeworkMutation = (lessonId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      homeworkId,
      content,
      attachmentUrl,
    }: {
      homeworkId: string;
      content: string;
      attachmentUrl?: string;
    }) => lessonService.submitHomework(homeworkId, content, attachmentUrl),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.lesson(lessonId) }),
  });
};

export const useCreateHomeworkMutation = (lessonId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof teacherService.createHomework>[1]) =>
      teacherService.createHomework(lessonId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.lesson(lessonId) }),
  });
};
