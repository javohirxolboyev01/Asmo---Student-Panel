// src/pages/GroupsPage.tsx
import { useEffect, useState } from "react";
import { useGroupStore } from "@/stores/groupStore";
import { Link } from "react-router-dom";
import { Search, Users, ChevronRight, User } from "lucide-react";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";

export const GroupsPage = () => {
  const { groups, isLoading, error, fetchGroups } = useGroupStore();
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  const filteredGroups = groups.filter(
    (group) =>
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.direction.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

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
          <h1 className="text-2xl md:text-3xl font-bold text-[#1A1D26]">
            Guruhlarim
          </h1>
          <p className="text-gray-500 text-sm md:text-base">
            Siz a'zo bo'lgan guruhlar
          </p>
        </div>
        <div className="bg-white px-3 py-1.5 rounded-full shadow-sm">
          <span className="text-sm font-semibold text-[#1A1D26]">
            {groups.length}
          </span>
          <span className="text-xs text-gray-400 ml-1">ta</span>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Guruh qidirish..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-12 pr-4 py-3.5 bg-white rounded-2xl border border-gray-200 focus:border-[#2D6BFF] focus:ring-2 focus:ring-[#2D6BFF]/20 outline-none transition-all text-sm"
        />
      </div>

      {/* Groups List */}
      <div className="space-y-3">
        {filteredGroups.map((group) => (
          <Link
            key={group.id}
            to={`/groups/${group.id}`}
            className="card block hover:shadow-card-hover transition-shadow duration-200"
          >
            <div className="p-4 md:p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <h3 className="font-bold text-[#1A1D26]">{group.name}</h3>
                    <span
                      className="text-xs font-medium px-2 py-0.5 rounded-full text-white"
                      style={{ backgroundColor: group.direction.color }}
                    >
                      {group.direction.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-500">
                    <div className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5" />
                      <span>{group.teacher.fullName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" />
                      <span>{group.studentCount}</span>
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
              </div>
              <div className="mt-2.5">
                <span
                  className={`badge ${group.status === "active" ? "badge-present" : "badge-absent"}`}
                >
                  {group.status === "active" ? "Faol" : "Tugallangan"}
                </span>
              </div>
            </div>
          </Link>
        ))}

        {filteredGroups.length === 0 && (
          <div className="card p-8 text-center">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Guruhlar topilmadi</p>
            {searchQuery && (
              <p className="text-sm text-gray-400 mt-1">
                "{searchQuery}" bo'yicha hech narsa topilmadi
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
