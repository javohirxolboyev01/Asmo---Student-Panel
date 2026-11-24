// Shared "where is this lesson / homework at" helpers for the student group
// and lesson pages, so both show the same words and colours.
import {
  CircleAlert,
  CircleCheck,
  Clock,
  Hourglass,
  Lock,
  Minus,
  PencilLine,
  type LucideIcon,
} from "lucide-react";
import { getHoursUntilDeadline, isOverdue } from "@/utilist/calculateDeadline";
import { formatDate, formatTime } from "@/utilist/formatData";
import { humanDay } from "@/lib/humanDate";

type T = (key: string, vars?: Record<string, string | number>) => string;

const DAY = 86_400_000;
const startOfDay = (d: Date) =>
  new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** Calendar days from today: 0 = today, 1 = tomorrow, -1 = yesterday. */
export const dayOffset = (iso: string) =>
  Math.round((startOfDay(new Date(iso)) - startOfDay(new Date())) / DAY);

export type When = "today" | "upcoming" | "past";
export const lessonWhen = (iso: string): When => {
  const d = dayOffset(iso);
  return d === 0 ? "today" : d > 0 ? "upcoming" : "past";
};

/** "Bugun, 15:00" / "Ertaga, 15:00" / "Kecha, 15:00" / "27.11.2026, 15:00". */
export const whenLabel = (t: T, iso: string) => {
  const d = dayOffset(iso);
  const time = formatTime(iso);
  if (d === 0) return t("space.groups.whenToday", { time });
  if (d === 1) return t("space.groups.whenTomorrow", { time });
  if (d === -1) return t("space.groups.whenYesterday", { time });
  return t("space.groups.whenDate", { date: humanDay(iso, t), time });
};

/** "2 kun qoldi" / "5 soat qoldi" / "1 soatdan kam vaqt qoldi". */
export const timeLeftLabel = (t: T, deadline: string) => {
  const h = getHoursUntilDeadline(deadline);
  if (h >= 48) return t("space.groups.leftDays", { n: Math.floor(h / 24) });
  if (h >= 1) return t("space.groups.leftHours", { n: h });
  return t("space.groups.leftLess");
};

/**
 * none      – no homework
 * todo      – open, nothing sent yet
 * submitted – sent, waiting for the teacher
 * graded    – has a score
 * missed    – deadline passed, nothing sent
 * closed    – teacher closed it
 * pending   – status not known yet (still loading / not fetched)
 */
export type HwState =
  "none" | "todo" | "submitted" | "graded" | "missed" | "closed" | "pending";

export const hwStateOf = (
  homework:
    | { deadline: string; isOverdue?: boolean; status?: string }
    | null
    | undefined,
  submission: { status: string } | null | undefined,
  known: boolean,
): HwState => {
  if (!homework) return "none";
  if (submission?.status === "graded") return "graded";
  if (submission) return "submitted";
  if (!known) return "pending";
  if (homework.status === "closed") return "closed";
  if (homework.isOverdue || isOverdue(homework.deadline)) return "missed";
  return "todo";
};

const TONE: Record<HwState, string> = {
  none: "sp-mute",
  todo: "sp-sun",
  submitted: "sp-cyan",
  graded: "",
  missed: "sp-pink",
  closed: "sp-mute",
  pending: "sp-mute",
};
const ICON: Record<HwState, LucideIcon> = {
  none: Minus,
  todo: PencilLine,
  submitted: Hourglass,
  graded: CircleCheck,
  missed: CircleAlert,
  closed: Lock,
  pending: Clock,
};

/** Coloured status chip of a lesson's homework. */
export const HwChip = ({
  t,
  state,
  deadline,
  score,
  max,
  long = false,
}: {
  t: T;
  state: HwState;
  deadline?: string;
  score?: number | null;
  max?: number;
  /** Adds the time left to an open homework ("Topshirilmagan · 2 kun qoldi"). */
  long?: boolean;
}) => {
  const Icon = ICON[state];
  let text: string;
  switch (state) {
    case "graded":
      text = t("space.groups.stGraded", { score: score ?? 0, max: max ?? 0 });
      break;
    case "todo":
      text =
        deadline && long
          ? `${t("space.groups.stTodo")} · ${timeLeftLabel(t, deadline)}`
          : t("space.groups.stTodo");
      break;
    case "pending":
      text = deadline
        ? t("space.groups.deadline", { date: formatDate(deadline) })
        : t("space.groups.hwOpen");
      break;
    default:
      text = t(`space.groups.st${state[0].toUpperCase()}${state.slice(1)}`);
  }
  return (
    <span className={`sp-badge sp-hwchip ${TONE[state]}`}>
      <Icon aria-hidden="true" />
      {text}
    </span>
  );
};
