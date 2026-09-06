// src/components/Dashboard/CourseLevelCard.tsx
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";

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
  const { t } = useTranslation();
  return (
    // Deliberately not using the shared `.card` class: its `.dark .card`
    // rule has higher specificity than a single `bg-*` utility and would
    // stomp the level color in dark mode, leaving every level looking the
    // same flat dark gray. No border and no shadow either — the gradient
    // itself reads as the card's edge, and `shadow-card`'s dark offset
    // shadow showed up as a hard rim along the bottom/right edge against
    // the dashboard's near-black background.
    <div className={cn("overflow-hidden rounded-2xl", colorClass)}>
      <div className="p-5 md:p-6">
        {/* Level and Next Level */}
        <div className="flex items-center gap-2 text-lg md:text-xl font-semibold text-white">
          <span>{level}</span>
        </div>
        {nextLevel && (
          <p className="text-sm text-white/70 mt-0.5">
            <span>→</span> <span className="text-white font-semibold">{nextLevel}</span>
          </p>
        )}
        {/* Unit, Week, Percentage */}
        <div className="flex items-center gap-3 mt-2 flex-nowrap overflow-x-auto">
          <div className="px-2 py-1 rounded-xl bg-white/20 whitespace-nowrap">
            <span className="text-sm font-medium text-white">{unit}</span>
          </div>

          <div className="px-2 py-1 rounded-xl bg-white/20 whitespace-nowrap">
            <span className="text-sm font-medium text-white">{t("dashboardWidgets.week", { week })}</span>
          </div>

          <div className="px-2 py-1 rounded-xl bg-white/20 whitespace-nowrap">
            <span className="text-sm font-semibold text-white">
              {t("dashboardWidgets.completed", { percentage })}
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        {/* <div className="mt-3">
          <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-primary-500 rounded-full transition-all duration-500"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div> */}
      </div>
    </div>
  );
};
