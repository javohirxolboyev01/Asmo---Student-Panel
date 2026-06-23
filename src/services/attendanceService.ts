// src/services/attendanceService.ts
import api from "./api";

export const attendanceService = {
  getAttendance: async () => {
    const response = await api.get("/attendance.json");
    return response.data;
  },
};
