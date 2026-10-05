// src/components/Groups/GroupsView.tsx
// Teacher "Guruhlarim" list, 1:1 with the Ustoz paneli mock `groups` view:
// header + search + Faol/Tugagan switch + coloured group cards. The page adds
// its own actions (create group, directions) through the slots below.
import { ReactNode, useMemo, useState } from "react";
import type { CSSProperties } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Clock, Search } from "lucide-react";
import { useGroupsQuery } from "@/hooks/queries/useGroups";
import { useTranslation } from "@/hooks/useTranslation";
import { Button, Input } from "@/components/ui";
import { getErrorMessage } from "@/lib/toast";
import type { Group } from "@/types/group";
import {
  Avatar,
  Bar,
  EmptyBox,
  PageHeader,
  Seg,
  Skel,
  Tag,
  WeekDots,
  groupColor,
  parseScheduleDays,
} from "@/teacher/components/ui";

interface GroupsViewProps {
  /** Rendered at the right of the page title (the teacher's create/directions buttons). */
  headerActions?: ReactNode;
  /** Rendered after the list (the teacher's modals). */
  children?: ReactNode;
}

type Tab = "active" | "completed";

const GroupCard = ({ group }: { group: Group }) => {
  const { t } = useTranslation();
  const color = groupColor(group.id, group.direction?.color);
  const count = group.studentCount ?? group.studentsPreview?.length ?? 0;
  const max = group.maxStudents ?? 0;
  const level = group.courseName || group.direction?.name;
  const preview = group.studentsPreview ?? [];
  const active = group.status === "active";

  return (
    <Link to={`/groups/${group.id}`} className="u-gcard" style={{ "--g": color } as CSSProperties}>
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="break-words">{group.name}</h2>
          {(level || group.teacher?.fullName) && (
            <p className="u-sub !m-0 truncate">
              {[level, group.teacher?.fullName].filter(Boolean).join(" · ")}
            </p>
          )}
        </div>
        <Tag tone={active ? "ok" : "mu"}>{active ? t("groups.active") : t("groups.completed")}</Tag>
      </div>
      <WeekDots days={parseScheduleDays(group.schedule?.days)} color={color} />
      <div className="flex flex-wrap items-center justify-between gap-2.5">
        {group.schedule?.time ? (
          <span className="u-chip">
            <Clock className="u-i s" strokeWidth={2} aria-hidden="true" />
            {group.schedule.time}
          </span>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-2.5">
          {preview.length > 0 && (
            <div className="u-avs">
              {preview.slice(0, 3).map((s) => (
                <Avatar key={s.id} name={`${s.firstName} ${s.lastName}`} src={s.avatar} seed={s.id} size="s" />
              ))}
            </div>
          )}
          <b>{max ? `${count}/${max}` : t("groups.studentsSuffix", { count })}</b>
        </div>
      </div>
      {max > 0 && <Bar value={(count / max) * 100} color={color} />}
    </Link>
  );
};

export const GroupsView = ({ headerActions, children }: GroupsViewProps) => {
  const { t } = useTranslation();
  const { data: groups = [], isLoading, error, refetch } = useGroupsQuery();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<Tab>("active");

  const activeCount = groups.filter((g) => g.status === "active").length;
  const displayGroups = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return groups.filter(
      (group) =>
        group.status === activeTab &&
        (!query ||
          (group.name ?? "").toLowerCase().includes(query) ||
          (group.courseName ?? "").toLowerCase().includes(query) ||
          (group.direction?.name ?? "").toLowerCase().includes(query) ||
          (group.teacher?.fullName ?? "").toLowerCase().includes(query)),
    );
  }, [groups, searchQuery, activeTab]);

  if (isLoading) {
    return (
      <div aria-busy="true">
        <Skel className="mt-2 h-8 w-1/2 rounded-xl" />
        <Skel className="mt-2 h-4 w-1/3 rounded-lg" />
        <Skel className="mt-6 h-[52px] rounded-[14px]" />
        <Skel className="my-3.5 h-[46px] w-52 rounded-[14px]" />
        <div className="u-cols c3 u-stack">
          {Array.from({ length: 3 }, (_, i) => (
            <Skel key={i} className="h-[196px]" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <EmptyBox
        tone="er"
        icon={AlertTriangle}
        title={getErrorMessage(error, t("common.error"))}
        action={<Button onClick={() => refetch()}>{t("common.retry")}</Button>}
      />
    );
  }

  return (
    <div>
      <PageHeader
        title={t("groups.title")}
        subtitle={t("us.groups.activeCount", { n: activeCount })}
        right={headerActions}
      />

      <Input
        type="search"
        placeholder={t("groups.searchPlaceholder")}
        aria-label={t("groups.searchPlaceholder")}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        leftIcon={<Search className="h-[18px] w-[18px]" strokeWidth={2} aria-hidden="true" />}
      />
      <div className="my-3.5">
        <Seg<Tab>
          value={activeTab}
          onChange={setActiveTab}
          options={[
            { value: "active", label: t("groups.active") },
            { value: "completed", label: t("groups.completed") },
          ]}
        />
      </div>

      <div className="u-cols c3 u-stack">
        {displayGroups.length === 0 ? (
          <EmptyBox
            className="col-span-full"
            title={t("us.groups.notFound")}
            text={searchQuery.trim() ? t("groups.noSearchResults", { query: searchQuery.trim() }) : t("us.groups.emptyText")}
          />
        ) : (
          displayGroups.map((group) => <GroupCard key={group.id} group={group} />)
        )}
      </div>

      {children}
    </div>
  );
};
