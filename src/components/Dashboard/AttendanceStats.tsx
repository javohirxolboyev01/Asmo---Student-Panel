// src/components/Dashboard/AttendanceStats.tsx
import { TrendingUp, Calendar, CheckCircle, XCircle } from "lucide-react";

interface AttendanceStatsProps {
  total: number;
  present: number;
  absent: number;
  percentage: number;
}

export const AttendanceStats = ({
  total,
  present,
  absent,
  percentage,
}: AttendanceStatsProps) => {
  return (
    <div className="stat-card">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium text-text-primary">Davomat</h4>
        <span className="text-2xl font-bold text-primary-500">
          {percentage}%
        </span>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-secondary">Bu hafta</span>
          <span className="font-medium text-text-primary">
            {present}/{total}
          </span>
        </div>
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-green-500 rounded-full transition-all duration-500"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-text-secondary">
          <div className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3 text-green-500" />
            <span>{present} kelgan</span>
          </div>
          <div className="flex items-center gap-1">
            <XCircle className="w-3 h-3 text-red-500" />
            <span>{absent} kelmagan</span>
          </div>
        </div>
      </div>
    </div>
  );
};
