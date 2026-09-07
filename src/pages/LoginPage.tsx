// src/pages/LoginPage.tsx
import { cn } from "@/lib/utils";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useTranslation } from "@/hooks/useTranslation";
import {
  GraduationCap,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Sparkles,
} from "lucide-react";
import { Input, IconButton } from "@/components/ui";

export const LoginPage = () => {
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuthStore();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    try {
      // The account's role comes from the server; the dashboard and route
      // guards already branch on it, so login doesn't need to guess it too.
      await login(email.trim().toLowerCase(), password);
      navigate("/");
    } catch (err) {
      setLoginError(t("auth.invalidCredentials"));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5F7FA] via-white to-[#EBF0FF] dark:from-background-dark dark:via-background-dark dark:to-[#111522] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-warning/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-warning/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-warning/[0.02] rounded-full blur-2xl" />

      {/* Floating particles */}
      <div className="absolute top-10 left-10 w-2 h-2 bg-warning/30 rounded-full animate-pulse" />
      <div
        className="absolute top-20 right-20 w-3 h-3 bg-warning/30 rounded-full animate-pulse"
        style={{ animationDelay: "1s" }}
      />
      <div
        className="absolute bottom-20 left-20 w-2 h-2 bg-warning/30 rounded-full animate-pulse"
        style={{ animationDelay: "2s" }}
      />
      <div
        className="absolute bottom-10 right-10 w-3 h-3 bg-warning/30 rounded-full animate-pulse"
        style={{ animationDelay: "0.5s" }}
      />

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
              {t("auth.welcomeBack")}
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className={cn("transition-all duration-300", isFocused && "scale-[1.01]")}>
              <Input
                type="email"
                label={t("auth.email")}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                leftIcon={<Mail className="w-4 h-4" />}
                uiSize="lg"
                className="rounded-2xl border-2 bg-gray-50/50 focus:border-warning focus:ring-4 focus:ring-warning/10"
                placeholder={t("auth.emailPlaceholder")}
                required
              />
            </div>

            <Input
              type={showPassword ? "text" : "password"}
              label={t("auth.password")}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4" />}
              uiSize="lg"
              className="rounded-2xl border-2 bg-gray-50/50 focus:border-warning focus:ring-4 focus:ring-warning/10"
              placeholder={t("auth.passwordPlaceholder")}
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

            {(loginError || error) && (
              <div className="text-sm text-[#C62828] text-center bg-[#FFEBEE] dark:bg-[#C62828]/15 p-3 rounded-2xl border border-red-200 dark:border-red-900/40 animate-shake">
                {loginError || error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-warning to-[#D97706] text-white py-3.5 rounded-2xl font-semibold text-base transition-all duration-300 hover:shadow-xl hover:shadow-warning/30 hover:scale-[1.02] active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
            >
              {isLoading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {t("auth.loggingIn")}
                </>
              ) : (
                <>
                  {t("auth.login")}
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>

          {/* Register link */}
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-6">
            {t("auth.noAccount")}{" "}
            <Link
              to="/register"
              className="text-warning font-semibold hover:underline"
            >
              {t("auth.register")}
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
        .animate-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  );
};
