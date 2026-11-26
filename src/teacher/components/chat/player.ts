// src/teacher/components/chat/player.ts — the chat's "now playing" state, like
// Telegram's audio player: one voice message / round video at a time, a bar on
// top of the thread (⏪ ▶ ⏩, who + what, speed, mute, close), and playback
// that moves on to the next voice / round video when one ends.
// Each bubble owns its <audio>/<video>; it hands the element to the store
// when it starts, and registers how to start / stop itself.
import { useEffect, useState } from "react";
import { create } from "zustand";

export type TrackKind = "voice" | "video_note";

export interface Track {
  id: string;
  kind: TrackKind;
  /** "Siz" or the sender's name. */
  title: string;
  el: HTMLMediaElement;
  /** Seconds, from Telegram (browser recordings may report an endless duration). */
  length: number;
  /** Back to the bubble's resting state (paused voice / silent looping round video). */
  stop: () => void;
}

interface PlayerState {
  track: Track | null;
  playing: boolean;
  rate: number;
  muted: boolean;
}

const RATE_KEY = "asmo.chat.rate";
const readRate = () => {
  try {
    const r = Number(localStorage.getItem(RATE_KEY));
    return [1, 1.5, 2].includes(r) ? r : 1;
  } catch {
    return 1;
  }
};

export const usePlayer = create<PlayerState>(() => ({ track: null, playing: false, rate: readRate(), muted: false }));

/** How each playable bubble starts itself from the beginning (for ⏪ ⏩ and auto-next). */
const starters = new Map<string, () => void>();
export const registerStarter = (id: string, start: () => void) => {
  starters.set(id, start);
  return () => {
    if (starters.get(id) === start) starters.delete(id);
  };
};

/** The playable bubbles in on-screen order (they carry data-play-id). */
const neighbour = (id: string, step: 1 | -1) => {
  const ids = [...document.querySelectorAll<HTMLElement>("[data-play-id]")].map((el) => el.dataset.playId!);
  const at = ids.indexOf(id);
  return at < 0 ? undefined : ids[at + step];
};

let detach: (() => void) | null = null;

const listen = (track: Track) => {
  const el = track.el;
  const sync = () => usePlayer.setState({ playing: !el.paused });
  const ended = () => {
    detach?.();
    detach = null;
    const next = neighbour(track.id, 1);
    const start = next ? starters.get(next) : undefined;
    if (start) start();
    else usePlayer.setState({ track: null, playing: false });
  };
  el.addEventListener("play", sync);
  el.addEventListener("pause", sync);
  el.addEventListener("ended", ended);
  return () => {
    el.removeEventListener("play", sync);
    el.removeEventListener("pause", sync);
    el.removeEventListener("ended", ended);
  };
};

/** A bubble starts playing: it becomes the track (the previous one stops). */
export const playTrack = (track: Track) => {
  const { track: current, rate, muted } = usePlayer.getState();
  if (current && current.id !== track.id) {
    detach?.();
    detach = null;
    current.stop();
  }
  if (!current || current.id !== track.id || !detach) {
    detach?.();
    detach = listen(track);
  }
  track.el.playbackRate = rate;
  track.el.muted = muted;
  usePlayer.setState({ track, playing: true });
  void track.el.play().catch(() => usePlayer.setState({ playing: false }));
};

/** The bubble went away (left the thread): forget it without touching other tracks. */
export const forgetTrack = (id: string) => {
  if (usePlayer.getState().track?.id !== id) return;
  detach?.();
  detach = null;
  usePlayer.setState({ track: null, playing: false });
};

// ── Bar controls ──

export const togglePlay = () => {
  const { track } = usePlayer.getState();
  if (!track) return;
  if (track.el.paused) void track.el.play().catch(() => undefined);
  else track.el.pause();
};

export const closePlayer = () => {
  const { track } = usePlayer.getState();
  detach?.();
  detach = null;
  usePlayer.setState({ track: null, playing: false });
  track?.stop();
};

/** ⏪: back to the start, or (already near it) the previous voice / round video. */
export const prevTrack = () => {
  const { track } = usePlayer.getState();
  if (!track) return;
  const prev = neighbour(track.id, -1);
  if (track.el.currentTime > 3 || !prev || !starters.get(prev)) {
    track.el.currentTime = 0;
    return;
  }
  starters.get(prev)!();
};

/** ⏩: the next voice / round video. */
export const nextTrack = () => {
  const { track } = usePlayer.getState();
  if (!track) return;
  const next = neighbour(track.id, 1);
  const start = next ? starters.get(next) : undefined;
  if (start) start();
};

export const hasNext = (id: string) => Boolean(neighbour(id, 1));

const RATES = [1, 1.5, 2];
export const cycleRate = () => {
  const { rate, track } = usePlayer.getState();
  const next = RATES[(RATES.indexOf(rate) + 1) % RATES.length];
  if (track) track.el.playbackRate = next;
  try {
    localStorage.setItem(RATE_KEY, String(next));
  } catch {
    /* not remembered — fine */
  }
  usePlayer.setState({ rate: next });
};

export const toggleMute = () => {
  const { muted, track } = usePlayer.getState();
  if (track) track.el.muted = !muted;
  usePlayer.setState({ muted: !muted });
};

/**
 * The element's current time, read every animation frame while it plays (so
 * waveforms, rings and the bar move smoothly) and on seeks while paused.
 */
export const useMediaClock = (el: HTMLMediaElement | null | undefined, running: boolean) => {
  const [time, setTime] = useState(() => el?.currentTime ?? 0);
  useEffect(() => {
    if (!el) return;
    const read = () => setTime(el.currentTime);
    read();
    el.addEventListener("seeked", read);
    el.addEventListener("timeupdate", read);
    let frame = 0;
    if (running) {
      const tick = () => {
        read();
        frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("seeked", read);
      el.removeEventListener("timeupdate", read);
    };
  }, [el, running]);
  return time;
};
