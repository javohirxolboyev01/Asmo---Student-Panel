// src/services/groupService.ts
import { apiGet } from "./apiClient";
import { Group, GroupDetail } from "@/types/group";
import { LessonListItem } from "@/types/lesson";
import { StudentSummary } from "@/types/teacher";

interface RawStaffStudent {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  phone: string | null;
  role?: string;
  status: string;
  coinBalance: number;
}

interface GroupDetailResponse {
  group: GroupDetail;
  lessons: LessonListItem[];
  students?: RawStaffStudent[];
}

const toStudentSummary = (student: RawStaffStudent): StudentSummary => ({
  id: student.id,
  firstName: student.firstName,
  lastName: student.lastName,
  avatar: student.avatar,
  phone: student.phone,
  status: (student.status?.toLowerCase() as "active" | "inactive") ?? "active",
  coinBalance: student.coinBalance ?? 0,
  groups: [],
  attendancePercentage: 0,
});

export const groupService = {
  getGroups: async () => {
    const data = await apiGet<Group[] | { groups: Group[] }>("/groups");
    const groups = Array.isArray(data) ? data : data.groups ?? [];
    return groups.map((group) => ({
      ...group,
      status: (String(group.status).toLowerCase() as Group["status"]) || "active",
    }));
  },

  getGroupDetail: async (id: string) => {
    const data = await apiGet<GroupDetailResponse>(`/groups/${id}`);
    return {
      group: data.group,
      lessons: data.lessons ?? [],
      students: data.students?.map(toStudentSummary),
    };
  },
};
