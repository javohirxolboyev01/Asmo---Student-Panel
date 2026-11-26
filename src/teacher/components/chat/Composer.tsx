// src/teacher/components/chat/Composer.tsx — the Telegram message bar.
// One round button on the right: Send when there's a draft; otherwise a
// microphone or camera — tap switches between them, hold records (voice
// message / round video), slide left cancels, slide up locks so you can let go.
// Keyboard: Enter/Space on the button starts a locked recording.
import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronUp, Lock, Mic, Paperclip, SendHorizontal, Trash2, Video, X } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { toast } from "@/lib/toast";
import {
  canRecord,
  toJpeg,
  useVoiceRecorder,
  VideoNoteCapture,
  VIDEO_NOTE_MAX_SECONDS,
  VOICE_MAX_SECONDS,
  type VideoNoteHandle,
} from "./recorders";

type Mode = "voice" | "video";
interface Rec {
  kind: Mode;
  locked: boolean;
  /** null until the mic / camera is actually recording (permission prompt). */
  startedAt: number | null;
}

const HOLD_MS = 220;
const CANCEL_DX = -110;
const LOCK_DY = -80;
const MIN_SECONDS = 0.6;
const MODE_KEY = "asmo.chat.recMode";

/** "0:03,4" — Telegram's recording timer. */
const recTime = (s: number) => {
  const whole = Math.floor(s);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, "0")},${Math.floor((s - whole) * 10)}`;
};

export const Composer = ({
  stage,
  onText,
  onPhoto,
  onVoice,
  onVideoNote,
}: {
  /** The thread element: the round-video camera covers it (the bar stays on top). */
  stage: HTMLElement | null;
  onText: (text: string) => void;
  onPhoto: (blob: Blob, caption: string) => void;
  onVoice: (blob: Blob, seconds: number) => void;
  onVideoNote: (blob: Blob, seconds: number) => void;
}) => {
  const { t } = useTranslation();
  const voice = useVoiceRecorder();
  const videoRef = useRef<VideoNoteHandle>(null);
  const [text, setText] = useState("");
  const [photo, setPhoto] = useState<{ blob: Blob; url: string } | null>(null);
  const [mode, setMode] = useState<Mode>(() => {
    try {
      return localStorage.getItem(MODE_KEY) === "video" ? "video" : "voice";
    } catch {
      return "voice";
    }
  });
  const [rec, setRec] = useState<Rec | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [slide, setSlide] = useState({ dx: 0, dy: 0 });
  const [hint, setHint] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const mainRef = useRef<HTMLButtonElement>(null);
  const press = useRef<{
    x: number;
    y: number;
    timer: number;
    held: boolean;
  } | null>(null);
  /** The click that follows a handled hold/tap gesture is ignored until this time. */
  const suppressUntil = useRef(0);
  const recRef = useRef<Rec | null>(null);
  recRef.current = rec;
  const finishing = useRef(false);

  const recordable = canRecord();
  const hasDraft = Boolean(text.trim() || photo);

  // ── Recording ──

  const begin = async (kind: Mode, locked: boolean) => {
    finishing.current = false;
    setSeconds(0);
    setSlide({ dx: 0, dy: 0 });
    setRec({ kind, locked, startedAt: null });
    if (kind === "video") return; // VideoNoteCapture calls onStarted
    try {
      await voice.start();
      if (!recRef.current) return void voice.cancel(); // cancelled while the prompt was open
      setRec((r) => (r ? { ...r, startedAt: Date.now() } : r));
    } catch {
      setRec(null);
      toast.error(t("us.chat.noMic"));
    }
  };

  const end = useCallback(
    async (send: boolean) => {
      const r = recRef.current;
      if (!r || finishing.current) return;
      finishing.current = true;
      const length = r.startedAt ? (Date.now() - r.startedAt) / 1000 : 0;
      let blob: Blob | null = null;
      if (r.kind === "voice") blob = send ? await voice.stop() : (await voice.cancel(), null);
      else if (send) blob = (await videoRef.current?.stop()) ?? null;
      else videoRef.current?.cancel();
      setRec(null);
      setSlide({ dx: 0, dy: 0 });
      if (!send || !blob || blob.size === 0) return;
      if (length < MIN_SECONDS) {
        setHint(true);
        return;
      }
      if (r.kind === "voice") onVoice(blob, Math.round(length));
      else onVideoNote(blob, Math.round(length));
    },
    [voice, onVoice, onVideoNote],
  );

  // Timer + limits.
  useEffect(() => {
    if (!rec?.startedAt) return;
    const startedAt = rec.startedAt;
    const max = rec.kind === "voice" ? VOICE_MAX_SECONDS : VIDEO_NOTE_MAX_SECONDS;
    const id = window.setInterval(() => {
      const s = (Date.now() - startedAt) / 1000;
      setSeconds(s);
      if (s >= max) void end(true);
    }, 100);
    return () => window.clearInterval(id);
  }, [rec?.startedAt, rec?.kind, end]);

  // The button pulses with the mic level.
  useEffect(() => {
    if (!rec?.startedAt) return;
    let frame = 0;
    let smooth = 0;
    const tick = () => {
      const level = rec.kind === "voice" ? voice.level() : (videoRef.current?.level() ?? 0);
      smooth = smooth * 0.7 + level * 0.3;
      mainRef.current?.style.setProperty("--lvl", smooth.toFixed(3));
      frame = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(frame);
  }, [rec?.startedAt, rec?.kind, voice]);

  // Esc cancels a recording.
  useEffect(() => {
    if (!rec) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      void end(false);
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [rec, end]);

  useEffect(() => {
    if (!hint) return;
    const id = window.setTimeout(() => setHint(false), 2600);
    return () => window.clearTimeout(id);
  }, [hint]);

  // ── Main button: hold / slide / tap ──

  const recordingMode = !hasDraft && recordable && !rec?.locked;

  const onPointerDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (!recordingMode || e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    press.current = {
      x: e.clientX,
      y: e.clientY,
      held: false,
      timer: window.setTimeout(() => {
        if (!press.current) return;
        press.current.held = true;
        setHint(false);
        void begin(mode, false);
      }, HOLD_MS),
    };
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const p = press.current;
    const r = recRef.current;
    if (!p?.held || !r || r.locked) return;
    const dx = Math.min(0, e.clientX - p.x);
    const dy = Math.min(0, e.clientY - p.y);
    if (dx < CANCEL_DX) {
      press.current = null;
      void end(false);
      return;
    }
    if (dy < LOCK_DY) {
      setRec({ ...r, locked: true });
      setSlide({ dx: 0, dy: 0 });
      return;
    }
    setSlide({ dx, dy });
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLButtonElement>) => {
    const p = press.current;
    press.current = null;
    if (!p) return;
    window.clearTimeout(p.timer);
    suppressUntil.current = Date.now() + 400;
    if (!p.held) {
      // Tap: switch between voice and round video, like Telegram.
      const next = mode === "voice" ? "video" : "voice";
      setMode(next);
      try {
        localStorage.setItem(MODE_KEY, next);
      } catch {
        /* not remembered — fine */
      }
      setHint(true);
      return;
    }
    const r = recRef.current;
    if (!r || r.locked) return;
    // Let go before the mic/camera was ready (permission prompt): keep recording, locked.
    if (!r.startedAt || e.type === "pointercancel") setRec({ ...r, locked: true });
    else void end(true);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (!recordingMode || rec || (e.key !== "Enter" && e.key !== " ")) return;
    e.preventDefault();
    void begin(mode, true);
  };

  const onClick = () => {
    if (Date.now() < suppressUntil.current) return;
    if (rec?.locked) void end(true);
    else if (hasDraft) submit();
  };

  // ── Text / photo ──

  const submit = () => {
    const value = text.trim();
    if (photo) {
      onPhoto(photo.blob, value);
      URL.revokeObjectURL(photo.url);
      setPhoto(null);
      setText("");
      return;
    }
    if (!value) return;
    onText(value);
    setText("");
    inputRef.current?.focus();
  };

  // Desktop: Enter sends, Shift+Enter is a new line. Phones keep Enter as a new line.
  const onInputKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
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

  const mainIcon = rec?.locked || hasDraft || !recordable ? "send" : mode;
  const cancelFade = Math.max(0, 1 + slide.dx / -CANCEL_DX);

  return (
    <div className={rec ? "tg-bar rec" : "tg-bar"}>
      {photo && !rec && (
        <div className="tg-draft">
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
            <X className="tg-ic s" strokeWidth={2.4} />
          </button>
        </div>
      )}

      <div className="tg-bar-row">
        <div className="tg-field">
          {rec ? (
            <>
              <span className="tg-rec-time">
                <i />
                {recTime(seconds)}
              </span>
              {rec.locked ? (
                <button type="button" className="tg-rec-cancel" onClick={() => void end(false)}>
                  {t("common.cancel")}
                </button>
              ) : (
                <span
                  className="tg-rec-slide"
                  style={{
                    transform: `translateX(${slide.dx}px)`,
                    opacity: cancelFade,
                  }}
                >
                  <ChevronLeft className="tg-ic s" strokeWidth={2.4} />
                  {t("us.chat.slideCancel")}
                </span>
              )}
              {rec.locked && (
                <button
                  type="button"
                  className="tg-field-btn"
                  onClick={() => void end(false)}
                  aria-label={t("common.cancel")}
                >
                  <Trash2 className="tg-ic" strokeWidth={2} />
                </button>
              )}
            </>
          ) : (
            <>
              <textarea
                ref={inputRef}
                rows={1}
                value={text}
                maxLength={photo ? 900 : 3500}
                placeholder={photo ? t("us.chat.captionPh") : t("us.chat.placeholder")}
                aria-label={t("us.chat.placeholder")}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={onInputKey}
              />
              <button
                type="button"
                className="tg-field-btn"
                onClick={() => fileRef.current?.click()}
                aria-label={t("us.chat.attachPhoto")}
                title={t("us.chat.attachPhoto")}
              >
                <Paperclip className="tg-ic" strokeWidth={2} />
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
            </>
          )}
        </div>

        <div className="tg-main-wrap">
          {rec && !rec.locked && (
            <div
              className="tg-lock"
              style={{
                transform: `translateY(${Math.max(slide.dy, LOCK_DY) / 2}px)`,
              }}
              aria-hidden="true"
            >
              <Lock className="tg-ic s" strokeWidth={2.2} />
              <ChevronUp className="tg-ic xs" strokeWidth={2.6} />
            </div>
          )}
          {hint && !rec && (
            <div className="tg-hint" role="status">
              {mode === "voice" ? t("us.chat.holdVoice") : t("us.chat.holdVideo")}
            </div>
          )}
          <button
            ref={mainRef}
            type="button"
            className={`tg-main${rec ? " on" : ""}${mainIcon === "send" ? " send" : ""}`}
            style={
              rec && !rec.locked
                ? {
                    transform: `translate(${slide.dx * 0.25}px, ${slide.dy * 0.4}px)`,
                  }
                : undefined
            }
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            onKeyDown={onKeyDown}
            onClick={onClick}
            onContextMenu={(e) => e.preventDefault()}
            disabled={!recordable && !hasDraft}
            aria-label={
              mainIcon === "send"
                ? t("us.chat.send")
                : mode === "voice"
                  ? t("us.chat.recordVoice")
                  : t("us.chat.recordVideo")
            }
            title={mainIcon === "send" ? undefined : mode === "voice" ? t("us.chat.holdVoice") : t("us.chat.holdVideo")}
          >
            <span key={mainIcon} className="tg-main-ic">
              {mainIcon === "send" ? (
                <SendHorizontal className="tg-ic" strokeWidth={2.2} />
              ) : mainIcon === "voice" ? (
                <Mic className="tg-ic" strokeWidth={2.2} />
              ) : (
                <Video className="tg-ic" strokeWidth={2.2} />
              )}
            </span>
          </button>
        </div>
      </div>

      {rec?.kind === "video" &&
        stage &&
        createPortal(
          <VideoNoteCapture
            ref={videoRef}
            seconds={seconds}
            onStarted={() => setRec((r) => (r ? { ...r, startedAt: Date.now() } : r))}
            onError={(message) => {
              setRec(null);
              toast.error(message);
            }}
          />,
          stage,
        )}
    </div>
  );
};
