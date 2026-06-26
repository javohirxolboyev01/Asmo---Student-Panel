// src/components/Dashboard/StreakCard.tsx
import { useState, useEffect } from "react";
import { Sun, Moon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StreakCardProps {
  streakDays: number;
  onClick?: () => void;
}

export const StreakCard = ({ onClick }: StreakCardProps) => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem("streakTheme");
    return saved ? saved === "dark" : false;
  });

  useEffect(() => {
    localStorage.setItem("streakTheme", isDark ? "dark" : "light");
  }, [isDark]);

  const toggleTheme = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDark(!isDark);
  };

  return (
    <div
      className="card p-4 md:p-5 text-center cursor-pointer hover:shadow-card-hover transition-all duration-200 hover:scale-[1.02] active:scale-95 relative overflow-hidden"
      onClick={onClick}
    >
      {/* Animated Background - Day/Night */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className={cn(
            "absolute inset-0 transition-all duration-1000 ease-in-out",
            isDark
              ? "bg-gradient-to-b from-[#0a0e1a] via-[#1a1030] to-[#0d1b2a]"
              : "bg-gradient-to-b from-[#87CEEB] via-[#FFD700]/20 to-[#FFA500]/30",
          )}
        >
          {/* Sun/Moon */}
          <div
            className={cn(
              "absolute rounded-full transition-all duration-1000 ease-in-out",
              isDark
                ? "w-10 h-10 -top-4 -right-4 bg-gradient-to-br from-[#4a6fa5] to-[#6b4c8a] shadow-[0_0_60px_rgba(74,111,165,0.3)] opacity-60"
                : "w-14 h-14 -top-6 -right-6 bg-gradient-to-br from-[#FFD700] to-[#FF6B00] shadow-[0_0_80px_rgba(255,200,0,0.4)]",
            )}
          >
            {/* Sun Rays - Day mode */}
            {!isDark && (
              <>
                <div className="absolute inset-0 rounded-full bg-yellow-400/20 animate-ping" />
                <div className="absolute -inset-3 rounded-full bg-yellow-300/10 animate-pulse" />
                <div
                  className="absolute -inset-6 rounded-full bg-yellow-200/5 animate-pulse"
                  style={{ animationDelay: "0.5s" }}
                />
              </>
            )}
            {/* Moon Glow - Night mode */}
            {isDark && (
              <div className="absolute -inset-4 rounded-full bg-blue-400/10 animate-pulse" />
            )}
          </div>

          {/* Stars - Night mode */}
          {isDark && (
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

          {/* Clouds - Day mode */}
          {!isDark && (
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

      {/* Theme Toggle Button - Inside Card */}
      {/* <button
        onClick={toggleTheme}
        className={cn(
          "absolute top-2 right-2 z-20 p-1.5 rounded-full transition-all duration-300",
          isDark
            ? "bg-white/10 hover:bg-white/20 text-yellow-400"
            : "bg-black/5 hover:bg-black/10 text-gray-700",
        )}
      >
        {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      </button> */}

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center justify-center mb-2">
          <div
            className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300",
              isDark ? "bg-blue-900/30" : "bg-blue-50",
            )}
          >
            {/* Theme toggle button moved here as main icon */}
            <button
              onClick={toggleTheme}
              className="w-full h-full rounded-full flex items-center justify-center transition-all duration-300"
            >
              {isDark ? (
                <Moon className="w-5 h-5 text-blue-400" />
              ) : (
                <Sun className="w-5 h-5 text-yellow-500" />
              )}
            </button>
          </div>
        </div>
        <p
          className={cn(
            "text-lg font-semibold transition-colors duration-300",
            isDark ? "text-white" : "text-[#1A1D26]",
          )}
        >
          24 - iyun
        </p>
        <p
          className={cn(
            "text-xs transition-colors duration-300",
            isDark ? "text-gray-400" : "text-gray-500",
          )}
        >
          Payshanba
        </p>
        <p
          className={cn(
            "text-xs mt-0.5 transition-colors duration-300",
            isDark ? "text-gray-500" : "text-gray-400",
          )}
        >
          {isDark ? "Tun" : "Kun"}
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
