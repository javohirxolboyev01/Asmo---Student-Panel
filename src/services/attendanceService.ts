// src/services/attendanceService.ts
import { apiGet } from "./apiClient";
import { AttendanceData } from "@/types/attendance";
import { normalizeAttendanceRecord } from "./normalizers";

interface RawAttendanceData {
  records?: unknown[];
  stats?: { total?: number; present?: number; percentage?: number };
}

export const attendanceService = {
  getAttendance: async (groupId?: string): Promise<AttendanceData> => {
    const query = groupId ? `?groupId=${encodeURIComponent(groupId)}` : "";
    const data = await apiGet<RawAttendanceData>(`/attendance${query}`);
    const records = ((data.records ?? []) as Parameters<typeof normalizeAttendanceRecord>[0][]).map(
      normalizeAttendanceRecord,
    );
    return {
      records,
      stats: {
        total: data.stats?.total ?? records.length,
        present: data.stats?.present ?? records.filter((r) => r.status === "present").length,
        percentage: data.stats?.percentage ?? 0,
      },
    };
  },
};
