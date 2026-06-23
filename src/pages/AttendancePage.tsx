// src/pages/AttendancePage.tsx
import { useEffect, useState } from "react";
import { attendanceService } from "@/services/attendanceService";

import { formatDate } from "@/utilist/formatData";
import { cn } from "@/lib/utils";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { StatusBadge } from "@/components/common/StatusBadge";

type ViewMode = "weekly" | "monthly";

interface AttendanceRecord {
  id: string;
  lessonId: string;
  lessonTopic: string;
  lessonDate: string;
  status: "present" | "absent" | "late" | "excused";
  markedAt: string;
}

interface AttendanceData {
  summary: {
    totalLessons: number;
    present: number;
    absent: number;
    late: number;
    percentage: number;
  };
  records: AttendanceRecord[];
}

export const AttendancePage = () => {
  const [data, setData] = useState<AttendanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("weekly");

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const result = await attendanceService.getAttendance();
        setData(result);
      } catch (err) {
        setError("Ma'lumotlarni yuklashda xatolik yuz berdi");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Yuklanmoqda..." />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="card p-8 text-center">
        <p className="text-red-500">{error || "Ma'lumotlar topilmadi"}</p>
        <button
          onClick={() => window.location.reload()}
          className="btn-primary mt-4"
        >
          Qayta urinish
        </button>
      </div>
    );
  }

  const { summary, records } = data;

  // Get day of month from date string
  const getDayOfMonth = (dateStr: string): number => {
    return new Date(dateStr).getDate();
  };

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1A1D26]">
            Davomatim
          </h1>
          <p className="text-gray-500 text-sm md:text-base">
            Darslarga qatnashish statistikasi
          </p>
        </div>
        <div className="bg-white px-3 py-1.5 rounded-full shadow-sm">
          <span className="text-sm font-semibold text-[#2E7D32]">
            {summary.percentage}%
          </span>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex items-center gap-1 bg-white rounded-2xl p-1 border border-gray-100">
        {(["weekly", "monthly"] as ViewMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className={cn(
              "flex-1 px-4 py-2.5 rounded-xl text-sm font-medium transition-all",
              viewMode === mode
                ? "bg-[#2D6BFF] text-white shadow-sm"
                : "text-gray-500 hover:text-[#1A1D26]",
            )}
          >
            {mode === "weekly" ? "Haftalik" : "Oylik"}
          </button>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-[#1A1D26]">
            {summary.totalLessons}
          </p>
          <p className="text-xs text-gray-500">Jami darslar</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-[#2E7D32]">{summary.present}</p>
          <p className="text-xs text-gray-500">Qatnashgan</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-[#C62828]">{summary.absent}</p>
          <p className="text-xs text-gray-500">Kelmagan</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-[#E65100]">{summary.late}</p>
          <p className="text-xs text-gray-500">Kech qolgan</p>
        </div>
      </div>

      {/* Calendar */}
      <div className="card">
        <div className="p-5">
          <h3 className="font-semibold text-[#1A1D26] mb-4">📅 Kalendar</h3>

          {/* Day Headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-2">
            {["D", "S", "C", "P", "J", "S", "Y"].map((day) => (
              <div key={day} className="text-xs font-medium text-gray-400 py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 28 }, (_, i) => i + 1).map((day) => {
              const record = records.find(
                (r: AttendanceRecord) => getDayOfMonth(r.lessonDate) === day,
              );
              const status = record?.status || "excused";
              const colorMap = {
                present: "bg-[#4CAF50] text-white",
                absent: "bg-[#F44336] text-white",
                late: "bg-[#FF9800] text-white",
                excused: "bg-gray-100 text-gray-400",
              };
              return (
                <div
                  key={day}
                  className="aspect-square flex items-center justify-center"
                >
                  <div
                    className={cn(
                      "w-full max-w-[40px] aspect-square rounded-full flex items-center justify-center text-sm font-medium",
                      colorMap[status as keyof typeof colorMap],
                    )}
                  >
                    {day}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#4CAF50]" />
              <span className="text-xs text-gray-500">Keldi</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#F44336]" />
              <span className="text-xs text-gray-500">Kelmadi</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#FF9800]" />
              <span className="text-xs text-gray-500">Kech</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-gray-200" />
              <span className="text-xs text-gray-500">Reja</span>
            </div>
          </div>
        </div>
      </div>

      {/* Records Table */}
      <div className="card">
        <div className="p-5">
          <h3 className="font-semibold text-[#1A1D26] mb-4">
            📋 Barcha davomatlar
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2 px-3">
                    Sana
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2 px-3">
                    Mavzu
                  </th>
                  <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider py-2 px-3">
                    Holati
                  </th>
                </tr>
              </thead>
              <tbody>
                {records.map((record: AttendanceRecord) => (
                  <tr key={record.id} className="border-b border-gray-50">
                    <td className="py-2.5 px-3 text-sm text-gray-500">
                      {formatDate(record.lessonDate)}
                    </td>
                    <td className="py-2.5 px-3 text-sm text-[#1A1D26]">
                      {record.lessonTopic}
                    </td>
                    <td className="py-2.5 px-3">
                      <StatusBadge status={record.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
