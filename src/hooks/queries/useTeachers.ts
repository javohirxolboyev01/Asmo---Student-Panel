// src/hooks/queries/useTeachers.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { teacherService } from "@/services/teacherService";
import { queryKeys } from "@/lib/queryClient";

export const useTeachersQuery = (enabled = true) =>
  useQuery({
    queryKey: queryKeys.teachers,
    queryFn: teacherService.getTeachers,
    enabled,
  });

export const useCreateTeacherMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof teacherService.createTeacher>[0]) =>
      teacherService.createTeacher(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.teachers }),
  });
};

export const useUpdateTeacherMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Parameters<typeof teacherService.updateTeacher>[1];
    }) => teacherService.updateTeacher(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.teachers }),
  });
};

export const useDeleteTeacherMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => teacherService.deleteTeacher(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.teachers }),
  });
};
