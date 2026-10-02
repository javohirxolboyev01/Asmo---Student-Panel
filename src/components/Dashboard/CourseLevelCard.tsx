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
  /** Progress fill color, chosen to contrast with the level color. Defaults to white. */
  barClass?: string;
}

export const CourseLevelCard = ({
  level,
  nextLevel,
  unit,
  week,
  percentage,
  colorClass,
  barClass = "bg-white",
  // darkMode,
}: CourseLevelCardProps) => {
  const { t } = useTranslation();
  const clampedPercentage = Math.min(100, Math.max(0, percentage));
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
        {/* Level → Next Level, on one line */}
        <div className="flex items-center gap-2 flex-wrap text-lg md:text-xl font-semibold text-white">
          <span>{level}</span>
          {nextLevel && (
            <>
              <span className="text-white/70">→</span>
              <span>{nextLevel}</span>
            </>
          )}
        </div>

        {/* Progress Bar */}
        <div
          className="mt-3 w-full h-2 rounded-full bg-white/20 overflow-hidden"
          role="progressbar"
          aria-valuenow={clampedPercentage}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={cn("h-full rounded-full transition-all duration-500", barClass)}
            style={{ width: `${clampedPercentage}%` }}
          />
        </div>

        {/* Unit, Week, Percentage */}
        <div className="flex items-center gap-3 mt-3 flex-nowrap overflow-x-auto">
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
      </div>
    </div>
  );
};
