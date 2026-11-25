// src/teacher/components/chat/ChatThread.tsx — one student's thread: header,
// messages (family on the left, staff on the right) and the composer (text,
// photo, voice message, round video). Fills its parent's height; used by the
// phone page and by the desktop chat window.
import { Fragment, useEffect, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ChevronLeft, Circle, ImagePlus, Mic, SendHorizontal, Trash2, X } from "lucide-react";
import {
  useChatThreadQuery,
  useSendChatMediaMutation,
  useSendChatMutation,
  type ChatMessage,
  type OutgoingMediaKind,
} from "@/hooks/queries/useChat";
import { useTranslation } from "@/hooks/useTranslation";
import { ApiError } from "@/services/apiClient";
import { toast, getErrorMessage } from "@/lib/toast";
import { humanDay } from "@/lib/humanDate";
import { Button } from "@/components/ui";
import { Avatar, EmptyBox, Skel } from "../ui";
import { ChatMedia, formatDuration } from "./ChatMedia";
import { canRecord, toJpeg, useVoiceRecorder, VideoNoteRecorder, VOICE_MAX_SECONDS } from "./recorders";

const pad = (n: number) => String(n).padStart(2, "0");
const hhmm = (iso: string) => {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const dayKey = (iso: string) => new Date(iso).toDateString();

const SEND_ERRORS: Record<string, string> = {
  NOT_LINKED: "us.chat.notLinked",
  BOT_DISABLED: "us.chat.botDisabled",
  BLOCKED: "us.chat.blocked",
  TELEGRAM_FAILED: "us.chat.failed",
  UNSUPPORTED_FORMAT: "us.chat.unsupported",
};

const Bubble = ({ studentId, m }: { studentId: string; m: ChatMessage }) => {
  // A round video has no bubble around it, like in Telegram.
  const bare = m.kind === "video_note";
  return (
    <div className={`u-msg ${m.fromStudent ? "in" : "out"}${bare ? " bare" : ""}${m.kind !== "text" ? " media" : ""}`}>
      {m.hasFile && <ChatMedia studentId={studentId} message={m} />}
      {m.text && <p>{m.text}</p>}
      <small>
        {!m.fromStudent && m.senderName ? `${m.senderName} · ` : ""}
        {hhmm(m.createdAt)}
      </small>
    </div>
  );
};

export const ChatThread = ({
  studentId,
  onBack,
  compact = false,
}: {
  studentId: string;
  /** Desktop chat window: back to the thread list inside the window. */
  onBack?: () => void;
  compact?: boolean;
}) => {
  const { t } = useTranslation();
  const { data, isLoading, error, refetch } = useChatThreadQuery(studentId);
  const sendText = useSendChatMutation(studentId);
  const sendMedia = useSendChatMediaMutation(studentId);
  const voice = useVoiceRecorder();
  const [text, setText] = useState("");
  const [photo, setPhoto] = useState<{ blob: Blob; url: string } | null>(null);
  const [videoOpen, setVideoOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const stickToBottom = useRef(true);

  const student = data?.student;
  const name = student ? `${student.firstName} ${student.lastName}` : "";
  const messages = data?.messages ?? [];
  const canSend = Boolean(data?.botEnabled && student?.telegramLinked);
  const busy = sendText.isPending || sendMedia.isPending;

  // Keep the newest message in view unless the teacher scrolled up to read.
  useLayoutEffect(() => {
    const list = listRef.current;
    if (list && stickToBottom.current) list.scrollTop = list.scrollHeight;
  }, [messages.length, isLoading]);
  const onScroll = () => {
    const list = listRef.current;
    if (list) stickToBottom.current = list.scrollHeight - list.scrollTop - list.clientHeight < 80;
  };

  const fail = (err: unknown) => {
    const code = err instanceof ApiError ? err.code : undefined;
    toast.error(code && SEND_ERRORS[code] ? t(SEND_ERRORS[code]) : getErrorMessage(err, t("common.error")));
  };

  const uploadMedia = (kind: OutgoingMediaKind, blob: Blob, caption = "") => {
    stickToBottom.current = true;
    sendMedia.mutate({ kind, blob, caption }, { onError: fail });
  };

  const submit = (e?: FormEvent) => {
    e?.preventDefault();
    if (busy) return;
    const value = text.trim();
    if (photo) {
      stickToBottom.current = true;
      sendMedia.mutate(
        { kind: "photo", blob: photo.blob, caption: value },
        {
          onSuccess: () => {
            URL.revokeObjectURL(photo.url);
            setPhoto(null);
            setText("");
          },
          onError: fail,
        },
      );
      return;
    }
    if (!value) return;
    stickToBottom.current = true;
    sendText.mutate(value, {
      onSuccess: () => {
        setText("");
        inputRef.current?.focus();
      },
      onError: fail,
    });
  };

  // Desktop: Enter sends, Shift+Enter is a new line. Phones keep Enter as a new line.
  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing && window.matchMedia("(hover: hover)").matches) {
      e.preventDefault();
      submit();
    }
  };

  const pickPhoto = async (file: File | undefined) => {
    if (!file) return;
    try {
      const blob = await toJpeg(file);
      setPhoto({ blob, url: URL.createObjectURL(blob) });
      inputRef.current?.focus();
    } catch {
      toast.error(t("us.chat.unsupported"));
    }
  };

  const startVoice = async () => {
    try {
      await voice.start();
    } catch {
      toast.error(t("us.chat.noMic"));
    }
  };
  const sendVoice = async () => {
    const blob = await voice.stop();
    if (blob && blob.size > 0) uploadMedia("voice", blob);
  };
  // Long recordings are sent automatically at the limit.
  useEffect(() => {
    if (voice.recording && voice.seconds >= VOICE_MAX_SECONDS) void sendVoice();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voice.recording, voice.seconds]);

  if (isLoading) {
    return (
      <div className="u-chat">
        <div className="grid flex-1 content-end gap-3 p-4">
          <Skel className="h-12 w-2/3 rounded-[18px]" />
          <Skel className="ml-auto h-12 w-1/2 rounded-[18px]" />
          <Skel className="h-16 w-3/5 rounded-[18px]" />
        </div>
      </div>
    );
  }
  if (error || !student) {
    return (
      <EmptyBox
        tone="er"
        icon={AlertTriangle}
        title={getErrorMessage(error, t("common.error"))}
        action={<Button onClick={() => refetch()}>{t("common.retry")}</Button>}
      />
    );
  }

  const recordable = canRecord();
  const hasDraft = Boolean(text.trim() || photo);

  return (
    <div className={compact ? "u-chat compact" : "u-chat"}>
      <div className="u-chat-hd">
        {onBack && (
          <button type="button" className="u-chat-back" onClick={onBack} aria-label={t("common.back")}>
            <ChevronLeft className="u-i m" strokeWidth={2.2} />
          </button>
        )}
        <Avatar name={name} src={student.avatar} seed={student.id} size="s" />
        <div className="min-w-0 flex-1">
          <b className="block truncate">{name}</b>
          <small className="u-sub !m-0 block truncate">
            {[student.telegramUsername && `@${student.telegramUsername}`, ...student.groups.map((g) => g.name)]
              .filter(Boolean)
              .join(" · ") || t("us.chat.familyHint")}
          </small>
        </div>
        <Link to={`/students/${student.id}`} className="u-chip flex-none">
          {t("us.chat.openProfile")}
        </Link>
      </div>

      <div className="u-chat-list" ref={listRef} onScroll={onScroll}>
        {messages.length === 0 ? (
          <p className="m-auto max-w-xs py-8 text-center text-sm opacity-70">{t("us.chat.threadEmpty")}</p>
        ) : (
          messages.map((m, i) => (
            <Fragment key={m.id}>
              {(i === 0 || dayKey(messages[i - 1].createdAt) !== dayKey(m.createdAt)) && (
                <div className="u-chat-day">{humanDay(m.createdAt, t)}</div>
              )}
              <Bubble studentId={student.id} m={m} />
            </Fragment>
          ))
        )}
        {sendMedia.isPending && <div className="u-msg out sending">{t("us.chat.sending")}</div>}
      </div>

      {!canSend ? (
        <p className="u-chat-off">{t(data.botEnabled ? "us.chat.notLinked" : "us.chat.botDisabled")}</p>
      ) : voice.recording ? (
        <div className="u-chat-in rec">
          <button type="button" className="u-chat-tool" onClick={() => void voice.cancel()} aria-label={t("common.cancel")}>
            <Trash2 className="u-i m" strokeWidth={2} />
          </button>
          <div className="u-chat-recbar">
            <i /> {t("us.chat.recording")} {formatDuration(voice.seconds)}
          </div>
          <button type="button" className="u-chat-send" onClick={() => void sendVoice()} aria-label={t("us.chat.send")}>
            <SendHorizontal className="u-i m" strokeWidth={2.2} />
          </button>
        </div>
      ) : (
        <form className="u-chat-in" onSubmit={submit}>
          {photo && (
            <div className="u-chat-draft">
              <img src={photo.url} alt="" />
              <span>{t("us.chat.photoCaption")}</span>
              <button
                type="button"
                onClick={() => {
                  URL.revokeObjectURL(photo.url);
                  setPhoto(null);
                }}
                aria-label={t("common.cancel")}
              >
                <X className="u-i s" strokeWidth={2.4} />
              </button>
            </div>
          )}
          <button
            type="button"
            className="u-chat-tool"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            aria-label={t("us.chat.attachPhoto")}
            title={t("us.chat.attachPhoto")}
          >
            <ImagePlus className="u-i m" strokeWidth={2} />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              void pickPhoto(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <textarea
            ref={inputRef}
            rows={1}
            value={text}
            maxLength={photo ? 900 : 3500}
            placeholder={photo ? t("us.chat.captionPh") : t("us.chat.placeholder")}
            aria-label={t("us.chat.placeholder")}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={onKeyDown}
          />
          {hasDraft || !recordable ? (
            <button type="submit" className="u-chat-send" disabled={!hasDraft || busy} aria-label={t("us.chat.send")}>
              <SendHorizontal className="u-i m" strokeWidth={2.2} />
            </button>
          ) : (
            <>
              <button
                type="button"
                className="u-chat-tool"
                onClick={() => setVideoOpen(true)}
                disabled={busy}
                aria-label={t("us.chat.recordVideo")}
                title={t("us.chat.recordVideo")}
              >
                <Circle className="u-i m" strokeWidth={2.2} />
              </button>
              <button
                type="button"
                className="u-chat-send"
                onClick={() => void startVoice()}
                disabled={busy}
                aria-label={t("us.chat.recordVoice")}
                title={t("us.chat.recordVoice")}
              >
                <Mic className="u-i m" strokeWidth={2.2} />
              </button>
            </>
          )}
        </form>
      )}

      {videoOpen && (
        <VideoNoteRecorder
          onClose={() => setVideoOpen(false)}
          onSend={(blob) => {
            setVideoOpen(false);
            uploadMedia("video_note", blob);
          }}
        />
      )}
    </div>
  );
};
