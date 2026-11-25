// src/teacher/pages/ChatPage.tsx — "Chat" on phones: every student's account,
// searchable. The student and their parents share the student's Telegram bot,
// so whatever that account writes to the bot shows up in their thread; replies
// go back through the bot. (Laptops use the floating chat window, ChatWidget.)
import { useTranslation } from "@/hooks/useTranslation";
import { PageHeader } from "../components/ui";
import { ChatList } from "../components/chat/ChatList";

export const ChatPage = () => {
  const { t } = useTranslation();
  return (
    <div>
      <PageHeader title={t("us.chat.title")} subtitle={t("us.chat.subtitle")} />
      <ChatList />
    </div>
  );
};
