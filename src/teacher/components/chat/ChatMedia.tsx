// src/teacher/components/chat/ChatMedia.tsx — Telegram-style media inside chat
// bubbles: voice message (play button + waveform you can seek on), round video
// (muted loop in the feed, tap for sound + progress ring), photo and video
// (edge-to-edge, open full screen). Files live on Telegram; the server streams
// them (staff token required), so they're fetched as blobs and cached per tab.
import {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { Pause, Play, VolumeX, X } from "lucide-react";
import { API_URL, tokenStorage } from "@/services/apiClient";
import { chatMediaCache, type ChatMessage } from "@/hooks/queries/useChat";
import { useTranslation } from "@/hooks/useTranslation";
import { GalleryContext } from "./gallery";
import { forgetTrack, playTrack, registerStarter, togglePlay, useMediaClock, usePlayer } from "./player";

export const formatDuration = (seconds: number | null | undefined) => {
  const s = Math.max(0, Math.round(seconds ?? 0));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

/** Messages still on their way have a local id and only a local file. */
export const isLocalId = (id: string) => id.startsWith("tmp-");

/** Object URL of a message's file (cached for the tab). */
export const useMediaUrl = (studentId: string, messageId: string) => {
  const [url, setUrl] = useState<string | null>(() => chatMediaCache.get(messageId) ?? null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const cached = chatMediaCache.get(messageId);
    if (cached) return setUrl(cached);
    if (isLocalId(messageId)) return setFailed(true);
    let cancelled = false;
    fetch(`${API_URL}/teacher/chats/${studentId}/file/${messageId}`, {
      headers: {
        Authorization: `Bearer ${tokenStorage.getAccessToken() ?? ""}`,
      },
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

// ── "Listened" marks for incoming voice / round videos (blue dot until played) ──

const PLAYED_KEY = "asmo.chat.played";
const readPlayed = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem(PLAYED_KEY) ?? "[]");
  } catch {
    return [];
  }
};
const usePlayed = (id: string) => {
  const [played, setPlayed] = useState(() => readPlayed().includes(id));
  const mark = () => {
    if (played) return;
    setPlayed(true);
    try {
      localStorage.setItem(PLAYED_KEY, JSON.stringify([...readPlayed(), id].slice(-500)));
    } catch {
      /* private mode: the dot just comes back next time */
    }
  };
  return [played, mark] as const;
};

// ── Waveform ──

const peaksCache = new Map<string, number[]>();
let audioCtx: AudioContext | null = null;

/** Telegram draws the real loudness of the recording; fallback is a stable pseudo-wave. */
const seededPeaks = (seed: string, n: number) => {
  let h = 2166136261;
  for (const ch of seed) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  const out: number[] = [];
  let prev = 0.5;
  for (let i = 0; i < n; i++) {
    h = Math.imul(h ^ (h >>> 15), 2246822507) ^ Math.imul(h ^ (h >>> 13), 3266489909);
    const r = ((h >>> 0) % 1000) / 1000;
    prev = prev * 0.35 + r * 0.65;
    out.push(0.15 + prev * 0.85);
  }
  return out;
};

const decodePeaks = async (url: string, n: number) => {
  const Ctx =
    window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
  audioCtx ??= new Ctx();
  const buffer = await audioCtx.decodeAudioData(await (await fetch(url)).arrayBuffer());
  const data = buffer.getChannelData(0);
  const step = Math.max(1, Math.floor(data.length / n));
  const peaks: number[] = [];
  for (let i = 0; i < n; i++) {
    let sum = 0;
    for (let j = i * step; j < Math.min(data.length, (i + 1) * step); j++) sum += data[j] * data[j];
    peaks.push(Math.sqrt(sum / step));
  }
  const max = Math.max(...peaks, 1e-4);
  return peaks.map((p) => Math.max(0.1, p / max));
};

const usePeaks = (id: string, url: string | null, n: number) => {
  const [peaks, setPeaks] = useState(() => peaksCache.get(id) ?? seededPeaks(id, n));
  useEffect(() => {
    if (!url || peaksCache.has(id)) return;
    let alive = true;
    decodePeaks(url, n)
      .then((p) => {
        peaksCache.set(id, p);
        if (alive) setPeaks(p);
      })
      .catch(() => peaksCache.set(id, seededPeaks(id, n)));
    return () => {
      alive = false;
    };
  }, [id, url, n]);
  return peaks;
};

export const Spinner = () => (
  <svg className="tg-spin" viewBox="0 0 50 50" aria-hidden="true">
    <circle cx="25" cy="25" r="20" />
  </svg>
);

// ── Voice message ──

const VoiceMessage = ({
  studentId,
  message,
  meta,
  title,
}: {
  studentId: string;
  message: ChatMessage;
  meta: ReactNode;
  title: string;
}) => {
  const { t } = useTranslation();
  const { url, failed } = useMediaUrl(studentId, message.id);
  const [played, markPlayed] = usePlayed(message.id);
  const [el, setEl] = useState<HTMLAudioElement | null>(null);
  const playing = usePlayer((s) => s.track?.id === message.id && s.playing);
  const time = useMediaClock(el, playing);
  const known = message.duration ?? 0;
  const [length, setLength] = useState(known);
  const bars = Math.min(46, Math.max(20, Math.round(16 + known * 1.3)));
  const peaks = usePeaks(message.id, url, bars);

  const start = useCallback(
    (fromStart: boolean) => {
      if (!el) return;
      if (fromStart) el.currentTime = 0;
      playTrack({ id: message.id, kind: "voice", title, el, length: known, stop: () => el.pause() });
      if (message.fromStudent) markPlayed();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [el, message.id, title, known, message.fromStudent, played],
  );
  useEffect(() => registerStarter(message.id, () => start(true)), [message.id, start]);
  useEffect(() => () => forgetTrack(message.id), [message.id]);

  const toggle = () => {
    if (!el) return;
    if (playing) el.pause();
    else start(false);
  };

  const seek = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!el || !(length > 0)) return;
    const box = e.currentTarget.getBoundingClientRect();
    el.currentTime = Math.min(1, Math.max(0, (e.clientX - box.left) / box.width)) * length;
  };

  const progress = length > 0 ? Math.min(1, time / length) : 0;
  const shown = playing || time > 0 ? time : length;

  return (
    <div className="tg-voice" data-play-id={message.id}>
      {url && (
        <audio
          ref={setEl}
          src={url}
          preload="metadata"
          onLoadedMetadata={(e) => Number.isFinite(e.currentTarget.duration) && setLength(e.currentTarget.duration)}
          onEnded={(e) => (e.currentTarget.currentTime = 0)}
        />
      )}
      <button
        type="button"
        className="tg-voice-btn"
        onClick={toggle}
        disabled={!url}
        aria-label={playing ? t("us.chat.pause") : t("us.chat.play")}
      >
        {failed ? (
          <X className="tg-ic" strokeWidth={2.6} />
        ) : !url ? (
          <Spinner />
        ) : (
          <span key={playing ? "pause" : "play"} className="tg-swap">
            {playing ? (
              <Pause className="tg-ic" fill="currentColor" strokeWidth={0} />
            ) : (
              <Play className="tg-ic play" fill="currentColor" strokeWidth={0} />
            )}
          </span>
        )}
      </button>
      <div className="tg-voice-main">
        <div
          className="tg-wave"
          role="slider"
          aria-label={t("us.chat.kind.voice")}
          aria-valuemin={0}
          aria-valuemax={Math.round(length)}
          aria-valuenow={Math.round(time)}
          tabIndex={-1}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            seek(e);
          }}
          onPointerMove={(e) => e.buttons === 1 && seek(e)}
        >
          {peaks.map((p, i) => {
            // Bars fill smoothly: the one under the playhead is partly coloured.
            const fill = Math.min(1, Math.max(0, progress * peaks.length - i));
            return <i key={i} style={{ height: `${Math.round(p * 100)}%`, "--fill": fill } as CSSProperties} />;
          })}
        </div>
        <div className="tg-voice-foot">
          <span className="tg-voice-len">
            {failed ? t("us.chat.fileUnavailable") : formatDuration(shown)}
            {message.fromStudent && !played && !failed && <i className="tg-unplayed" />}
          </span>
          {meta}
        </div>
      </div>
    </div>
  );
};

// ── Round video ──

const VideoNote = ({
  studentId,
  message,
  meta,
  title,
}: {
  studentId: string;
  message: ChatMessage;
  meta: ReactNode;
  title: string;
}) => {
  const { t } = useTranslation();
  const { url, failed } = useMediaUrl(studentId, message.id);
  const [played, markPlayed] = usePlayed(message.id);
  const [el, setEl] = useState<HTMLVideoElement | null>(null);
  const box = useRef<HTMLDivElement>(null);
  // idle = muted loop in the feed; active = the player's track (playing or paused).
  const active = usePlayer((s) => s.track?.id === message.id);
  const playing = usePlayer((s) => s.track?.id === message.id && s.playing);
  const time = useMediaClock(el, playing);
  const length = message.duration ?? 0;

  const idle = useCallback((v: HTMLVideoElement) => {
    v.muted = true;
    v.loop = true;
    v.playbackRate = 1;
    v.currentTime = 0;
    void v.play().catch(() => undefined);
  }, []);

  const start = useCallback(() => {
    if (!el) return;
    el.loop = false;
    el.currentTime = 0;
    playTrack({ id: message.id, kind: "video_note", title, el, length, stop: () => idle(el) });
    if (message.fromStudent) markPlayed();
    // Grows to the big size: keep it in view once it has.
    window.setTimeout(() => box.current?.scrollIntoView({ block: "nearest", behavior: "smooth" }), 320);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [el, message.id, title, length, idle, message.fromStudent, played]);
  useEffect(() => registerStarter(message.id, start), [message.id, start]);
  useEffect(() => () => forgetTrack(message.id), [message.id]);

  // Finished (or the player moved on): back to the silent loop.
  const wasActive = useRef(false);
  useEffect(() => {
    if (wasActive.current && !active && el) idle(el);
    wasActive.current = active;
  }, [active, el, idle]);

  // Muted loop while on screen, like in Telegram.
  useEffect(() => {
    if (!el || active) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const io = new IntersectionObserver(([entry]) => {
      if (reduce) return;
      if (entry.isIntersecting) void el.play().catch(() => undefined);
      else el.pause();
    });
    io.observe(el);
    return () => io.disconnect();
  }, [el, active]);

  const tap = () => {
    if (!el) return;
    if (!active) start();
    else togglePlay();
  };

  const progress = active && length > 0 ? Math.min(1, time / length) : 0;

  return (
    <div ref={box} className={active ? "tg-round big" : "tg-round"} data-play-id={message.id}>
      <button
        type="button"
        className="tg-round-btn"
        onClick={tap}
        aria-label={t("us.chat.kind.videoNote")}
        disabled={!url}
      >
        {url ? (
          <video ref={setEl} src={url} muted loop playsInline preload="auto" />
        ) : (
          <span className="tg-round-load">{failed ? <X className="tg-ic" strokeWidth={2.4} /> : <Spinner />}</span>
        )}
        <svg viewBox="0 0 100 100" aria-hidden="true" className={active ? "on" : undefined}>
          <circle cx="50" cy="50" r="48.5" pathLength="1" strokeDasharray={`${progress} 1`} />
        </svg>
        {active && !playing && (
          <span className="tg-round-play">
            <Play className="tg-ic play" fill="currentColor" strokeWidth={0} />
          </span>
        )}
      </button>
      <span className="tg-pill tg-round-len">
        {formatDuration(active ? Math.max(0, length - time) : length)}
        {!active && <VolumeX className="tg-ic xs" strokeWidth={2.4} />}
        {message.fromStudent && !played && <i className="tg-unplayed" />}
      </span>
      <span className="tg-pill tg-round-meta">{meta}</span>
    </div>
  );
};

const Visual = ({
  studentId,
  message,
  overlayMeta,
}: {
  studentId: string;
  message: ChatMessage;
  overlayMeta: ReactNode | null;
}) => {
  const { t } = useTranslation();
  const { url, failed } = useMediaUrl(studentId, message.id);
  const gallery = useContext(GalleryContext);
  const video = message.kind === "video";

  if (failed) return <div className="tg-media-ph">{t("us.chat.fileUnavailable")}</div>;
  return (
    <>
      <button
        type="button"
        className="tg-media"
        onClick={() => url && gallery?.open(message.id)}
        aria-label={video ? t("us.chat.kind.video") : t("us.chat.kind.photo")}
      >
        {!url ? (
          <span className="tg-media-load">
            <Spinner />
          </span>
        ) : video ? (
          <video src={url} muted playsInline preload="metadata" />
        ) : (
          <img src={url} alt="" />
        )}
        {video && url && (
          <>
            <span className="tg-media-play">
              <Play className="tg-ic play" fill="currentColor" strokeWidth={0} />
            </span>
            {message.duration != null && (
              <span className="tg-pill tg-media-len">{formatDuration(message.duration)}</span>
            )}
          </>
        )}
        {overlayMeta && <span className="tg-pill tg-media-meta">{overlayMeta}</span>}
      </button>
    </>
  );
};

/** The media part of a bubble. `meta` (time + ticks) is placed the Telegram way for each kind. */
export const ChatMedia = ({
  studentId,
  message,
  meta,
  title,
}: {
  studentId: string;
  message: ChatMessage;
  meta: ReactNode;
  /** Who sent it, for the player bar ("Siz" or a name). */
  title: string;
}) => {
  switch (message.kind) {
    case "voice":
      return <VoiceMessage studentId={studentId} message={message} meta={meta} title={title} />;
    case "video_note":
      return <VideoNote studentId={studentId} message={message} meta={meta} title={title} />;
    case "photo":
    case "video":
      return <Visual studentId={studentId} message={message} overlayMeta={message.text ? null : meta} />;
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
