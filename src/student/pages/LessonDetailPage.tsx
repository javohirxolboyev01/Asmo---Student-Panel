// src/student/pages/LessonDetailPage.tsx
// Lesson info + homework: status/score, your answer, and the submit form.
import { type ChangeEvent, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useLessonDetailQuery, useSubmitHomeworkMutation } from "@/hooks/queries/useLessons";
import { useTranslation } from "@/hooks/useTranslation";
import { getErrorMessage } from "@/lib/toast";
import { queryKeys } from "@/lib/queryClient";
import { getHoursUntilDeadline, isOverdue } from "@/utilist/calculateDeadline";
import { formatDate, formatDateTime } from "@/utilist/formatData";
import { EmptyState, ErrorState, Modal, PageHeader, Skel, Spinner } from "../components/ui";
import "../theme/groups.css";

const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024;
const MAX_CONTENT = 10000; // backend limit for submission text

/** Attachment link: data: URLs can't be opened in a new tab, so download them. */
const Attachment = ({ url, label }: { url: string; label: string }) => {
  const isData = url.startsWith("data:");
  const mime = isData ? url.slice(5, url.indexOf(";")) : "";
  const ext = mime.split("/")[1]?.split("+")[0] || "bin";
  const isImage = mime.startsWith("image/") || /\.(png|jpe?g|gif|webp|svg)(\?|$)/i.test(url);
  return (
    <div>
      {isImage && <img src={url} alt={label} className="sp-groups-preview" loading="lazy" />}
      <a
        href={url}
        className="sp-groups-file"
        {...(isData ? { download: `attachment.${ext}` } : { target: "_blank", rel: "noopener noreferrer" })}
      >
        <span aria-hidden="true">📎</span>
        <span>{label}</span>
      </a>
    </div>
  );
};

const LessonSkeleton = () => (
  <div aria-busy="true">
    <Skel className="mt-4 h-9 w-32" />
    <Skel className="mt-5 h-9 w-2/3" />
    <Skel className="mt-2 h-4 w-1/2" />
    <div className="sp-panel mt-4">
      <Skel className="h-6 w-40" />
      <div className="sp-groups-hw">
        <div>
          <Skel className="h-5 w-3/4" />
          <Skel className="mt-2 h-16" />
          <Skel className="mt-3 h-4 w-1/2" />
        </div>
        <Skel className="h-[130px]" />
      </div>
      <Skel className="mt-5 h-[110px]" />
      <Skel className="mt-3 h-11 w-40" />
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
  const [attachment, setAttachment] = useState<{ name: string; dataUrl: string } | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [sentOpen, setSentOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const prefilledFor = useRef<string | null>(null);

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
    if (!data?.homework || !content.trim() || !id || submitHomework.isPending) return;
    setMessage(null);
    submitHomework.mutate(
      { homeworkId: data.homework.id, content, attachmentUrl: attachment?.dataUrl },
      {
        onSuccess: () => {
          // Lets the "submit homework" mission become claimable right away.
          void queryClient.invalidateQueries({ queryKey: queryKeys.missionsToday });
          setAttachment(null);
          setMessage({ type: "success", text: t("lessonDetail.submitSuccess") });
          setSentOpen(true);
        },
        onError: (err) => setMessage({ type: "error", text: getErrorMessage(err, t("lessonDetail.submitError")) }),
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
    reader.onerror = () => setMessage({ type: "error", text: t("common.error") });
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
        <PageHeader back={{ to: "/groups", label: t("groups.title") }} title={t("lessonDetail.notFound")} />
        {error ? (
          <ErrorState message={getErrorMessage(error, t("lessonDetail.notFound"))} onRetry={() => refetch()} />
        ) : (
          <EmptyState
            emoji="🔭"
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
    ? { to: `/groups/${groupId}`, label: lesson.groupName || t("lessonDetail.backToGroup") }
    : { to: "/groups", label: t("groups.title") };
  const graded = submission?.status === "graded";
  const overdue = homework ? isOverdue(homework.deadline) : false;
  const canSubmit = !!homework && homework.status === "active" && !overdue && !graded;
  const pending = submitHomework.isPending;

  const timeLeft = () => {
    if (!homework) return "";
    const h = getHoursUntilDeadline(homework.deadline);
    if (h >= 48) return t("space.groups.leftDays", { n: Math.floor(h / 24) });
    if (h >= 1) return t("space.groups.leftHours", { n: h });
    return t("space.groups.leftLess");
  };

  return (
    <div className="sp-page">
      <PageHeader
        back={back}
        title={lesson.topic}
        subtitle={[
          t("lessonDetail.lessonNumber", { order: lesson.lessonOrder }),
          `📅 ${formatDate(lesson.lessonDate)}`,
          lesson.teacherName && `👩‍🏫 ${lesson.teacherName}`,
        ]
          .filter(Boolean)
          .join(" · ")}
        right={
          graded && homework ? (
            <div className="sp-pill" aria-label={t("lessonDetail.graded")}>
              ⭐ {submission?.score}/{homework.maxScore}
            </div>
          ) : undefined
        }
      />

      {lesson.description && (
        <div className="sp-panel mb-3.5">
          <h2>📘 {t("space.groups.lessonAbout")}</h2>
          <p className="sp-groups-text">{lesson.description}</p>
        </div>
      )}

      {!homework ? (
        <EmptyState emoji="🌙" title={t("space.groups.noHomework")} text={t("space.groups.noHomeworkHint")} />
      ) : (
        <div className="sp-panel">
          <h2>📝 {t("lessonDetail.homeworkTitle")}</h2>

          <div className="sp-groups-hw">
            <div className="min-w-0">
              <h3>{homework.title}</h3>
              {homework.description && <p className="sp-groups-text">{homework.description}</p>}
              <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                <span className={overdue ? "sp-badge sp-pink" : "sp-badge sp-sun"}>
                  ⏰ {t("lessonDetail.deadlineLabel", { date: formatDateTime(homework.deadline) })}
                </span>
                {graded && <span className="sp-badge">✓ {t("lessonDetail.graded")}</span>}
                {submission?.status === "submitted" && (
                  <span className="sp-badge sp-cyan">⏳ {t("lessonDetail.waiting")}</span>
                )}
              </div>
            </div>

            {graded ? (
              <div className="sp-groups-score sp-graded">
                <b>
                  {submission?.score}
                  <small> {t("space.groups.ofMax", { max: homework.maxScore })}</small>
                </b>
                <span>{t("lessonDetail.graded")}</span>
              </div>
            ) : submission?.status === "submitted" ? (
              <div className="sp-groups-score">
                <span className="sp-groups-big-ic" aria-hidden="true">
                  ⏳
                </span>
                <strong className="text-base" style={{ color: "var(--sp-ink)" }}>
                  {t("lessonDetail.waiting")}
                </strong>
                <span>{t("lessonDetail.checking")}</span>
              </div>
            ) : (
              <div className="sp-groups-score">
                <b>
                  0<small> {t("space.groups.ofMax", { max: homework.maxScore })}</small>
                </b>
                <span>{t("lessonDetail.notSubmittedYet")}</span>
              </div>
            )}
          </div>

          {graded && submission?.feedback && (
            <div className="sp-groups-block">
              <h3>💬 {t("space.groups.feedback")}</h3>
              <p className="sp-groups-answer">{submission?.feedback}</p>
            </div>
          )}

          {overdue && homework.status !== "closed" && (
            <div className="sp-groups-alert sp-pink" role="status">
              ⛔ {t("lessonDetail.overdue")}
            </div>
          )}
          {homework.status === "closed" && !graded && (
            <div className="sp-groups-alert sp-mute" role="status">
              🔒 {t("space.groups.closed")}
            </div>
          )}
          {!overdue && homework.status === "active" && !submission && (
            <div className="sp-groups-alert" role="status">
              ⏰ {timeLeft()}
            </div>
          )}

          {submission && (
            <div className="sp-groups-block">
              <h3>{t("lessonDetail.yourAnswerTitle")}</h3>
              <p className="sp-groups-answer">{submission.content}</p>
              {submission.submittedAt && (
                <small className="sp-groups-meta">
                  {t("space.groups.submittedAt", { date: formatDateTime(submission.submittedAt) })}
                </small>
              )}
              {submission.attachmentUrl && (
                <Attachment url={submission.attachmentUrl} label={t("lessonDetail.attachmentLabel")} />
              )}
            </div>
          )}

          {canSubmit && (
            <div className="sp-groups-block">
              <h3>{submission ? t("lessonDetail.editTitle") : t("lessonDetail.submitTitle")}</h3>
              <label className="sp-fl mt-2">
                <span className="sr-only">{t("lessonDetail.submitTitle")}</span>
                <textarea
                  className="sp-in min-h-[140px]"
                  value={content}
                  maxLength={MAX_CONTENT}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder={t("lessonDetail.submitPlaceholder")}
                  disabled={pending}
                />
              </label>
              {content.length > MAX_CONTENT * 0.8 && (
                <small className="sp-groups-count">
                  {content.length}/{MAX_CONTENT}
                </small>
              )}

              <input ref={fileInputRef} type="file" onChange={handleFileSelect} className="hidden" />
              {attachment && (
                <div>
                  <div className="sp-groups-file">
                    <span aria-hidden="true">📎</span>
                    <span>{attachment.name}</span>
                    <button
                      type="button"
                      onClick={() => setAttachment(null)}
                      aria-label={t("space.groups.removeFile")}
                      disabled={pending}
                    >
                      ✕
                    </button>
                  </div>
                  {submission?.attachmentUrl && <small className="sp-groups-meta">{t("space.groups.replaceFile")}</small>}
                </div>
              )}

              <div className="sp-groups-actions">
                <button
                  type="button"
                  className="sp-cta sp-ghost"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={pending}
                >
                  📎 {t("lessonDetail.uploadFile")}
                </button>
                <button type="button" className="sp-cta" onClick={handleSubmit} disabled={!content.trim() || pending}>
                  {pending ? <Spinner /> : "🚀"} {submission ? t("lessonDetail.resubmit") : t("lessonDetail.submit")}
                </button>
              </div>
              {message && (
                <p className={message.type === "error" ? "sp-msg sp-err" : "sp-msg"} role="status">
                  {message.type === "success" ? "✓ " : ""}
                  {message.text}
                </p>
              )}
            </div>
          )}

          {!canSubmit && message?.type === "success" && (
            <p className="sp-msg" role="status">
              ✓ {message.text}
            </p>
          )}

          {graded && (
            <p className="sp-msg mt-4" role="status">
              ✓ {t("lessonDetail.gradedFooter", { score: submission?.score, max: homework.maxScore })}
            </p>
          )}
        </div>
      )}

      <Modal open={sentOpen} onClose={() => setSentOpen(false)} labelledBy="sp-hw-sent">
        <div className="text-5xl" aria-hidden="true">
          🚀
        </div>
        <h2 id="sp-hw-sent">{t("space.groups.sentTitle")}</h2>
        <p>{t("space.groups.sentText")}</p>
        <div className="flex flex-wrap justify-center gap-2">
          <button className="sp-cta sp-ghost" onClick={() => setSentOpen(false)}>
            {t("space.awesome")}
          </button>
          <Link to="/" className="sp-cta inline-block no-underline" onClick={() => setSentOpen(false)}>
            {t("space.groups.toMissions")}
          </Link>
        </div>
      </Modal>
    </div>
  );
};
