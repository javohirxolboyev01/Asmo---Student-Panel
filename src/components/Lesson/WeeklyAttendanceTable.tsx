// src/components/Lesson/WeeklyAttendanceTable.tsx
// Weekly attendance of a group (teacher lesson page), in the "Ustoz paneli"
// mock language: one `u-row` per student with a day pill per lesson of the
// week, an optional coin award and edit / save / cancel.
import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { uz } from "date-fns/locale";
import { useQueryClient } from "@tanstack/react-query";
import { Calendar, Check, Coins, Pencil, Save, X } from "lucide-react";
import { useWeeklyAttendanceQuery, useSaveAttendanceMutation } from "@/hooks/queries/useWeeklyAttendance";
import { useAwardCoinsMutation } from "@/hooks/queries/useCoins";
import { WeeklyAttendanceLesson, WeeklyAttendanceStudent } from "@/types/teacher";
import { queryKeys } from "@/lib/queryClient";
import { cn, isImageUrl } from "@/lib/utils";
import { Button, IconButton, Input } from "@/components/ui";
import { toast, getErrorMessage } from "@/lib/toast";
import { useTranslation } from "@/hooks/useTranslation";
import { Avatar, CoinTag, Skel } from "@/teacher/components/ui";

const formatDayColumn = (isoDate: string) => format(parseISO(isoDate), "EEEEEE, dd.MM", { locale: uz });
const formatShort = (isoDate: string) => {
  try {
    return format(parseISO(isoDate), "dd.MM");
  } catch {
    return "";
  }
};

interface WeeklyAttendanceRowProps {
  student: WeeklyAttendanceStudent;
  lessons: WeeklyAttendanceLesson[];
}

const buildInitialChecks = (student: WeeklyAttendanceStudent, lessons: WeeklyAttendanceLesson[]) => {
  const initial: Record<string, boolean> = {};
  lessons.forEach((l) => {
    initial[l.id] = student.attendance[l.id] === "present";
  });
  return initial;
};

const WeeklyAttendanceRow = ({ student, lessons }: WeeklyAttendanceRowProps) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [checks, setChecks] = useState<Record<string, boolean>>(() => buildInitialChecks(student, lessons));
  const [coin, setCoin] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const saveAttendance = useSaveAttendanceMutation();
  const awardCoins = useAwardCoinsMutation();
  const name = `${student.firstName} ${student.lastName}`;

  useEffect(() => {
    setChecks(buildInitialChecks(student, lessons));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [student]);

  const cancelEdit = () => {
    setChecks(buildInitialChecks(student, lessons));
    setCoin("");
    setIsEditing(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await Promise.all(
        lessons.map((lesson) =>
          saveAttendance.mutateAsync({
            lessonId: lesson.id,
            records: [{ userId: student.id, status: checks[lesson.id] ? "PRESENT" : "ABSENT" }],
          }),
        ),
      );
      // The lesson page's attendance card reads the lesson roster.
      lessons.forEach((lesson) => queryClient.invalidateQueries({ queryKey: queryKeys.lesson(lesson.id) }));
      const coinAmount = Number(coin);
      if (coin.trim() !== "" && !Number.isNaN(coinAmount) && coinAmount !== 0) {
        await awardCoins.mutateAsync({
          studentId: student.id,
          amount: coinAmount,
          reason: t("lessonDetail.weeklyAttendanceCoinReason"),
        });
        queryClient.invalidateQueries({ queryKey: ["attendance", "weekly"] });
      }
      toast.success(t("common.updateSuccess"));
      setCoin("");
      setIsEditing(false);
    } catch (err) {
      toast.error(getErrorMessage(err, t("common.error")));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="u-row flex-wrap !items-center gap-y-3">
      {/* Student */}
      <div className="flex min-w-0 flex-[1_1_200px] items-center gap-3">
        <Avatar name={name} src={isImageUrl(student.avatar) ? student.avatar : null} seed={student.id} size="s" />
        <div className="min-w-0">
          <b className="truncate">{name}</b>
          <CoinTag n={student.coinBalance} className="mt-0.5" />
        </div>
      </div>

      {/* Present / absent pill per lesson of the week */}
      <div className="flex flex-wrap gap-2">
        {lessons.map((lesson) => {
          const checked = checks[lesson.id] ?? false;
          const day = formatDayColumn(lesson.lessonDate);
          return (
            <label
              key={lesson.id}
              title={lesson.topic}
              className={cn(
                "flex h-14 w-[68px] select-none flex-col items-center justify-center gap-0.5 rounded-2xl text-[11px] font-bold capitalize transition-colors focus-within:outline focus-within:outline-[3px] focus-within:outline-offset-2 focus-within:outline-u-pr",
                isEditing ? "cursor-pointer" : "cursor-default",
                checked
                  ? isEditing
                    ? "bg-[rgb(var(--u-okf))] text-white"
                    : "bg-u-okt text-u-ok"
                  : isEditing
                    ? "bg-u-ert text-u-er"
                    : "bg-u-sf text-u-mu",
              )}
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={!isEditing}
                aria-label={`${day} — ${lesson.topic}`}
                onChange={(e) => setChecks((prev) => ({ ...prev, [lesson.id]: e.target.checked }))}
                className="sr-only"
              />
              <span className="leading-none">{day}</span>
              {checked ? (
                <Check className="u-i s" strokeWidth={3} aria-hidden="true" />
              ) : (
                <X className="u-i s" strokeWidth={3} aria-hidden="true" />
              )}
            </label>
          );
        })}
      </div>

      {/* Coin + actions */}
      <div className="ml-auto flex items-center gap-2">
        <div className="w-[118px]">
          <Input
            type="number"
            placeholder="0"
            value={coin}
            disabled={!isEditing}
            aria-label={t("lessonDetail.coinLabel")}
            onChange={(e) => setCoin(e.target.value)}
            leftIcon={<Coins className="u-i s text-u-gdx" />}
            className="!py-2"
          />
        </div>
        {isEditing ? (
          <>
            <Button size="sm" onClick={handleSave} isLoading={isSaving} leftIcon={<Save className="u-i s" />}>
              {t("common.save")}
            </Button>
            <IconButton onClick={cancelEdit} disabled={isSaving} aria-label={t("common.cancel")}>
              <X className="u-i s" />
            </IconButton>
          </>
        ) : (
          <IconButton onClick={() => setIsEditing(true)} aria-label={t("common.edit")}>
            <Pencil className="u-i s" />
          </IconButton>
        )}
      </div>
    </div>
  );
};

interface WeeklyAttendanceTableProps {
  groupId: string;
  referenceDate: string;
}

export const WeeklyAttendanceTable = ({ groupId, referenceDate }: WeeklyAttendanceTableProps) => {
  const { t } = useTranslation();
  const { data, isLoading } = useWeeklyAttendanceQuery(groupId, referenceDate);

  if (isLoading) {
    return <Skel className="h-40" />;
  }

  if (!data || data.lessons.length === 0 || data.roster.length === 0) {
    return (
      <div className="u-card">
        <p className="u-sub !mt-0">{t("lessonDetail.noWeekLessons")}</p>
      </div>
    );
  }

  return (
    <div className="u-card">
      {data.weekStart && data.weekEnd && (
        <div className="u-chips mb-3">
          <span className="u-chip">
            <Calendar className="u-i s" strokeWidth={2} aria-hidden="true" />
            {t("us.ld.weekRange", { from: formatShort(data.weekStart), to: formatShort(data.weekEnd) })}
          </span>
        </div>
      )}
      <div className="u-stack">
        {data.roster.map((student) => (
          <WeeklyAttendanceRow key={student.id} student={student} lessons={data.lessons} />
        ))}
      </div>
    </div>
  );
};
