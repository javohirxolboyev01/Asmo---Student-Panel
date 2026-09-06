// src/pages/GroupDetailPage.tsx
import { cn, getAvatarUrl } from "@/lib/utils";
import { useEffect, useState } from "react";
import { Users, Calendar, Clock, Plus, X, Coins, Pencil, Trash2 } from "lucide-react";
import { formatDate } from "@/utilist/formatData";
import { useGroupStore } from "@/stores/groupStore";
import { useAuthStore } from "@/stores/authStore";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Skeleton, SkeletonCardGrid } from "@/components/common/Skeleton";
import { useTranslation } from "@/hooks/useTranslation";
import { Modal } from "@/components/common/Modal";
import { Button, IconButton, Input, Textarea, Select } from "@/components/ui";
import { teacherService } from "@/services/teacherService";
import { studentService } from "@/services/studentService";
import { StudentSummary } from "@/types/teacher";
import { toast, getErrorMessage } from "@/lib/toast";
import { useConfirm } from "@/hooks/useConfirm";

export const GroupDetailPage = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const isTeacher = user?.role === "teacher" || user?.role === "admin";
  const {
    selectedGroup,
    lessons,
    students,
    isLoading,
    error,
    fetchGroupDetail,
    clearSelectedGroup,
  } = useGroupStore();

  const [isLessonModalOpen, setIsLessonModalOpen] = useState(false);
  const [lessonForm, setLessonForm] = useState({ topic: "", description: "", lessonDate: "" });
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [allStudents, setAllStudents] = useState<StudentSummary[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    courseName: "",
    maxStudents: "20",
    scheduleDays: "",
    scheduleTime: "",
    status: "ACTIVE",
  });
  const [isSavingGroup, setIsSavingGroup] = useState(false);
  const { confirm, confirmModal } = useConfirm();

  useEffect(() => {
    if (id) fetchGroupDetail(id);
    return () => clearSelectedGroup();
  }, [id, fetchGroupDetail, clearSelectedGroup]);

  useEffect(() => {
    if (!selectedGroup) return;
    setEditForm({
      name: selectedGroup.name ?? "",
      courseName: selectedGroup.courseName ?? "",
      maxStudents: String(selectedGroup.maxStudents ?? 20),
      scheduleDays: (selectedGroup.schedule?.days ?? []).join(", "),
      scheduleTime: selectedGroup.schedule?.time ?? "",
      status: "ACTIVE",
    });
  }, [selectedGroup]);

  const refresh = () => id && fetchGroupDetail(id);

  const openStudentModal = async () => {
    setIsStudentModalOpen(true);
    const data = await studentService.getStudents();
    setAllStudents(data);
  };

  const handleAddLesson = async () => {
    setFormError(null);
    if (!id || !lessonForm.topic || !lessonForm.lessonDate) return;
    setIsSubmitting(true);
    try {
      await teacherService.createLesson(id, {
        topic: lessonForm.topic,
        description: lessonForm.description || undefined,
        lessonDate: lessonForm.lessonDate,
      });
      setIsLessonModalOpen(false);
      setLessonForm({ topic: "", description: "", lessonDate: "" });
      refresh();
      toast.success(t("common.createSuccess"));
    } catch (err) {
      const message = getErrorMessage(err, t("common.error"));
      setFormError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddStudent = async () => {
    if (!id || !selectedStudentId) return;
    try {
      await teacherService.enrollStudent(id, selectedStudentId);
      setIsStudentModalOpen(false);
      setSelectedStudentId("");
      refresh();
      toast.success(t("common.createSuccess"));
    } catch (err) {
      toast.error(getErrorMessage(err, t("common.error")));
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!id) return;
    const confirmed = await confirm(t("common.deleteConfirm"));
    if (!confirmed) return;
    try {
      await teacherService.unenrollStudent(id, studentId);
      refresh();
      toast.success(t("common.deleteSuccess"));
    } catch (err) {
      toast.error(getErrorMessage(err, t("common.error")));
    }
  };

  const handleSaveGroup = async () => {
    if (!id) return;
    setIsSavingGroup(true);
    try {
      await teacherService.updateGroup(id, {
        name: editForm.name,
        courseName: editForm.courseName,
        maxStudents: Number(editForm.maxStudents) || undefined,
        scheduleDays: editForm.scheduleDays,
        scheduleTime: editForm.scheduleTime,
        status: editForm.status,
      });
      setIsEditModalOpen(false);
      refresh();
      toast.success(t("common.updateSuccess"));
    } catch (err) {
      toast.error(getErrorMessage(err, t("common.error")));
    } finally {
      setIsSavingGroup(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!id) return;
    const confirmed = await confirm(t("groups.deleteConfirm"));
    if (!confirmed) return;
    try {
      await teacherService.deleteGroup(id);
      toast.success(t("common.deleteSuccess"));
      navigate("/groups");
    } catch (err) {
      toast.error(getErrorMessage(err, t("common.error")));
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 md:space-y-5">
        <Skeleton className="w-32 h-4" />
        <SkeletonCardGrid count={4} cols="grid-cols-1 lg:grid-cols-2" />
      </div>
    );
  }

  if (error || !selectedGroup) {
    return (
      <div className="card p-8 text-center">
        <p className="text-red-500">{error || t("groupDetail.notFound")}</p>
        <Button onClick={() => navigate("/groups")} className="mt-4">
          {t("groupDetail.backToGroups")}
        </Button>
      </div>
    );
  }

  const enrolledIds = new Set((students ?? []).map((s) => s.id));
  const availableStudents = allStudents.filter((s) => !enrolledIds.has(s.id));

  return (
    <div className="space-y-4 md:space-y-5">

      {isTeacher && (
        <div className="card p-5">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                  {selectedGroup.name}
                </h1>
              </div>
              <p className="text-sm text-gray-400">{selectedGroup.courseName}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
              <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-white/5 px-3 py-1.5 rounded-full">
                <Users className="w-3.5 h-3.5" />
                <span>
                  {selectedGroup.studentCount}/{selectedGroup.maxStudents}
                </span>
              </div>
              {selectedGroup.schedule?.days && (
                <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-white/5 px-3 py-1.5 rounded-full">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{selectedGroup.schedule.days.join(", ")}</span>
                </div>
              )}
              {selectedGroup.schedule?.time && (
                <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-white/5 px-3 py-1.5 rounded-full">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{selectedGroup.schedule.time}</span>
                </div>
              )}
              <IconButton size="sm" onClick={() => setIsEditModalOpen(true)}>
                <Pencil className="w-3.5 h-3.5" />
              </IconButton>
              <IconButton size="sm" variant="danger" onClick={handleDeleteGroup}>
                <Trash2 className="w-3.5 h-3.5" />
              </IconButton>
            </div>
          </div>
        </div>
      )}

      {/* ── Students roster (teacher only) ── */}
      {isTeacher && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">{t("groupDetail.studentsTitle")}</h3>
            <Button variant="outline" size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={openStudentModal}>
              {t("groupDetail.addStudent")}
            </Button>
          </div>
          {!students || students.length === 0 ? (
            <p className="text-sm text-gray-400">{t("groupDetail.noStudents")}</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {students.map((s) => (
                <Link
                  key={s.id}
                  to={`/students/${s.id}`}
                  className="flex items-center justify-between gap-2 p-2.5 bg-gray-50 dark:bg-white/5 rounded-xl hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <img src={getAvatarUrl(s.avatar, `${s.firstName} ${s.lastName}`)} alt="" className="w-8 h-8 rounded-full flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
                        {s.firstName} {s.lastName}
                      </p>
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Coins className="w-3 h-3 text-warning" /> {s.coinBalance}
                      </p>
                    </div>
                  </div>
                  <IconButton
                    variant="danger"
                    size="sm"
                    className="flex-shrink-0"
                    onClick={(e) => {
                      e.preventDefault();
                      handleRemoveStudent(s.id);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </IconButton>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Lessons list ── */}
      <div>
        {isTeacher && (
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-gray-800 dark:text-gray-100">{t("groupDetail.topics")}</h3>
            <Button size="sm" leftIcon={<Plus className="w-3.5 h-3.5" />} onClick={() => setIsLessonModalOpen(true)}>
              {t("groupDetail.addLesson")}
            </Button>
          </div>
        )}
        <div
          className={
            lessons.length === 0
              ? ""
              : "grid grid-cols-1 lg:grid-cols-2 gap-3"
          }
        >
          {lessons.length === 0 ? (
            <div className="card p-10 text-center">
              <p className="text-sm text-gray-400">{t("groupDetail.noLessons")}</p>
            </div>
          ) : (
            lessons.map((lesson) => (
              <Link
                key={lesson.id}
                to={`/lessons/${lesson.id}`}
                className="card block hover:shadow-md transition-shadow duration-200"
              >
                {/* ── Row: Mavzu ── */}
                <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                    {t("groupDetail.topics")}
                  </span>
                  <span className="text-sm text-gray-700 dark:text-gray-300 font-medium text-right max-w-[60%] truncate">
                    {lesson.topic}
                  </span>
                </div>

                {/* ── Row: Uyga vazifa holati ── */}
                <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                    {t("groupDetail.homeworkStatus")}
                  </span>
                  {lesson.homework ? (
                    <span
                      className={cn(
                        "text-xs font-medium px-2.5 py-1 rounded-full",
                        lesson.homework.isOverdue
                          ? "bg-[#FFEBEE] dark:bg-[#C62828]/15 text-[#C62828]"
                          : "bg-primary-500/10 text-primary-500",
                      )}
                    >
                      {t("groupDetail.hasHomework")}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400">—</span>
                  )}
                </div>

                {/* ── Row: Uyga vazifa tugash vaqti ── */}
                <div className="flex items-center justify-between px-4 py-3.5 border-b border-gray-100 dark:border-gray-800">
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                    {t("groupDetail.homeworkDeadline")}
                  </span>
                  {lesson.homework?.deadline ? (
                    <span
                      className={cn(
                        "text-sm font-medium",
                        lesson.homework.isOverdue
                          ? "text-red-500"
                          : "text-gray-600 dark:text-gray-300",
                      )}
                    >
                      {formatDate(lesson.homework.deadline)}
                    </span>
                  ) : (
                    <span className="text-sm text-gray-400">—</span>
                  )}
                </div>

                {/* ── Row: Dars sanasi ── */}
                <div className="flex items-center justify-between px-4 py-3.5">
                  <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                    {t("groupDetail.lessonDate")}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {formatDate(lesson.lessonDate)}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {isTeacher && (
        <>
          <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={t("groupDetail.editGroup")}>
            <div className="space-y-3">
              <Input
                type="text"
                placeholder={t("groups.name")}
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
              <Input
                type="text"
                placeholder={t("groups.courseName")}
                value={editForm.courseName}
                onChange={(e) => setEditForm({ ...editForm, courseName: e.target.value })}
              />
              <Input
                type="number"
                placeholder={t("groups.maxStudents")}
                value={editForm.maxStudents}
                onChange={(e) => setEditForm({ ...editForm, maxStudents: e.target.value })}
              />
              <Input
                type="text"
                placeholder={t("groups.scheduleDays")}
                value={editForm.scheduleDays}
                onChange={(e) => setEditForm({ ...editForm, scheduleDays: e.target.value })}
              />
              <Input
                type="text"
                placeholder={t("groups.scheduleTime")}
                value={editForm.scheduleTime}
                onChange={(e) => setEditForm({ ...editForm, scheduleTime: e.target.value })}
              />
              <Select
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
              >
                <option value="ACTIVE">{t("groups.active")}</option>
                <option value="COMPLETED">{t("groups.completed")}</option>
              </Select>
              <Button onClick={handleSaveGroup} isLoading={isSavingGroup} fullWidth>
                {t("common.update")}
              </Button>
            </div>
          </Modal>

          <Modal isOpen={isLessonModalOpen} onClose={() => setIsLessonModalOpen(false)} title={t("groupDetail.addLesson")}>
            <div className="space-y-3">
              <Input
                type="text"
                placeholder={t("groupDetail.lessonTopic")}
                value={lessonForm.topic}
                onChange={(e) => setLessonForm({ ...lessonForm, topic: e.target.value })}
              />
              <Textarea
                placeholder={t("groupDetail.lessonDescription")}
                value={lessonForm.description}
                onChange={(e) => setLessonForm({ ...lessonForm, description: e.target.value })}
                className="min-h-[80px]"
              />
              <Input
                type="datetime-local"
                value={lessonForm.lessonDate}
                onChange={(e) => setLessonForm({ ...lessonForm, lessonDate: e.target.value })}
              />
              {formError && <p className="text-sm text-red-500">{formError}</p>}
              <Button onClick={handleAddLesson} isLoading={isSubmitting} fullWidth>
                {t("common.create")}
              </Button>
            </div>
          </Modal>

          <Modal isOpen={isStudentModalOpen} onClose={() => setIsStudentModalOpen(false)} title={t("groupDetail.addStudent")}>
            <div className="space-y-3">
              <Select value={selectedStudentId} onChange={(e) => setSelectedStudentId(e.target.value)}>
                <option value="">{t("groupDetail.selectStudent")}</option>
                {availableStudents.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.firstName} {s.lastName}
                  </option>
                ))}
              </Select>
              <Button onClick={handleAddStudent} disabled={!selectedStudentId} fullWidth>
                {t("common.add")}
              </Button>
            </div>
          </Modal>
        </>
      )}
      {confirmModal}
    </div>
  );
};
