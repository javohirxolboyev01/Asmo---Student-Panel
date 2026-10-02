// src/student/pages/SettingsPage.tsx
// "Kosmik maktab" settings: email, password, language, theme — same
// authStore / settingsStore calls as src/pages/SettingsPage.tsx.
import "../theme/profile.css";
import { useState, type FormEvent } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useTranslation } from "@/hooks/useTranslation";
import { LANGUAGES, type Language } from "@/i18n/translations";
import { ROUTES } from "@/constans/route";
import { getErrorMessage } from "@/lib/toast";
import { PageHeader, Segmented, Spinner, Switch } from "../components/ui";

// Mirrors the backend's /settings/* schemas.
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN = 6;
const PASSWORD_MAX = 128;

type Msg = { ok: boolean; text: string } | null;

const Message = ({ msg }: { msg: Msg }) => (
  <p className={msg && !msg.ok ? "sp-msg sp-err" : "sp-msg"} role={msg ? "status" : undefined}>
    {msg?.text}
  </p>
);

export const SettingsPage = () => {
  const user = useAuthStore((s) => s.user);
  const updateEmail = useAuthStore((s) => s.updateEmail);
  const updatePassword = useAuthStore((s) => s.updatePassword);
  const theme = useSettingsStore((s) => s.theme);
  const setTheme = useSettingsStore((s) => s.setTheme);
  const { t, language, setLanguage } = useTranslation();

  const [email, setEmail] = useState(user?.email ?? "");
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailMsg, setEmailMsg] = useState<Msg>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState<Msg>(null);

  const trimmedEmail = email.trim();
  const emailValid = EMAIL_RE.test(trimmedEmail);
  const emailChanged = trimmedEmail !== (user?.email ?? "");

  const handleEmail = async (e: FormEvent) => {
    e.preventDefault();
    if (emailSaving || !emailChanged) return;
    if (!emailValid) {
      setEmailMsg({ ok: false, text: t("space.profile.emailInvalid") });
      return;
    }
    setEmailMsg(null);
    setEmailSaving(true);
    try {
      await updateEmail(trimmedEmail);
      setEmailMsg({ ok: true, text: t("space.profile.emailSaved") });
    } catch (err) {
      setEmailMsg({ ok: false, text: getErrorMessage(err, t("common.error")) });
    } finally {
      setEmailSaving(false);
    }
  };

  const handlePassword = async (e: FormEvent) => {
    e.preventDefault();
    if (passwordSaving) return;
    const error = !currentPassword
      ? t("space.profile.currentRequired")
      : newPassword.length < PASSWORD_MIN
        ? t("space.profile.newTooShort")
        : newPassword.length > PASSWORD_MAX
          ? t("space.profile.newTooLong")
          : newPassword !== confirmPassword
            ? t("space.profile.mismatch")
            : null;
    if (error) {
      setPasswordMsg({ ok: false, text: error });
      return;
    }
    setPasswordMsg(null);
    setPasswordSaving(true);
    try {
      await updatePassword(currentPassword, newPassword);
      setPasswordMsg({ ok: true, text: t("space.profile.passwordSaved") });
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setPasswordMsg({ ok: false, text: getErrorMessage(err, t("common.error")) });
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="sp-page">
      <PageHeader
        title={t("settings.title")}
        subtitle={t("settings.subtitle")}
        back={{ to: ROUTES.PROFILE, label: t("profile.title") }}
      />

      <div className="sp-sg">
        <form className="sp-panel" onSubmit={handleEmail} noValidate>
          <h2>✉️ {t("settings.accountSection")}</h2>
          <label className="sp-fl">
            {t("auth.email")}
            <input
              className="sp-in"
              type="email"
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setEmailMsg(null);
              }}
              placeholder={t("auth.emailPlaceholder")}
            />
          </label>
          <button type="submit" className="sp-cta" disabled={!emailValid || !emailChanged || emailSaving}>
            {emailSaving && <Spinner />} {t("settings.changeEmail")}
          </button>
          <Message msg={emailMsg} />
        </form>

        <form className="sp-panel" onSubmit={handlePassword} noValidate>
          <h2>🔒 {t("settings.passwordSection")}</h2>
          <label className="sp-fl">
            {t("settings.currentPassword")}
            <input
              className="sp-in"
              type="password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
            />
          </label>
          <label className="sp-fl">
            {t("settings.newPassword")}
            <input
              className="sp-in"
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder={t("space.profile.minPassword")}
            />
          </label>
          <label className="sp-fl">
            {t("settings.confirmNewPassword")}
            <input
              className="sp-in"
              type="password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </label>
          <button type="submit" className="sp-cta" disabled={passwordSaving}>
            {passwordSaving && <Spinner />} {t("settings.changePasswordButton")}
          </button>
          <Message msg={passwordMsg} />
        </form>

        <div className="sp-panel">
          <h2>🌐 {t("space.profile.language")}</h2>
          <div className="sp-profile-lang">
            <Segmented<Language>
              value={language}
              options={LANGUAGES.map((l) => ({ value: l.code, label: l.label }))}
              onChange={setLanguage}
            />
          </div>
        </div>

        <div className="sp-panel">
          <h2>🌗 {t("space.profile.theme")}</h2>
          <div className="sp-tg">
            <span className="sp-profile-tgtext">
              {theme === "dark" ? "🌙" : "☀️"} {t("space.profile.darkMode")}
              <small>{t("space.profile.darkModeHint")}</small>
            </span>
            <Switch
              checked={theme === "dark"}
              onChange={(on) => setTheme(on ? "dark" : "light")}
              label={t("space.profile.darkMode")}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
