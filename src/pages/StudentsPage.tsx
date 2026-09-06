// src/pages/StudentsPage.tsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Search, Users, ChevronRight, Coins, Plus, Trash2 } from "lucide-react";
import { useStudentsStore } from "@/stores/studentsStore";
import { useGroupStore } from "@/stores/groupStore";
import { studentService } from "@/services/studentService";
import { SkeletonHeader, SkeletonCardGrid, Skeleton } from "@/components/common/Skeleton";
import { Modal } from "@/components/common/Modal";
import { Button, IconButton, Input, Select } from "@/components/ui";
import { getAvatarUrl } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { toast, getErrorMessage } from "@/lib/toast";
import { useConfirm } from "@/hooks/useConfirm";

export const StudentsPage = () => {
  const { t } = useTranslation();
  const { students, isLoading, error, fetchStudents, deleteStudent } = useStudentsStore();
  const { confirm, confirmModal } = useConfirm();
  const { groups, fetchGroups } = useGroupStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ email: "", password: "", firstName: "", lastName: "", phone: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    fetchGroups();
  }, [fetchGroups]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchStudents({ search: searchQuery || undefined, groupId: groupFilter || undefined });
    }, 250);
    return () => clearTimeout(timeout);
  }, [searchQuery, groupFilter, fetchStudents]);

  const handleCreate = async () => {
    setFormError(null);
    if (!form.email || !form.password || !form.firstName || !form.lastName) return;
    setIsSubmitting(true);
    try {
      await studentService.createStudent(form);
      setIsModalOpen(false);
      setForm({ email: "", password: "", firstName: "", lastName: "", phone: "" });
      fetchStudents({ search: searchQuery || undefined, groupId: groupFilter || undefined });
      toast.success(t("common.createSuccess"));
    } catch (err) {
      const message = getErrorMessage(err, t("common.error"));
      setFormError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    const confirmed = await confirm(t("common.deleteConfirm"), {
      title: t("common.deleteTitle"),
      tone: "danger",
    });
    if (!confirmed) return;
    try {
      await deleteStudent(id);
      toast.success(t("common.deleteSuccess"));
    } catch (err) {
      toast.error(getErrorMessage(err, t("common.error")));
    }
  };

  if (isLoading && students.length === 0) {
    return (
      <div className="space-y-4 md:space-y-6">
        <SkeletonHeader />
        <Skeleton className="w-full h-10 rounded-xl" />
        <SkeletonCardGrid count={6} cols="grid-cols-1 lg:grid-cols-2 xl:grid-cols-3" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="card p-8 text-center">
        <p className="text-red-500">{error}</p>
        <Button onClick={() => fetchStudents()} className="mt-4">
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
            {t("students.title")}
          </h1>
          <p className="text-gray-500 text-xs md:text-base">{t("students.subtitle")}</p>
        </div>
        <Button leftIcon={<Plus className="w-4 h-4" />} onClick={() => setIsModalOpen(true)}>
          {t("students.addStudent")}
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          type="text"
          placeholder={t("students.searchPlaceholder")}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search className="w-4 h-4" />}
          containerClassName="flex-1"
        />
        <Select value={groupFilter} onChange={(e) => setGroupFilter(e.target.value)} containerClassName="sm:w-56">
          <option value="">{t("students.groupFilter")}</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </Select>
      </div>

      {students.length === 0 ? (
        <div className="card p-8 text-center">
          <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">{t("students.notFound")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3">
          {students.map((student) => (
            <Link
              key={student.id}
              to={`/students/${student.id}`}
              className="card block hover:shadow-card-hover transition-all duration-200 hover:scale-[1.01] group p-4 md:p-5"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  <img
                    src={getAvatarUrl(student.avatar, `${student.firstName} ${student.lastName}`)}
                    alt={student.firstName}
                    className="w-11 h-11 rounded-full flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-800 dark:text-gray-100 text-sm md:text-base group-hover:text-primary-500 transition-colors truncate">
                      {student.firstName} {student.lastName}
                    </h3>
                    <p className="text-xs text-gray-500 truncate">
                      {student.groups.map((g) => g.name).join(", ") || t("students.noGroups")}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <IconButton
                    type="button"
                    size="sm"
                    variant="danger"
                    onClick={(e) => handleDelete(e, student.id)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </IconButton>
                  <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-primary-500 group-hover:translate-x-1 transition-all duration-200" />
                </div>
              </div>
              <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Coins className="w-3.5 h-3.5 text-warning" />
                  <span>{student.coinBalance}</span>
                </div>
                <div>{student.attendancePercentage}% {t("students.attendance").toLowerCase()}</div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={t("students.addStudent")}>
        <div className="space-y-3">
          <Input
            type="text"
            placeholder={t("students.firstName")}
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
          />
          <Input
            type="text"
            placeholder={t("students.lastName")}
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
          />
          <Input
            type="email"
            placeholder={t("students.email")}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <Input
            type="password"
            placeholder={t("students.password")}
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <Input
            type="text"
            placeholder={t("students.phone")}
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          {formError && <p className="text-sm text-red-500">{formError}</p>}
          <Button onClick={handleCreate} isLoading={isSubmitting} fullWidth>
            {t("common.create")}
          </Button>
        </div>
      </Modal>
      {confirmModal}
    </div>
  );
};
