// src/teacher/pages/TeachersPage.tsx
// Mock `teachers` view: back to "Ko'proq", header + "Qo'shish", one row per teacher.
import { useState, type FormEvent } from "react";
import { AlertTriangle, GraduationCap, Pencil, Plus, Trash2 } from "lucide-react";
import {
  useTeachersQuery,
  useCreateTeacherMutation,
  useUpdateTeacherMutation,
  useDeleteTeacherMutation,
} from "@/hooks/queries/useTeachers";
import { TeacherProfile } from "@/types/teacher";
import { Modal } from "@/components/common/Modal";
import { Button, Input, Checkbox } from "@/components/ui";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuthStore } from "@/stores/authStore";
import { toast, getErrorMessage } from "@/lib/toast";
import { useConfirm } from "@/hooks/useConfirm";
import { Avatar, EmptyBox, PageHeader, Skel, Tag } from "../components/ui";

const EMPTY_FORM = { fullName: "", avatar: "", email: "", password: "" };

export const TeachersPage = () => {
  const { t } = useTranslation();
  const me = useAuthStore((s) => s.user);
  // Adding and removing teachers is admin-only on the server.
  const isAdmin = me?.role === "admin";
  const { data: teachers = [], isLoading, error, refetch } = useTeachersQuery();
  const createTeacher = useCreateTeacherMutation();
  const updateTeacher = useUpdateTeacherMutation();
  const deleteTeacher = useDeleteTeacherMutation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<TeacherProfile | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [wantsLogin, setWantsLogin] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { confirm, confirmModal } = useConfirm();

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setWantsLogin(false);
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEdit = (teacher: TeacherProfile) => {
    setEditing(teacher);
    setForm({ fullName: teacher.fullName, avatar: teacher.avatar ?? "", email: "", password: "" });
    setWantsLogin(false);
    setFormError(null);
    setIsModalOpen(true);
  };

  const isSubmitting = createTeacher.isPending || updateTeacher.isPending;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!form.fullName.trim()) {
      setFormError(t("us.fillRequired"));
      return;
    }
    try {
      if (editing) {
        await updateTeacher.mutateAsync({
          id: editing.id,
          payload: { fullName: form.fullName, avatar: form.avatar || undefined },
        });
      } else {
        await createTeacher.mutateAsync({
          fullName: form.fullName,
          avatar: form.avatar || undefined,
          email: wantsLogin ? form.email : undefined,
          password: wantsLogin ? form.password : undefined,
        });
      }
      setIsModalOpen(false);
      toast.success(editing ? t("us.people.saved") : t("us.people.teacherAdded"));
    } catch (err) {
      const message = getErrorMessage(err, t("common.error"));
      setFormError(message);
      toast.error(message);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm(t("teachers.deleteConfirm"), {
      title: t("common.deleteTitle"),
      tone: "danger",
    });
    if (!confirmed) return;
    try {
      await deleteTeacher.mutateAsync(id);
      toast.success(t("common.deleteSuccess"));
    } catch (err) {
      toast.error(getErrorMessage(err, t("common.error")));
    }
  };

  return (
    <>
      <PageHeader
        back={{ to: "/more" }}
        title={t("teachers.title")}
        subtitle={t("us.people.teachersSubtitle")}
        right={
          isAdmin && (
            <button type="button" className="u-btn" onClick={openCreate}>
              <Plus className="u-i m" strokeWidth={2} aria-hidden="true" />
              {t("common.add")}
            </button>
          )
        }
      />

      <div className="u-stack max-w-[680px]">
        {error ? (
          <EmptyBox
            tone="er"
            icon={AlertTriangle}
            title={getErrorMessage(error, t("common.error"))}
            action={<Button onClick={() => refetch()}>{t("common.retry")}</Button>}
          />
        ) : isLoading ? (
          Array.from({ length: 3 }, (_, i) => <Skel key={i} className="h-[74px] rounded-[20px]" />)
        ) : teachers.length === 0 ? (
          <EmptyBox tone="mu" icon={GraduationCap} title={t("teachers.notFound")} />
        ) : (
          teachers.map((teacher) => {
            const isMe = !!me && !!teacher.userId && teacher.userId === me.id;
            return (
              <div key={teacher.id} className="u-les min-w-0">
                <Avatar name={teacher.fullName} src={teacher.avatar} seed={teacher.userId ?? teacher.id} />
                <div className="min-w-0 flex-1">
                  <b className="block truncate text-[17px]">{teacher.fullName}</b>
                  <small className="u-sub m-0 block truncate">
                    {[
                      teacher.email || t("teachers.noLogin"),
                      t("teachers.groupsCount", { count: teacher.groupsCount }),
                    ].join(" · ")}
                  </small>
                </div>
                {isMe && <Tag tone="pr">{t("us.people.me")}</Tag>}
                {/* A teacher may only edit their own profile (enforced by the API). */}
                {(isAdmin || isMe) && (
                  <button
                    type="button"
                    className="u-ib"
                    aria-label={t("common.edit")}
                    onClick={() => openEdit(teacher)}
                  >
                    <Pencil className="u-i s" strokeWidth={2} aria-hidden="true" />
                  </button>
                )}
                {isAdmin && (
                  <button
                    type="button"
                    className="u-ib"
                    aria-label={t("common.delete")}
                    onClick={() => handleDelete(teacher.id)}
                    disabled={deleteTeacher.isPending}
                  >
                    <Trash2 className="u-i s" strokeWidth={2} aria-hidden="true" />
                  </button>
                )}
              </div>
            );
          })
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editing ? t("us.people.editTeacher") : t("us.people.newTeacher")}
      >
        <form className="grid gap-3.5" onSubmit={handleSubmit}>
          <Input
            label={t("teachers.fullName")}
            required
            autoFocus
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          />
          <Input
            label={t("us.people.avatarUrl")}
            placeholder="https://"
            value={form.avatar}
            onChange={(e) => setForm({ ...form, avatar: e.target.value })}
          />
          {!editing && (
            <>
              <Checkbox
                checked={wantsLogin}
                onChange={(e) => setWantsLogin(e.target.checked)}
                label={t("teachers.createLogin")}
              />
              {wantsLogin && (
                <>
                  <Input
                    label={t("teachers.email")}
                    type="email"
                    autoComplete="off"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                  <Input
                    label={t("teachers.password")}
                    type="password"
                    autoComplete="new-password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                </>
              )}
            </>
          )}
          {formError && <p className="text-[13px] font-bold text-u-er">{formError}</p>}
          <div className="flex gap-2.5">
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" className="flex-1" isLoading={isSubmitting}>
              {editing ? t("common.save") : t("common.add")}
            </Button>
          </div>
        </form>
      </Modal>
      {confirmModal}
    </>
  );
};
