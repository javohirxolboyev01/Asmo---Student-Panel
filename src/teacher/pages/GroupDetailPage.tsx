// src/teacher/pages/GroupDetailPage.tsx
// One group, 1:1 with the mock `group` view: coloured hero (name, level,
// edit/delete, week dots, time, size), Darslar/Talabalar switch, lessons
// (+ AddLessonSheet) and the roster (enroll / remove).
import { useEffect, useState } from "react";
import type { CSSProperties } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { AlertTriangle, Calendar, Clock, Pencil, Plus, Trash2, Users, X } from "lucide-react";
import {
  useGroupDetailQuery,
  useUpdateGroupMutation,
  useDeleteGroupMutation,
  useEnrollStudentMutation,
  useUnenrollStudentMutation,
} from "@/hooks/queries/useGroups";
import { useStudentsQuery } from "@/hooks/queries/useStudents";
import { useDirectionsQuery } from "@/hooks/queries/useDirections";
import { useTeachersQuery } from "@/hooks/queries/useTeachers";
import { useTranslation } from "@/hooks/useTranslation";
import { useConfirm } from "@/hooks/useConfirm";
import { Modal } from "@/components/common/Modal";
import { Button, Input, Select } from "@/components/ui";
import { toast, getErrorMessage } from "@/lib/toast";
import { GroupLessonList } from "@/components/Groups/GroupLessonList";
import { AddLessonSheet } from "../components/sheets";
import {
  Avatar,
  BackButton,
  CoinTag,
  EmptyBox,
  Seg,
  SectionHead,
  Skel,
  WeekDots,
  groupColor,
  parseScheduleDays,
} from "../components/ui";

type Tab = "lessons" | "students";

export const GroupDetailPage = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab: Tab = searchParams.get("tab") === "students" ? "students" : "lessons";
  const setTab = (next: Tab) =>
    setSearchParams(next === "students" ? { tab: "students" } : {}, { replace: true });

  const { data, isLoading, error, refetch } = useGroupDetailQuery(id);
  const selectedGroup = data?.group;
  const lessons = data?.lessons ?? [];
  const students = data?.students ?? [];
  const updateGroup = useUpdateGroupMutation(id ?? "");
  const deleteGroupMutation = useDeleteGroupMutation();
  const enrollStudent = useEnrollStudentMutation();
  const unenrollStudent = useUnenrollStudentMutation();
  const { data: allStudents = [] } = useStudentsQuery();
  const { data: directions = [] } = useDirectionsQuery();
  const { data: teachers = [] } = useTeachersQuery();

  const [isLessonSheetOpen, setIsLessonSheetOpen] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [isEnrolling, setIsEnrolling] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    courseName: "",
    directionId: "",
    teacherId: "",
    maxStudents: "20",
    scheduleDays: "",
    scheduleTime: "",
    status: "ACTIVE",
  });
  const [isSavingGroup, setIsSavingGroup] = useState(false);
  const { confirm, confirmModal } = useConfirm();

  useEffect(() => {
    if (!selectedGroup) return;
    setEditForm({
      name: selectedGroup.name ?? "",
      courseName: selectedGroup.courseName ?? "",
      directionId: selectedGroup.directionId ?? "",
      teacherId: selectedGroup.teacherId ?? "",
      maxStudents: String(selectedGroup.maxStudents ?? 20),
      scheduleDays: (selectedGroup.schedule?.days ?? []).join(", "),
      scheduleTime: selectedGroup.schedule?.time ?? "",
      status: selectedGroup.status === "completed" ? "COMPLETED" : "ACTIVE",
    });
  }, [selectedGroup]);

  const setField = (key: keyof typeof editForm) => (e: { target: { value: string } }) =>
    setEditForm((f) => ({ ...f, [key]: e.target.value }));

  const handleAddStudent = async () => {
    if (!id || !selectedStudentId) return;
    setIsEnrolling(true);
    try {
      await enrollStudent.mutateAsync({ groupId: id, userId: selectedStudentId });
      setIsStudentModalOpen(false);
      setSelectedStudentId("");
      toast.success(t("common.createSuccess"));
    } catch (err) {
      toast.error(getErrorMessage(err, t("common.error")));
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!id) return;
    const confirmed = await confirm(t("us.groups.kickConfirm"));
    if (!confirmed) return;
    try {
      await unenrollStudent.mutateAsync({ groupId: id, userId: studentId });
      toast.success(t("common.deleteSuccess"));
    } catch (err) {
      toast.error(getErrorMessage(err, t("common.error")));
    }
  };

  const handleSaveGroup = async () => {
    if (!id) return;
    if (!editForm.name.trim()) {
      toast.error(t("us.fillRequired"));
      return;
    }
    setIsSavingGroup(true);
    try {
      await updateGroup.mutateAsync({
        name: editForm.name,
        courseName: editForm.courseName,
        ...(editForm.directionId ? { directionId: editForm.directionId } : {}),
        ...(editForm.teacherId ? { teacherId: editForm.teacherId } : {}),
        maxStudents: Number(editForm.maxStudents) || undefined,
        scheduleDays: editForm.scheduleDays,
        scheduleTime: editForm.scheduleTime,
        status: editForm.status,
      });
      setIsEditModalOpen(false);
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
      await deleteGroupMutation.mutateAsync(id);
      toast.success(t("common.deleteSuccess"));
      navigate("/groups");
    } catch (err) {
      toast.error(getErrorMessage(err, t("common.error")));
    }
  };

  if (isLoading) {
    return (
      <div aria-busy="true">
        <Skel className="h-6 w-24 rounded-lg" />
        <Skel className="mt-2 h-[190px] rounded-[28px]" />
        <Skel className="my-[18px] h-[46px] w-56 rounded-[14px]" />
        <div className="u-stack">
          {Array.from({ length: 3 }, (_, i) => (
            <Skel key={i} className="h-[90px] rounded-[20px]" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !selectedGroup) {
    return (
      <>
        <BackButton to="/groups" />
        <EmptyBox
          tone="er"
          icon={AlertTriangle}
          title={error ? getErrorMessage(error, t("groupDetail.notFound")) : t("groupDetail.notFound")}
          action={
            <div className="flex flex-wrap justify-center gap-2.5">
              {error && <Button onClick={() => refetch()}>{t("common.retry")}</Button>}
              <Button variant="outline" onClick={() => navigate("/groups")}>
                {t("groupDetail.backToGroups")}
              </Button>
            </div>
          }
        />
      </>
    );
  }

  const color = groupColor(selectedGroup.id, selectedGroup.directionColor);
  const days = parseScheduleDays(selectedGroup.schedule?.days);
  const rawDays = (selectedGroup.schedule?.days ?? []).map((d) => d.trim()).filter(Boolean);
  const level = selectedGroup.courseName || selectedGroup.directionName;
  const enrolledIds = new Set(students.map((s) => s.id));
  const availableStudents = allStudents.filter((s) => !enrolledIds.has(s.id));
  // GET /groups/:id reports a stale coinBalance; the students list has the live one.
  const coinsOf = new Map(allStudents.map((s) => [s.id, s.coinBalance]));
  const studentCount = selectedGroup.studentCount ?? students.length;

  const addLessonButton = (
    <Button size="sm" leftIcon={<Plus className="u-i s" strokeWidth={2} />} onClick={() => setIsLessonSheetOpen(true)}>
      {t("groupDetail.addLesson")}
    </Button>
  );
  const addStudentButton = (
    <Button size="sm" leftIcon={<Plus className="u-i s" strokeWidth={2} />} onClick={() => setIsStudentModalOpen(true)}>
      {t("groupDetail.addStudent")}
    </Button>
  );

  return (
    <div>
      <BackButton to="/groups" />
      <section className="u-ghero" style={{ "--g": color } as CSSProperties}>
        <div className="flex items-start justify-between gap-2.5">
          <div className="min-w-0">
            <h1 className="break-words">{selectedGroup.name}</h1>
            {level && <p className="opacity-90">{level}</p>}
          </div>
          <div className="flex flex-none gap-2">
            <button
              type="button"
              className="u-ib gl"
              aria-label={t("groupDetail.editGroup")}
              onClick={() => setIsEditModalOpen(true)}
            >
              <Pencil className="u-i m" strokeWidth={2} aria-hidden="true" />
            </button>
            <button type="button" className="u-ib gl" aria-label={t("common.delete")} onClick={handleDeleteGroup}>
              <Trash2 className="u-i m" strokeWidth={2} aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {days.length > 0 ? (
            <WeekDots days={days} color={color} />
          ) : (
            rawDays.length > 0 && (
              <span className="u-chip">
                <Calendar className="u-i s" strokeWidth={2} aria-hidden="true" />
                {rawDays.join(", ")}
              </span>
            )
          )}
          {selectedGroup.schedule?.time && (
            <span className="u-chip">
              <Clock className="u-i s" strokeWidth={2} aria-hidden="true" />
              {selectedGroup.schedule.time}
            </span>
          )}
          <span className="u-chip">
            <Users className="u-i s" strokeWidth={2} aria-hidden="true" />
            {selectedGroup.maxStudents ? `${studentCount}/${selectedGroup.maxStudents}` : studentCount}
          </span>
        </div>
      </section>

      <div className="my-[18px]">
        <Seg<Tab>
          value={tab}
          onChange={setTab}
          options={[
            { value: "lessons", label: t("us.groups.lessons") },
            { value: "students", label: t("us.groups.students") },
          ]}
        />
      </div>

      {tab === "lessons" ? (
        <>
          <SectionHead title={t("us.groups.lessons")} right={addLessonButton} />
          <GroupLessonList lessons={lessons} studentCount={studentCount} />
        </>
      ) : (
        <>
          <SectionHead title={t("us.groups.students")} right={addStudentButton} />
          {students.length === 0 ? (
            <EmptyBox title={t("us.groups.noStudents")} text={t("us.groups.noStudentsSub")} />
          ) : (
            <div className="u-stack">
              {students.map((s) => {
                const name = `${s.firstName} ${s.lastName}`.trim();
                return (
                  <div key={s.id} className="u-row">
                    <Link to={`/students/${s.id}`} className="g flex items-center gap-3 text-inherit no-underline">
                      <Avatar name={name} src={s.avatar} seed={s.id} />
                      <span className="min-w-0">
                        <b className="truncate">{name}</b>
                        <CoinTag n={coinsOf.get(s.id) ?? s.coinBalance ?? 0} />
                      </span>
                    </Link>
                    <button
                      type="button"
                      className="u-ib"
                      style={{ background: "var(--sf)" }}
                      aria-label={t("groupDetail.removeStudent")}
                      onClick={() => handleRemoveStudent(s.id)}
                    >
                      <X className="u-i m" strokeWidth={2} aria-hidden="true" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      <AddLessonSheet open={isLessonSheetOpen} onClose={() => setIsLessonSheetOpen(false)} groupId={id} />

      <Modal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} title={t("groups.editGroup")}>
        <form
          className="grid gap-3.5"
          onSubmit={(e) => {
            e.preventDefault();
            handleSaveGroup();
          }}
        >
          <Input label={t("groups.name")} type="text" value={editForm.name} onChange={setField("name")} required />
          <Input label={t("groups.courseName")} type="text" value={editForm.courseName} onChange={setField("courseName")} />
          {directions.length > 0 && (
            <Select label={t("groups.direction")} value={editForm.directionId} onChange={setField("directionId")}>
              {directions.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </Select>
          )}
          {teachers.length > 0 && (
            <Select label={t("groups.teacher")} value={editForm.teacherId} onChange={setField("teacherId")}>
              {teachers.map((tch) => (
                <option key={tch.id} value={tch.id}>
                  {tch.fullName}
                </option>
              ))}
            </Select>
          )}
          <Input
            label={t("groups.scheduleDays")}
            type="text"
            placeholder={t("us.groups.daysPh")}
            value={editForm.scheduleDays}
            onChange={setField("scheduleDays")}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              label={t("groups.scheduleTime")}
              // Older groups may hold free text ("18:00-19:30"); keep it editable as text.
              type={!editForm.scheduleTime || /^\d{2}:\d{2}$/.test(editForm.scheduleTime) ? "time" : "text"}
              value={editForm.scheduleTime}
              onChange={setField("scheduleTime")}
            />
            <Input
              label={t("groups.maxStudents")}
              type="number"
              inputMode="numeric"
              min={1}
              value={editForm.maxStudents}
              onChange={setField("maxStudents")}
            />
          </div>
          <Select label={t("groups.status")} value={editForm.status} onChange={setField("status")}>
            <option value="ACTIVE">{t("groups.active")}</option>
            <option value="COMPLETED">{t("groups.completed")}</option>
          </Select>
          <div className="flex gap-2.5">
            <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" className="flex-1" isLoading={isSavingGroup}>
              {t("common.save")}
            </Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isStudentModalOpen} onClose={() => setIsStudentModalOpen(false)} title={t("groupDetail.addStudent")}>
        <div className="grid gap-3.5">
          {availableStudents.length === 0 ? (
            <EmptyBox card={false} tone="mu" icon={Users} title={t("us.groups.noFreeStudents")} />
          ) : (
            <Select
              label={t("us.coin.student")}
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
            >
              <option value="">{t("groupDetail.selectStudent")}</option>
              {availableStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.firstName} {s.lastName}
                </option>
              ))}
            </Select>
          )}
          <div className="flex gap-2.5">
            <Button type="button" variant="outline" onClick={() => setIsStudentModalOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button className="flex-1" onClick={handleAddStudent} disabled={!selectedStudentId} isLoading={isEnrolling}>
              {t("common.add")}
            </Button>
          </div>
        </div>
      </Modal>
      {confirmModal}
    </div>
  );
};
