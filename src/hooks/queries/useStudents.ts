// src/hooks/queries/useStudents.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { studentService } from "@/services/studentService";
import { queryKeys } from "@/lib/queryClient";

export const useStudentsQuery = (
  params?: { search?: string; groupId?: string },
  enabled = true,
) =>
  useQuery({
    queryKey: queryKeys.students(params),
    queryFn: () => studentService.getStudents(params),
    enabled,
  });

export const useStudentDetailQuery = (id: string | undefined) =>
  useQuery({
    queryKey: queryKeys.studentDetail(id ?? ""),
    queryFn: () => studentService.getStudent(id as string),
    enabled: !!id,
  });

export const useCreateStudentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof studentService.createStudent>[0]) =>
      studentService.createStudent(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["students"] }),
  });
};

export const useUpdateStudentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      payload,
    }: {
      id: string;
      payload: Parameters<typeof studentService.updateStudent>[1];
    }) => studentService.updateStudent(id, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["students"] }),
  });
};

export const useDeleteStudentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => studentService.deleteStudent(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["students"] }),
  });
};
