// src/teacher/components/chat/gallery.ts — lets a photo/video bubble open the
// thread's full-screen media viewer (provided by ChatThread).
import { createContext } from "react";

export const GalleryContext = createContext<{ open: (messageId: string) => void } | null>(null);
