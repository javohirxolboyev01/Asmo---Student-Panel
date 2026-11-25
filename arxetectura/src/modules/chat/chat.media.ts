// src/modules/chat/chat.media.ts — gets a file recorded/picked in the teacher
// panel into a format Telegram accepts for that message kind:
//   photo      → JPEG / PNG / WebP
//   voice      → OGG/Opus, MP3 or M4A (shows as a voice message)
//   video_note → square MP4 (H.264), up to 1 minute
// Formats that already fit are passed through untouched.
import type { OutgoingFile } from "./chat.telegram.js";

export type OutgoingKind = "photo" | "voice" | "video_note";

const PASS: Record<OutgoingKind, Record<string, string>> = {
  photo: { "image/jpeg": "photo.jpg", "image/png": "photo.png", "image/webp": "photo.webp" },
  voice: { "audio/ogg": "voice.ogg", "audio/mpeg": "voice.mp3", "audio/mp4": "voice.m4a", "audio/x-m4a": "voice.m4a" },
  video_note: { "video/mp4": "video.mp4" },
};

export class MediaFormatError extends Error {}

/** The file ready for Telegram, or MediaFormatError when it can't be sent as this kind. */
export async function prepareForTelegram(kind: OutgoingKind, data: Buffer, contentType: string): Promise<OutgoingFile> {
  const type = contentType.split(";")[0]!.trim().toLowerCase();
  const filename = PASS[kind][type];
  if (filename) return { data, filename, type };
  throw new MediaFormatError(`${type} can't be sent as ${kind}`);
}
