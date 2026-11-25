// src/teacher/components/chat/ChatMedia.tsx — shows a chat message's photo,
// voice message, round video or video. Files live on Telegram; the server
// streams them (staff token required), so they're fetched as blobs.
import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";
import { API_URL, tokenStorage } from "@/services/apiClient";
import { chatMediaCache, type ChatMessage } from "@/hooks/queries/useChat";
import { useTranslation } from "@/hooks/useTranslation";
import { Skel } from "../ui";

export const formatDuration = (seconds: number | null | undefined) => {
  const s = Math.max(0, Math.round(seconds ?? 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

/** Object URL of a message's file (cached for the tab), or "error". */
const useMediaUrl = (studentId: string, messageId: string) => {
  const [url, setUrl] = useState<string | null>(() => chatMediaCache.get(messageId) ?? null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (chatMediaCache.has(messageId)) return;
    let cancelled = false;
    fetch(`${API_URL}/teacher/chats/${studentId}/file/${messageId}`, {
      headers: { Authorization: `Bearer ${tokenStorage.getAccessToken() ?? ""}` },
    })
      .then((r) => (r.ok ? r.blob() : Promise.reject(new Error(String(r.status)))))
      .then((blob) => {
        const objectUrl = URL.createObjectURL(blob);
        chatMediaCache.set(messageId, objectUrl);
        if (!cancelled) setUrl(objectUrl);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [studentId, messageId]);
  return { url, failed };
};

/** Round video: tap to play/pause, a ring shows progress. */
const VideoNote = ({ src, duration }: { src: string; duration: number | null }) => {
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) void v.play();
    else v.pause();
  };
  return (
    <button type="button" className="u-vnote" onClick={toggle} aria-label={playing ? "Pause" : "Play"}>
      <video
        ref={ref}
        src={src}
        playsInline
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => {
          setPlaying(false);
          setProgress(0);
        }}
        onTimeUpdate={(e) => {
          const v = e.currentTarget;
          setProgress(v.duration ? v.currentTime / v.duration : 0);
        }}
      />
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle cx="50" cy="50" r="48" pathLength="1" strokeDasharray={`${progress} 1`} />
      </svg>
      {!playing && (
        <span className="u-vnote-play">
          <Play className="u-i m" fill="currentColor" strokeWidth={0} />
        </span>
      )}
      {duration != null && <small className="u-vnote-len">{formatDuration(duration)}</small>}
    </button>
  );
};

export const ChatMedia = ({ studentId, message }: { studentId: string; message: ChatMessage }) => {
  const { t } = useTranslation();
  const { url, failed } = useMediaUrl(studentId, message.id);
  const round = message.kind === "video_note";

  if (failed) return <div className="u-chat-ph">{t("us.chat.fileUnavailable")}</div>;
  if (!url)
    return message.kind === "voice" ? (
      <Skel className="h-10 w-56 rounded-full" />
    ) : (
      <Skel className={round ? "h-[200px] w-[200px] rounded-full" : "h-44 w-56 rounded-[14px]"} />
    );

  switch (message.kind) {
    case "photo":
      return (
        <a href={url} target="_blank" rel="noreferrer">
          <img src={url} alt="" className="u-chat-img" />
        </a>
      );
    case "voice":
      return <audio className="u-chat-audio" src={url} controls preload="metadata" />;
    case "video_note":
      return <VideoNote src={url} duration={message.duration} />;
    case "video":
      return <video className="u-chat-video" src={url} controls playsInline preload="metadata" />;
    default:
      return null;
  }
};

/** One-line preview for the thread list. */
export const chatPreview = (m: Pick<ChatMessage, "kind" | "text">, t: (key: string) => string) => {
  const label: Record<string, string> = {
    photo: t("us.chat.kind.photo"),
    voice: t("us.chat.kind.voice"),
    video_note: t("us.chat.kind.videoNote"),
    video: t("us.chat.kind.video"),
  };
  if (m.kind === "text") return m.text;
  return m.text ? `${label[m.kind]} · ${m.text}` : label[m.kind];
};
