// src/student/pages/LessonDetailPage.tsx
// One clear hierarchy: lesson header (topic, lesson N, date & time, status),
// then the homework card — status + deadline countdown, the result (score and
// teacher's comment), the task, your answer and the submit form — then what
// the lesson was about.
import { type ChangeEvent, useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  useLessonDetailQuery,
  useSubmitHomeworkMutation,
} from "@/hooks/queries/useLessons";
import { useTranslation } from "@/hooks/useTranslation";
import { useClosingConfirmation } from "@/hooks/useTelegram";
import { openExternal } from "@/lib/telegram";
import { getErrorMessage } from "@/lib/toast";
import { ApiError } from "@/services/apiClient";
import { queryKeys } from "@/lib/queryClient";
import { isOverdue } from "@/utilist/calculateDeadline";
import { formatDateTime } from "@/utilist/formatData";
import {
  BookOpen,
  CalendarDays,
  CircleCheck,
  CircleX,
  Clock,
  GraduationCap,
  Hash,
  Lock,
  MessageSquare,
  OctagonX,
  Paperclip,
  PencilLine,
  Search,
  Send,
  Star,
  Moon,
  Hourglass,
} from "lucide-react";
import {
  EmptyState,
  ErrorState,
  ImageViewer,
  Modal,
  PageHeader,
  Skel,
  Spinner,
} from "../components/ui";
import { IconTile, InlineIcon } from "../components/icons";
import {
  HwChip,
  hwStateOf,
  lessonWhen,
  timeLeftLabel,
  whenLabel,
} from "../components/groups/lessonStatus";
import "../theme/groups.css";

const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024;
/** Phone photos are usually 3–8 MB: they're shrunk on the device before sending. */
const MAX_PHOTO_BYTES = 25 * 1024 * 1024;
/** Fits the backend's attachment limit (2.9M chars) with room to spare. */
const MAX_DATA_URL = 2_700_000;
const MAX_CONTENT = 10000; // backend limit for submission text

const isImageUrl = (url: string) =>
  url.startsWith("data:image/") || /\.(png|jpe?g|gif|webp)(\?|$)/i.test(url);

const readAsDataUrl = (file: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

/**
 * A photo → JPEG data URL, longest side ≤ 2000px and small enough to send.
 * Returns null when the browser can't decode it (e.g. HEIC outside Safari).
 */
async function shrinkPhoto(file: File): Promise<string | null> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = url;
    }).catch(() => null);
    if (!img || !img.naturalWidth || !img.naturalHeight) return null;
    for (const side of [2000, 1600, 1280]) {
      const scale = Math.min(1, side / Math.max(img.naturalWidth, img.naturalHeight));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.naturalWidth * scale);
      canvas.height = Math.round(img.naturalHeight * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.fillStyle = "#fff"; // transparent PNGs get a white page, not black
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      for (const q of [0.85, 0.72, 0.6]) {
        const data = canvas.toDataURL("image/jpeg", q);
        if (data.length <= MAX_DATA_URL) return data;
      }
    }
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Attachment: a photo opens in the app's viewer; other files download / open. */
const Attachment = ({
  url,
  label,
  onOpenImage,
}: {
  url: string;
  label: string;
  onOpenImage: (url: string) => void;
}) => {
  const isData = url.startsWith("data:");
  const mime = isData ? url.slice(5, url.indexOf(";")) : "";
  const ext = mime.split("/")[1]?.split("+")[0] || "bin";
  if (isImageUrl(url)) {
    return (
      <div className="sp-ld-file">
        <button
          type="button"
          className="sp-ld-photo"
          onClick={() => onOpenImage(url)}
          aria-label={label}
        >
          <img src={url} alt={label} className="sp-groups-preview" loading="lazy" />
        </button>
      </div>
    );
  }
  return (
    <div className="sp-ld-file">
      <a
        href={url}
        className="sp-groups-file"
        {...(isData
          ? { download: `attachment.${ext}` }
          : { target: "_blank", rel: "noopener noreferrer" })}
        onClick={(e) => {
          // Inside Telegram a new-tab link may do nothing: open it in Telegram's browser.
          if (!isData && openExternal(url)) e.preventDefault();
        }}
      >
        <Paperclip className="sp-ii" aria-hidden="true" />
        <span>{label}</span>
      </a>
    </div>
  );
};

const LessonSkeleton = () => (
  <div aria-busy="true">
    <Skel className="mt-4 h-9 w-32" />
    <Skel className="mt-5 h-9 w-2/3" />
    <div className="mt-3 flex flex-wrap gap-2">
      <Skel className="h-8 w-24" />
      <Skel className="h-8 w-40" />
      <Skel className="h-8 w-28" />
    </div>
    <div className="sp-panel mt-4">
      <div className="flex items-center gap-3">
        <Skel className="h-8 w-8 !rounded-[10px]" />
        <Skel className="h-6 w-36" />
        <Skel className="ml-auto h-7 w-28" />
      </div>
      <Skel className="mt-4 h-[64px]" />
      <Skel className="mt-4 h-5 w-1/2" />
      <Skel className="mt-2 h-16" />
      <Skel className="mt-5 h-[140px]" />
      <Skel className="mt-3 h-12 w-44 !rounded-full" />
    </div>
  </div>
);

export const LessonDetailPage = () => {
  const { t } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const { data, isLoading, error, refetch } = useLessonDetailQuery(id);
  const submitHomework = useSubmitHomeworkMutation(id ?? "");
  const [content, setContent] = useState("");
  const [attachment, setAttachment] = useState<{
    name: string;
    dataUrl: string;
  } | null>(null);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [sentOpen, setSentOpen] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [viewing, setViewing] = useState<string | null>(null);
  const closeViewer = useCallback(() => setViewing(null), []);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Telegram asks before closing the app with an answer typed but not sent.
  useClosingConfirmation(Boolean(content.trim() || attachment) && !submitHomework.isPending);
  const { hash } = useLocation();
  const hasHomework = !!data?.homework;
  const jumpedFor = useRef<string | null>(null);

  // `/lessons/:id#homework` (notifications, dashboard) lands on the homework
  // card. Deferred so it runs after the layout's scroll-to-top on navigation.
  useEffect(() => {
    if (hash !== "#homework" || !hasHomework || !id || jumpedFor.current === id) return;
    jumpedFor.current = id;
    const timer = window.setTimeout(() => {
      document.getElementById("homework")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
    return () => window.clearTimeout(timer);
  }, [hash, hasHomework, id]);

  const handleSubmit = () => {
    if (!data?.homework || !id || submitHomework.isPending || preparing) return;
    // A file alone is a full answer; the comment is optional.
    if (!content.trim() && !attachment) return;
    setMessage(null);
    submitHomework.mutate(
      {
        homeworkId: data.homework.id,
        content: content.trim(),
        attachmentUrl: attachment?.dataUrl,
        attachmentName: attachment?.name,
      },
      {
        onSuccess: () => {
          // Drops it from the dashboard's "homework to do" list.
          void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard, exact: true });
          setAttachment(null);
          setContent("");
          setMessage({
            type: "success",
            text: t("lessonDetail.submitSuccess"),
          });
          setSentOpen(true);
        },
        onError: (err) =>
          setMessage({
            type: "error",
            text:
              err instanceof ApiError && err.code === "ALREADY_SUBMITTED"
                ? t("space.groups.alreadySent")
                : getErrorMessage(err, t("lessonDetail.submitError")),
          }),
      },
    );
  };

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const tooLarge = () =>
      setMessage({ type: "error", text: t("lessonDetail.attachmentTooLarge") });
    // Photos (not GIFs: they'd lose their animation) are shrunk on the phone.
    const isPhoto =
      (file.type.startsWith("image/") && file.type !== "image/gif" && file.type !== "image/svg+xml") ||
      /\.(jpe?g|png|webp|heic|heif)$/i.test(file.name);
    if (file.size > (isPhoto ? MAX_PHOTO_BYTES : MAX_ATTACHMENT_BYTES)) return tooLarge();
    setMessage(null);
    setPreparing(true);
    try {
      let dataUrl: string | null = null;
      let name = file.name || "file";
      if (isPhoto) {
        dataUrl = await shrinkPhoto(file);
        if (dataUrl) name = `${name.replace(/\.[^.]+$/, "") || "photo"}.jpg`;
      }
      if (!dataUrl) {
        if (file.size > MAX_ATTACHMENT_BYTES) return tooLarge();
        dataUrl = await readAsDataUrl(file);
      }
      setAttachment({ name, dataUrl });
    } catch {
      setMessage({ type: "error", text: t("common.error") });
    } finally {
      setPreparing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="sp-page">
        <LessonSkeleton />
      </div>
    );
  }

  if (error || !data?.lesson) {
    return (
      <div className="sp-page">
        <PageHeader
          back={{ to: "/groups", label: t("groups.title") }}
          title={t("lessonDetail.notFound")}
        />
        {error ? (
          <ErrorState
            message={getErrorMessage(error, t("lessonDetail.notFound"))}
            onRetry={() => refetch()}
          />
        ) : (
          <EmptyState
            icon={Search}
            title={t("lessonDetail.notFound")}
            action={
              <Link to="/groups" className="sp-cta inline-block no-underline">
                {t("lessonDetail.backToGroups")}
              </Link>
            }
          />
        )}
      </div>
    );
  }

  const { lesson, homework, submission } = data;
  const groupId = lesson.groupId;
  const back = groupId
    ? {
        to: `/groups/${groupId}`,
        label: lesson.groupName || t("lessonDetail.backToGroup"),
      }
    : { to: "/groups", label: t("groups.title") };
  const graded = submission?.status === "graded";
  const overdue = homework ? isOverdue(homework.deadline) : false;
  // One answer per homework: once it's sent it can't be changed.
  const canSubmit =
    !!homework && homework.status === "active" && !overdue && !graded && !submission;
  const pending = submitHomework.isPending;
  const canSend = Boolean(content.trim() || attachment) && !pending && !preparing;
  const state = hwStateOf(homework, submission, true);
  const when = lessonWhen(lesson.lessonDate);
  const lessonStatus =
    lesson.status === "cancelled"
      ? { text: t("space.groups.lsCancelled"), tone: "sp-pink" }
      : when === "today"
        ? { text: t("space.groups.lsToday"), tone: "sp-sun" }
        : when === "upcoming"
          ? { text: t("space.groups.lsUpcoming"), tone: "sp-cyan" }
          : { text: t("space.groups.lsPast"), tone: "" };
  const percent =
    graded && homework?.maxScore
      ? Math.round(((submission?.score ?? 0) / homework.maxScore) * 100)
      : 0;

  return (
    <div className="sp-page">
      <PageHeader
        back={back}
        title={lesson.topic}
        subtitle={lesson.groupName || undefined}
        right={
          graded && homework ? (
            <div className="sp-pill" aria-label={t("lessonDetail.graded")}>
              <Star
                className="sp-flame-ic"
                aria-hidden="true"
                strokeWidth={2.2}
              />
              <span>
                {submission?.score}/{homework.maxScore}
              </span>
            </div>
          ) : undefined
        }
      />

      <div className="sp-groups-info sp-ld-meta">
        <span>
          <InlineIcon icon={Hash} />{" "}
          {t("lessonDetail.lessonNumber", { order: lesson.lessonOrder })}
        </span>
        <span>
          <InlineIcon icon={CalendarDays} /> {whenLabel(t, lesson.lessonDate)}
        </span>
        {lesson.teacherName && (
          <span className="sp-groups-teacher-chip">
            <GraduationCap
              className="sp-groups-teacher-icon"
              aria-hidden="true"
            />
            <span className="sp-groups-teacher-name">{lesson.teacherName}</span>
          </span>
        )}
        <span className={`sp-ld-status ${lessonStatus.tone}`}>
          {lessonStatus.text}
        </span>
      </div>

      <div className={lesson.description ? "sp-ld" : "sp-ld sp-ld-one"}>
        <div className="sp-ld-main">
          {!homework ? (
            <EmptyState
              icon={Moon}
              title={t("space.groups.noHomework")}
              text={t("space.groups.noHomeworkHint")}
            />
          ) : (
            <section id="homework" className="sp-panel sp-hwc" aria-labelledby="sp-hwc-title">
              <div className="sp-hwc-head">
                <h2 id="sp-hwc-title" className="sp-h-ic">
                  <IconTile icon={PencilLine} tint="orange" size="sm" />{" "}
                  {t("lessonDetail.homeworkTitle")}
                </h2>
                <HwChip
                  t={t}
                  state={state}
                  score={submission?.score}
                  max={homework.maxScore}
                />
              </div>

              {/* Deadline + countdown */}
              <div
                className={`sp-hwc-due ${state === "missed" ? "sp-pink" : state === "todo" ? "sp-sun" : ""}`}
              >
                <InlineIcon icon={Clock} />
                <div className="min-w-0">
                  <small>{t("space.groups.dueLabel")}</small>
                  <b>{formatDateTime(homework.deadline)}</b>
                </div>
                {!overdue && homework.status === "active" && !graded && (
                  <span className="sp-hwc-left">
                    {timeLeftLabel(t, homework.deadline)}
                  </span>
                )}
                {overdue && !submission && (
                  <span className="sp-hwc-left">
                    {t("space.groups.dueOver")}
                  </span>
                )}
              </div>

              {/* Result */}
              {graded && (
                <div className="sp-hwc-result">
                  <div className="sp-hwc-score">
                    <b>{submission?.score}</b>
                    <span>
                      {t("space.groups.ofMax", { max: homework.maxScore })}
                    </span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <strong>
                      {t("lessonDetail.gradedFooter", {
                        score: submission?.score ?? 0,
                        max: homework.maxScore,
                      })}
                    </strong>
                    <div className="sp-hwc-bar" aria-hidden="true">
                      <i style={{ width: `${Math.min(100, percent)}%` }} />
                    </div>
                    {submission?.feedback && (
                      <div className="sp-hwc-feedback">
                        <small>
                          <InlineIcon icon={MessageSquare} />{" "}
                          {t("space.groups.feedback")}
                        </small>
                        <p>{submission.feedback}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {submission?.status === "submitted" && (
                <div className="sp-groups-alert sp-cyan" role="status">
                  <InlineIcon icon={Hourglass} />{" "}
                  {t("space.groups.waitingHint")}
                </div>
              )}
              {overdue && !submission && homework.status !== "closed" && (
                <div className="sp-groups-alert sp-pink" role="status">
                  <InlineIcon icon={OctagonX} /> {t("lessonDetail.overdue")}.{" "}
                  {t("space.groups.missedHint")}
                </div>
              )}
              {homework.status === "closed" && !graded && (
                <div className="sp-groups-alert sp-mute" role="status">
                  <InlineIcon icon={Lock} /> {t("space.groups.closed")}
                </div>
              )}

              {/* Task */}
              <div className="sp-groups-block">
                <small className="sp-hwc-label">{t("space.groups.task")}</small>
                <h3>{homework.title}</h3>
                {homework.description && (
                  <p className="sp-groups-text">{homework.description}</p>
                )}
                <span className="sp-badge sp-mute sp-hwc-max">
                  <InlineIcon icon={Star} />{" "}
                  {t("space.groups.maxScore", { n: homework.maxScore })}
                </span>
              </div>

              {/* Your answer */}
              {submission && (
                <div className="sp-groups-block">
                  <small className="sp-hwc-label">
                    {t("lessonDetail.yourAnswerTitle")}
                  </small>
                  {submission.content.trim() && (
                    <p className="sp-groups-answer">{submission.content}</p>
                  )}
                  {submission.submittedAt && (
                    <small className="sp-groups-meta">
                      <InlineIcon icon={CircleCheck} />{" "}
                      {t("space.groups.submittedAt", {
                        date: formatDateTime(submission.submittedAt),
                      })}
                    </small>
                  )}
                  {submission.attachmentUrl && (
                    <Attachment
                      url={submission.attachmentUrl}
                      label={t("lessonDetail.attachmentLabel")}
                      onOpenImage={setViewing}
                    />
                  )}
                </div>
              )}

              {/* Submit (only before the first answer: it can't be changed later) */}
              {canSubmit && (
                <div className="sp-groups-block">
                  <label className="sp-fl" htmlFor="sp-hw-answer">
                    <span className="sp-hwc-label">
                      {t("lessonDetail.submitTitle")}
                    </span>
                  </label>
                  <small className="sp-groups-meta !mt-0.5">
                    {t("space.groups.answerHint")} {t("space.groups.finalHint")}
                  </small>
                  <textarea
                    id="sp-hw-answer"
                    className="sp-in mt-2 min-h-[140px]"
                    value={content}
                    maxLength={MAX_CONTENT}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder={t("lessonDetail.submitPlaceholder")}
                    disabled={pending}
                  />
                  {content.length > MAX_CONTENT * 0.8 && (
                    <small className="sp-groups-count">
                      {content.length}/{MAX_CONTENT}
                    </small>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  {attachment && (
                    <div>
                      {isImageUrl(attachment.dataUrl) && (
                        <button
                          type="button"
                          className="sp-ld-photo"
                          onClick={() => setViewing(attachment.dataUrl)}
                          aria-label={attachment.name}
                        >
                          <img
                            src={attachment.dataUrl}
                            alt={attachment.name}
                            className="sp-groups-preview"
                          />
                        </button>
                      )}
                      <div className="sp-groups-file">
                        <Paperclip className="sp-ii" aria-hidden="true" />
                        <span>{attachment.name}</span>
                        <button
                          type="button"
                          onClick={() => setAttachment(null)}
                          aria-label={t("space.groups.removeFile")}
                          disabled={pending}
                        >
                          <CircleX aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="sp-groups-actions">
                    <button
                      type="button"
                      className="sp-cta sp-ghost"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={pending || preparing}
                    >
                      {preparing ? <Spinner /> : <Paperclip aria-hidden="true" />}{" "}
                      {t("lessonDetail.uploadFile")}
                    </button>
                    <button
                      type="button"
                      className="sp-cta sp-hwc-send"
                      onClick={handleSubmit}
                      disabled={!canSend}
                    >
                      {pending ? <Spinner /> : <Send aria-hidden="true" />}{" "}
                      {t("lessonDetail.submit")}
                    </button>
                  </div>
                  {message && (
                    <p
                      className={
                        message.type === "error" ? "sp-msg sp-err" : "sp-msg"
                      }
                      role="status"
                    >
                      {message.type === "success" && (
                        <InlineIcon icon={CircleCheck} />
                      )}{" "}
                      {message.text}
                    </p>
                  )}
                </div>
              )}

              {!canSubmit && message?.type === "success" && (
                <p className="sp-msg" role="status">
                  <InlineIcon icon={CircleCheck} /> {message.text}
                </p>
              )}
            </section>
          )}
        </div>

        {lesson.description && (
          <aside className="sp-ld-aside">
            <div className="sp-panel">
              <h2 className="sp-h-ic">
                <IconTile icon={BookOpen} tint="blue" size="sm" />{" "}
                {t("space.groups.lessonAbout")}
              </h2>
              <p className="sp-groups-text">{lesson.description}</p>
            </div>
          </aside>
        )}
      </div>

      <ImageViewer
        src={viewing}
        alt={t("lessonDetail.attachmentLabel")}
        onClose={closeViewer}
      />

      <Modal
        open={sentOpen}
        onClose={() => setSentOpen(false)}
        labelledBy="sp-hw-sent"
      >
        <IconTile icon={Send} tint="green" size="lg" />
        <h2 id="sp-hw-sent">{t("space.groups.sentTitle")}</h2>
        <p>{t("space.groups.sentText")}</p>
        <div className="flex flex-wrap justify-center gap-2">
          <button
            className="sp-cta sp-ghost"
            onClick={() => setSentOpen(false)}
          >
            {t("space.awesome")}
          </button>
          <Link
            to="/"
            className="sp-cta inline-block no-underline"
            onClick={() => setSentOpen(false)}
          >
            {t("space.groups.toHome")}
          </Link>
        </div>
      </Modal>
    </div>
  );
};
