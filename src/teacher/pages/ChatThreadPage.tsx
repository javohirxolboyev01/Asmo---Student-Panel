// src/teacher/pages/ChatThreadPage.tsx — one student's thread as a page
// (phones). The page fills the visible screen: messages scroll, the composer
// stays at the bottom (the phone tab bar is hidden here, see TeacherLayout).
import { useEffect, useLayoutEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { useChatThreadQuery } from "@/hooks/queries/useChat";
import { useTopBar } from "../components/topBar";
import { ChatThread } from "../components/chat/ChatThread";

export const ChatThreadPage = () => {
  const { studentId = "" } = useParams<{ studentId: string }>();
  const { data } = useChatThreadQuery(studentId);
  const bar = useTopBar();
  const boxRef = useRef<HTMLDivElement>(null);
  const name = data ? `${data.student.firstName} ${data.student.lastName}` : "";

  // Back button + name in the shared top bar.
  useEffect(() => {
    if (!bar) return;
    bar.set({ title: name, back: { to: "/chat" }, collapsed: true });
    return () => bar.set(null);
  }, [bar, name]);

  // Fill the visible screen (follows the phone keyboard too).
  useLayoutEffect(() => {
    const fit = () => {
      const box = boxRef.current;
      if (!box) return;
      const viewport = window.visualViewport?.height ?? window.innerHeight;
      box.style.height = `${Math.max(280, viewport - box.getBoundingClientRect().top - 12)}px`;
    };
    fit();
    window.addEventListener("resize", fit);
    window.visualViewport?.addEventListener("resize", fit);
    return () => {
      window.removeEventListener("resize", fit);
      window.visualViewport?.removeEventListener("resize", fit);
    };
  }, []);

  return (
    <div ref={boxRef} className="flex flex-col">
      <ChatThread studentId={studentId} />
    </div>
  );
};
