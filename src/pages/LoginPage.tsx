// src/pages/LoginPage.tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Lock, Mail } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useTranslation } from "@/hooks/useTranslation";
import { AuthField, AuthShell, RoleSwitch, type AuthRole } from "./auth/AuthShell";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    const cleanEmail = email.trim().toLowerCase();
    if (!EMAIL_RE.test(cleanEmail)) return setLoginError(t("auth.invalidEmail"));
    if (!password) return setLoginError(t("auth.enterPassword"));
    try {
      await login(cleanEmail, password);
      const loggedInUser = useAuthStore.getState().user;
      if (loggedInUser && loggedInUser.role !== role) {
        logout();
        setLoginError(t("auth.roleMismatch"));
        return;
      }
      navigate("/");
    } catch {
      setLoginError(t("auth.invalidCredentials"));
    }
  };

  return (
    <AuthShell subtitle={t("auth.welcomeBack")}>
      <RoleSwitch role={role} onChange={setRole} />
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

        <p className="au-alt">
          {t("auth.noAccount")} <Link to="/register">{t("auth.register")}</Link>
        </p>
      </form>
    </AuthShell>
  );
};
