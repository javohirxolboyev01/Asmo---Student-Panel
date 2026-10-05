// src/teacher/pages/MissionsPage.tsx
// Kunlik missiyalarni boshqarish: yaratish, tahrirlash, faol/nofaol qilish, o'chirish.
// Missiya bajarilganini server o'zi tekshiradi (topshiriq / davomat / baho).
import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, CheckCircle2, ListChecks, Pencil, Plus, Target, Trash2, Users } from "lucide-react";
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
import { Button, Input, Select, Textarea } from "@/components/ui";
import { toast, getErrorMessage } from "@/lib/toast";
import { cn } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { CoinTag, EmptyBox, PageHeader, Seg, Skel, Toggle } from "../components/ui";

// Attendance and good-grade missions were retired (2026-10-05); the backend no longer accepts them.
const MISSION_TYPES: MissionType[] = ["SUBMIT_HOMEWORK", "PASS_QUIZ"];
/** Types with a minimum score percentage. */
const USES_TARGET = new Set<MissionType>(["PASS_QUIZ"]);
const QUICK_EMOJIS = ["⭐", "📖", "✏️", "🎧", "🏆", "📅", "🚀", "💎"];

type Filter = "all" | "active" | "inactive";

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
  const [filter, setFilter] = useState<Filter>("all");

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

  if (isLoading) {
    return (
      <div aria-busy="true">
        <Skel className="mt-2 h-8 w-1/2 rounded-xl" />
        <Skel className="mt-2 h-4 w-1/3 rounded-lg" />
        <div className="u-stats3 mt-5">
          {[0, 1, 2].map((i) => (
            <Skel key={i} className="h-[76px] rounded-[18px]" />
          ))}
        </div>
        <div className="u-cols c3 u-stack mt-5">
          {[0, 1, 2].map((i) => (
            <Skel key={i} className="h-[220px]" />
          ))}
        </div>
      </div>
    );
  }

  const activeCount = missions.filter((m) => m.isActive).length;
  const doneToday = missions.reduce((sum, m) => sum + m.completedToday, 0);
  const shown = missions.filter((m) => filter === "all" || m.isActive === (filter === "active"));
  const setField = <K extends keyof MissionForm>(key: K, value: MissionForm[K]) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <>
      <PageHeader
        title={t("missions.title")}
        subtitle={missions.length ? t("us.manage.missionsActive", { count: activeCount }) : t("missions.subtitle")}
        right={
          <button type="button" className="u-btn" onClick={openCreate} aria-label={t("missions.create")}>
            <Plus className="u-i m" strokeWidth={2} aria-hidden="true" />
            {t("us.manage.missionBtn")}
          </button>
        }
      />

      {isError ? (
        <EmptyBox
          icon={AlertTriangle}
          tone="er"
          title={getErrorMessage(error, t("missions.loadError"))}
          action={
            <Button onClick={() => refetch()} isLoading={isFetching}>
              {t("common.retry")}
            </Button>
          }
        />
      ) : missions.length === 0 ? (
        <EmptyBox
          icon={Target}
          tone="mu"
          title={t("missions.empty")}
          text={t("missions.emptyHint")}
          action={
            <button type="button" className="u-btn" onClick={openCreate}>
              <Plus className="u-i m" strokeWidth={2} aria-hidden="true" />
              {t("missions.create")}
            </button>
          }
        />
      ) : (
        <>
          <div className="u-stats3">
            <div>
              <b className="text-u-ok">{activeCount}</b>
              <span>{t("missions.active")}</span>
            </div>
            <div>
              <b className="text-u-pr">{doneToday}</b>
              <span>{t("us.manage.statDoneToday")}</span>
            </div>
            <div>
              <b>{missions.length}</b>
              <span>{t("us.manage.statTotal")}</span>
            </div>
          </div>

          <div className="mt-[18px] mb-3.5">
            <Seg<Filter>
              value={filter}
              onChange={setFilter}
              label={t("us.manage.filterLabel")}
              options={[
                { value: "all", label: t("us.manage.all") },
                { value: "active", label: t("missions.active") },
                { value: "inactive", label: t("missions.inactive") },
              ]}
            />
          </div>

          <div className="u-cols c3 u-stack">
            {shown.map((mission) => (
              <article key={mission.id} className="u-card grid gap-3 content-start">
                <div className="flex items-center gap-3">
                  <span
                    className={cn("u-mi !w-[54px] !h-[54px] text-[28px] leading-none", !mission.isActive && "opacity-60")}
                    style={{ background: "var(--gdt)" }}
                    aria-hidden="true"
                  >
                    {mission.emoji}
                  </span>
                  <div className="flex-1 min-w-0">
                    <h3 className="break-words">{mission.title}</h3>
                    <p className="u-sub !mt-0.5 text-sm">{t(`missions.type.${mission.type}`)}</p>
                  </div>
                  <CoinTag n={`+${mission.coinReward}`} className="flex-none" />
                </div>

                {mission.description && <p className="u-sub !mt-0 text-sm break-words">{mission.description}</p>}

                <div className="u-chips">
                  {mission.type === "PASS_QUIZ" && mission.quizTitle && (
                    <span className="u-chip max-w-full">
                      <ListChecks className="u-i s" strokeWidth={2} aria-hidden="true" />
                      <span className="truncate">{mission.quizTitle}</span>
                    </span>
                  )}
                  {USES_TARGET.has(mission.type) && mission.target != null && (
                    <span className="u-chip">
                      <Target className="u-i s" strokeWidth={2} aria-hidden="true" />
                      {t("missions.targetLabel", { target: mission.target })}
                    </span>
                  )}
                  <span className="u-chip max-w-full">
                    <Users className="u-i s" strokeWidth={2} aria-hidden="true" />
                    <span className="truncate">
                      {mission.groupId ? mission.groupName ?? "—" : t("missions.allStudents")}
                    </span>
                  </span>
                </div>

                <div className="u-row">
                  <span className="u-mi !w-9 !h-9 !rounded-xl" style={{ background: "var(--okt)", color: "var(--ok)" }}>
                    <CheckCircle2 className="u-i s" strokeWidth={2} aria-hidden="true" />
                  </span>
                  <small className="g !text-u-tx font-semibold">
                    {t("missions.completedToday", { count: mission.completedToday })}
                  </small>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="u-btn soft sm"
                      onClick={() => openEdit(mission)}
                      aria-label={`${t("missions.edit")}: ${mission.title}`}
                    >
                      <Pencil className="u-i s" strokeWidth={2} aria-hidden="true" />
                      {t("common.edit")}
                    </button>
                    <button
                      type="button"
                      className="u-ib"
                      onClick={() => setDeleting(mission)}
                      aria-label={t("common.delete")}
                    >
                      <Trash2 className="u-i m" strokeWidth={2} aria-hidden="true" />
                    </button>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={mission.isActive}
                    onClick={() => handleToggleActive(mission)}
                    disabled={togglingId !== null}
                    className={cn(
                      "flex items-center gap-2 font-bold text-u-mu disabled:cursor-wait",
                      togglingId === mission.id && "opacity-60",
                    )}
                  >
                    {mission.isActive ? t("missions.active") : t("missions.inactive")}
                    <Toggle on={mission.isActive} />
                  </button>
                </div>
              </article>
            ))}
            {shown.length === 0 && (
              <EmptyBox
                className="col-span-full"
                tone="mu"
                icon={Target}
                title={t("us.manage.emptyFilter")}
                text={t("us.manage.emptyFilterHint")}
              />
            )}
          </div>
        </>
      )}

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editing ? t("missions.edit") : t("missions.create")}>
        <div className="grid gap-3.5">
          {/* Emoji: big preview + quick picks + free input */}
          <div>
            <p className="text-[13.5px] font-bold text-u-mu mb-1.5">{t("missions.field.emoji")}</p>
            <div className="flex items-center gap-3">
              <span
                className="u-mi !w-[58px] !h-[58px] text-[30px] leading-none"
                style={{ background: "var(--gdt)" }}
                aria-hidden="true"
              >
                {form.emoji.trim() || "?"}
              </span>
              <div className="u-chips flex-1 min-w-0">
                {QUICK_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    aria-pressed={form.emoji.trim() === emoji}
                    onClick={() => setField("emoji", emoji)}
                    className={cn(
                      "w-10 h-10 rounded-xl grid place-items-center text-xl transition-colors",
                      form.emoji.trim() === emoji ? "bg-u-prt shadow-[inset_0_0_0_2px_rgb(var(--u-pr))]" : "bg-u-sf2",
                    )}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
            <Input
              type="text"
              aria-label={t("missions.field.emoji")}
              placeholder={t("us.manage.emojiCustom")}
              value={form.emoji}
              maxLength={8}
              onChange={(e) => setField("emoji", e.target.value)}
              error={errors.emoji}
              containerClassName="mt-2.5"
              className="text-lg"
            />
          </div>

          <Input
            label={t("missions.field.title")}
            type="text"
            placeholder={t("missions.field.titlePlaceholder")}
            value={form.title}
            maxLength={100}
            onChange={(e) => setField("title", e.target.value)}
            error={errors.title}
          />
          <Textarea
            label={t("missions.field.description")}
            value={form.description}
            maxLength={200}
            onChange={(e) => setField("description", e.target.value)}
            error={errors.description}
            className="min-h-[72px]"
          />

          {/* Type: chips like the mock's reason picker */}
          <div>
            <p className="text-[13.5px] font-bold text-u-mu mb-1.5">{t("missions.field.type")}</p>
            <div className="u-chips" role="radiogroup" aria-label={t("missions.field.type")}>
              {MISSION_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  role="radio"
                  aria-checked={form.type === type}
                  className={cn("u-chip", form.type === type && "sel")}
                  onClick={() => setField("type", type)}
                >
                  {t(`missions.type.${type}`)}
                </button>
              ))}
            </div>
            <p className="mt-2 text-[13px] font-semibold text-u-mu">{t(`missions.typeHint.${form.type}`)}</p>
          </div>

          {form.type === "PASS_QUIZ" && (
            <div>
              <Select
                label={t("missions.field.quiz")}
                value={form.quizId}
                onChange={(e) => setField("quizId", e.target.value)}
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
                <Link to="/tests/new" className="u-chip mt-2 !bg-u-prt !text-u-pr">
                  {t("missions.createQuizFirst")}
                </Link>
              )}
            </div>
          )}

          <div className={cn("grid gap-3.5", USES_TARGET.has(form.type) ? "grid-cols-2" : "grid-cols-1")}>
            {USES_TARGET.has(form.type) && (
              <Input
                label={t("missions.field.target")}
                type="number"
                inputMode="numeric"
                min={1}
                max={100}
                value={form.target}
                onChange={(e) => setField("target", e.target.value)}
                error={errors.target}
              />
            )}
            <Input
              label={t("missions.field.coinReward")}
              type="number"
              inputMode="numeric"
              min={1}
              max={100}
              value={form.coinReward}
              onChange={(e) => setField("coinReward", e.target.value)}
              error={errors.coinReward}
            />
          </div>

          <Select label={t("missions.field.group")} value={form.groupId} onChange={(e) => setField("groupId", e.target.value)}>
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

          <button
            type="button"
            role="switch"
            aria-checked={form.isActive}
            onClick={() => setField("isActive", !form.isActive)}
            className="u-row"
          >
            <span className="g font-bold">{t("missions.field.isActive")}</span>
            <Toggle on={form.isActive} />
          </button>

          {formError && <p className="text-[13px] font-bold text-u-er">{formError}</p>}
          <div className="flex gap-2.5">
            <Button variant="outline" onClick={closeModal}>
              {t("common.cancel")}
            </Button>
            <Button className="flex-1" onClick={handleSave} isLoading={isSaving}>
              {editing ? t("common.update") : t("common.create")}
            </Button>
          </div>
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
    </>
  );
};
