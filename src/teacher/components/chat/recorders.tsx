// src/teacher/components/chat/recorders.tsx — recording in the browser for the
// chat, the way Telegram does it: a voice recorder (with a live mic level for
// the pulsing button) and a round-video capture that starts filming as soon as
// the camera is up. The composer drives both (hold / slide / lock).
// Recordings are made directly in formats Telegram accepts where the browser can.
import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { useTranslation } from "@/hooks/useTranslation";

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
  typeof window !== "undefined" &&
  typeof MediaRecorder !== "undefined" &&
  Boolean(navigator.mediaDevices?.getUserMedia);

const stopTracks = (stream: MediaStream | null) => stream?.getTracks().forEach((track) => track.stop());

/** Mic level meter (0…1) on a stream; read it as often as you like. */
const meter = (stream: MediaStream) => {
  try {
    const Ctx =
      window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new Ctx();
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 512;
    ctx.createMediaStreamSource(stream).connect(analyser);
    const buf = new Uint8Array(analyser.fftSize);
    return {
      level: () => {
        analyser.getByteTimeDomainData(buf);
        let sum = 0;
        for (const v of buf) sum += ((v - 128) / 128) ** 2;
        return Math.min(1, Math.sqrt(sum / buf.length) * 4);
      },
      close: () => void ctx.close().catch(() => undefined),
    };
  } catch {
    return { level: () => 0, close: () => undefined };
  }
};

// ── Voice ──

export const VOICE_MAX_SECONDS = 5 * 60;

/** Microphone recorder: start → stop() gives the Blob, cancel() throws it away. */
export const useVoiceRecorder = () => {
  const recorder = useRef<MediaRecorder | null>(null);
  const stream = useRef<MediaStream | null>(null);
  const chunks = useRef<Blob[]>([]);
  const level = useRef<ReturnType<typeof meter> | null>(null);

  const start = useCallback(async () => {
    stream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    const type = pickType(VOICE_TYPES);
    const rec = new MediaRecorder(stream.current, type ? { mimeType: type } : undefined);
    chunks.current = [];
    rec.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
    rec.start(250);
    recorder.current = rec;
    level.current = meter(stream.current);
  }, []);

  const finish = useCallback(
    (keep: boolean) =>
      new Promise<Blob | null>((resolve) => {
        const rec = recorder.current;
        recorder.current = null;
        level.current?.close();
        level.current = null;
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
  useEffect(
    () => () => {
      level.current?.close();
      stopTracks(stream.current);
    },
    [],
  );

  return useMemo(
    () => ({
      start,
      stop: () => finish(true),
      cancel: () => finish(false),
      level: () => level.current?.level() ?? 0,
    }),
    [start, finish],
  );
};

// ── Round video ──

export const VIDEO_NOTE_MAX_SECONDS = 60;
const SIDE = 384; // Telegram round videos are square, up to 640px

export interface VideoNoteHandle {
  stop: () => Promise<Blob | null>;
  cancel: () => void;
  level: () => number;
}

/**
 * Telegram's round camera: the front camera cropped to a circle in the middle
 * of a dimmed screen with a progress ring. Filming starts as soon as the camera
 * is up (`onStarted`); the composer ends it through the ref.
 */
export const VideoNoteCapture = forwardRef<
  VideoNoteHandle,
  { seconds: number; onStarted: () => void; onError: (message: string) => void }
>(({ seconds, onStarted, onError }, ref) => {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const level = useRef<ReturnType<typeof meter> | null>(null);
  const frame = useRef(0);
  const [live, setLive] = useState(false);
  const callbacks = useRef({ onStarted, onError });
  callbacks.current = { onStarted, onError };

  useEffect(() => {
    let alive = true;
    navigator.mediaDevices
      .getUserMedia({
        video: {
          facingMode: "user",
          width: { ideal: 720 },
          height: { ideal: 720 },
        },
        audio: true,
      })
      .then(async (s) => {
        if (!alive) return stopTracks(s);
        stream.current = s;
        const video = videoRef.current!;
        video.srcObject = s;
        await video.play().catch(() => undefined);
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
        if (!alive || !canvasRef.current) return;
        const out = canvasRef.current.captureStream(30);
        s.getAudioTracks().forEach((track) => out.addTrack(track));
        const type = pickType(VIDEO_TYPES);
        const rec = new MediaRecorder(out, {
          ...(type ? { mimeType: type } : {}),
          videoBitsPerSecond: 1_000_000,
        });
        chunks.current = [];
        rec.ondataavailable = (e) => e.data.size && chunks.current.push(e.data);
        rec.start(250);
        recorder.current = rec;
        level.current = meter(s);
        setLive(true);
        callbacks.current.onStarted();
      })
      .catch(() => alive && callbacks.current.onError(t("us.chat.noCamera")));
    return () => {
      alive = false;
      cancelAnimationFrame(frame.current);
      level.current?.close();
      if (recorder.current?.state === "recording") recorder.current.stop();
      stopTracks(stream.current);
    };
  }, [t]);

  useImperativeHandle(
    ref,
    () => ({
      stop: () =>
        new Promise<Blob | null>((resolve) => {
          const rec = recorder.current;
          recorder.current = null;
          if (!rec || rec.state === "inactive") return resolve(null);
          rec.onstop = () => resolve(new Blob(chunks.current, { type: rec.mimeType || "video/webm" }));
          rec.stop();
        }),
      cancel: () => {
        const rec = recorder.current;
        recorder.current = null;
        if (rec && rec.state !== "inactive") {
          rec.onstop = null;
          rec.stop();
        }
      },
      level: () => level.current?.level() ?? 0,
    }),
    [],
  );

  return (
    <div className="tg-vrec" aria-hidden="true">
      <video ref={videoRef} muted playsInline className="hidden" />
      <div className={live ? "tg-vrec-cam on" : "tg-vrec-cam"}>
        <canvas ref={canvasRef} width={SIDE} height={SIDE} />
        <svg viewBox="0 0 100 100">
          <circle cx="50" cy="50" r="48.5" pathLength="1" strokeDasharray={`${seconds / VIDEO_NOTE_MAX_SECONDS} 1`} />
        </svg>
      </div>
    </div>
  );
});
VideoNoteCapture.displayName = "VideoNoteCapture";

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
