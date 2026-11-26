// src/teacher/components/chat/ChatThread.tsx — one student's thread, drawn
// like Telegram: wallpaper, bubbles with tails (family on the left, staff on
// the right), time + ticks inside the bubble, sticky day pills, a jump-down
// button, and messages that appear at once with a clock until Telegram takes
// them. Fills its parent's height; used by the phone page and the laptop window.
import { Fragment, useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ChevronDown, ChevronLeft, UserRound } from "lucide-react";
import {
  chatMediaCache,
  useChatThreadQuery,
  useSendChatMediaMutation,
  useSendChatMutation,
  type ChatMessage,
  type OutgoingMediaKind,
} from "@/hooks/queries/useChat";
import { useTranslation } from "@/hooks/useTranslation";
import { useAuthStore } from "@/stores/authStore";
import { ApiError } from "@/services/apiClient";
import { toast, getErrorMessage } from "@/lib/toast";
import { humanDay } from "@/lib/humanDate";
import { Button } from "@/components/ui";
import { Avatar, EmptyBox, Skel } from "../ui";
import { ChatMedia } from "./ChatMedia";
import { Composer } from "./Composer";
import { GalleryContext } from "./gallery";
import { MediaViewer, type ViewerItem } from "./MediaViewer";
import { PlayerBar } from "./PlayerBar";
import "../../theme/chat-tg.css";

const pad = (n: number) => String(n).padStart(2, "0");
const hhmm = (iso: string) => {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
};
const dayKey = (iso: string) => new Date(iso).toDateString();
const GROUP_MS = 10 * 60 * 1000;

const SEND_ERRORS: Record<string, string> = {
  NOT_LINKED: "us.chat.notLinked",
  BOT_DISABLED: "us.chat.botDisabled",
  BLOCKED: "us.chat.blocked",
  TELEGRAM_FAILED: "us.chat.failed",
  UNSUPPORTED_FORMAT: "us.chat.unsupported",
};

type Status = "sending" | "sent" | "failed";
interface Pending extends ChatMessage {
  status: "sending" | "failed";
  blob?: Blob;
}

// ── Ticks, clock, tail ──

const Ticks = ({ status }: { status: Status }) =>
  status === "sending" ? (
    <svg className="tg-tick clock" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="6.2" />
      <path d="M8 4.6V8l2.2 1.6" />
    </svg>
  ) : status === "sent" ? (
    <svg className="tg-tick" viewBox="0 0 16 16" aria-hidden="true">
      <path d="M3 8.6l3.2 3.1L13 4.6" />
    </svg>
  ) : null;

const Tail = () => (
  <svg className="tg-tail" viewBox="0 0 9 18" aria-hidden="true">
    <path d="M9 0v18H1.6C.5 18 0 16.7.8 15.9 4.4 12.2 8.2 7.6 9 0z" />
  </svg>
);

const Meta = ({ m, status }: { m: ChatMessage; status?: Status }) => (
  <span className="tg-meta">
    {hhmm(m.createdAt)}
    {status && <Ticks status={status} />}
  </span>
);

const Bubble = ({
  studentId,
  m,
  status,
  first,
  last,
  name,
  sender,
  onRetry,
  onDrop,
}: {
  studentId: string;
  m: ChatMessage;
  status?: Status;
  first: boolean;
  last: boolean;
  /** Another staff member's message: their name on top, like in a Telegram group. */
  name: string | null;
  /** "Siz" or the sender's name (player bar). */
  sender: string;
  onRetry?: () => void;
  onDrop?: () => void;
}) => {
  const { t } = useTranslation();
  const out = !m.fromStudent;
  const round = m.kind === "video_note";
  const visual = m.kind === "photo" || m.kind === "video";
  const meta = <Meta m={m} status={status} />;
  const cls = [
    "tg-msg",
    out ? "out" : "in",
    first && "first",
    last && !round && "last",
    round && "round",
    visual && "visual",
    visual && !m.text && "bare-visual",
    status === "sending" && "sending",
  ]
    .filter(Boolean)
    .join(" ");

  let body: ReactNode;
  if (round) body = <ChatMedia studentId={studentId} message={m} meta={meta} title={sender} />;
  else
    body = (
      <div className="tg-bubble">
        {first && name && <b className="tg-name">{name}</b>}
        {m.hasFile && <ChatMedia studentId={studentId} message={m} meta={meta} title={sender} />}
        {m.text ? (
          <div className="tg-text">
            {m.text}
            {/* Invisible copy keeps room for the time at the end of the last line. */}
            <span className="tg-meta-space" aria-hidden="true">
              {meta}
            </span>
            {meta}
          </div>
        ) : (
          !m.hasFile && <div className="tg-text">{meta}</div>
        )}
        {last && <Tail />}
      </div>
    );

  return (
    <div className={cls}>
      {body}
      {status === "failed" && (
        <div className="tg-failed">
          <span className="tg-failed-ic" aria-hidden="true">
            !
          </span>
          <button type="button" onClick={onRetry}>
            {t("us.chat.retry")}
          </button>
          <button type="button" onClick={onDrop}>
            {t("us.chat.delete")}
          </button>
        </div>
      )}
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
  const me = useAuthStore((s) => s.user);
  const myName = me ? `${me.firstName} ${me.lastName ?? ""}`.trim() : "";
  const [pending, setPending] = useState<Pending[]>([]);
  const [viewerId, setViewerId] = useState<string | null>(null);
  const gallery = useMemo(() => ({ open: setViewerId }), []);
  const [atBottom, setAtBottom] = useState(true);
  const [fresh, setFresh] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  const [stage, setStage] = useState<HTMLDivElement | null>(null);
  const stickToBottom = useRef(true);
  const seen = useRef(0);

  const student = data?.student;
  const name = student ? `${student.firstName} ${student.lastName}` : "";
  const messages = data?.messages ?? [];
  const canSend = Boolean(data?.botEnabled && student?.telegramLinked);

  // Keep the newest message in view unless the teacher scrolled up to read;
  // then count what came in meanwhile on the jump-down button.
  useLayoutEffect(() => {
    const list = listRef.current;
    if (!list) return;
    if (stickToBottom.current) list.scrollTop = list.scrollHeight;
    else setFresh((n) => n + messages.slice(seen.current).filter((m) => m.fromStudent).length);
    seen.current = messages.length;
  }, [messages.length, pending.length, isLoading]); // eslint-disable-line react-hooks/exhaustive-deps

  // Photos / videos load after the first paint and grow the feed: stay at the bottom.
  useEffect(() => {
    const feed = feedRef.current;
    const list = listRef.current;
    if (!feed || !list) return;
    const ro = new ResizeObserver(() => {
      if (stickToBottom.current) list.scrollTop = list.scrollHeight;
    });
    ro.observe(feed);
    return () => ro.disconnect();
  }, [isLoading, Boolean(data)]); // eslint-disable-line react-hooks/exhaustive-deps

  // Only the teacher scrolling up unsticks the view; content growing under a
  // programmatic scroll (photos loading) must not.
  const lastTop = useRef(0);
  const lastHeight = useRef(0);
  const onScroll = () => {
    const list = listRef.current;
    if (!list) return;
    const bottom = list.scrollHeight - list.scrollTop - list.clientHeight < 80;
    // Moving up with the content height unchanged = the teacher scrolled up
    // (a shrinking placeholder also moves scrollTop up, but changes the height).
    if (bottom) stickToBottom.current = true;
    else if (list.scrollTop < lastTop.current - 2 && list.scrollHeight === lastHeight.current)
      stickToBottom.current = false;
    lastTop.current = list.scrollTop;
    lastHeight.current = list.scrollHeight;
    setAtBottom(bottom || stickToBottom.current);
    if (bottom) setFresh(0);
  };
  const jumpDown = () => {
    const list = listRef.current;
    if (list) list.scrollTo({ top: list.scrollHeight, behavior: "smooth" });
    setFresh(0);
  };

  // ── Sending (shown at once, with a clock, until Telegram takes it) ──

  const drop = (id: string) => setPending((list) => list.filter((p) => p.id !== id));

  const deliver = useCallback(
    async (p: Pending) => {
      stickToBottom.current = true;
      setPending((list) => [...list.filter((x) => x.id !== p.id), { ...p, status: "sending" }]);
      try {
        if (p.kind === "text") await sendText.mutateAsync(p.text);
        else
          await sendMedia.mutateAsync({
            kind: p.kind as OutgoingMediaKind,
            blob: p.blob!,
            caption: p.text,
          });
        setPending((list) => list.filter((x) => x.id !== p.id));
      } catch (err) {
        const code = err instanceof ApiError ? err.code : undefined;
        toast.error(code && SEND_ERRORS[code] ? t(SEND_ERRORS[code]) : getErrorMessage(err, t("common.error")));
        setPending((list) => list.map((x) => (x.id === p.id ? { ...x, status: "failed" } : x)));
      }
    },
    [sendText, sendMedia, t],
  );

  const draft = (kind: ChatMessage["kind"], text: string, blob?: Blob, duration: number | null = null): Pending => {
    const id = `tmp-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    if (blob) chatMediaCache.set(id, URL.createObjectURL(blob));
    return {
      id,
      fromStudent: false,
      senderName: myName || null,
      kind,
      text,
      hasFile: Boolean(blob),
      duration,
      createdAt: new Date().toISOString(),
      status: "sending",
      blob,
    };
  };

  if (isLoading) {
    return (
      <div className={compact ? "tg-chat compact" : "tg-chat"}>
        <div className="tg-list">
          <div className="grid flex-1 content-end gap-3 p-4">
            <Skel className="h-12 w-2/3 rounded-[16px]" />
            <Skel className="ml-auto h-12 w-1/2 rounded-[16px]" />
            <Skel className="h-16 w-3/5 rounded-[16px]" />
          </div>
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

  const all: (ChatMessage & { status?: Status; pending?: Pending })[] = [
    ...messages.map((m) => ({
      ...m,
      status: m.fromStudent ? undefined : ("sent" as const),
    })),
    ...pending.map((p) => ({ ...p, pending: p })),
  ];
  const sameGroup = (a: ChatMessage | undefined, b: ChatMessage | undefined) =>
    Boolean(
      a &&
      b &&
      a.fromStudent === b.fromStudent &&
      (a.fromStudent || a.senderName === b.senderName) &&
      dayKey(a.createdAt) === dayKey(b.createdAt) &&
      Math.abs(new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()) < GROUP_MS,
    );
  const status = [student.telegramUsername && `@${student.telegramUsername}`, ...student.groups.map((g) => g.name)]
    .filter(Boolean)
    .join(" · ");
  // Every photo / video of the thread, for the viewer's ← → navigation.
  const viewerItems: ViewerItem[] = all
    .filter((m) => m.hasFile && (m.kind === "photo" || m.kind === "video"))
    .map((m) => ({
      message: m,
      sender: m.fromStudent ? name : m.senderName || myName || t("us.chat.you"),
      seed: m.fromStudent ? student.id : (m.senderName ?? "staff"),
      avatar: m.fromStudent ? student.avatar : m.senderName === myName ? (me?.avatar ?? null) : null,
    }));

  return (
    <div className={compact ? "tg-chat compact" : "tg-chat"} ref={setStage}>
      <div className="tg-head">
        {onBack && (
          <button type="button" className="tg-head-btn" onClick={onBack} aria-label={t("common.back")}>
            <ChevronLeft className="tg-ic l" strokeWidth={2.2} />
          </button>
        )}
        <Avatar name={name} src={student.avatar} seed={student.id} size="s" />
        <div className="min-w-0 flex-1">
          <b className="tg-head-name">{name}</b>
          <small className="tg-head-sub">{status || t("us.chat.viaBot")}</small>
        </div>
        <Link
          to={`/students/${student.id}`}
          className="tg-head-btn"
          aria-label={t("us.chat.openProfile")}
          title={t("us.chat.openProfile")}
        >
          <UserRound className="tg-ic" strokeWidth={2} />
        </Link>
      </div>

      <PlayerBar />

      <GalleryContext.Provider value={gallery}>
        <div className="tg-list" ref={listRef} onScroll={onScroll}>
          <div className="tg-feed" ref={feedRef}>
            {all.length === 0 ? (
              <div className="tg-empty">
                <b>{t("us.chat.noMessages")}</b>
                <span>{t("us.chat.threadEmpty")}</span>
              </div>
            ) : (
              all.map((m, i) => {
                const prev = all[i - 1];
                const next = all[i + 1];
                const newDay = !prev || dayKey(prev.createdAt) !== dayKey(m.createdAt);
                const otherStaff = !m.fromStudent && m.senderName && m.senderName !== myName ? m.senderName : null;
                return (
                  <Fragment key={m.id}>
                    {newDay && (
                      <div className="tg-day">
                        <span>{humanDay(m.createdAt, t)}</span>
                      </div>
                    )}
                    <Bubble
                      studentId={student.id}
                      m={m}
                      status={m.pending ? m.pending.status : m.status}
                      first={!sameGroup(prev, m)}
                      last={!sameGroup(m, next)}
                      name={otherStaff}
                      sender={m.fromStudent ? name : otherStaff || t("us.chat.you")}
                      onRetry={m.pending ? () => void deliver(m.pending!) : undefined}
                      onDrop={m.pending ? () => drop(m.id) : undefined}
                    />
                  </Fragment>
                );
              })
            )}
          </div>
        </div>
      </GalleryContext.Provider>

      {viewerId && viewerItems.some((v) => v.message.id === viewerId) && (
        <MediaViewer studentId={student.id} items={viewerItems} startId={viewerId} onClose={() => setViewerId(null)} />
      )}

      {!atBottom && (
        <button type="button" className="tg-down" onClick={jumpDown} aria-label={t("us.chat.toLatest")}>
          <ChevronDown className="tg-ic l" strokeWidth={2.2} />
          {fresh > 0 && <span>{fresh > 99 ? "99+" : fresh}</span>}
        </button>
      )}

      {canSend ? (
        <Composer
          stage={stage}
          onText={(text) => void deliver(draft("text", text))}
          onPhoto={(blob, caption) => void deliver(draft("photo", caption, blob))}
          onVoice={(blob, seconds) => void deliver(draft("voice", "", blob, seconds))}
          onVideoNote={(blob, seconds) => void deliver(draft("video_note", "", blob, seconds))}
        />
      ) : (
        <p className="tg-off">{t(data.botEnabled ? "us.chat.notLinked" : "us.chat.botDisabled")}</p>
      )}
    </div>
  );
};
