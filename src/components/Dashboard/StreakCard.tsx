// src/components/Dashboard/StreakCard.tsx
import { useState, useEffect } from "react";
import { Sunrise, Sun, SunMedium, Sunset, Moon } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";

interface StreakCardProps {
  streakDays: number;
  onClick?: () => void;
}

type DayPhase = "morning" | "noon" | "afternoon" | "sunset" | "night";

// Boundaries follow the sun's arc through the day rather than a fixed
// day/night split, so the card's look tracks the actual time of day.
const getDayPhase = (hour: number): DayPhase => {
  if (hour >= 6 && hour < 11) return "morning";
  if (hour >= 11 && hour < 16) return "noon";
  if (hour >= 16 && hour < 18) return "afternoon";
  if (hour >= 18 && hour < 21) return "sunset";
  return "night";
};

const PHASE_CONFIG: Record<
  DayPhase,
  {
    gradient: string;
    orb: string;
    orbGlow: string;
    Icon: typeof Sun;
    iconBg: string;
    iconColor: string;
    textPrimary: string;
    textSecondary: string;
    textTertiary: string;
    showRays: boolean;
    showClouds: boolean;
    showStars: boolean;
  }
> = {
  morning: {
    gradient: "bg-gradient-to-b from-[#6EC6FF] via-[#9FE0FF] to-[#FFE9C7]",
    orb: "w-12 h-12 top-2 right-4 bg-gradient-to-br from-[#FFE29A] to-[#FFB84D]",
    orbGlow: "shadow-[0_0_60px_rgba(255,184,77,0.5)]",
    Icon: Sunrise,
    iconBg: "bg-orange-100",
    iconColor: "text-orange-500",
    textPrimary: "text-gray-800",
    textSecondary: "text-gray-600",
    textTertiary: "text-gray-500",
    showRays: true,
    showClouds: true,
    showStars: false,
  },
  noon: {
    gradient: "bg-gradient-to-b from-[#3FA9F5] via-[#8ED1FC] to-[#EAF6FF]",
    orb: "w-14 h-14 -top-6 -right-6 bg-gradient-to-br from-[#FFD700] to-[#FF6B00]",
    orbGlow: "shadow-[0_0_80px_rgba(255,200,0,0.4)]",
    Icon: Sun,
    iconBg: "bg-yellow-50",
    iconColor: "text-yellow-500",
    textPrimary: "text-gray-800",
    textSecondary: "text-gray-600",
    textTertiary: "text-gray-500",
    showRays: true,
    showClouds: true,
    showStars: false,
  },
  afternoon: {
    gradient: "bg-gradient-to-b from-[#4A90D9] via-[#F6C667] to-[#F2994A]",
    orb: "w-14 h-14 top-1 right-2 bg-gradient-to-br from-[#FFD36B] to-[#F2994A]",
    orbGlow: "shadow-[0_0_70px_rgba(242,153,74,0.5)]",
    Icon: SunMedium,
    iconBg: "bg-amber-500/20",
    iconColor: "text-amber-100",
    textPrimary: "text-white",
    textSecondary: "text-amber-50/80",
    textTertiary: "text-amber-50/60",
    showRays: true,
    showClouds: false,
    showStars: false,
  },
  sunset: {
    gradient: "bg-gradient-to-b from-[#1B2845] via-[#F2994A] to-[#EB5757]",
    orb: "w-16 h-16 top-4 right-0 bg-gradient-to-br from-[#FF9A56] to-[#EB5757]",
    orbGlow: "shadow-[0_0_90px_rgba(235,87,87,0.5)]",
    Icon: Sunset,
    iconBg: "bg-orange-900/30",
    iconColor: "text-orange-300",
    textPrimary: "text-white",
    textSecondary: "text-orange-100/80",
    textTertiary: "text-orange-100/60",
    showRays: false,
    showClouds: false,
    showStars: false,
  },
  night: {
    gradient: "bg-gradient-to-b from-[#0a0e1a] via-[#1a1030] to-[#0d1b2a]",
    orb: "w-10 h-10 -top-4 -right-4 bg-gradient-to-br from-[#4a6fa5] to-[#6b4c8a]",
    orbGlow: "shadow-[0_0_60px_rgba(74,111,165,0.3)] opacity-60",
    Icon: Moon,
    iconBg: "bg-blue-900/30",
    iconColor: "text-blue-400",
    textPrimary: "text-white",
    textSecondary: "text-gray-400",
    textTertiary: "text-gray-500",
    showRays: false,
    showClouds: false,
    showStars: true,
  },
};

export const StreakCard = ({ onClick }: StreakCardProps) => {
  const { t, language } = useTranslation();
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const phase = getDayPhase(currentTime.getHours());
  const config = PHASE_CONFIG[phase];
  const { Icon } = config;

  const formatDate = (date: Date) => {
    const months = t("dashboardWidgets.months").split(",");
    const day = date.getDate();
    const month = months[date.getMonth()];
    return `${day} - ${month}`;
  };

  const formatDayOfWeek = (date: Date) => {
    const days = t("dashboardWidgets.weekdays").split(",");
    return days[date.getDay()];
  };

  const localeMap: Record<string, string> = { uz: "uz-UZ", ru: "ru-RU", en: "en-US" };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(localeMap[language] ?? "uz-UZ", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div
      className="card p-4 md:p-5 text-center cursor-pointer hover:shadow-card-hover transition-all duration-200 hover:scale-[1.02] active:scale-95 relative overflow-hidden"
      onClick={onClick}
    >
      {/* Animated Background - follows the actual time of day */}
      <div className="absolute inset-0 overflow-hidden">
        <div className={cn("absolute inset-0 transition-all duration-1000 ease-in-out", config.gradient)}>
          {/* Sun/Moon orb */}
          <div
            className={cn(
              "absolute rounded-full transition-all duration-1000 ease-in-out",
              config.orb,
              config.orbGlow,
            )}
          >
            {config.showRays && (
              <>
                <div className="absolute inset-0 rounded-full bg-yellow-400/20 animate-ping" />
                <div className="absolute -inset-3 rounded-full bg-yellow-300/10 animate-pulse" />
                <div
                  className="absolute -inset-6 rounded-full bg-yellow-200/5 animate-pulse"
                  style={{ animationDelay: "0.5s" }}
                />
              </>
            )}
            {phase === "night" && (
              <div className="absolute -inset-4 rounded-full bg-blue-400/10 animate-pulse" />
            )}
          </div>

          {/* Stars - Night mode */}
          {config.showStars && (
            <>
              <div
                className="absolute top-2 left-4 w-1 h-1 bg-white/80 rounded-full animate-twinkle"
                style={{ animationDelay: "0.1s" }}
              />
              <div
                className="absolute top-5 left-8 w-0.5 h-0.5 bg-white/60 rounded-full animate-twinkle"
                style={{ animationDelay: "0.4s" }}
              />
              <div
                className="absolute top-8 left-2 w-0.5 h-0.5 bg-white/50 rounded-full animate-twinkle"
                style={{ animationDelay: "0.7s" }}
              />
              <div
                className="absolute top-3 left-12 w-0.5 h-0.5 bg-white/40 rounded-full animate-twinkle"
                style={{ animationDelay: "1.0s" }}
              />
              <div
                className="absolute top-6 left-16 w-1 h-1 bg-white/30 rounded-full animate-twinkle"
                style={{ animationDelay: "0.3s" }}
              />
              <div
                className="absolute top-10 left-6 w-0.5 h-0.5 bg-white/20 rounded-full animate-twinkle"
                style={{ animationDelay: "0.8s" }}
              />
              <div
                className="absolute top-1 left-20 w-0.5 h-0.5 bg-white/30 rounded-full animate-twinkle"
                style={{ animationDelay: "0.5s" }}
              />
              <div
                className="absolute top-7 left-14 w-0.5 h-0.5 bg-white/20 rounded-full animate-twinkle"
                style={{ animationDelay: "1.2s" }}
              />
            </>
          )}

          {/* Clouds - Morning/Noon */}
          {config.showClouds && (
            <>
              <div className="absolute top-1 left-3 w-8 h-2.5 bg-white/40 rounded-full animate-cloud" />
              <div
                className="absolute top-3 left-10 w-6 h-2 bg-white/30 rounded-full animate-cloud"
                style={{ animationDelay: "0.5s" }}
              />
              <div
                className="absolute top-5 left-16 w-5 h-1.5 bg-white/20 rounded-full animate-cloud"
                style={{ animationDelay: "1.0s" }}
              />
              <div
                className="absolute top-7 left-5 w-4 h-1.5 bg-white/25 rounded-full animate-cloud"
                style={{ animationDelay: "1.5s" }}
              />
              <div
                className="absolute top-2 left-20 w-3 h-1.5 bg-white/20 rounded-full animate-cloud"
                style={{ animationDelay: "2.0s" }}
              />
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center justify-center mb-2">
          <div
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300",
              config.iconBg,
            )}
          >
            <Icon className={cn("w-5 h-5 transition-colors duration-300", config.iconColor)} />
          </div>
        </div>
        <p className={cn("text-lg font-semibold transition-colors duration-300", config.textPrimary)}>
          {formatDate(currentTime)}
        </p>
        <p className={cn("text-xs transition-colors duration-300", config.textSecondary)}>
          {formatDayOfWeek(currentTime)}
        </p>
        <p className={cn("text-xs mt-0.5 transition-colors duration-300", config.textTertiary)}>
          {formatTime(currentTime)}
        </p>
      </div>

      {/* Custom Animations */}
      <style>{`
        @keyframes twinkle {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.2; transform: scale(0.5); }
        }
        @keyframes cloud {
          0% { transform: translateX(-100%) scale(0.8); opacity: 0; }
          20% { opacity: 1; }
          80% { opacity: 1; }
          100% { transform: translateX(200%) scale(1.2); opacity: 0; }
        }
        .animate-twinkle {
          animation: twinkle 2s ease-in-out infinite;
        }
        .animate-cloud {
          animation: cloud 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};
