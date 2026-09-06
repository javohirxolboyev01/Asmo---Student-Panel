// src/services/studentService.ts — teacher-facing student management
import { apiGet, apiPost, apiPatch, apiDelete } from "./apiClient";
import { StudentSummary, StudentDetail } from "@/types/teacher";

export const studentService = {
  getStudents: async (params?: { search?: string; groupId?: string }) => {
    const query = new URLSearchParams();
    if (params?.search) query.set("search", params.search);
    if (params?.groupId) query.set("groupId", params.groupId);
    const qs = query.toString();
    const data = await apiGet<{ students: StudentSummary[] }>(`/students${qs ? `?${qs}` : ""}`);
    return data.students ?? [];
  },

  getStudent: async (id: string) => {
    const data = await apiGet<StudentDetail>(`/students/${id}`);
    return {
      ...data,
      attendance: {
        ...data.attendance,
        records: data.attendance.records.map((r) => ({
          ...r,
          status: String(r.status).toLowerCase() as StudentDetail["attendance"]["records"][number]["status"],
        })),
      },
    };
  },

  createStudent: async (payload: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) => apiPost<StudentSummary>("/students", payload),

  updateStudent: async (
    id: string,
    payload: Partial<{ firstName: string; lastName: string; phone: string | null; status: string }>,
  ) => apiPatch<StudentSummary>(`/students/${id}`, payload),

  deleteStudent: async (id: string) => apiDelete(`/students/${id}`),
};
