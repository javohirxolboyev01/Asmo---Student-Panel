// src/teacher/components/chat/recorders.tsx — recording in the browser for the
// chat: voice messages and Telegram-style round videos, plus photo prep.
// Recordings are made directly in formats Telegram accepts where the browser can.
import { useCallback, useEffect, useRef, useState } from "react";
import { Circle, Send, X } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import { formatDuration } from "./ChatMedia";

const pickType = (types: string[]) =>
  typeof MediaRecorder === "undefined" ? "" : (types.find((type) => MediaRecorder.isTypeSupported(type)) ?? "");

// Formats Telegram takes as-is come first: OGG/Opus (Firefox), M4A/AAC (Chrome,
// Safari); round videos as H.264 MP4 (Chrome 126+, Safari). WebM is the last
// resort — the server answers UNSUPPORTED_FORMAT for it (no converter yet).
const VOICE_TYPES = [
  "audio/ogg;codecs=opus",
  "audio/mp4;codecs=mp4a.40.2",
  "audio/mp4",
  "audio/webm;codecs=opus",
  "audio/webm",
];
const VIDEO_TYPES = [
  "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
  "video/mp4;codecs=avc1,mp4a",
  "video/mp4",
  "video/webm;codecs=vp8,opus",
  "video/webm",
];

export const canRecord = () =>
  typeof window !== "undefined" && typeof MediaRecorder !== "undefined" && Boolean(navigator.mediaDevices?.getUserMedia);

const stopTracks = (stream: MediaStream | null) => stream?.getTracks().forEach((track) => track.stop());

/** Seconds since `running` became true (ticks every 250 ms). */
const useTimer = (running: boolean) => {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!running) return;
    const start = Date.now();
    setSeconds(0);
    const id = window.setInterval(() => setSeconds((Date.now() - start) / 1000), 250);
    return () => window.clearInterval(id);
  }, [running]);
  return seconds;
};

// ── Voice ──

export const VOICE_MAX_SECONDS = 5 * 60;

/** Microphone recorder: start → stop() gives the Blob, cancel() throws it away. */
export const useVoiceRecorder = () => {
  const [recording, setRecording] = useState(false);
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const seconds = useTimer(recording);

  const start = useCallback(async () => {
    stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    const type = pickType(VOICE_TYPES);
    const rec = new MediaRecorder(stream.current, type ? { mimeType: type } : undefined);
    chunks.current = [];
    rec.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
    rec.start(250);
    recorder.current = rec;
    setRecording(true);
  }, []);

  const finish = useCallback(
    (keep: boolean) =>
      new Promise<Blob | null>((resolve) => {
        const rec = recorder.current;
        setRecording(false);
        if (!rec || rec.state === "inactive") {
          stopTracks(stream.current);
          return resolve(null);
        }
        rec.onstop = () => {
          stopTracks(stream.current);
          resolve(keep ? new Blob(chunks.current, { type: rec.mimeType || "audio/webm" }) : null);
        };
        rec.stop();
      }),
    [],
  );

  // Leaving the page mid-recording releases the microphone.
  useEffect(() => () => stopTracks(stream.current), []);

  return { recording, seconds, start, stop: () => finish(true), cancel: () => finish(false) };
};

// ── Round video ──

export const VIDEO_NOTE_MAX_SECONDS = 60;
const SIDE = 384; // Telegram round videos are square, up to 640px

/**
 * Full-screen round camera like Telegram's: the camera is cropped to a square
 * on a canvas, and the canvas (plus the microphone) is what gets recorded.
 */
export const VideoNoteRecorder = ({ onClose, onSend }: { onClose: () => void; onSend: (blob: Blob) => void }) => {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const frame = useRef(0);
  const [error, setError] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const seconds = useTimer(recording);

  useEffect(() => {
    let alive = true;
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "user", width: { ideal: 720 }, height: { ideal: 720 } }, audio: true })
      .then((s) => {
        if (!alive) return stopTracks(s);
        stream.current = s;
        const video = videoRef.current!;
        video.srcObject = s;
        void video.play();
        // Square centre crop of the camera, mirrored like a selfie view.
        const draw = () => {
          const canvas = canvasRef.current;
          const ctx = canvas?.getContext("2d");
          if (canvas && ctx && video.videoWidth) {
            const side = Math.min(video.videoWidth, video.videoHeight);
            ctx.save();
            ctx.translate(SIDE, 0);
            ctx.scale(-1, 1);
            ctx.drawImage(
              video,
              (video.videoWidth - side) / 2,
              (video.videoHeight - side) / 2,
              side,
              side,
              0,
              0,
              SIDE,
              SIDE,
            );
            ctx.restore();
          }
          frame.current = requestAnimationFrame(draw);
        };
        draw();
      })
      .catch(() => alive && setError(t("us.chat.noCamera")));
    return () => {
      alive = false;
      cancelAnimationFrame(frame.current);
      if (recorder.current?.state === "recording") recorder.current.stop();
      stopTracks(stream.current);
    };
  }, [t]);

  const start = () => {
    const canvas = canvasRef.current;
    if (!canvas || !stream.current) return;
    const out = canvas.captureStream(30);
    stream.current.getAudioTracks().forEach((track) => out.addTrack(track));
    const type = pickType(VIDEO_TYPES);
    const rec = new MediaRecorder(out, { ...(type ? { mimeType: type } : {}), videoBitsPerSecond: 1_000_000 });
    chunks.current = [];
    rec.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
    rec.start(250);
    recorder.current = rec;
    setRecording(true);
  };

  const stopAndSend = () => {
    const rec = recorder.current;
    if (!rec) return;
    rec.onstop = () => onSend(new Blob(chunks.current, { type: rec.mimeType || "video/webm" }));
    rec.stop();
    setRecording(false);
  };

  useEffect(() => {
    if (recording && seconds >= VIDEO_NOTE_MAX_SECONDS) stopAndSend();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recording, seconds]);

  return (
    <div className="u-vrec" role="dialog" aria-modal="true" aria-label={t("us.chat.recordVideo")}>
      <video ref={videoRef} muted playsInline className="hidden" />
      <div className={recording ? "u-vrec-cam on" : "u-vrec-cam"}>
        {error ? <p>{error}</p> : <canvas ref={canvasRef} width={SIDE} height={SIDE} />}
        {recording && (
          <svg viewBox="0 0 100 100" aria-hidden="true">
            <circle cx="50" cy="50" r="49" pathLength="1" strokeDasharray={`${seconds / VIDEO_NOTE_MAX_SECONDS} 1`} />
          </svg>
        )}
      </div>
      <p className="u-vrec-time">
        {recording ? (
          <>
            <i /> {formatDuration(seconds)} / {formatDuration(VIDEO_NOTE_MAX_SECONDS)}
          </>
        ) : (
          t("us.chat.videoHint")
        )}
      </p>
      <div className="u-vrec-bar">
        <button type="button" className="u-vrec-btn" onClick={onClose} aria-label={t("common.cancel")}>
          <X className="u-i m" strokeWidth={2.2} />
        </button>
        {!recording ? (
          <button
            type="button"
            className="u-vrec-btn rec"
            onClick={start}
            disabled={Boolean(error)}
            aria-label={t("us.chat.startRecording")}
          >
            <Circle className="u-i m" fill="currentColor" strokeWidth={0} />
          </button>
        ) : (
          <button type="button" className="u-vrec-btn send" onClick={stopAndSend} aria-label={t("us.chat.send")}>
            <Send className="u-i m" strokeWidth={2.2} />
          </button>
        )}
        <span className="u-vrec-btn ghost" aria-hidden="true" />
      </div>
    </div>
  );
};

// ── Photo ──

/** Any picked image → JPEG (at most 2560 px), which Telegram always accepts. */
export const toJpeg = async (file: File): Promise<Blob> => {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 2560 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("encode"))), "image/jpeg", 0.9),
  );
};
