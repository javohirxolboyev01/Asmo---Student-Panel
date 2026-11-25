// src/teacher/components/StudentCodeCard.tsx — its own card on the student
// page (above "Guruh"): Telegram status + make the one-time login code.
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { KeyRound, Send } from "lucide-react";
import { apiGet } from "@/services/apiClient";
import { useTranslation } from "@/hooks/useTranslation";
import { Button } from "@/components/ui";
import { Tag } from "./ui";
import { TelegramLinkModal, telegramStatusKey, type TelegramStatus } from "./TelegramLinkModal";

export const StudentCodeCard = ({ studentId, studentName }: { studentId: string; studentName: string }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const { data: status } = useQuery({
    queryKey: telegramStatusKey(studentId),
    queryFn: () => apiGet<TelegramStatus>(`/students/${studentId}/telegram`),
  });

  return (
    <div className="u-card grid gap-3">
      <div className="flex items-start gap-3">
        <span className="u-ib gl flex-none" aria-hidden="true">
          <KeyRound className="u-i m" strokeWidth={2} />
        </span>
        <div className="min-w-0 flex-1">
          <h2>{t("us.tg.cardTitle")}</h2>
          <p className="u-sub !m-0">{t("us.tg.cardSub")}</p>
        </div>
        {status?.enabled && (
          <Tag tone={status.linked ? "ok" : "mu"}>{status.linked ? t("us.tg.linked") : t("us.tg.notLinked")}</Tag>
        )}
      </div>
      <Button type="button" onClick={() => setOpen(true)} leftIcon={<Send size={16} />}>
        {status?.pendingCodeExpiresAt ? t("us.tg.newCode") : t("us.tg.makeCode")}
      </Button>
      <TelegramLinkModal studentId={studentId} studentName={studentName} isOpen={open} onClose={() => setOpen(false)} />
    </div>
  );
};
