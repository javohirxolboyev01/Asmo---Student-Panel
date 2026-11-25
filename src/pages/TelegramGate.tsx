// src/pages/TelegramGate.tsx — shown inside the Telegram Mini App when the
// automatic sign-in didn't work (account not linked yet, offline, signed out).
import { Info, RefreshCw, Send } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useTranslation } from "@/hooks/useTranslation";
import { closeTelegram } from "@/lib/telegram";
import { AuthShell } from "./auth/AuthShell";

export const TelegramGate = () => {
  const { t } = useTranslation();
  const telegramError = useAuthStore((s) => s.telegramError);
  const isLoading = useAuthStore((s) => s.isLoading);
  const checkAuth = useAuthStore((s) => s.checkAuth);
  const notLinked = telegramError === "TELEGRAM_NOT_LINKED";

  return (
    <AuthShell subtitle={t("tg.gateTitle")}>
      <div className="au-note">
        <Info className="ic" />
        <span>{notLinked ? t("tg.notLinked") : telegramError ? t("tg.failed") : t("tg.signedOut")}</span>
      </div>
      {notLinked ? (
        <button className="au-cta" type="button" onClick={closeTelegram}>
          <Send className="ic" /> {t("tg.backToBot")}
        </button>
      ) : (
        <button className="au-cta" type="button" onClick={() => void checkAuth()} disabled={isLoading}>
          {isLoading ? (
            <>
              <span className="au-spin" /> {t("tg.signingIn")}
            </>
          ) : (
            <>
              <RefreshCw className="ic" /> {telegramError ? t("tg.retry") : t("tg.signIn")}
            </>
          )}
        </button>
      )}
    </AuthShell>
  );
};
