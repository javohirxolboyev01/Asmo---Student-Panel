// src/components/Dashboard/CourseLevelCard.tsx
import { cn } from "@/lib/utils";

interface CourseLevelCardProps {
  level: string;
  nextLevel?: string;
  unit: string;
  week: number;
  percentage: number;
  colorClass: string;
}

export const CourseLevelCard = ({
  level,
  nextLevel,
  unit,
  week,
  percentage,
  colorClass,
  // darkMode,
}: CourseLevelCardProps) => {
  return (
    <div className={cn("card overflow-hidden", colorClass)}>
      <div className="p-5 md:p-6">
        {/* Level and Next Level */}
        <div className="flex items-center gap-2 text-lg md:text-xl font-semibold text-white">
          <span>{level}</span>
        </div>
        {nextLevel && (
          <>
            <span className="text-gray-800">→</span> {""}
            <span className="text-gray-900 font-semibold text-md">
              {nextLevel}
            </span>
          </>
        )}
        {/* Unit, Week, Percentage */}
        <div className="flex items-center gap-3 mt-2 flex-nowrap overflow-x-auto">
          <div className="px-2 py-1 rounded-xl bg-white/15 backdrop-blur-lg border border-white/20 shadow-lg whitespace-nowrap">
            <span className="text-sm font-medium text-white">{unit}</span>
          </div>

          <div className="px-2 py-1 rounded-xl bg-white/15 backdrop-blur-lg border border-white/20 shadow-lg whitespace-nowrap">
            <span className="text-sm font-medium text-white">{week}-hafta</span>
          </div>

          <div className="px-2 py-1 rounded-xl bg-white/15 backdrop-blur-lg border border-white/20 shadow-lg whitespace-nowrap">
            <span className="text-sm font-semibold text-white">
              {percentage}% Tugallangan
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        {/* <div className="mt-3">
          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#2D6BFF] rounded-full transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div> */}
      </div>
    </div>
  );
};
