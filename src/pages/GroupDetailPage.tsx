// src/pages/GroupDetailPage.tsx
import { cn } from "@/lib/utils";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { formatDate } from "@/utilist/formatData";
import { useGroupStore } from "@/stores/groupStore";
import { StatusBadge } from "@/components/common/StatusBadge";
import { useParams, Link, useNavigate } from "react-router-dom";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

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

  useEffect(() => {
    if (id) fetchGroupDetail(id);
    return () => clearSelectedGroup();
  }, [id, fetchGroupDetail, clearSelectedGroup]);

  if (isLoading) {
    return <LoadingSpinner text="Yuklanmoqda..." />;
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
    <div className="space-y-4 md:space-y-5">
      {/* ── Back ── */}
      <Link
        to="/groups"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-[#2D6BFF] transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">Guruhlarga qaytish</span>
      </Link>

      {/* ── Group header card ── */}
      {/* <div className="card p-5">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-lg font-semibold text-[#1A1D26]">
                {selectedGroup.name}
              </h1>
              <span className="text-xs font-medium px-2.5 py-1 bg-[#E8F5E9] text-[#2E7D32] rounded-full">
                Faol
              </span>
            </div>
            <p className="text-sm text-gray-400">{selectedGroup.courseName}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
            <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full">
              <Users className="w-3.5 h-3.5" />
              <span>
                {selectedGroup.studentCount}/{selectedGroup.maxStudents}
              </span>
            </div>
            <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full">
              <Calendar className="w-3.5 h-3.5" />
              <span>{selectedGroup.schedule.days.join(", ")}</span>
            </div>
            <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full">
              <Clock className="w-3.5 h-3.5" />
              <span>{selectedGroup.schedule.time}</span>
            </div>
          </div>
        </div>
      </div> */}

      {/* ── Lessons list ── */}
      <div className="space-y-3">
        {lessons.length === 0 ? (
          <div className="card p-10 text-center">
            <p className="text-sm text-gray-400">Darslar topilmadi</p>
          </div>
        ) : (
          lessons.map((lesson) => (
            <Link
              key={lesson.id}
              to={`/lessons/${lesson.id}`}
              className="card block hover:shadow-md transition-shadow duration-200"
            >
              {/* ── Row: Mavzu ── */}
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100">
                <span className="text-sm font-semibold text-[#1A1D26]">
                  Mavzular
                </span>
                <span className="text-sm text-gray-700 font-medium text-right max-w-[60%] truncate">
                  {lesson.topic}
                </span>
              </div>

              {/* ── Row: Uyga vazifa holati ── */}
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100">
                <span className="text-sm font-semibold text-[#1A1D26]">
                  Uyga vazifa holati
                </span>
                {lesson.homework ? (
                  <StatusBadge status={lesson.homework.status} />
                ) : (
                  <span className="text-sm text-gray-400">—</span>
                )}
              </div>

              {/* ── Row: Uyga vazifa tugash vaqti ── */}
              <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100">
                <span className="text-sm font-semibold text-[#1A1D26]">
                  Uyga vazifa tugash vaqti
                </span>
                {lesson.homework?.deadline ? (
                  <span
                    className={cn(
                      "text-sm font-medium",
                      lesson.homework.isOverdue
                        ? "text-red-500"
                        : "text-gray-600",
                    )}
                  >
                    {formatDate(lesson.homework.deadline)}
                  </span>
                ) : (
                  <span className="text-sm text-gray-400">—</span>
                )}
              </div>

              {/* ── Row: Dars sanasi ── */}
              <div className="flex items-center justify-between px-4 py-3.5">
                <span className="text-sm font-semibold text-[#1A1D26]">
                  Dars sanasi
                </span>
                <span className="text-sm text-gray-600">
                  {formatDate(lesson.lessonDate)}
                </span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};
