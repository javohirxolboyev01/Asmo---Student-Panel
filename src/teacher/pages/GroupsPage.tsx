// src/teacher/pages/GroupsPage.tsx
import { useState } from "react";
import { useCreateGroupMutation } from "@/hooks/queries/useGroups";
import {
  useDirectionsQuery,
  useCreateDirectionMutation,
  useDeleteDirectionMutation,
} from "@/hooks/queries/useDirections";
import { useTeachersQuery } from "@/hooks/queries/useTeachers";
import { Plus, Palette, Trash2 } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { Modal } from "@/components/common/Modal";
import { Button, IconButton, Input, Select } from "@/components/ui";
import { toast, getErrorMessage } from "@/lib/toast";
import { useConfirm } from "@/hooks/useConfirm";
import { GroupsView } from "@/components/Groups/GroupsView";

export const GroupsPage = () => {
  const { t } = useTranslation();
  const { data: directions = [] } = useDirectionsQuery();
  const { data: teachers = [] } = useTeachersQuery();
  const createGroup = useCreateGroupMutation();
  const createDirection = useCreateDirectionMutation();
  const deleteDirection = useDeleteDirectionMutation();

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

  const handleCreateGroup = async () => {
    setFormError(null);
    if (!groupForm.name || !groupForm.courseName || !groupForm.directionId || !groupForm.teacherId) {
      setFormError(t("common.error"));
      return;
    }
    setIsSubmitting(true);
    try {
      await createGroup.mutateAsync({
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
      await createDirection.mutateAsync({ name: newDirectionName.trim() });
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
      await deleteDirection.mutateAsync(id);
      toast.success(t("common.deleteSuccess"));
    } catch (err) {
      toast.error(getErrorMessage(err, t("common.error")));
    }
  };

  return (
    <GroupsView
      headerActions={
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
      }
    >
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
      {confirmModal}
    </GroupsView>
  );
};
