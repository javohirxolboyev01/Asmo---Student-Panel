// src/pages/GroupDetailPage.tsx
import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useGroupStore } from "@/stores/groupStore";
import {
  ArrowLeft,
  Users,
  Calendar,
  Clock,
  Play,
  FileText,
} from "lucide-react";

import { formatDate } from "@/utilist/formatData";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { StatusBadge } from "@/components/common/StatusBadge";

export const GroupDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    selectedGroup,
    lessons,
    isLoading,
    error,
    fetchGroupDetail,
    clearSelectedGroup,
  } = useGroupStore();
  const [activeTab, setActiveTab] = useState<"lessons" | "students" | "stats">(
    "lessons",
  );

  useEffect(() => {
    if (id) {
      fetchGroupDetail(id);
    }
    return () => {
      clearSelectedGroup();
    };
  }, [id, fetchGroupDetail, clearSelectedGroup]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Yuklanmoqda..." />
      </div>
    );
  }

  if (error || !selectedGroup) {
    return (
      <div className="card p-8 text-center">
        <p className="text-red-500">{error || "Guruh topilmadi"}</p>
        <button
          onClick={() => navigate("/groups")}
          className="btn-primary mt-4"
        >
          Guruhlarga qaytish
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Back */}
      <Link
        to="/groups"
        className="inline-flex items-center gap-2 text-gray-500 hover:text-[#2D6BFF] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">Guruhlarga qaytish</span>
      </Link>

      {/* Header */}
      <div className="card">
        <div className="p-5 md:p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-[#1A1D26]">
                  {selectedGroup.name}
                </h1>
                <span className="text-xs font-medium px-2.5 py-1 bg-[#E8F5E9] text-[#2E7D32] rounded-full">
                  Faol
                </span>
              </div>
              <p className="text-gray-500 text-sm">
                {selectedGroup.courseName}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
              <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full">
                <Users className="w-4 h-4" />
                <span>
                  {selectedGroup.studentCount}/{selectedGroup.maxStudents}
                </span>
              </div>
              <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full">
                <Calendar className="w-4 h-4" />
                <span>{selectedGroup.schedule.days.join(", ")}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full">
                <Clock className="w-4 h-4" />
                <span>{selectedGroup.schedule.time}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white rounded-2xl p-1 border border-gray-100">
        {(["lessons", "students", "stats"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={cn(
              "flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
              activeTab === tab
                ? "bg-[#2D6BFF] text-white shadow-sm"
                : "text-gray-500 hover:text-[#1A1D26]",
            )}
          >
            {tab === "lessons" && "Darslar"}
            {tab === "students" && "Studentlar"}
            {tab === "stats" && "Statistika"}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === "lessons" && (
        <div className="card">
          <div className="p-0 overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
                    Mavzu
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4 hidden md:table-cell">
                    Holati
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4 hidden sm:table-cell">
                    Muddat
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4">
                    Sana
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-3 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {lessons.map((lesson) => (
                  <tr
                    key={lesson.id}
                    className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <Link
                        to={`/lessons/${lesson.id}`}
                        className="font-medium text-[#1A1D26] hover:text-[#2D6BFF] transition-colors"
                      >
                        {lesson.topic}
                      </Link>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      {lesson.homework ? (
                        <StatusBadge status={lesson.homework.status} />
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 hidden sm:table-cell">
                      {lesson.homework ? (
                        <span
                          className={cn(
                            "text-sm",
                            lesson.homework.isOverdue
                              ? "text-red-500 font-medium"
                              : "text-gray-500",
                          )}
                        >
                          {formatDate(lesson.homework.deadline)}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-gray-500">
                        {formatDate(lesson.lessonDate)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <Link
                        to={`/lessons/${lesson.id}`}
                        className="inline-flex items-center gap-1 text-sm text-[#2D6BFF] hover:text-[#1A56E8] transition-colors"
                      >
                        <span className="hidden sm:inline">Ko'rish</span>
                        <Play className="w-4 h-4" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "students" && (
        <div className="card p-8 text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Studentlar ro'yxati</p>
          <p className="text-sm text-gray-400 mt-1">Tez orada qo'shiladi</p>
        </div>
      )}

      {activeTab === "stats" && (
        <div className="card p-8 text-center">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Guruh statistikasi</p>
          <p className="text-sm text-gray-400 mt-1">Tez orada qo'shiladi</p>
        </div>
      )}
    </div>
  );
};
