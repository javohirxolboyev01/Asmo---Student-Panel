// src/student/pages/GroupsPage.tsx
// "Guruhlarim": search + Faol/Tugagan tabs + group cards (mock: #p-guruh).
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import { useGroupsQuery } from "@/hooks/queries/useGroups";
import { useTranslation } from "@/hooks/useTranslation";
import { getErrorMessage } from "@/lib/toast";
import type { Group } from "@/types/group";
import {
  EmptyState,
  ErrorState,
  PageHeader,
  SearchBox,
  Segmented,
  Skel,
} from "../components/ui";
import { groupEmoji } from "../components/groups/groupEmoji";
import "../theme/groups.css";

type Tab = "active" | "completed";

const GroupsSkeleton = () => (
  <div aria-busy="true">
    <Skel className="mt-5 h-9 w-1/2" />
    <Skel className="mt-2 h-4 w-2/3" />
    <Skel className="mt-4 h-12" />
    <Skel className="my-3.5 h-11" />
    <div className="sp-gl">
      {Array.from({ length: 4 }, (_, i) => (
        <Skel key={i} className="h-[84px]" />
      ))}
    </div>
  </div>
);

export const GroupsPage = () => {
  const { t } = useTranslation();
  const { data, isLoading, error, refetch } = useGroupsQuery();
  const groups = data ?? [];
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<Tab>("active");

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    return groups.filter(
      (g: Group) =>
        g.status === tab &&
        (!q ||
          (g.name ?? "").toLowerCase().includes(q) ||
          (g.direction?.name ?? "").toLowerCase().includes(q) ||
          (g.teacher?.fullName ?? "").toLowerCase().includes(q)),
    );
  }, [groups, search, tab]);

  if (isLoading) {
    return (
      <div className="sp-page">
        <GroupsSkeleton />
      </div>
    );
  }

  // Cached data wins over a failed background refetch (offline, flaky network).
  if (error && !data) {
    return (
      <div className="sp-page">
        <PageHeader title={t("groups.title")} subtitle={t("groups.subtitle")} />
        <ErrorState
          message={getErrorMessage(error, t("common.error"))}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const empty = search.trim() ? (
    <EmptyState
      emoji="🔭"
      title={t("space.groups.searchEmpty")}
      text={t("groups.noSearchResults", { query: search.trim() })}
      className="col-span-full"
    />
  ) : tab === "active" ? (
    <EmptyState
      emoji="🛸"
      title={t("space.groups.emptyActive")}
      text={t("space.groups.emptyActiveHint")}
      className="col-span-full"
    />
  ) : (
    <EmptyState
      emoji="🌌"
      title={t("space.groups.emptyCompleted")}
      text={t("space.groups.emptyCompletedHint")}
      className="col-span-full"
    />
  );

  return (
    <div className="sp-page">
      <PageHeader title={t("groups.title")} subtitle={t("groups.subtitle")} />
      <SearchBox
        value={search}
        onChange={setSearch}
        placeholder={t("groups.searchPlaceholder")}
      />
      <div className="sp-groups-tabs">
        <Segmented<Tab>
          value={tab}
          onChange={setTab}
          options={[
            { value: "active", label: t("groups.active") },
            { value: "completed", label: t("groups.completed") },
          ]}
        />
      </div>
      <div className="sp-gl">
        {shown.length === 0
          ? empty
          : shown.map((g) => (
              <Link key={g.id} to={`/groups/${g.id}`} className="sp-gc">
                <div className="sp-a" aria-hidden="true">
                  {groupEmoji(g.id)}
                </div>
                <div className="sp-t">
                  <b>{g.name}</b>
                  <span
                    className={
                      g.status === "active" ? "sp-badge" : "sp-badge sp-mute"
                    }
                  >
                    {g.status === "active"
                      ? t("groups.active")
                      : t("groups.completed")}
                  </span>
                  <small>
                    {g.teacher?.fullName && (
                      <span className="sp-groups-teacher">
                        <GraduationCap aria-hidden="true" />
                        <span className="sp-groups-teacher-name">
                          {g.teacher.fullName}
                        </span>
                      </span>
                    )}
                    {g.teacher?.fullName &&
                      g.studentCount !== undefined &&
                      " · "}
                    {g.studentCount !== undefined &&
                      `👥 ${t("groups.studentsSuffix", { count: g.studentCount })}`}
                  </small>
                </div>
                <span className="sp-groups-chev" aria-hidden="true">
                  ›
                </span>
              </Link>
            ))}
      </div>
    </div>
  );
};
