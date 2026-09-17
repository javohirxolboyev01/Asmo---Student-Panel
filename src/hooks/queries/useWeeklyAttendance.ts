// src/hooks/queries/useWeeklyAttendance.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { teacherService } from "@/services/teacherService";
import { queryKeys } from "@/lib/queryClient";

export const useWeeklyAttendanceQuery = (groupId: string, date?: string | null) =>
  useQuery({
    queryKey: queryKeys.weeklyAttendance(groupId, date),
    queryFn: () => teacherService.getWeeklyAttendance(groupId, date ?? undefined),
    enabled: !!groupId,
  });

export const useSaveAttendanceMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      lessonId,
      records,
    }: {
      lessonId: string;
      records: { userId: string; status: string }[];
    }) => teacherService.saveAttendance(lessonId, records),
    onSuccess: (_data, _vars, _ctx) => {
      queryClient.invalidateQueries({ queryKey: ["attendance", "weekly"] });
    },
  });
};
