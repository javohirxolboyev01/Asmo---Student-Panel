// src/hooks/queries/useChat.ts — teacher ↔ family chat (through the Telegram bot).
// No websockets, and polls kept cheap for the server: the open thread asks
// every 5s only for messages after the last one it has; the badge asks every
// 15s for the unread count + newest message time, and the thread list is
// refetched only when that time changes (it doesn't poll on its own).
import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { API_URL, ApiError, apiGet, apiPost, tokenStorage } from "@/services/apiClient";

export type ChatKind = "text" | "photo" | "voice" | "video_note" | "video";
export type OutgoingMediaKind = "photo" | "voice" | "video_note";

export interface ChatMessage {
  id: string;
  fromStudent: boolean;
  senderName: string | null;
  kind: ChatKind;
  /** Text, or the caption of a media message (may be empty). */
  text: string;
  hasFile: boolean;
  /** Seconds (voice / video). */
  duration: number | null;
  createdAt: string;
}
export interface ChatStudent {
  id: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  telegramLinked: boolean;
}
export interface ChatThreadSummary {
  student: ChatStudent;
  last: ChatMessage;
  unread: number;
}
export interface ChatThread {
  student: ChatStudent & { telegramUsername: string | null; groups: { id: string; name: string }[] };
  botEnabled: boolean;
  messages: ChatMessage[];
}

const keys = {
  all: ["chat"] as const,
  list: ["chat", "list"] as const,
  unread: ["chat", "unread"] as const,
  thread: (studentId: string) => ["chat", "thread", studentId] as const,
};

export const useChatThreadsQuery = () =>
  useQuery({
    queryKey: keys.list,
    queryFn: () => apiGet<ChatThreadSummary[]>("/teacher/chats"),
  });

export const useChatUnreadQuery = () => {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: keys.unread,
    queryFn: async () => {
      const prev = queryClient.getQueryData<{ count: number; latestAt: string | null }>(keys.unread);
      const next = await apiGet<{ count: number; latestAt: string | null }>("/teacher/chats/unread");
      // Something new somewhere: refresh the thread list (only if it's in use).
      if (prev && prev.latestAt !== next.latestAt)
        void queryClient.invalidateQueries({ queryKey: keys.list, refetchType: "active" });
      return next;
    },
    refetchInterval: 15_000,
    select: (d) => d.count,
  });
};

/** Threads that had their full load since they were (re)opened. */
const loadedFull = new Set<string>();

export const useChatThreadQuery = (studentId: string | undefined) => {
  const queryClient = useQueryClient();
  // The first fetch after opening a thread is a full one (fresh header, read
  // marks); the 5s polls after it only ask for what came after the last message.
  useEffect(() => {
    if (studentId) loadedFull.delete(studentId);
  }, [studentId]);
  return useQuery({
    queryKey: keys.thread(studentId ?? ""),
    queryFn: async () => {
      const key = keys.thread(studentId ?? "");
      const prev = queryClient.getQueryData<ChatThread>(key);
      const last = prev?.messages[prev.messages.length - 1];
      if (prev && last && studentId && loadedFull.has(studentId)) {
        const { messages, complete } = await apiGet<{ messages: ChatMessage[]; complete: boolean }>(
          `/teacher/chats/${studentId}?after=${encodeURIComponent(last.createdAt)}`,
        );
        if (complete) {
          const known = new Set(prev.messages.map((m) => m.id));
          const fresh = messages.filter((m) => !known.has(m.id));
          if (fresh.length === 0) return prev; // same object: nothing re-renders
          if (fresh.some((m) => m.fromStudent)) {
            // They were just marked read on the server.
            void queryClient.invalidateQueries({ queryKey: keys.unread });
            void queryClient.invalidateQueries({ queryKey: keys.list, refetchType: "active" });
          }
          return { ...prev, messages: [...prev.messages, ...fresh] };
        }
        // Too much arrived at once: fall through to a full reload.
      }
      const data = await apiGet<ChatThread>(`/teacher/chats/${studentId}`);
      if (studentId) loadedFull.add(studentId);
      // Opening a thread marks it read on the server: refresh the badges.
      void queryClient.invalidateQueries({ queryKey: keys.unread });
      void queryClient.invalidateQueries({ queryKey: keys.list, refetchType: "active" });
      return data;
    },
    enabled: Boolean(studentId),
    refetchInterval: 5_000,
  });
};

export const useSendChatMutation = (studentId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (text: string) => apiPost<ChatMessage>(`/teacher/chats/${studentId}`, { text }),
    onSuccess: (message) => {
      queryClient.setQueryData<ChatThread>(keys.thread(studentId), (old) =>
        old ? { ...old, messages: [...old.messages, message] } : old,
      );
      void queryClient.invalidateQueries({ queryKey: keys.list });
    },
  });
};

/** Object URLs of media already in this tab (just sent or already downloaded). */
export const chatMediaCache = new Map<string, string>();

/** Uploads a photo / voice / round video; the raw file is the request body. */
const uploadMedia = async (studentId: string, kind: OutgoingMediaKind, blob: Blob, caption: string) => {
  const query = new URLSearchParams({ kind });
  if (caption) query.set("caption", caption);
  const send = () =>
    fetch(`${API_URL}/teacher/chats/${studentId}/media?${query}`, {
      method: "POST",
      headers: {
        "Content-Type": blob.type || "application/octet-stream",
        Authorization: `Bearer ${tokenStorage.getAccessToken() ?? ""}`,
      },
      body: blob,
    });
  let res = await send();
  // Expired access token: one cheap retry through the normal client's refresh.
  if (res.status === 401) {
    await apiGet("/teacher/chats/unread").catch(() => undefined);
    res = await send();
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new ApiError(data.error || `HTTP ${res.status}`, res.status, data.code);
  return data as ChatMessage;
};

export const useSendChatMediaMutation = (studentId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ kind, blob, caption = "" }: { kind: OutgoingMediaKind; blob: Blob; caption?: string }) =>
      uploadMedia(studentId, kind, blob, caption),
    onSuccess: (message, { blob }) => {
      // Show it from the local copy instead of downloading it back from Telegram.
      chatMediaCache.set(message.id, URL.createObjectURL(blob));
      queryClient.setQueryData<ChatThread>(keys.thread(studentId), (old) =>
        old ? { ...old, messages: [...old.messages, message] } : old,
      );
      void queryClient.invalidateQueries({ queryKey: keys.list });
    },
  });
};
