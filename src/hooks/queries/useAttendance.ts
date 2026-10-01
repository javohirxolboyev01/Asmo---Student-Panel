// src/hooks/queries/useAttendance.ts
import { useQuery, queryOptions } from "@tanstack/react-query";
import { attendanceService } from "@/services/attendanceService";
import { queryKeys } from "@/lib/queryClient";

export const attendanceQueryOptions = (groupId?: string | null) =>
  queryOptions({
    queryKey: queryKeys.attendance(groupId),
    queryFn: () => attendanceService.getAttendance(groupId ?? undefined),
  });

export const useAttendanceQuery = (groupId?: string | null) => useQuery(attendanceQueryOptions(groupId));
