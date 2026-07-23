import { Trophy, Coins, X, Calendar, User, Users } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

export type LeaderboardFilter = "week" | "month" | "all";

export interface LeaderboardStudent {
  id: number;
  name: string;
  fatherName?: string;
  group: string;
  coins: number;
  streak: number;
  avatar: string;
  birthYear?: number;
}

interface CoinLeaderboardProps {
  students: LeaderboardStudent[];
  currentUserId?: number;
  currentUserRank?: number;
  currentUserCoins?: number;
  currentUserStreak?: number;
  currentUserName?: string;
  currentUserGroup?: string;
  currentUserAvatar?: string;
  filter: LeaderboardFilter;
  onFilterChange: (filter: LeaderboardFilter) => void;
  isLoading?: boolean;
}

const AVATAR_COLORS: Record<number, { bg: string; text: string }> = {
  0: { bg: "bg-purple-100", text: "text-purple-700" },
  1: { bg: "bg-emerald-100", text: "text-emerald-700" },
  2: { bg: "bg-orange-100", text: "text-orange-700" },
  3: { bg: "bg-blue-100", text: "text-blue-700" },
  4: { bg: "bg-pink-100", text: "text-pink-700" },
  5: { bg: "bg-slate-100", text: "text-slate-700" },
};

const getAvatarColor = (index: number) =>
  AVATAR_COLORS[index % Object.keys(AVATAR_COLORS).length];

const FILTER_LABELS: Record<LeaderboardFilter, string> = {
  week: "Hafta",
  month: "Oy",
  all: "Jami",
};

export const CoinLeaderboard = ({
  students = [],
  currentUserId,
  filter,
  onFilterChange,
  isLoading = false,
}: CoinLeaderboardProps) => {
  const [selectedStudent, setSelectedStudent] = useState<LeaderboardStudent | null>(null);

  return (
    <div className="card">
      {/* ── Header ── */}
      <div className="card-header">
        <div className={cn('flex', 'items-center')}>
          {/* <div className={cn('w-7', 'h-7', 'bg-amber-50', 'rounded-lg', 'flex', 'items-center', 'justify-center')}>
            <Trophy className={cn('w-4', 'h-4', 'text-amber-500')} />
          </div> */}
          <div>
            <h3 className={cn('font-semibold', 'text-[#1A1D26]', 'text-sm')}>
              Reyting jadvali
            </h3>
            <p className={cn('text-[10px]', 'text-gray-400', 'leading-none', 'mt-0.5')}>
              Coinlar asosida
            </p>
          </div>
        </div>

        <div className={cn('flex', 'items-center', 'gap-1')}>
          {(["week", "month", "all"] as LeaderboardFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => onFilterChange(f)}
              className={`text-[11px] font-medium px-2.5   transition-all duration-150 ${
                filter === f
                  ? "  text-[#F59E0B]"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {FILTER_LABELS[f]}
            </button>
          ))}
        </div>
      </div>

      {/* ── Body ── */}
      <div className={cn('card-body', 'space-y-2')}>
        {isLoading ? (
          <div className={cn('flex', 'items-center', 'justify-center', 'py-10')}>
            <div className={cn('w-6', 'h-6', 'border-2', 'border-[#2D6BFF]', 'border-t-transparent', 'rounded-full', 'animate-spin')} />
          </div>
        ) : students.length === 0 ? (
          <div className={cn('flex', 'flex-col', 'items-center', 'justify-center', 'py-10', 'gap-2')}>
            <Trophy className={cn('w-10', 'h-10', 'text-gray-200')} />
            <p className={cn('text-sm', 'text-gray-400')}>Hali ma'lumot yo'q</p>
          </div>
        ) : (
          <>
            {/* ── List (All students) ── */}
            <div className="space-y-1.5">
              {students.map((student, idx) => {
                const rank = idx + 1;
                const avatarColor = getAvatarColor(idx);
                const isMe = student.id === currentUserId;

                // Special styling for top 3
                const getRankBackground = (rank: number) => {
                  if (rank === 1) return "bg-amber-50 ring-1 ring-amber-300";
                  if (rank === 2) return "bg-slate-100 ring-1 ring-slate-300";
                  if (rank === 3) return "bg-rose-50 ring-1 ring-rose-300";
                  return "bg-gray-50 hover:bg-gray-100";
                };

                return (
                  <div
                    key={student.id}
                    onClick={() => setSelectedStudent(student)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors cursor-pointer ${
                      isMe
                        ? "bg-blue-50 ring-1 ring-blue-200"
                        : getRankBackground(rank)
                    }`}
                  >
                    <span className={cn('text-xs', 'font-semibold', 'text-gray-400', 'w-5', 'text-center', 'flex-shrink-0')}>
                      {rank}
                    </span>
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${avatarColor.bg} ${avatarColor.text}`}
                    >
                      {student.avatar}
                    </div>
                    <div className={cn('flex-1', 'min-w-0')}>
                      <p className={cn('text-xs', 'font-medium', 'text-[#1A1D26]', 'truncate')}>
                        {student.name}
                        {isMe && (
                          <span className={cn('ml-1.5', 'text-[9px]', 'bg-blue-100', 'text-blue-600', 'px-1.5', 'py-0.5', 'rounded-full', 'font-semibold')}>
                            Siz
                          </span>
                        )}
                      </p>
                      <p className={cn('text-[10px]', 'text-gray-400', 'truncate')}>
                        Guruh : {student.group}
                      </p>
                    </div>
                    <div className={cn('flex', 'items-center', 'gap-2', 'flex-shrink-0')}>
                      <div className={cn('flex', 'items-center', 'gap-0.5', 'bg-amber-50', 'px-2', 'py-1', 'rounded-lg')}>
                        <Coins className={cn('w-3', 'h-3', 'text-amber-500')} />
                        <span className={cn('text-[11px]', 'font-semibold', 'text-amber-600')}>
                          {student.coins.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* ── Student Detail Modal ── */}
      {selectedStudent && (
        <div className={cn('fixed', 'inset-0', 'bg-black/50', 'flex', 'items-center', 'justify-center', 'z-50', 'p-4')}>
          <div className={cn('bg-white', 'rounded-2xl', 'w-full', 'max-w-md', 'p-6', 'relative', 'animate-in', 'fade-in', 'zoom-in', 'duration-200')}>
            {/* Close Button */}
            <button
              onClick={() => setSelectedStudent(null)}
              className={cn('absolute', 'top-4', 'right-4', 'w-8', 'h-8', 'bg-gray-100', 'rounded-full', 'flex', 'items-center', 'justify-center', 'hover:bg-gray-200', 'transition-colors')}
            >
              <X className={cn('w-4', 'h-4', 'text-gray-600')} />
            </button>

            {/* Avatar */}
            <div className={cn('flex', 'flex-col', 'items-center', 'mb-6')}>
              <div
                className={`w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold mb-3 ${getAvatarColor(selectedStudent.id).bg} ${getAvatarColor(selectedStudent.id).text}`}
              >
                {selectedStudent.avatar}
              </div>
              <h3 className={cn('text-xl', 'font-bold', 'text-[#1A1D26]', 'text-center')}>
                {selectedStudent.name}
                {selectedStudent.fatherName && (
                  <span className={cn('text-lg', 'font-medium', 'text-gray-600', 'ml-1')}>
                    {selectedStudent.fatherName}
                 
                  </span>
                )}
              </h3>
            </div>

            {/* Details */}
            <div className="space-y-4">
              {/* Coins */}
              <div className={cn('flex', 'items-center', 'gap-3', 'p-4', 'bg-amber-50', 'rounded-xl')}>
                <div className={cn('w-10', 'h-10', 'bg-amber-100', 'rounded-full', 'flex', 'items-center', 'justify-center')}>
                  <Coins className={cn('w-5', 'h-5', 'text-amber-600')} />
                </div>
                <div className="flex-1">
                  <p className={cn('text-xs', 'text-gray-500')}>Coinlar</p>
                  <p className={cn('text-lg', 'font-bold', 'text-amber-600')}>
                    {selectedStudent.coins.toLocaleString()}
                  </p>
                </div>
              </div>

              {/* Group */}
              <div className={cn('flex', 'items-center', 'gap-3', 'p-4', 'bg-blue-50', 'rounded-xl')}>
                <div className={cn('w-10', 'h-10', 'bg-blue-100', 'rounded-full', 'flex', 'items-center', 'justify-center')}>
                  <Users className={cn('w-5', 'h-5', 'text-blue-600')} />
                </div>
                <div className="flex-1">
                  <p className={cn('text-xs', 'text-gray-500')}>Guruh</p>
                  <p className={cn('text-lg', 'font-bold', 'text-blue-600')}>
                    {selectedStudent.group}
                  </p>
                </div>
              </div>

              {/* Birth Year */}
              {selectedStudent.birthYear && (
                <div className={cn('flex', 'items-center', 'gap-3', 'p-4', 'bg-purple-50', 'rounded-xl')}>
                  <div className={cn('w-10', 'h-10', 'bg-purple-100', 'rounded-full', 'flex', 'items-center', 'justify-center')}>
                    <Calendar className={cn('w-5', 'h-5', 'text-purple-600')} />
                  </div>
                  <div className="flex-1">
                    <p className={cn('text-xs', 'text-gray-500')}>Tug'ilgan yil</p>
                    <p className={cn('text-lg', 'font-bold', 'text-purple-600')}>
                      {selectedStudent.birthYear}
                    </p>
                  </div>
                </div>
              )}

              {/* Streak */}
              <div className={cn('flex', 'items-center', 'gap-3', 'p-4', 'bg-green-50', 'rounded-xl')}>
                <div className={cn('w-10', 'h-10', 'bg-green-100', 'rounded-full', 'flex', 'items-center', 'justify-center')}>
                  <User className={cn('w-5', 'h-5', 'text-green-600')} />
                </div>
                <div className="flex-1">
                  <p className={cn('text-xs', 'text-gray-500')}>Seriya</p>
                  <p className={cn('text-lg', 'font-bold', 'text-green-600')}>
                    {selectedStudent.streak} kun
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
