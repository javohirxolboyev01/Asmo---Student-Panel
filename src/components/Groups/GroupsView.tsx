// src/components/Groups/GroupsView.tsx
import { ReactNode, useState } from "react";
import { useGroupsQuery } from "@/hooks/queries/useGroups";
import { Link } from "react-router-dom";
import { Search, Users, ChevronRight, User } from "lucide-react";
import { SkeletonHeader, SkeletonCardGrid, Skeleton } from "@/components/common/Skeleton";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { Button, Input } from "@/components/ui";
import { getErrorMessage } from "@/lib/toast";

interface GroupsViewProps {
  /** Rendered at the right of the page title (e.g. teacher's create buttons). */
  headerActions?: ReactNode;
  /** Rendered after the list (e.g. teacher's modals). */
  children?: ReactNode;
}

// Groups list shared by the student and teacher panels; each panel adds its
// own actions through the slots above.
export const GroupsView = ({ headerActions, children }: GroupsViewProps) => {
  const { t } = useTranslation();
  const { data: groups = [], isLoading, error, refetch } = useGroupsQuery();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"active">("active");

  const filteredGroups = groups.filter((group) => {
    const query = searchQuery.toLowerCase();
    return (
      (group.name ?? "").toLowerCase().includes(query) ||
      (group.direction?.name ?? "").toLowerCase().includes(query) ||
      (group.teacher?.fullName ?? "").toLowerCase().includes(query)
    );
  });

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
      <div className="space-y-4 md:space-y-6">
        <SkeletonHeader />
        <Skeleton className="w-full h-10 rounded-xl" />
        <Skeleton className="w-40 h-6" />
        <SkeletonCardGrid count={4} cols="grid-cols-1 lg:grid-cols-2 xl:grid-cols-3" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-8 text-center">
        <p className="text-red-500">{getErrorMessage(error, t("common.error"))}</p>
        <Button onClick={() => refetch()} className="mt-4">
          {t("common.retry")}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg md:text-xl font-bold text-gray-800 dark:text-gray-100">
            {t("groups.title")}
          </h1>
          <p className="text-gray-500 text-xs md:text-base">
            {t("groups.subtitle")}
          </p>
        </div>
        {headerActions}
      </div>

      <Input
        type="text"
        placeholder={t("groups.searchPlaceholder")}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        leftIcon={<Search className="w-4 h-4" />}
      />

      {/* Filter Tabs */}
      <div className="flex items-center ml-2 gap-6 border-b border-gray-200 dark:border-gray-700">
        {[
          { key: "active", label: t("groups.active") },
          { key: "completed", label: t("groups.completed") },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as typeof activeTab)}
            className={cn(
              "pb-2 text-xs font-medium border-b-2 transition-all sm:pb-3 sm:text-sm",
              activeTab === tab.key
                ? "border-warning text-warning"
                : "border-transparent text-gray-500 hover:text-gray-800 dark:text-gray-100",
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
          <p className="text-gray-500">{t("groups.notFound")}</p>
          {searchQuery && (
            <p className="text-sm text-gray-400 mt-1">
              {t("groups.noSearchResults", { query: searchQuery })}
            </p>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
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
                      <h3 className="font-bold text-gray-800 dark:text-gray-100 text-base md:text-lg group-hover:text-warning transition-colors">
                        {group.name}
                      </h3>
                      <span
                        className={cn(
                          "text-xs font-medium px-2 py-0.5 rounded-full",
                          group.status === "active"
                            ? "bg-[#E8F5E9] text-[#2E7D32]"
                            : "bg-gray-100 dark:bg-white/10 text-gray-500",
                        )}
                      >
                        {group.status === "active"
                          ? t("groups.active")
                          : t("groups.completed")}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                      {group.teacher?.fullName && (
                        <div className="flex items-center gap-1">
                          <User className="w-3.5 h-3.5" />
                          <span>{group.teacher.fullName}</span>
                        </div>
                      )}
                      {group.studentCount !== undefined && (
                        <div className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" />
                          <span>
                            {t("groups.studentsSuffix", {
                              count: group.studentCount,
                            })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 group-hover:text-warning group-hover:translate-x-1 transition-all duration-200" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {children}
    </div>
  );
};

