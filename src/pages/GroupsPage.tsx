// src/pages/GroupsPage.tsx
import { useEffect, useState } from "react";
import { useGroupStore } from "@/stores/groupStore";
import { Link } from "react-router-dom";
import { Search, Users, ChevronRight, User } from "lucide-react";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { cn } from "@/lib/utils";

export const GroupsPage = () => {
  const { groups, isLoading, error, fetchGroups } = useGroupStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"active">("active");

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const filteredGroups = groups.filter(
    (group) =>
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.direction.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.teacher.fullName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const activeGroups = filteredGroups.filter(
    (group) => group.status === "active",
  );
  const completedGroups = filteredGroups.filter(
    (group) => group.status === "completed",
  );

  const getDisplayGroups = () => {
    if (activeTab === "active") return activeGroups;
    if (activeTab === "completed") return completedGroups;
    return filteredGroups;
  };

  const displayGroups = getDisplayGroups();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner size="lg" text="Yuklanmoqda..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-8 text-center">
        <p className="text-red-500">{error}</p>
        <button onClick={fetchGroups} className="btn-primary mt-4">
          Qayta urinish
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl md:text-3xl font-bold text-[#1A1D26]">
            Guruhlarim
          </h1>
          <p className="text-gray-500 text-xs md:text-base">
            Siz a'zo bo'lgan guruhlar
          </p>
        </div>
        {/* <div className="bg-[#FFF8E1] px-3 py-1.5 rounded-full shadow-sm">
          <span className="text-sm font-semibold text-[#F59E0B]">
            {groups.length}
          </span>
          <span className="text-xs text-[#F59E0B] ml-0.5">ta</span>
        </div> */}
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Guruh qidirish..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-2 bg-white rounded-xl border border-gray-200 focus:border-[#2D6BFF] focus:ring-2 focus:ring-[#2D6BFF]/20 outline-none transition-all text-sm"
        />
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center ml-2 gap-6 border-b border-gray-200">
        {[
          { key: "active", label: "Faol" },
          { key: "completed", label: "Tugagan" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={cn(
              "pb-3 text-sm font-medium border-b-2 transition-all",
              activeTab === tab.key
                ? "border-[#F59E0B] text-[#F59E0B]"
                : "border-transparent text-gray-500 hover:text-[#1A1D26]",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Groups List */}
      {displayGroups.length === 0 ? (
        <div className="card p-8 text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">Guruhlar topilmadi</p>
          {searchQuery && (
            <p className="text-sm text-gray-400 mt-1">
              "{searchQuery}" bo'yicha hech narsa topilmadi
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {displayGroups.map((group) => (
            <Link
              key={group.id}
              to={`/groups/${group.id}`}
              className="card block hover:shadow-card-hover transition-all duration-200 hover:scale-[1.01] group"
            >
              <div className="p-4 md:p-5">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1.5">
                      <h3 className="font-bold text-[#1A1D26] text-base md:text-lg group-hover:text-[#2D6BFF] transition-colors">
                        {group.name}
                      </h3>
                      <span
                        className={cn(
                          "text-xs font-medium px-2 py-0.5 rounded-full",
                          group.status === "active"
                            ? "bg-[#E8F5E9] text-[#2E7D32]"
                            : "bg-gray-100 text-gray-500",
                        )}
                      >
                        {group.status === "active" ? "Faol" : "Tugagan"}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5" />
                        <span>{group.teacher.fullName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5" />
                        <span>{group.studentCount} talaba</span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 group-hover:text-[#2D6BFF] group-hover:translate-x-1 transition-all duration-200" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};
