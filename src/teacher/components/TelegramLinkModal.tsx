// src/teacher/components/TelegramLinkModal.tsx — teacher gives a student a
// one-time code; the student sends it to the bot and then opens the app there.
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, Link2Off, Send } from "lucide-react";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/ui";
import { apiDelete, apiGet, apiPost } from "@/services/apiClient";
import { useTranslation } from "@/hooks/useTranslation";
import { useConfirm } from "@/hooks/useConfirm";
import { toast, getErrorMessage } from "@/lib/toast";
import { humanDateTime } from "@/lib/humanDate";

export interface TelegramStatus {
  enabled: boolean;
  linked: boolean;
  username: string | null;
  pendingCodeExpiresAt: string | null;
  bot: string | null;
}
interface LinkCode {
  bot: string | null;
  code: string;
  expiresAt: string;
  link: string | null;
}

export const telegramStatusKey = (studentId: string) => ["students", "telegram", studentId] as const;
const statusKey = telegramStatusKey;

const CopyButton = ({ text, label }: { text: string; label: string }) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error(t("common.error"));
    }
  };
  return (
    <Button type="button" variant="outline" size="sm" onClick={copy} leftIcon={copied ? <Check size={16} /> : <Copy size={16} />}>
      {copied ? t("us.tg.copied") : label}
    </Button>
  );
};

export const TelegramLinkModal = ({
  studentId,
  studentName,
  isOpen,
  onClose,
}: {
  studentId: string;
  studentName: string;
  isOpen: boolean;
  onClose: () => void;
}) => {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const { confirm, confirmModal } = useConfirm();
  const [code, setCode] = useState<LinkCode | null>(null);

  const { data: status, isLoading } = useQuery({
    queryKey: statusKey(studentId),
    queryFn: () => apiGet<TelegramStatus>(`/students/${studentId}/telegram`),
    enabled: isOpen,
    staleTime: 0,
  });
  const generate = useMutation({
    mutationFn: () => apiPost<LinkCode>(`/students/${studentId}/telegram-code`),
    onSuccess: (data) => {
      setCode(data);
      void queryClient.invalidateQueries({ queryKey: statusKey(studentId) });
    },
    onError: (err) => toast.error(getErrorMessage(err, t("common.error"))),
  });
  const unlink = useMutation({
    mutationFn: () => apiDelete(`/students/${studentId}/telegram`),
    onSuccess: () => {
      setCode(null);
      toast.success(t("us.tg.unlinked"));
      void queryClient.invalidateQueries({ queryKey: statusKey(studentId) });
    },
    onError: (err) => toast.error(getErrorMessage(err, t("common.error"))),
  });

  const close = () => {
    setCode(null);
    onClose();
  };

  const handleUnlink = async () => {
    const ok = await confirm(t("us.tg.unlinkConfirm", { name: studentName }), { tone: "danger" });
    if (ok) unlink.mutate();
  };

  const message = code
    ? t("us.tg.shareText", { bot: code.bot ? `@${code.bot}` : "", code: code.code, link: code.link ?? "" })
    : "";

  return (
    <>
      <Modal isOpen={isOpen} onClose={close} title={t("us.tg.title")}>
        {isLoading || !status ? (
          <p className="py-6 text-center text-sm opacity-70">…</p>
        ) : !status.enabled ? (
          <p className="text-sm leading-relaxed">{t("us.tg.notConfigured")}</p>
        ) : (
          <div className="grid gap-4">
            <div className="rounded-2xl p-3.5 text-sm leading-relaxed" style={{ background: "rgb(var(--u-sf2))" }}>
              <b>{t("us.tg.statusLabel")}: </b>
              {status.linked
                ? status.username
                  ? t("us.tg.linkedAs", { username: `@${status.username}` })
                  : t("us.tg.linked")
                : t("us.tg.notLinked")}
            </div>

            {code ? (
              <div className="grid gap-3 text-center">
                <p className="text-sm">{t("us.tg.codeHint", { name: studentName })}</p>
                <div
                  className="select-all rounded-2xl py-4 font-mono text-3xl font-extrabold tracking-[0.2em]"
                  style={{ background: "rgb(var(--u-prt))", color: "rgb(var(--u-pr))" }}
                >
                  {code.code}
                </div>
                <p className="text-xs opacity-70">
                  {t("us.tg.expires", { date: humanDateTime(code.expiresAt, t) })}
                  {code.bot && <> · {t("us.tg.bot", { bot: `@${code.bot}` })}</>}
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  <CopyButton text={code.code} label={t("us.tg.copyCode")} />
                  {code.link && <CopyButton text={message} label={t("us.tg.copyMessage")} />}
                </div>
              </div>
            ) : (
              <p className="text-sm leading-relaxed">{t("us.tg.explain")}</p>
            )}

            <div className="flex flex-wrap gap-2.5">
              {status.linked && (
                <Button
                  type="button"
                  variant="danger"
                  onClick={handleUnlink}
                  isLoading={unlink.isPending}
                  leftIcon={<Link2Off size={16} />}
                >
                  {t("us.tg.unlink")}
                </Button>
              )}
              <Button
                type="button"
                className="flex-1"
                onClick={() => generate.mutate()}
                isLoading={generate.isPending}
                leftIcon={<Send size={16} />}
              >
                {code || status.pendingCodeExpiresAt ? t("us.tg.newCode") : t("us.tg.makeCode")}
              </Button>
            </div>
            {(code || status.pendingCodeExpiresAt) && <p className="text-xs opacity-70">{t("us.tg.oldCodeNote")}</p>}
          </div>
        )}
      </Modal>
      {confirmModal}
    </>
  );
};
