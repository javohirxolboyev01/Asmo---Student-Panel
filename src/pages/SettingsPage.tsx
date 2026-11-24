// src/pages/SettingsPage.tsx
// Mock `settings` view: stacked cards — appearance (Kunduz / Tun), language,
// and the account forms (change email, change password).
import { useState } from "react";
import { Check, Moon, Sun } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore, type Theme } from "@/stores/settingsStore";
import { useTranslation } from "@/hooks/useTranslation";
import { LANGUAGES, type Language } from "@/i18n/translations";
import { cn } from "@/lib/utils";
import { Button, Input } from "@/components/ui";
import { toast, getErrorMessage } from "@/lib/toast";
import { PageHeader, Seg } from "@/teacher/components/ui";

type Message = { type: "success" | "error"; text: string } | null;

const Notice = ({ message }: { message: Message }) =>
  message ? (
    <div
      className={cn(
        "flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-bold",
        message.type === "success" ? "bg-u-okt text-u-ok" : "bg-u-ert text-u-er",
      )}
    >
      {message.type === "success" && <Check className="u-i s" strokeWidth={2} aria-hidden="true" />}
      {message.text}
    </div>
  ) : null;

export const SettingsPage = () => {
  const user = useAuthStore((state) => state.user);
  const updateEmail = useAuthStore((state) => state.updateEmail);
  const updatePassword = useAuthStore((state) => state.updatePassword);
  const isLoading = useAuthStore((state) => state.isLoading);
  const theme = useSettingsStore((state) => state.theme);
  const setTheme = useSettingsStore((state) => state.setTheme);
  const { t, language, setLanguage } = useTranslation();

  const [email, setEmail] = useState(user?.email ?? "");
  const [emailMessage, setEmailMessage] = useState<Message>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState<Message>(null);

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailMessage(null);
    try {
      await updateEmail(email.trim());
      setEmailMessage({ type: "success", text: t("settings.emailUpdated") });
      toast.success(t("settings.emailUpdated"));
    } catch (err) {
      const message = getErrorMessage(err, t("common.error"));
      setEmailMessage({ type: "error", text: message });
      toast.error(message);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword.length < 6) {
      setPasswordMessage({ type: "error", text: t("auth.passwordTooShort") });
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setPasswordMessage({ type: "error", text: t("auth.passwordMismatch") });
      return;
    }

    try {
      await updatePassword(currentPassword, newPassword);
      setPasswordMessage({ type: "success", text: t("settings.passwordUpdated") });
      toast.success(t("settings.passwordUpdated"));
      setCurrentPassword("");
      setNewPassword("");
      setConfirmNewPassword("");
    } catch (err) {
      const message = getErrorMessage(err, t("common.error"));
      setPasswordMessage({ type: "error", text: message });
      toast.error(message);
    }
  };

  return (
    <>
      <PageHeader title={t("settings.title")} subtitle={t("settings.subtitle")} back={{ to: "/more" }} />

      <div className="u-stack" style={{ maxWidth: 680 }}>
        {/* Appearance */}
        <div className="u-card">
          <h3 className="mb-3">{t("settings.themeSection")}</h3>
          <Seg<Theme>
            value={theme}
            label={t("settings.themeSection")}
            onChange={setTheme}
            options={[
              {
                value: "light",
                label: (
                  <span className="inline-flex items-center gap-1.5">
                    <Sun className="u-i s" strokeWidth={2} aria-hidden="true" />
                    {t("us.set.light")}
                  </span>
                ),
              },
              {
                value: "dark",
                label: (
                  <span className="inline-flex items-center gap-1.5">
                    <Moon className="u-i s" strokeWidth={2} aria-hidden="true" />
                    {t("us.set.dark")}
                  </span>
                ),
              },
            ]}
          />
        </div>

        {/* Language */}
        <div className="u-card">
          <h3 className="mb-3">{t("settings.languageSection")}</h3>
          <Seg<Language>
            value={language}
            label={t("settings.languageSection")}
            onChange={setLanguage}
            options={LANGUAGES.map((lang) => ({ value: lang.code, label: lang.label }))}
          />
        </div>

        {/* Email */}
        <form onSubmit={handleEmailSubmit} className="u-card u-stack">
          <h3>{t("settings.accountSection")}</h3>
          <Input
            type="email"
            label={t("auth.email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("auth.emailPlaceholder")}
            required
          />
          <Notice message={emailMessage} />
          <Button type="submit" isLoading={isLoading} disabled={email.trim() === user?.email} className="justify-self-start">
            {t("settings.changeEmail")}
          </Button>
        </form>

        {/* Password */}
        <form onSubmit={handlePasswordSubmit} className="u-card u-stack">
          <h3>{t("settings.passwordSection")}</h3>
          <Input
            type="password"
            label={t("settings.currentPassword")}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
          <Input
            type="password"
            label={t("settings.newPassword")}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder={t("auth.minPassword")}
            autoComplete="new-password"
            required
          />
          <Input
            type="password"
            label={t("settings.confirmNewPassword")}
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            autoComplete="new-password"
            required
          />
          <Notice message={passwordMessage} />
          <Button type="submit" isLoading={isLoading} className="justify-self-start">
            {t("settings.changePasswordButton")}
          </Button>
        </form>
      </div>
    </>
  );
};
