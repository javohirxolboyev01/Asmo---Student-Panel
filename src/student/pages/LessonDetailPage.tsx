// src/student/pages/LessonDetailPage.tsx
// One clear hierarchy: lesson header (topic, lesson N, date & time, status),
// then the homework card — status + deadline countdown, the result (score and
// teacher's comment), the task, your answer and the submit form — then what
// the lesson was about.
import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import {
  useLessonDetailQuery,
  useSubmitHomeworkMutation,
} from "@/hooks/queries/useLessons";
import { useTranslation } from "@/hooks/useTranslation";
import { getErrorMessage } from "@/lib/toast";
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
const MAX_CONTENT = 10000; // backend limit for submission text

/** Attachment link: data: URLs can't be opened in a new tab, so download them. */
const Attachment = ({ url, label }: { url: string; label: string }) => {
  const isData = url.startsWith("data:");
  const mime = isData ? url.slice(5, url.indexOf(";")) : "";
  const ext = mime.split("/")[1]?.split("+")[0] || "bin";
  const isImage =
    mime.startsWith("image/") || /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(url);
  return (
    <div className="sp-ld-file">
      {isImage && (
        <img
          src={url}
          alt={label}
          className="sp-groups-preview"
          loading="lazy"
        />
      )}
      <a
        href={url}
        className="sp-groups-file"
        {...(isData
          ? { download: `attachment.${ext}` }
          : { target: "_blank", rel: "noopener noreferrer" })}
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prefilledFor = useRef<string | null>(null);
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

  // Prefill the editor with the existing (ungraded) answer once per submission,
  // so a background refetch never overwrites what the student is typing.
  useEffect(() => {
    const s = data?.submission;
    if (s && s.status !== "graded" && prefilledFor.current !== s.id) {
      prefilledFor.current = s.id;
      setContent(s.content ?? "");
    }
  }, [data]);

  const handleSubmit = () => {
    if (!data?.homework || !content.trim() || !id || submitHomework.isPending)
      return;
    setMessage(null);
    submitHomework.mutate(
      {
        homeworkId: data.homework.id,
        content,
        attachmentUrl: attachment?.dataUrl,
      },
      {
        onSuccess: () => {
          // Drops it from the dashboard's "homework to do" list.
          void queryClient.invalidateQueries({ queryKey: queryKeys.dashboard, exact: true });
          setAttachment(null);
          setMessage({
            type: "success",
            text: t("lessonDetail.submitSuccess"),
          });
          setSentOpen(true);
        },
        onError: (err) =>
          setMessage({
            type: "error",
            text: getErrorMessage(err, t("lessonDetail.submitError")),
          }),
      },
    );
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > MAX_ATTACHMENT_BYTES) {
      setMessage({ type: "error", text: t("lessonDetail.attachmentTooLarge") });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      setMessage(null);
      setAttachment({ name: file.name, dataUrl: reader.result as string });
    };
    reader.onerror = () =>
      setMessage({ type: "error", text: t("common.error") });
    reader.readAsDataURL(file);
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
  const canSubmit =
    !!homework && homework.status === "active" && !overdue && !graded;
  const pending = submitHomework.isPending;
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
                  <p className="sp-groups-answer">{submission.content}</p>
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
                    />
                  )}
                </div>
              )}

              {/* Submit / resubmit */}
              {canSubmit && (
                <div className="sp-groups-block">
                  <label className="sp-fl" htmlFor="sp-hw-answer">
                    <span className="sp-hwc-label">
                      {submission
                        ? t("lessonDetail.editTitle")
                        : t("lessonDetail.submitTitle")}
                    </span>
                  </label>
                  <small className="sp-groups-meta !mt-0.5">
                    {submission
                      ? t("space.groups.resubmitHint")
                      : t("space.groups.answerHint")}
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
                      {submission?.attachmentUrl && (
                        <small className="sp-groups-meta">
                          {t("space.groups.replaceFile")}
                        </small>
                      )}
                    </div>
                  )}

                  <div className="sp-groups-actions">
                    <button
                      type="button"
                      className="sp-cta sp-ghost"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={pending}
                    >
                      <Paperclip aria-hidden="true" />{" "}
                      {t("lessonDetail.uploadFile")}
                    </button>
                    <button
                      type="button"
                      className="sp-cta sp-hwc-send"
                      onClick={handleSubmit}
                      disabled={!content.trim() || pending}
                    >
                      {pending ? <Spinner /> : <Send aria-hidden="true" />}{" "}
                      {submission
                        ? t("lessonDetail.resubmit")
                        : t("lessonDetail.submit")}
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
