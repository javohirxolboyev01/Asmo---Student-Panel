// src/hooks/queries/useAttendance.ts
import { useQuery } from "@tanstack/react-query";
import { attendanceService } from "@/services/attendanceService";
import { queryKeys } from "@/lib/queryClient";

export const useAttendanceQuery = (groupId?: string | null) =>
  useQuery({
    queryKey: queryKeys.attendance(groupId),
    queryFn: () => attendanceService.getAttendance(groupId ?? undefined),
  });
