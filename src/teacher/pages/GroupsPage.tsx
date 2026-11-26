// src/teacher/pages/GroupsPage.tsx
// "Guruhlarim": the list itself lives in GroupsView; this page adds the
// "+ Guruh" create sheet and the "Yo'nalishlar" (directions) manager.
import { useState } from "react";
import { Palette, Plus, Tags, Trash2 } from "lucide-react";
import { useCreateGroupMutation } from "@/hooks/queries/useGroups";
import {
  useDirectionsQuery,
  useCreateDirectionMutation,
  useDeleteDirectionMutation,
} from "@/hooks/queries/useDirections";
import { useTeachersQuery } from "@/hooks/queries/useTeachers";
import { useTranslation } from "@/hooks/useTranslation";
import { Modal } from "@/components/common/Modal";
import { Button, Input, Select, TimeField } from "@/components/ui";
import { toast, getErrorMessage } from "@/lib/toast";
import { useConfirm } from "@/hooks/useConfirm";
import { GroupsView } from "@/components/Groups/GroupsView";
import { EmptyBox, GROUP_COLORS } from "../components/ui";

const emptyGroupForm = {
  name: "",
  courseName: "",
  directionId: "",
  teacherId: "",
  maxStudents: "20",
  scheduleDays: "",
  scheduleTime: "",
};

export const GroupsPage = () => {
  const { t } = useTranslation();
  // Directions are view-only for teachers; only an admin may add or delete them.
  const { data: directions = [] } = useDirectionsQuery();
  const { data: teachers = [] } = useTeachersQuery();
  const createGroup = useCreateGroupMutation();
  const createDirection = useCreateDirectionMutation();
  const deleteDirection = useDeleteDirectionMutation();

  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isDirectionsModalOpen, setIsDirectionsModalOpen] = useState(false);
  const [groupForm, setGroupForm] = useState(emptyGroupForm);
  const [newDirectionName, setNewDirectionName] = useState("");
  const [newDirectionColor, setNewDirectionColor] = useState(GROUP_COLORS[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { confirm, confirmModal } = useConfirm();

  const set = (key: keyof typeof emptyGroupForm) => (e: { target: { value: string } }) => {
    setGroupForm((f) => ({ ...f, [key]: e.target.value }));
    setFormError(null);
  };

  const openGroupModal = () => {
    // A single direction/teacher is the obvious choice — preselect it.
    setGroupForm({
      ...emptyGroupForm,
      directionId: directions.length === 1 ? directions[0].id : "",
      teacherId: teachers.length === 1 ? teachers[0].id : "",
    });
    setFormError(null);
    setIsGroupModalOpen(true);
  };

  const handleCreateGroup = async () => {
    setFormError(null);
    if (!groupForm.name || !groupForm.courseName || !groupForm.directionId || !groupForm.teacherId) {
      setFormError(t("us.fillRequired"));
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
      setGroupForm(emptyGroupForm);
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
      await createDirection.mutateAsync({
        name: newDirectionName.trim(),
        color: newDirectionColor,
      });
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
        <>
          <Button
            variant="outline"
            title={t("groups.manageDirections")}
            leftIcon={<Tags className="u-i m" strokeWidth={2} />}
            onClick={() => setIsDirectionsModalOpen(true)}
          >
            {t("groups.directionsTitle")}
          </Button>
          <Button
            aria-label={t("groups.addGroup")}
            leftIcon={<Plus className="u-i m" strokeWidth={2} />}
            onClick={openGroupModal}
          >
            {t("us.groups.add")}
          </Button>
        </>
      }
    >
      <Modal isOpen={isGroupModalOpen} onClose={() => setIsGroupModalOpen(false)} title={t("us.groups.new")}>
        <form
          className="grid gap-3.5"
          onSubmit={(e) => {
            e.preventDefault();
            handleCreateGroup();
          }}
        >
          <Input
            label={t("groups.name")}
            type="text"
            placeholder={t("us.groups.namePh")}
            value={groupForm.name}
            onChange={set("name")}
            required
          />
          <Input
            label={t("groups.courseName")}
            type="text"
            value={groupForm.courseName}
            onChange={set("courseName")}
            required
          />
          <Select label={t("groups.direction")} value={groupForm.directionId} onChange={set("directionId")} required>
            <option value="">—</option>
            {directions.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
          <Select label={t("groups.teacher")} value={groupForm.teacherId} onChange={set("teacherId")} required>
            <option value="">—</option>
            {teachers.map((tch) => (
              <option key={tch.id} value={tch.id}>
                {tch.fullName}
              </option>
            ))}
          </Select>
          <Input
            label={t("groups.scheduleDays")}
            type="text"
            placeholder={t("us.groups.daysPh")}
            value={groupForm.scheduleDays}
            onChange={set("scheduleDays")}
          />
          <div className="grid grid-cols-2 gap-3">
            <TimeField
              label={t("groups.scheduleTime")}
              value={groupForm.scheduleTime}
              onChange={set("scheduleTime")}
            />
            <Input
              label={t("groups.maxStudents")}
              type="number"
              inputMode="numeric"
              min={1}
              value={groupForm.maxStudents}
              onChange={set("maxStudents")}
            />
          </div>
          {formError && (
            <p className="text-sm font-bold text-u-er" role="alert">
              {formError}
            </p>
          )}
          <div className="flex gap-2.5">
            <Button type="button" variant="outline" onClick={() => setIsGroupModalOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" className="flex-1" isLoading={isSubmitting}>
              {t("groups.addGroup")}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isDirectionsModalOpen}
        onClose={() => setIsDirectionsModalOpen(false)}
        title={t("groups.directionsTitle")}
      >
        <div className="grid gap-3.5">
          {directions.length === 0 ? (
            <EmptyBox card={false} tone="mu" icon={Palette} title={t("groups.noDirections")} />
          ) : (
            <div className="u-stack !gap-2">
              {directions.map((d) => (
                <div key={d.id} className="u-row">
                  <span
                    className="h-4 w-4 flex-none rounded-full"
                    style={{ background: d.color || "var(--pr)" }}
                    aria-hidden="true"
                  />
                  <div className="g">
                    <b className="break-words">{d.name}</b>
                  </div>
                  <button
                    type="button"
                    className="u-ib"
                    style={{ background: "var(--ert)", color: "var(--er)" }}
                    aria-label={t("common.delete")}
                    onClick={() => handleDeleteDirection(d.id)}
                  >
                    <Trash2 className="u-i m" strokeWidth={2} aria-hidden="true" />
                  </button>
                </div>
              ))}
            </div>
          )}
          <form
            className="flex items-end gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              handleAddDirection();
            }}
          >
            <Input
              label={t("groups.directionName")}
              type="text"
              value={newDirectionName}
              onChange={(e) => setNewDirectionName(e.target.value)}
              containerClassName="flex-1 min-w-0"
            />
            <label className="u-label flex-none">
              <span className="sr-only">{t("us.groups.directionColor")}</span>
              <input
                type="color"
                value={newDirectionColor}
                onChange={(e) => setNewDirectionColor(e.target.value)}
                aria-label={t("us.groups.directionColor")}
                className="h-[52px] w-[52px] cursor-pointer rounded-[14px] border-2 u-field p-1"
              />
            </label>
            <Button type="submit" className="h-[52px]" isLoading={createDirection.isPending}>
              {t("common.add")}
            </Button>
          </form>
        </div>
      </Modal>
      {confirmModal}
    </GroupsView>
  );
};
