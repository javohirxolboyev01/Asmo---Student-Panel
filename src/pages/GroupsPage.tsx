// src/pages/GroupsPage.tsx
import { useEffect, useState } from "react";
import { useGroupStore } from "@/stores/groupStore";
import { Link } from "react-router-dom";
import { Search, Users, ChevronRight, User, Plus, Palette, Trash2 } from "lucide-react";
import { SkeletonHeader, SkeletonCardGrid, Skeleton } from "@/components/common/Skeleton";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuthStore } from "@/stores/authStore";
import { Modal } from "@/components/common/Modal";
import { Button, IconButton, Input, Select } from "@/components/ui";
import { teacherService } from "@/services/teacherService";
import { Direction, TeacherProfile } from "@/types/teacher";
import { toast, getErrorMessage } from "@/lib/toast";
import { useConfirm } from "@/hooks/useConfirm";

export const GroupsPage = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const isTeacher = user?.role === "teacher" || user?.role === "admin";
  const { groups, isLoading, error, fetchGroups } = useGroupStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"active">("active");

  const [directions, setDirections] = useState<Direction[]>([]);
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isDirectionsModalOpen, setIsDirectionsModalOpen] = useState(false);
  const [groupForm, setGroupForm] = useState({
    name: "",
    courseName: "",
    directionId: "",
    teacherId: "",
    maxStudents: "20",
    scheduleDays: "",
    scheduleTime: "",
  });
  const [newDirectionName, setNewDirectionName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { confirm, confirmModal } = useConfirm();

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  useEffect(() => {
    if (!isTeacher) return;
    teacherService.getDirections().then(setDirections);
    teacherService.getTeachers().then(setTeachers);
  }, [isTeacher]);

  const handleCreateGroup = async () => {
    setFormError(null);
    if (!groupForm.name || !groupForm.courseName || !groupForm.directionId || !groupForm.teacherId) {
      setFormError(t("common.error"));
      return;
    }
    setIsSubmitting(true);
    try {
      await teacherService.createGroup({
        name: groupForm.name,
        courseName: groupForm.courseName,
        directionId: groupForm.directionId,
        teacherId: groupForm.teacherId,
        maxStudents: Number(groupForm.maxStudents) || undefined,
        scheduleDays: groupForm.scheduleDays,
        scheduleTime: groupForm.scheduleTime,
      });
      setIsGroupModalOpen(false);
      setGroupForm({ name: "", courseName: "", directionId: "", teacherId: "", maxStudents: "20", scheduleDays: "", scheduleTime: "" });
      fetchGroups();
      toast.success(t("common.createSuccess"));
    } catch (err) {
      const message = getErrorMessage(err, t("common.error"));
      setFormError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddDirection = async () => {
    if (!newDirectionName.trim()) return;
    try {
      const direction = await teacherService.createDirection({ name: newDirectionName.trim() });
      setDirections((prev) => [...prev, direction]);
      setNewDirectionName("");
      toast.success(t("common.createSuccess"));
    } catch (err) {
      toast.error(getErrorMessage(err, t("common.error")));
    }
  };

  const handleDeleteDirection = async (id: string) => {
    const confirmed = await confirm(t("groups.deleteDirectionConfirm"));
    if (!confirmed) return;
    try {
      await teacherService.deleteDirection(id);
      setDirections((prev) => prev.filter((d) => d.id !== id));
      toast.success(t("common.deleteSuccess"));
    } catch (err) {
      toast.error(getErrorMessage(err, t("common.error")));
    }
  };

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
        <p className="text-red-500">{error}</p>
        <Button onClick={fetchGroups} className="mt-4">
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
        {isTeacher && (
          <div className="flex items-center gap-2 flex-shrink-0">
            <Button
              variant="outline"
              leftIcon={<Palette className="w-4 h-4" />}
              onClick={() => setIsDirectionsModalOpen(true)}
            >
              <span className="hidden sm:inline">{t("groups.manageDirections")}</span>
            </Button>
            <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setIsGroupModalOpen(true)}>
              <span className="hidden sm:inline">{t("groups.addGroup")}</span>
            </Button>
          </div>
        )}
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
                      <h3 className="font-bold text-gray-800 dark:text-gray-100 text-base md:text-lg group-hover:text-primary-500 transition-colors">
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
                  <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 group-hover:text-primary-500 group-hover:translate-x-1 transition-all duration-200" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {isTeacher && (
        <>
          <Modal isOpen={isGroupModalOpen} onClose={() => setIsGroupModalOpen(false)} title={t("groups.addGroup")}>
            <div className="space-y-3">
              <Input
                type="text"
                placeholder={t("groups.name")}
                value={groupForm.name}
                onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}
              />
              <Input
                type="text"
                placeholder={t("groups.courseName")}
                value={groupForm.courseName}
                onChange={(e) => setGroupForm({ ...groupForm, courseName: e.target.value })}
              />
              <Select
                value={groupForm.directionId}
                onChange={(e) => setGroupForm({ ...groupForm, directionId: e.target.value })}
              >
                <option value="">{t("groups.direction")}</option>
                {directions.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name}
                  </option>
                ))}
              </Select>
              <Select
                value={groupForm.teacherId}
                onChange={(e) => setGroupForm({ ...groupForm, teacherId: e.target.value })}
              >
                <option value="">{t("groups.teacher")}</option>
                {teachers.map((tch) => (
                  <option key={tch.id} value={tch.id}>
                    {tch.fullName}
                  </option>
                ))}
              </Select>
              <Input
                type="number"
                placeholder={t("groups.maxStudents")}
                value={groupForm.maxStudents}
                onChange={(e) => setGroupForm({ ...groupForm, maxStudents: e.target.value })}
              />
              <Input
                type="text"
                placeholder={t("groups.scheduleDays")}
                value={groupForm.scheduleDays}
                onChange={(e) => setGroupForm({ ...groupForm, scheduleDays: e.target.value })}
              />
              <Input
                type="text"
                placeholder={t("groups.scheduleTime")}
                value={groupForm.scheduleTime}
                onChange={(e) => setGroupForm({ ...groupForm, scheduleTime: e.target.value })}
              />
              {formError && <p className="text-sm text-red-500">{formError}</p>}
              <Button onClick={handleCreateGroup} isLoading={isSubmitting} fullWidth>
                {t("common.create")}
              </Button>
            </div>
          </Modal>

          <Modal
            isOpen={isDirectionsModalOpen}
            onClose={() => setIsDirectionsModalOpen(false)}
            title={t("groups.directionsTitle")}
          >
            <div className="space-y-3">
              {directions.length === 0 ? (
                <p className="text-sm text-gray-400">{t("groups.noDirections")}</p>
              ) : (
                <div className="space-y-2">
                  {directions.map((d) => (
                    <div key={d.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 dark:bg-white/5 rounded-xl">
                      <span className="text-sm text-gray-800 dark:text-gray-100">{d.name}</span>
                      <IconButton
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteDirection(d.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </IconButton>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder={t("groups.directionName")}
                  value={newDirectionName}
                  onChange={(e) => setNewDirectionName(e.target.value)}
                  containerClassName="flex-1"
                />
                <Button onClick={handleAddDirection}>{t("common.add")}</Button>
              </div>
            </div>
          </Modal>
        </>
      )}
      {confirmModal}
    </div>
  );
};
