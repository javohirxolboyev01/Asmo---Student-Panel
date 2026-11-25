// src/pages/LoginPage.tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useTranslation } from "@/hooks/useTranslation";
import {
  AuthField,
  AuthShell,
  RoleSwitch,
  type AuthRole,
} from "./auth/AuthShell";
import { useAuthOptions } from "@/hooks/useAuthOptions";
import { ApiError } from "@/services/apiClient";

const EMAIL_RE = /^\S+@\S+\.\S+$/;

export const LoginPage = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const logout = useAuthStore((state) => state.logout);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const { t } = useTranslation();
  const [role, setRole] = useState<AuthRole>("student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState<string | null>(null);
  const { data: options } = useAuthOptions();
  const telegramOnly = !!options?.studentTelegramOnly;
  const botLink = options?.telegramBot
    ? `https://t.me/${options.telegramBot}`
    : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const cleanEmail = email.trim().toLowerCase();
    if (!EMAIL_RE.test(cleanEmail))
      return setLoginError(t("auth.invalidEmail"));
    if (!password) return setLoginError(t("auth.enterPassword"));
    try {
      await login(cleanEmail, password);
      const loggedInUser = useAuthStore.getState().user;
      // An admin signs in through the teacher side. With Telegram-only
      // students the page is staff-only, so there is no role to pick.
      const expected = telegramOnly ? "teacher" : role;
      const actual =
        loggedInUser?.role === "admin" ? "teacher" : loggedInUser?.role;
      if (loggedInUser && actual !== expected) {
        logout();
        setLoginError(t("auth.roleMismatch"));
        return;
      }
      navigate("/");
    } catch (err) {
      setLoginError(
        err instanceof ApiError && err.code === "TELEGRAM_ONLY"
          ? t("tg.studentUseBot")
          : t("auth.invalidCredentials"),
      );
    }
  };

  return (
    <AuthShell subtitle={t("auth.welcomeBack")}>
      {/* Students open the app from the Telegram bot, so then the page is staff-only. */}
      {!telegramOnly && <RoleSwitch role={role} onChange={setRole} />}
      <form onSubmit={handleSubmit} noValidate>
        <AuthField
          label={t("auth.email")}
          icon={<Mail className="ic" />}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t("auth.emailPlaceholder")}
          autoComplete="email"
        />
        <AuthField
          label={t("auth.password")}
          icon={<Lock className="ic" />}
          type="password"
          revealable
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t("auth.passwordPlaceholder")}
          autoComplete="current-password"
        />

        <button className="au-cta" type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <span className="au-spin" /> {t("auth.loggingIn")}
            </>
          ) : (
            <>
              {t("auth.login")} <ArrowRight className="ic" />
            </>
          )}
        </button>
        <p className="au-msg" role="alert">
          {loginError || error}
        </p>

        {telegramOnly ? (
          <p className="au-alt">
            {t("tg.areYouStudent")}{" "}
            {botLink ? (
              <a href={botLink} target="_blank" rel="noreferrer">
                {t("tg.openFromBot")} →
              </a>
            ) : (
              t("tg.openFromBot")
            )}
          </p>
        ) : (
          <p className="au-alt">
            {t("auth.noAccount")}{" "}
            <Link to="/register">{t("auth.register")}</Link>
          </p>
        )}
      </form>
    </AuthShell>
  );
};
