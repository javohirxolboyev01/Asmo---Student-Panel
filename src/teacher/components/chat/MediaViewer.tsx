// src/teacher/components/chat/MediaViewer.tsx — Telegram's media viewer for
// the chat: every photo and video of the thread in one full-screen gallery.
// Top: who sent it and when, "3 / 7", zoom, download, close. Arrows / ← → /
// swipe move between items; wheel, double-click or the +/− buttons zoom; drag
// pans a zoomed photo; swipe down (or Esc, or a tap beside the photo) closes.
import { useCallback, useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, Download, X, ZoomIn, ZoomOut } from "lucide-react";
import type { ChatMessage } from "@/hooks/queries/useChat";
import { useTranslation } from "@/hooks/useTranslation";
import { humanDay } from "@/lib/humanDate";
import { Avatar } from "../ui";
import { Spinner, useMediaUrl } from "./ChatMedia";

const MIN = 1;
const MAX = 4;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const pad = (n: number) => String(n).padStart(2, "0");

export interface ViewerItem {
  message: ChatMessage;
  sender: string;
  seed: string;
  avatar: string | null;
}

export const MediaViewer = ({
  studentId,
  items,
  startId,
  onClose,
}: {
  studentId: string;
  items: ViewerItem[];
  startId: string;
  onClose: () => void;
}) => {
  const { t } = useTranslation();
  const [index, setIndex] = useState(() =>
    Math.max(
      0,
      items.findIndex((i) => i.message.id === startId),
    ),
  );
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const [closing, setClosing] = useState(false);
  const gesture = useRef<{
    x: number;
    y: number;
    px: number;
    py: number;
    axis: "x" | "y" | null;
    moved: boolean;
    onMedia: boolean;
  } | null>(null);
  const item = items[index] ?? items[0];
  const m = item.message;
  const isVideo = m.kind === "video";
  const { url, failed } = useMediaUrl(studentId, m.id);

  const close = useCallback(() => {
    setClosing(true);
    window.setTimeout(onClose, 160);
  }, [onClose]);

  const go = useCallback(
    (step: number) => {
      setIndex((i) => clamp(i + step, 0, items.length - 1));
      setZoom(1);
      setPan({ x: 0, y: 0 });
    },
    [items.length],
  );

  const zoomTo = (next: number, cx = 0, cy = 0) => {
    const z = clamp(next, MIN, MAX);
    // Keep the point under the cursor in place (cx/cy relative to the centre).
    setPan((p) => (z === 1 ? { x: 0, y: 0 } : { x: cx - ((cx - p.x) * z) / zoom, y: cy - ((cy - p.y) * z) / zoom }));
    setZoom(z);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        close();
      } else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "ArrowRight") go(1);
      else if (e.key === "+" || e.key === "=") setZoom((z) => clamp(z + 0.5, MIN, MAX));
      else if (e.key === "-") setZoom((z) => (z - 0.5 <= 1 ? (setPan({ x: 0, y: 0 }), 1) : z - 0.5));
    };
    window.addEventListener("keydown", onKey, true);
    return () => window.removeEventListener("keydown", onKey, true);
  }, [close, go]);

  // ── Gestures (photos only; a video keeps its own controls) ──

  const centre = (e: { clientX: number; clientY: number }) => ({
    x: e.clientX - window.innerWidth / 2,
    y: e.clientY - window.innerHeight / 2,
  });

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || (isVideo && e.target instanceof HTMLVideoElement)) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    // Captured pointers report the stage as target on release: remember what was pressed.
    const onMedia = e.target instanceof HTMLImageElement || e.target instanceof HTMLVideoElement;
    gesture.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y, axis: null, moved: false, onMedia };
  };
  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    const g = gesture.current;
    if (!g) return;
    const dx = e.clientX - g.x;
    const dy = e.clientY - g.y;
    if (Math.abs(dx) + Math.abs(dy) > 6) g.moved = true;
    if (zoom > 1) return setPan({ x: g.px + dx, y: g.py + dy });
    if (!g.axis && g.moved) g.axis = Math.abs(dy) > Math.abs(dx) ? "y" : "x";
    if (g.axis === "y") setDrag({ x: 0, y: dy });
    else if (g.axis === "x") setDrag({ x: dx, y: 0 });
  };
  const onPointerUp = () => {
    const g = gesture.current;
    gesture.current = null;
    if (!g) return;
    setDrag({ x: 0, y: 0 });
    if (!g.moved) {
      // A tap beside the photo closes, like in Telegram.
      if (!g.onMedia) close();
      return;
    }
    if (zoom > 1) return;
    if (g.axis === "y" && Math.abs(drag.y) > 110) close();
    else if (g.axis === "x" && drag.x < -70) go(1);
    else if (g.axis === "x" && drag.x > 70) go(-1);
  };

  const onWheel = (e: React.WheelEvent) => {
    if (isVideo) return;
    const c = centre(e);
    zoomTo(zoom * (e.deltaY < 0 ? 1.18 : 1 / 1.18), c.x, c.y);
  };

  const fade = drag.y ? Math.max(0.25, 1 - Math.abs(drag.y) / 400) : 1;
  const d = new Date(m.createdAt);
  const when = `${humanDay(m.createdAt, t)}, ${pad(d.getHours())}:${pad(d.getMinutes())}`;

  return createPortal(
    <div
      className={closing ? "tg-viewer out" : "tg-viewer"}
      role="dialog"
      aria-modal="true"
      aria-label={isVideo ? t("us.chat.kind.video") : t("us.chat.kind.photo")}
      style={{ "--fade": fade } as React.CSSProperties}
    >
      <div className="tg-viewer-top">
        <div className="tg-viewer-who">
          <Avatar name={item.sender} src={item.avatar} seed={item.seed} size="s" />
          <div className="min-w-0">
            <b>{item.sender}</b>
            <small>{when}</small>
          </div>
        </div>
        {items.length > 1 && (
          <span className="tg-viewer-count">
            {index + 1} / {items.length}
          </span>
        )}
        <div className="tg-viewer-acts">
          {!isVideo && (
            <>
              <button
                type="button"
                onClick={() => zoomTo(zoom - 0.5)}
                disabled={zoom <= MIN}
                aria-label={t("us.chat.zoomOut")}
              >
                <ZoomOut className="tg-ic" strokeWidth={2} />
              </button>
              <button
                type="button"
                onClick={() => zoomTo(zoom + 0.5)}
                disabled={zoom >= MAX}
                aria-label={t("us.chat.zoomIn")}
              >
                <ZoomIn className="tg-ic" strokeWidth={2} />
              </button>
            </>
          )}
          {url && (
            <a href={url} download={isVideo ? "video.mp4" : "photo.jpg"} aria-label={t("us.chat.download")}>
              <Download className="tg-ic" strokeWidth={2} />
            </a>
          )}
          <button type="button" onClick={close} aria-label={t("common.close")}>
            <X className="tg-ic" strokeWidth={2.2} />
          </button>
        </div>
      </div>

      <div
        className={`tg-viewer-stage${zoom > 1 ? " zoomed" : ""}${drag.x || drag.y ? " dragging" : ""}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onWheel={onWheel}
        onDoubleClick={(e) => {
          if (isVideo) return;
          const c = centre(e);
          zoomTo(zoom > 1 ? 1 : 2.5, c.x, c.y);
        }}
      >
        <div
          key={m.id}
          className="tg-viewer-media"
          style={{
            transform: `translate(${pan.x + drag.x}px, ${pan.y + drag.y}px) scale(${zoom})`,
          }}
        >
          {failed ? (
            <p className="tg-viewer-fail">{t("us.chat.fileUnavailable")}</p>
          ) : !url ? (
            <Spinner />
          ) : isVideo ? (
            <video src={url} controls autoPlay playsInline />
          ) : (
            <img src={url} alt="" draggable={false} />
          )}
        </div>
      </div>

      {index > 0 && (
        <button type="button" className="tg-viewer-nav prev" onClick={() => go(-1)} aria-label={t("us.chat.prev")}>
          <ChevronLeft className="tg-ic l" strokeWidth={2.2} />
        </button>
      )}
      {index < items.length - 1 && (
        <button type="button" className="tg-viewer-nav next" onClick={() => go(1)} aria-label={t("us.chat.next")}>
          <ChevronRight className="tg-ic l" strokeWidth={2.2} />
        </button>
      )}

      {m.text && zoom === 1 && <p className="tg-viewer-caption">{m.text}</p>}
    </div>,
    document.body,
  );
};
