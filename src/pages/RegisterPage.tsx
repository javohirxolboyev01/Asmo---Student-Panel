// src/pages/RegisterPage.tsx
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useTranslation } from "@/hooks/useTranslation";
import {
  GraduationCap,
  Mail,
  Lock,
  User,
  Users,
  Phone,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
  Info,
} from "lucide-react";
import { Input, IconButton } from "@/components/ui";

const AUTH_INPUT_CLASS =
  "rounded-2xl border-2 bg-gray-50/50 focus:border-warning focus:ring-4 focus:ring-warning/10";

type AuthRole = "student" | "teacher";

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
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isTeacherRole = role === "teacher";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (isTeacherRole) return;

    if (password.length < 6) {
      setFormError(t("auth.passwordTooShort"));
      return;
    }
    if (password !== confirmPassword) {
      setFormError(t("auth.passwordMismatch"));
      return;
    }

    try {
      await register({
        email,
        password,
        firstName,
        lastName,
        phone: phone || undefined,
      });
      navigate("/");
    } catch {
      // error surfaced via authStore's `error` state
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F7FA] via-white to-[#EBF0FF] dark:from-background-dark dark:via-background-dark dark:to-[#111522] flex items-center justify-center px-4 py-10 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-warning/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-warning/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-white/80 dark:bg-card-dark/90 backdrop-blur-xl rounded-3xl shadow-2xl shadow-warning/10 border border-white/50 dark:border-white/10 p-6 md:p-8">
          {/* Logo with Text */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="relative">
                <div className="w-14 h-14 bg-gradient-to-br from-warning to-[#D97706] rounded-2xl flex items-center justify-center shadow-lg shadow-warning/30 animate-float">
                  <GraduationCap className="w-8 h-8 text-white" />
                  <Sparkles className="w-3 h-3 text-white absolute -top-1 -right-1 animate-pulse" />
                </div>
              </div>
              <div className="text-left">
                <h1 className="text-3xl font-bold tracking-tight">
                  <span className="text-gray-800 dark:text-gray-100">Asmo</span>
                  <span className="text-warning"> Learning</span>
                </h1>
                <p className="text-xs text-gray-400 font-medium tracking-wider uppercase">
                  {t("auth.educationCenter")}
                </p>
              </div>
            </div>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
              {t("auth.createAccount")}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("student")}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-2xl border-2 py-3 text-sm font-semibold transition-all",
                  role === "student"
                    ? "border-warning bg-warning/10 text-warning"
                    : "border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400",
                )}
              >
                <User className="w-4 h-4" />
                {t("auth.roleStudent")}
              </button>
              <button
                type="button"
                onClick={() => setRole("teacher")}
                className={cn(
                  "flex items-center justify-center gap-2 rounded-2xl border-2 py-3 text-sm font-semibold transition-all",
                  role === "teacher"
                    ? "border-warning bg-warning/10 text-warning"
                    : "border-gray-200 dark:border-white/10 text-gray-500 dark:text-gray-400",
                )}
              >
                <Users className="w-4 h-4" />
                {t("auth.roleTeacher")}
              </button>
            </div>

            {isTeacherRole && (
              <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-white/5 p-3 rounded-2xl border border-gray-200 dark:border-white/10">
                <Info className="w-4 h-4 shrink-0 mt-0.5 text-warning" />
                <span>{t("auth.teacherRegisterInfo")}</span>
              </div>
            )}

            <div className={cn("grid grid-cols-2 gap-3", isTeacherRole && "opacity-50 pointer-events-none")}>
              <Input
                type="text"
                label={t("auth.firstName")}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                leftIcon={<User className="w-4 h-4" />}
                uiSize="lg"
                className={AUTH_INPUT_CLASS}
                placeholder={t("auth.firstNamePlaceholder")}
                required
              />
              <Input
                type="text"
                label={t("auth.lastName")}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                uiSize="lg"
                className={AUTH_INPUT_CLASS}
                placeholder={t("auth.lastNamePlaceholder")}
                required
              />
            </div>

            <div className={cn("space-y-4", isTeacherRole && "opacity-50 pointer-events-none")}>
              <Input
                type="email"
                label={t("auth.email")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail className="w-4 h-4" />}
                uiSize="lg"
                className={AUTH_INPUT_CLASS}
                placeholder={t("auth.emailPlaceholder")}
                required
              />

              <Input
                type="tel"
                label={
                  <>
                    {t("auth.phone")} <span className="text-gray-400 font-normal">({t("common.optional")})</span>
                  </>
                }
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                leftIcon={<Phone className="w-4 h-4" />}
                uiSize="lg"
                className={AUTH_INPUT_CLASS}
                placeholder="+998 90 123 45 67"
              />

              <Input
                type={showPassword ? "text" : "password"}
                label={t("auth.password")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                uiSize="lg"
                className={AUTH_INPUT_CLASS}
                placeholder={t("auth.minPassword")}
                required
                rightSlot={
                  <IconButton
                    type="button"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </IconButton>
                }
              />

              <Input
                type={showPassword ? "text" : "password"}
                label={t("auth.confirmPassword")}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4" />}
                uiSize="lg"
                className={AUTH_INPUT_CLASS}
                placeholder={t("auth.confirmPasswordPlaceholder")}
                required
              />
            </div>

            {(formError || error) && (
              <div className="text-sm text-[#C62828] text-center bg-[#FFEBEE] dark:bg-[#C62828]/15 p-3 rounded-2xl border border-red-200 dark:border-red-900/40 animate-shake">
                {formError || error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || isTeacherRole}
              className="w-full bg-gradient-to-r from-warning to-[#D97706] text-white py-3.5 rounded-2xl font-semibold text-base transition-all duration-300 hover:shadow-xl hover:shadow-warning/30 hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t("auth.registering")}
                </>
              ) : (
                <>
                  {t("auth.register")}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Login link */}
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            {t("auth.haveAccount")}{" "}
            <Link
              to="/login"
              className="text-warning font-semibold hover:underline"
            >
              {t("auth.login")}
            </Link>
          </p>

          {/* Footer */}
          <p className="text-center text-xs text-gray-400 mt-4">
            {t("auth.footer")}
          </p>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
          20%, 40%, 60%, 80% { transform: translateX(4px); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
};
