import { Trophy, Coins } from "lucide-react";

export type LeaderboardFilter = "week" | "month" | "all";

export interface LeaderboardStudent {
  id: number;
  name: string;
  group: string;
  coins: number;
  streak: number;
  avatar: string;
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
  currentUserRank,
  currentUserCoins = 0,
  currentUserName = "Siz",
  currentUserGroup = "",
  currentUserAvatar = "SZ",
  filter,
  onFilterChange,
  isLoading = false,
}: CoinLeaderboardProps) => {
  const rest = students.slice(3);
  const isCurrentUserInTop = students.some((s) => s.id === currentUserId);

  return (
    <div className="card">
      {/* ── Header ── */}
      <div className="card-header">
        <div className="flex items-center ">
          {/* <div className="w-7 h-7 bg-amber-50 rounded-lg flex items-center justify-center">
            <Trophy className="w-4 h-4 text-amber-500" />
          </div> */}
          <div>
            <h3 className="font-semibold text-[#1A1D26] text-sm">
              Reyting jadvali
            </h3>
            <p className="text-[10px] text-gray-400 leading-none mt-0.5">
              Coinlar asosida
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1  ">
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
      <div className="card-body space-y-2">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-6 h-6 border-2 border-[#2D6BFF] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : students.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 gap-2">
            <Trophy className="w-10 h-10 text-gray-200" />
            <p className="text-sm text-gray-400">Hali ma'lumot yo'q</p>
          </div>
        ) : (
          <>
            {/* ── Podium (Top 3) ── */}

            {/* ── List (4+) ── */}
            {rest.length > 0 && (
              <div className="space-y-1.5">
                {rest.map((student, idx) => {
                  const rank = idx + 4;
                  const avatarColor = getAvatarColor(idx + 3);
                  const isMe = student.id === currentUserId;

                  return (
                    <div
                      key={student.id}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                        isMe
                          ? "bg-blue-50 ring-1 ring-blue-200"
                          : "bg-gray-50 hover:bg-gray-100"
                      }`}
                    >
                      <span className="text-xs font-semibold text-gray-400 w-5 text-center flex-shrink-0">
                        {rank}
                      </span>
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${avatarColor.bg} ${avatarColor.text}`}
                      >
                        {student.avatar}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-[#1A1D26] truncate">
                          {student.name}
                          {isMe && (
                            <span className="ml-1.5 text-[9px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-semibold">
                              Siz
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] text-gray-400 truncate">
                          Guruh : {student.group}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="flex items-center gap-0.5 bg-amber-50 px-2 py-1 rounded-lg">
                          <Coins className="w-3 h-3 text-amber-500" />
                          <span className="text-[11px] font-semibold text-amber-600">
                            {student.coins.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* ── Current User (top listda bo'lmasa) ── */}
            {!isCurrentUserInTop && currentUserRank && (
              <div className="pt-2 border-t border-gray-100">
                <p className="text-[10px] text-gray-400 mb-1.5 px-1">
                  Sizning o'rningiz
                </p>
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-blue-50 ring-1 ring-blue-200">
                  <span className="text-xs font-semibold text-blue-400 w-5 text-center flex-shrink-0">
                    {currentUserRank}
                  </span>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 bg-blue-100 text-blue-700">
                    {currentUserAvatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-[#1A1D26] truncate">
                      {currentUserName}
                      <span className="ml-1.5 text-[9px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full font-semibold">
                        Siz
                      </span>
                    </p>
                    <p className="text-[10px] text-gray-400 truncate">
                      Guruh : {currentUserGroup}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex items-center gap-0.5 bg-amber-50 px-2 py-1 rounded-lg">
                      <Coins className="w-3 h-3 text-amber-500" />
                      <span className="text-[11px] font-semibold text-amber-600">
                        {currentUserCoins.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
