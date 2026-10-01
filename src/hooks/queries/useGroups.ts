// src/hooks/queries/useGroups.ts
import { useMutation, useQuery, useQueryClient, queryOptions } from "@tanstack/react-query";
import { groupService } from "@/services/groupService";
import { teacherService } from "@/services/teacherService";
import { queryKeys } from "@/lib/queryClient";

export const groupsQueryOptions = () =>
  queryOptions({ queryKey: queryKeys.groups, queryFn: groupService.getGroups });

export const useGroupsQuery = () => useQuery(groupsQueryOptions());

export const useGroupDetailQuery = (id: string | undefined) =>
  useQuery({
    queryKey: queryKeys.groupDetail(id ?? ""),
    queryFn: () => groupService.getGroupDetail(id as string),
    enabled: !!id,
  });

export const useCreateGroupMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof teacherService.createGroup>[0]) =>
      teacherService.createGroup(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.groups }),
  });
};

export const useUpdateGroupMutation = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof teacherService.updateGroup>[1]) =>
      teacherService.updateGroup(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groups });
      queryClient.invalidateQueries({ queryKey: queryKeys.groupDetail(id) });
    },
  });
};

export const useDeleteGroupMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => teacherService.deleteGroup(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.groups }),
  });
};

export const useCreateLessonMutation = (groupId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Parameters<typeof teacherService.createLesson>[1]) =>
      teacherService.createLesson(groupId, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.groupDetail(groupId) }),
  });
};

// groupId va userId har ikkalasi ham chaqiruvchi sahifaga qarab o'zgarishi
// mumkin (GroupDetailPage'da groupId qat'iy, StudentDetailPage'da userId
// qat'iy) — shuning uchun ikkalasi ham mutation argumenti sifatida qabul
// qilinadi, biriktirilgan hook parametri emas.
export const useEnrollStudentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, userId }: { groupId: string; userId: string }) =>
      teacherService.enrollStudent(groupId, userId),
    onSuccess: (_data, { groupId, userId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groupDetail(groupId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.studentDetail(userId) });
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
};

export const useUnenrollStudentMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ groupId, userId }: { groupId: string; userId: string }) =>
      teacherService.unenrollStudent(groupId, userId),
    onSuccess: (_data, { groupId, userId }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.groupDetail(groupId) });
      queryClient.invalidateQueries({ queryKey: queryKeys.studentDetail(userId) });
      queryClient.invalidateQueries({ queryKey: ["students"] });
    },
  });
};
