// src/teacher/components/chat/PlayerBar.tsx — Telegram's audio player bar on
// top of the thread while a voice message or round video plays:
// ⏪ ▶ ⏩ · who sent it + what it is · 1.0x · mute · close, with a thin
// progress line along the bottom. Tapping the title scrolls to the message.
import { FastForward, Pause, Play, Rewind, Volume2, VolumeX, X } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import {
  closePlayer,
  cycleRate,
  hasNext,
  nextTrack,
  prevTrack,
  toggleMute,
  togglePlay,
  useMediaClock,
  usePlayer,
} from "./player";

export const PlayerBar = () => {
  const { t } = useTranslation();
  const track = usePlayer((s) => s.track);
  const playing = usePlayer((s) => s.playing);
  const rate = usePlayer((s) => s.rate);
  const muted = usePlayer((s) => s.muted);
  const time = useMediaClock(track?.el, playing);

  if (!track) return null;
  const length = Number.isFinite(track.el.duration) && track.el.duration > 0 ? track.el.duration : track.length;
  const progress = length > 0 ? Math.min(1, time / length) : 0;
  const reveal = () =>
    document
      .querySelector(`[data-play-id="${CSS.escape(track.id)}"]`)
      ?.scrollIntoView({ block: "center", behavior: "smooth" });

  return (
    <div className="tg-player" role="region" aria-label={t("us.chat.player")}>
      <button type="button" className="tg-player-btn" onClick={prevTrack} aria-label={t("us.chat.prev")}>
        <Rewind className="tg-ic" fill="currentColor" strokeWidth={0} />
      </button>
      <button
        type="button"
        className="tg-player-btn main"
        onClick={togglePlay}
        aria-label={playing ? t("us.chat.pause") : t("us.chat.play")}
      >
        <span key={playing ? "pause" : "play"} className="tg-swap">
          {playing ? (
            <Pause className="tg-ic" fill="currentColor" strokeWidth={0} />
          ) : (
            <Play className="tg-ic play" fill="currentColor" strokeWidth={0} />
          )}
        </span>
      </button>
      <button
        type="button"
        className="tg-player-btn"
        onClick={nextTrack}
        disabled={!hasNext(track.id)}
        aria-label={t("us.chat.next")}
      >
        <FastForward className="tg-ic" fill="currentColor" strokeWidth={0} />
      </button>

      <button type="button" className="tg-player-info" onClick={reveal}>
        <b>{track.title}</b>
        <small>{track.kind === "voice" ? t("us.chat.player.voice") : t("us.chat.player.videoNote")}</small>
      </button>

      <button
        type="button"
        className={rate === 1 ? "tg-player-rate" : "tg-player-rate on"}
        onClick={cycleRate}
        aria-label={t("us.chat.speed")}
        title={t("us.chat.speed")}
      >
        {rate.toFixed(1)}x
      </button>
      <button
        type="button"
        className="tg-player-btn"
        onClick={toggleMute}
        aria-label={muted ? t("us.chat.unmute") : t("us.chat.mute")}
        aria-pressed={muted}
      >
        {muted ? <VolumeX className="tg-ic" strokeWidth={2} /> : <Volume2 className="tg-ic" strokeWidth={2} />}
      </button>
      <button type="button" className="tg-player-btn" onClick={closePlayer} aria-label={t("common.close")}>
        <X className="tg-ic" strokeWidth={2.2} />
      </button>

      <i className="tg-player-line" style={{ transform: `scaleX(${progress})` }} aria-hidden="true" />
    </div>
  );
};
