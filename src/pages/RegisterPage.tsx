// src/pages/RegisterPage.tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Info, Lock, Mail, Phone, User } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useTranslation } from "@/hooks/useTranslation";
import { AuthField, AuthShell, RoleSwitch, type AuthRole } from "./auth/AuthShell";

const EMAIL_RE = /^\S+@\S+\.\S+$/;

export const RegisterPage = () => {
  const navigate = useNavigate();
  const register = useAuthStore((state) => state.register);
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const { t } = useTranslation();
  const [role, setRole] = useState<AuthRole>("student");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const isTeacherRole = role === "teacher";

  // Faqat raqam, bo'shliq, tire va boshidagi "+" belgisiga ruxsat beriladi —
  // harf yoki boshqa belgilar kiritilmaydi.
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(e.target.value.replace(/[^\d+\s-]/g, ""));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (isTeacherRole) return;

    if (!firstName.trim() || !lastName.trim()) return setFormError(t("auth.enterName"));
    if (!EMAIL_RE.test(email.trim())) return setFormError(t("auth.invalidEmail"));
    if (password.length < 6) return setFormError(t("auth.passwordTooShort"));
    if (password !== confirmPassword) return setFormError(t("auth.passwordMismatch"));

    try {
      await register({
        email: email.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone || undefined,
      });
      navigate("/");
    } catch {
      // error surfaced via authStore's `error` state
    }
  };

  return (
    <AuthShell subtitle={t("auth.createAccount")}>
      <RoleSwitch role={role} onChange={setRole} />
      {isTeacherRole && (
        <div className="au-note">
          <Info className="ic" />
          <span>{t("auth.teacherRegisterInfo")}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className={isTeacherRole ? "au-dim" : undefined}>
          <div className="au-two">
            <AuthField
              label={t("auth.firstName")}
              icon={<User className="ic" />}
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder={t("auth.firstNamePlaceholder")}
              autoComplete="given-name"
            />
            <AuthField
              label={t("auth.lastName")}
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              placeholder={t("auth.lastNamePlaceholder")}
              autoComplete="family-name"
            />
          </div>
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
            label={
              <>
                {t("auth.phone")} <span className="au-opt">({t("common.optional")})</span>
              </>
            }
            icon={<Phone className="ic" />}
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={handlePhoneChange}
            placeholder="+998 90 123 45 67"
            autoComplete="tel"
          />
          <AuthField
            label={t("auth.password")}
            icon={<Lock className="ic" />}
            type="password"
            revealable
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("auth.minPassword")}
            autoComplete="new-password"
          />
          <AuthField
            label={t("auth.confirmPassword")}
            icon={<Lock className="ic" />}
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder={t("auth.confirmPasswordPlaceholder")}
            autoComplete="new-password"
          />
        </div>

        <button className="au-cta" type="submit" disabled={isLoading || isTeacherRole}>
          {isLoading ? (
            <>
              <span className="au-spin" /> {t("auth.registering")}
            </>
          ) : (
            <>
              {t("auth.register")} <ArrowRight className="ic" />
            </>
          )}
        </button>
        <p className="au-msg" role="alert">
          {formError || error}
        </p>

        <p className="au-alt">
          {t("auth.haveAccount")} <Link to="/login">{t("auth.login")}</Link>
        </p>
      </form>
    </AuthShell>
  );
};
