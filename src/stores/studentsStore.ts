// src/stores/studentsStore.ts
import { create } from "zustand";
import { studentService } from "@/services/studentService";
import { StudentSummary, StudentDetail } from "@/types/teacher";

interface StudentsState {
  students: StudentSummary[];
  selectedStudent: StudentDetail | null;
  isLoading: boolean;
  error: string | null;
  fetchStudents: (params?: { search?: string; groupId?: string }) => Promise<void>;
  fetchStudentDetail: (id: string) => Promise<void>;
  updateStudent: (
    id: string,
    payload: Partial<{ firstName: string; lastName: string; phone: string | null; status: string }>,
  ) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
  clearSelectedStudent: () => void;
}

export const useStudentsStore = create<StudentsState>((set) => ({
  students: [],
  selectedStudent: null,
  isLoading: false,
  error: null,

  fetchStudents: async (params) => {
    set({ isLoading: true, error: null });
    try {
      const students = await studentService.getStudents(params);
      set({ students });
    } catch (error) {
      set({ error: "Failed to load students" });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchStudentDetail: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const selectedStudent = await studentService.getStudent(id);
      set({ selectedStudent });
    } catch (error) {
      set({ error: "Failed to load student" });
    } finally {
      set({ isLoading: false });
    }
  },

  updateStudent: async (id, payload) => {
    await studentService.updateStudent(id, payload);
    const status = payload.status?.toLowerCase() as "active" | "inactive" | undefined;
    set((state) => ({
      selectedStudent: state.selectedStudent
        ? {
            ...state.selectedStudent,
            student: {
              ...state.selectedStudent.student,
              ...(payload.firstName !== undefined && { firstName: payload.firstName }),
              ...(payload.lastName !== undefined && { lastName: payload.lastName }),
              ...(payload.phone !== undefined && { phone: payload.phone }),
              ...(status !== undefined && { status }),
            },
          }
        : state.selectedStudent,
      students: state.students.map((s) =>
        s.id === id
          ? {
              ...s,
              ...(payload.firstName !== undefined && { firstName: payload.firstName }),
              ...(payload.lastName !== undefined && { lastName: payload.lastName }),
              ...(payload.phone !== undefined && { phone: payload.phone }),
              ...(status !== undefined && { status }),
            }
          : s,
      ),
    }));
  },

  deleteStudent: async (id: string) => {
    await studentService.deleteStudent(id);
    set((state) => ({ students: state.students.filter((s) => s.id !== id) }));
  },

  clearSelectedStudent: () => set({ selectedStudent: null }),
}));
