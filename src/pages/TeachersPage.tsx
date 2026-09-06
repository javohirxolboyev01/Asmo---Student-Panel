// src/pages/TeachersPage.tsx
import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, GraduationCap, Mail } from "lucide-react";
import { teacherService } from "@/services/teacherService";
import { TeacherProfile } from "@/types/teacher";
import { Skeleton, SkeletonCardGrid } from "@/components/common/Skeleton";
import { Modal } from "@/components/common/Modal";
import { Button, IconButton, Input, Checkbox } from "@/components/ui";
import { getAvatarUrl } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { toast, getErrorMessage } from "@/lib/toast";
import { useConfirm } from "@/hooks/useConfirm";

export const TeachersPage = () => {
  const { t } = useTranslation();
  const [teachers, setTeachers] = useState<TeacherProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<TeacherProfile | null>(null);
  const [form, setForm] = useState({ fullName: "", avatar: "", email: "", password: "" });
  const [wantsLogin, setWantsLogin] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const { confirm, confirmModal } = useConfirm();

  const load = async () => {
    setIsLoading(true);
    try {
      const data = await teacherService.getTeachers();
      setTeachers(data);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ fullName: "", avatar: "", email: "", password: "" });
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

  const handleSubmit = async () => {
    setFormError(null);
    if (!form.fullName) return;
    setIsSubmitting(true);
    try {
      if (editing) {
        await teacherService.updateTeacher(editing.id, { fullName: form.fullName, avatar: form.avatar || undefined });
      } else {
        await teacherService.createTeacher({
          fullName: form.fullName,
          avatar: form.avatar || undefined,
          email: wantsLogin ? form.email : undefined,
          password: wantsLogin ? form.password : undefined,
        });
      }
      setIsModalOpen(false);
      load();
      toast.success(editing ? t("common.updateSuccess") : t("common.createSuccess"));
    } catch (err) {
      const message = getErrorMessage(err, t("common.error"));
      setFormError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = await confirm(t("teachers.deleteConfirm"));
    if (!confirmed) return;
    try {
      await teacherService.deleteTeacher(id);
      load();
      toast.success(t("common.deleteSuccess"));
    } catch (err) {
      toast.error(getErrorMessage(err, t("common.error")));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <Skeleton className="w-48 h-8" />
        <SkeletonCardGrid count={4} cols="grid-cols-1 lg:grid-cols-2 xl:grid-cols-3" />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-lg md:text-xl font-bold text-gray-800 dark:text-gray-100">{t("teachers.title")}</h1>
          <p className="text-gray-500 text-xs md:text-base">{t("teachers.subtitle")}</p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={openCreate}>
          {t("teachers.addTeacher")}
        </Button>
      </div>

      {teachers.length === 0 ? (
        <div className="card p-8 text-center">
          <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">{t("teachers.notFound")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
          {teachers.map((teacher) => (
            <div key={teacher.id} className="card p-4 md:p-5">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={getAvatarUrl(teacher.avatar, teacher.fullName)}
                    alt={teacher.fullName}
                    className="w-11 h-11 rounded-full flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm md:text-base truncate">
                      {teacher.fullName}
                    </h3>
                    <p className="text-xs text-gray-500 flex items-center gap-1 truncate">
                      {teacher.email ? (
                        <>
                          <Mail className="w-3 h-3" /> {teacher.email}
                        </>
                      ) : (
                        t("teachers.noLogin")
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <IconButton size="sm" onClick={() => openEdit(teacher)}>
                    <Pencil className="w-4 h-4" />
                  </IconButton>
                  <IconButton size="sm" variant="danger" onClick={() => handleDelete(teacher.id)}>
                    <Trash2 className="w-4 h-4" />
                  </IconButton>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-500">
                {t("teachers.groupsCount", { count: teacher.groupsCount })}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editing ? t("common.edit") : t("teachers.addTeacher")}
      >
        <div className="space-y-3">
          <Input
            type="text"
            placeholder={t("teachers.fullName")}
            value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          />
          <Input
            type="text"
            placeholder="Avatar URL"
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
                    type="email"
                    placeholder={t("teachers.email")}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                  <Input
                    type="password"
                    placeholder={t("teachers.password")}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                  />
                </>
              )}
            </>
          )}
          {formError && <p className="text-sm text-red-500">{formError}</p>}
          <Button onClick={handleSubmit} isLoading={isSubmitting} fullWidth>
            {editing ? t("common.update") : t("common.create")}
          </Button>
        </div>
      </Modal>
      {confirmModal}
    </div>
  );
};
