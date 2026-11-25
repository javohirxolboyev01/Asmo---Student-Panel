// src/teacher/components/chat/ChatWidget.tsx — laptops: a round chat button in
// the bottom-right corner with the unread count. It opens a chat window over
// the page: every student's account (searchable) → their thread, without
// leaving the page. Phones don't show it (they use the /chat pages).
import { useEffect, useState } from "react";
import { MessageCircle, X } from "lucide-react";
import { useChatUnreadQuery } from "@/hooks/queries/useChat";
import { useTranslation } from "@/hooks/useTranslation";
import { ChatList } from "./ChatList";
import { ChatThread } from "./ChatThread";

export const ChatWidget = () => {
  const { t } = useTranslation();
  const { data: unread = 0 } = useChatUnreadQuery();
  const [open, setOpen] = useState(false);
  const [studentId, setStudentId] = useState<string | null>(null);

  // Esc: from a thread back to the list, from the list closes the window.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (studentId) setStudentId(null);
      else setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, studentId]);

  return (
    <>
      {open && (
        <section className="u-cw" role="dialog" aria-label={t("us.chat.title")}>
          {studentId ? (
            <ChatThread key={studentId} studentId={studentId} compact onBack={() => setStudentId(null)} />
          ) : (
            <div className="u-cw-list">
              <div className="u-cw-hd">
                <h2>{t("us.chat.title")}</h2>
                <small className="u-sub !m-0">{t("us.chat.subtitle")}</small>
              </div>
              <div className="u-cw-body">
                <ChatList onOpen={setStudentId} />
              </div>
            </div>
          )}
        </section>
      )}

      <button
        type="button"
        className={open ? "u-cw-fab on" : "u-cw-fab"}
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? t("common.close") : t("us.chat.title")}
        aria-expanded={open}
      >
        {open ? <X className="u-i" strokeWidth={2.2} /> : <MessageCircle className="u-i" strokeWidth={2.2} />}
        {!open && unread > 0 && <span className="u-cw-n">{unread > 99 ? "99+" : unread}</span>}
      </button>
    </>
  );
};
