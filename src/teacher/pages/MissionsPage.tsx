// src/teacher/pages/MissionsPage.tsx
// Kunlik missiyalarni boshqarish: yaratish, tahrirlash, faol/nofaol qilish, o'chirish.
// Missiya bajarilganini server o'zi tekshiradi (topshiriq / davomat / baho).
import { useState } from "react";
import { Link } from "react-router-dom";
import { Pencil, Plus, Target, Trash2, Users, CheckCircle2, Coins } from "lucide-react";
import {
  useMissionsQuery,
  useCreateMissionMutation,
  useUpdateMissionMutation,
  useDeleteMissionMutation,
} from "@/hooks/queries/useMissions";
import { useGroupsQuery } from "@/hooks/queries/useGroups";
import { useQuizzesQuery } from "@/hooks/queries/useQuizzes";
import type { Mission, MissionInput, MissionType } from "@/types/mission";
import { Modal } from "@/components/common/Modal";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { EmptyState } from "@/components/common/EmptyState";
import { SkeletonHeader, SkeletonCardGrid } from "@/components/common/Skeleton";
import { Button, Checkbox, IconButton, Input, Select, Textarea } from "@/components/ui";
import { toast, getErrorMessage } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";

const MISSION_TYPES: MissionType[] = ["SUBMIT_HOMEWORK", "ATTEND_LESSON", "GOOD_GRADE", "PASS_QUIZ"];
/** Types with a minimum score percentage. */
const USES_TARGET = new Set<MissionType>(["GOOD_GRADE", "PASS_QUIZ"]);
const QUICK_EMOJIS = ["⭐", "📖", "✏️", "🎧", "🏆", "📅", "🚀", "💎"];

interface MissionForm {
  title: string;
  description: string;
  emoji: string;
  type: MissionType;
  target: string;
  coinReward: string;
  groupId: string; // "" = barcha talabalar (null)
  quizId: string;
  isActive: boolean;
}

type FormErrors = Partial<Record<"title" | "description" | "emoji" | "target" | "coinReward" | "quizId", string>>;

const EMPTY_FORM: MissionForm = {
  title: "",
  description: "",
  emoji: "⭐",
  type: "SUBMIT_HOMEWORK",
  target: "80",
  coinReward: "10",
  groupId: "",
  quizId: "",
  isActive: true,
};

const toForm = (m: Mission): MissionForm => ({
  title: m.title,
  description: m.description ?? "",
  emoji: m.emoji,
  type: m.type,
  target: m.target != null ? String(m.target) : "80",
  coinReward: String(m.coinReward),
  groupId: m.groupId ?? "",
  quizId: m.quizId ?? "",
  isActive: m.isActive,
});

/** The backend replaces every field on PATCH, so always send the full body. */
const toInput = (m: Mission, overrides: Partial<MissionInput> = {}): MissionInput => ({
  title: m.title,
  description: m.description,
  emoji: m.emoji,
  type: m.type,
  target: USES_TARGET.has(m.type) ? m.target : null,
  coinReward: m.coinReward,
  groupId: m.groupId,
  quizId: m.type === "PASS_QUIZ" ? m.quizId : null,
  isActive: m.isActive,
  ...overrides,
});

const isIntInRange = (value: string, min: number, max: number) => {
  const n = Number(value);
  return value.trim() !== "" && Number.isInteger(n) && n >= min && n <= max;
};

export const MissionsPage = () => {
  const { t } = useTranslation();
  const { data: missions = [], isLoading, isError, error, refetch, isFetching } = useMissionsQuery();
  const { data: groups = [] } = useGroupsQuery();
  const { data: quizzes = [] } = useQuizzesQuery();
  const createMission = useCreateMissionMutation();
  const updateMission = useUpdateMissionMutation();
  // Separate instance: a list toggle must not show the modal's Save as busy.
  const toggleMission = useUpdateMissionMutation();
  const deleteMission = useDeleteMissionMutation();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editing, setEditing] = useState<Mission | null>(null);
  const [form, setForm] = useState<MissionForm>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Mission | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const isSaving = createMission.isPending || updateMission.isPending;

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setErrors({});
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEdit = (mission: Mission) => {
    setEditing(mission);
    setForm(toForm(mission));
    setErrors({});
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSaving) return;
    setIsModalOpen(false);
  };

  const validate = (): FormErrors => {
    const next: FormErrors = {};
    const title = form.title.trim();
    const emoji = form.emoji.trim();
    if (title.length < 1 || title.length > 100) next.title = t("missions.error.title");
    if (form.description.trim().length > 200) next.description = t("missions.error.description");
    if (emoji.length < 1 || emoji.length > 8) next.emoji = t("missions.error.emoji");
    if (USES_TARGET.has(form.type) && !isIntInRange(form.target, 1, 100)) next.target = t("missions.error.target");
    if (form.type === "PASS_QUIZ" && !form.quizId) next.quizId = t("missions.error.quiz");
    if (!isIntInRange(form.coinReward, 1, 100)) next.coinReward = t("missions.error.coinReward");
    return next;
  };

  const handleSave = async () => {
    setFormError(null);
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    const input: MissionInput = {
      title: form.title.trim(),
      description: form.description.trim() || null,
      emoji: form.emoji.trim(),
      type: form.type,
      target: USES_TARGET.has(form.type) ? Number(form.target) : null,
      coinReward: Number(form.coinReward),
      groupId: form.groupId || null,
      quizId: form.type === "PASS_QUIZ" ? form.quizId : null,
      isActive: form.isActive,
    };

    try {
      if (editing) {
        await updateMission.mutateAsync({ id: editing.id, input });
      } else {
        await createMission.mutateAsync(input);
      }
      setIsModalOpen(false);
      toast.success(editing ? t("common.updateSuccess") : t("common.createSuccess"));
    } catch (err) {
      const message = getErrorMessage(err, t("common.error"));
      setFormError(message);
      toast.error(message);
    }
  };

  const handleToggleActive = async (mission: Mission) => {
    setTogglingId(mission.id);
    try {
      await toggleMission.mutateAsync({ id: mission.id, input: toInput(mission, { isActive: !mission.isActive }) });
      toast.success(t("common.updateSuccess"));
    } catch (err) {
      toast.error(getErrorMessage(err, t("common.error")));
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deleteMission.mutateAsync(deleting.id);
      setDeleting(null);
      toast.success(t("common.deleteSuccess"));
    } catch (err) {
      toast.error(getErrorMessage(err, t("common.error")));
    }
  };

  const header = (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="text-lg md:text-xl font-bold text-gray-800 dark:text-gray-100">{t("missions.title")}</h1>
        <p className="text-gray-500 text-sm md:text-base">{t("missions.subtitle")}</p>
      </div>
      <Button leftIcon={<Plus className="w-4 h-4" />} onClick={openCreate} className="flex-shrink-0" aria-label={t("missions.create")}>
        <span className="hidden sm:inline">{t("missions.create")}</span>
      </Button>
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-4 md:space-y-6">
        <SkeletonHeader />
        <SkeletonCardGrid count={4} />
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {header}

      {isError ? (
        <div className="card p-5 text-center space-y-3">
          <p className="text-red-500">{getErrorMessage(error, t("missions.loadError"))}</p>
          <Button variant="outline" size="sm" onClick={() => refetch()} isLoading={isFetching}>
            {t("common.retry")}
          </Button>
        </div>
      ) : missions.length === 0 ? (
        <div className="card p-5">
          <EmptyState icon={Target} title={t("missions.empty")} description={t("missions.emptyHint")} />
          <div className="flex justify-center -mt-4 pb-4">
            <Button leftIcon={<Plus className="w-4 h-4" />} onClick={openCreate}>
              {t("missions.create")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 md:gap-4">
          {missions.map((mission) => (
            <div
              key={mission.id}
              className={cn("card p-4 md:p-5 flex flex-col gap-3 transition-opacity", !mission.isActive && "opacity-60")}
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-2xl bg-warning/10 dark:bg-warning/15 flex items-center justify-center text-2xl flex-shrink-0">
                  {mission.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-100 break-words">{mission.title}</h3>
                    <span
                      className={cn(
                        "text-[11px] font-semibold px-2 py-0.5 rounded-full",
                        mission.isActive
                          ? "bg-[#E8F5E9] text-[#2E7D32] dark:bg-[#2E7D32]/20 dark:text-[#66BB6A]"
                          : "bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400",
                      )}
                    >
                      {mission.isActive ? t("missions.active") : t("missions.inactive")}
                    </span>
                  </div>
                  {mission.description && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 break-words">{mission.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <IconButton size="sm" onClick={() => openEdit(mission)} aria-label={t("missions.edit")}>
                    <Pencil className="w-4 h-4" />
                  </IconButton>
                  <IconButton
                    size="sm"
                    variant="danger"
                    onClick={() => setDeleting(mission)}
                    aria-label={t("common.delete")}
                  >
                    <Trash2 className="w-4 h-4" />
                  </IconButton>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 text-xs">
                <span className="px-2.5 py-1 rounded-full bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300">
                  {t(`missions.type.${mission.type}`)}
                  {mission.type === "PASS_QUIZ" && mission.quizTitle && <> · {mission.quizTitle}</>}
                  {USES_TARGET.has(mission.type) && mission.target != null && (
                    <> · {t("missions.targetLabel", { target: mission.target })}</>
                  )}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-warning/10 text-warning font-semibold">
                  <Coins className="w-3.5 h-3.5" />
                  {t("missions.reward", { count: mission.coinReward })}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300">
                  <Users className="w-3.5 h-3.5" />
                  {mission.groupId ? mission.groupName ?? "—" : t("missions.allStudents")}
                </span>
              </div>

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                <span className="inline-flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <CheckCircle2 className="w-4 h-4 text-[#2E7D32]" />
                  {t("missions.completedToday", { count: mission.completedToday })}
                </span>
                <Button
                  size="sm"
                  variant={mission.isActive ? "ghost" : "outline"}
                  onClick={() => handleToggleActive(mission)}
                  isLoading={togglingId === mission.id}
                  disabled={togglingId !== null && togglingId !== mission.id}
                >
                  {mission.isActive ? t("missions.deactivate") : t("missions.activate")}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editing ? t("missions.edit") : t("missions.create")}>
        <div className="space-y-3">
          <div>
            <Input
              label={t("missions.field.emoji")}
              type="text"
              value={form.emoji}
              maxLength={8}
              onChange={(e) => setForm({ ...form, emoji: e.target.value })}
              error={errors.emoji}
              className="text-lg"
            />
            <div className="flex flex-wrap gap-1.5 mt-2">
              {QUICK_EMOJIS.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => setForm({ ...form, emoji })}
                  className={cn(
                    "w-9 h-9 rounded-xl text-lg flex items-center justify-center border transition-all active:scale-95",
                    form.emoji.trim() === emoji
                      ? "border-warning bg-warning/10"
                      : "border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-white/5 hover:border-warning",
                  )}
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
          <Input
            label={t("missions.field.title")}
            type="text"
            placeholder={t("missions.field.titlePlaceholder")}
            value={form.title}
            maxLength={100}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            error={errors.title}
          />
          <Textarea
            label={t("missions.field.description")}
            value={form.description}
            maxLength={200}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            error={errors.description}
            className="min-h-[70px]"
          />
          <div>
            <Select
              label={t("missions.field.type")}
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as MissionType })}
            >
              {MISSION_TYPES.map((type) => (
                <option key={type} value={type}>
                  {t(`missions.type.${type}`)}
                </option>
              ))}
            </Select>
            <p className="mt-1.5 text-xs text-gray-400">{t(`missions.typeHint.${form.type}`)}</p>
          </div>
          {form.type === "PASS_QUIZ" && (
            <div>
              <Select
                label={t("missions.field.quiz")}
                value={form.quizId}
                onChange={(e) => setForm({ ...form, quizId: e.target.value })}
                error={errors.quizId}
              >
                <option value="">{t("missions.field.quizPlaceholder")}</option>
                {editing?.quizId && !quizzes.some((q) => q.id === editing.quizId) && (
                  <option value={editing.quizId}>{editing.quizTitle ?? editing.quizId}</option>
                )}
                {quizzes.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.title}
                    {q.isActive ? "" : ` (${t("missions.inactive")})`}
                  </option>
                ))}
              </Select>
              {quizzes.length === 0 && (
                <Link to="/tests/new" className="mt-1.5 inline-block text-xs text-warning hover:underline">
                  {t("missions.createQuizFirst")}
                </Link>
              )}
            </div>
          )}
          <div className={cn("grid gap-3", USES_TARGET.has(form.type) ? "grid-cols-2" : "grid-cols-1")}>
            {USES_TARGET.has(form.type) && (
              <Input
                label={t("missions.field.target")}
                type="number"
                min={1}
                max={100}
                value={form.target}
                onChange={(e) => setForm({ ...form, target: e.target.value })}
                error={errors.target}
              />
            )}
            <Input
              label={t("missions.field.coinReward")}
              type="number"
              min={1}
              max={100}
              value={form.coinReward}
              onChange={(e) => setForm({ ...form, coinReward: e.target.value })}
              error={errors.coinReward}
            />
          </div>
          <Select
            label={t("missions.field.group")}
            value={form.groupId}
            onChange={(e) => setForm({ ...form, groupId: e.target.value })}
          >
            <option value="">{t("missions.allStudents")}</option>
            {editing?.groupId && !groups.some((g) => g.id === editing.groupId) && (
              <option value={editing.groupId}>{editing.groupName ?? editing.groupId}</option>
            )}
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </Select>
          <Checkbox
            checked={form.isActive}
            onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            label={t("missions.field.isActive")}
          />
          {formError && <p className="text-sm text-red-500">{formError}</p>}
          <Button onClick={handleSave} isLoading={isSaving} fullWidth>
            {editing ? t("common.update") : t("common.create")}
          </Button>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={!!deleting}
        title={t("missions.deleteTitle")}
        message={t("missions.deleteConfirm", { title: deleting?.title ?? "" })}
        isLoading={deleteMission.isPending}
        onConfirm={handleDelete}
        onCancel={() => !deleteMission.isPending && setDeleting(null)}
      />
    </div>
  );
};
