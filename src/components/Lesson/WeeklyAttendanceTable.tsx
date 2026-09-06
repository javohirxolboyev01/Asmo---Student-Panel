// src/components/Lesson/WeeklyAttendanceTable.tsx
import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { uz } from "date-fns/locale";
import { Coins, Pencil, Save, X } from "lucide-react";
import { teacherService } from "@/services/teacherService";
import { WeeklyAttendanceData, WeeklyAttendanceLesson, WeeklyAttendanceStudent } from "@/types/teacher";
import { cn, getAvatarUrl } from "@/lib/utils";
import { Button, IconButton, Input } from "@/components/ui";
import { toast, getErrorMessage } from "@/lib/toast";
import { useTranslation } from "@/hooks/useTranslation";

const formatDayColumn = (isoDate: string) => format(parseISO(isoDate), "EEEEEE, dd.MM", { locale: uz });

interface WeeklyAttendanceRowProps {
  student: WeeklyAttendanceStudent;
  lessons: WeeklyAttendanceLesson[];
  onSaved: () => void;
}

const buildInitialChecks = (student: WeeklyAttendanceStudent, lessons: WeeklyAttendanceLesson[]) => {
  const initial: Record<string, boolean> = {};
  lessons.forEach((l) => {
    initial[l.id] = student.attendance[l.id] === "present";
  });
  return initial;
};

const WeeklyAttendanceRow = ({ student, lessons, onSaved }: WeeklyAttendanceRowProps) => {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [checks, setChecks] = useState<Record<string, boolean>>(() => buildInitialChecks(student, lessons));
  const [coin, setCoin] = useState("");
  const [isSaving, setIsSaving] = useState(false);

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
          teacherService.saveAttendance(lesson.id, [
            { userId: student.id, status: checks[lesson.id] ? "PRESENT" : "ABSENT" },
          ]),
        ),
      );
      const coinAmount = Number(coin);
      if (coin.trim() !== "" && !Number.isNaN(coinAmount) && coinAmount !== 0) {
        await teacherService.awardCoins(student.id, {
          amount: coinAmount,
          reason: t("lessonDetail.weeklyAttendanceCoinReason"),
        });
      }
      toast.success(t("common.updateSuccess"));
      setCoin("");
      setIsEditing(false);
      onSaved();
    } catch (err) {
      toast.error(getErrorMessage(err, t("common.error")));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <tr className="border-b border-gray-100 dark:border-gray-800 last:border-b-0">
      <td className="py-3 pr-3 whitespace-nowrap">
        <div className="flex items-center gap-2">
          <img
            src={getAvatarUrl(student.avatar, `${student.firstName} ${student.lastName}`)}
            alt=""
            className="w-7 h-7 rounded-full flex-shrink-0"
          />
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
              {student.firstName} {student.lastName}
            </p>
            <p className="text-[11px] text-gray-400 flex items-center gap-1">
              <Coins className="w-3 h-3 text-warning" /> {student.coinBalance}
            </p>
          </div>
        </div>
      </td>
      {lessons.map((lesson) => (
        <td key={lesson.id} className="py-3 px-2 text-center">
          <input
            type="checkbox"
            checked={checks[lesson.id] ?? false}
            disabled={!isEditing}
            onChange={(e) => setChecks((prev) => ({ ...prev, [lesson.id]: e.target.checked }))}
            className={cn(
              "w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-warning focus:ring-warning focus:ring-offset-0",
              !isEditing && "opacity-70",
            )}
          />
        </td>
      ))}
      <td className="py-3 pl-2 pr-3 w-24">
        <Input
          type="number"
          placeholder="0"
          value={coin}
          disabled={!isEditing}
          onChange={(e) => setCoin(e.target.value)}
          className="py-1.5"
        />
      </td>
      <td className="py-3 whitespace-nowrap">
        {isEditing ? (
          <div className="flex items-center gap-1.5">
            <Button size="sm" onClick={handleSave} isLoading={isSaving} leftIcon={<Save className="w-3.5 h-3.5" />}>
              {t("common.save")}
            </Button>
            <IconButton size="sm" onClick={cancelEdit} disabled={isSaving}>
              <X className="w-3.5 h-3.5" />
            </IconButton>
          </div>
        ) : (
          <IconButton size="sm" onClick={() => setIsEditing(true)}>
            <Pencil className="w-3.5 h-3.5" />
          </IconButton>
        )}
      </td>
    </tr>
  );
};

interface WeeklyAttendanceTableProps {
  groupId: string;
  referenceDate: string;
}

export const WeeklyAttendanceTable = ({ groupId, referenceDate }: WeeklyAttendanceTableProps) => {
  const { t } = useTranslation();
  const [data, setData] = useState<WeeklyAttendanceData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = () => {
    setIsLoading(true);
    teacherService
      .getWeeklyAttendance(groupId, referenceDate)
      .then(setData)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupId, referenceDate]);

  if (isLoading) {
    return <div className="h-24 animate-pulse bg-gray-100 dark:bg-white/5 rounded-2xl" />;
  }

  if (!data || data.lessons.length === 0 || data.roster.length === 0) {
    return <p className="text-sm text-gray-400">{t("lessonDetail.noWeekLessons")}</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-gray-100 dark:border-gray-800 text-xs text-gray-400">
            <th className="py-2 pr-3 font-medium">{t("students.studentLabel")}</th>
            {data.lessons.map((lesson) => (
              <th key={lesson.id} className="py-2 px-2 font-medium text-center whitespace-nowrap capitalize">
                {formatDayColumn(lesson.lessonDate)}
              </th>
            ))}
            <th className="py-2 pl-2 pr-3 font-medium">{t("lessonDetail.coinLabel")}</th>
            <th className="py-2 font-medium">{t("common.actions")}</th>
          </tr>
        </thead>
        <tbody>
          {data.roster.map((student) => (
            <WeeklyAttendanceRow key={student.id} student={student} lessons={data.lessons} onSaved={load} />
          ))}
        </tbody>
      </table>
    </div>
  );
};
