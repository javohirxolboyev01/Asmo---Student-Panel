// src/pages/SettingsPage.tsx
import { useState } from "react";
import {
  Mail,
  Lock,
  Check,
  Globe,
  Sun,
  Moon,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useTranslation } from "@/hooks/useTranslation";
import { LANGUAGES, Language } from "@/i18n/translations";
import { cn } from "@/lib/utils";
import { Button, Input } from "@/components/ui";
import { toast, getErrorMessage } from "@/lib/toast";

export const SettingsPage = () => {
  const { user, updateEmail, updatePassword, isLoading } = useAuthStore();
  const { theme, setTheme } = useSettingsStore();
  const { t, language, setLanguage } = useTranslation();

  const [email, setEmail] = useState(user?.email ?? "");
  const [emailMessage, setEmailMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [passwordMessage, setPasswordMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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
    <div className="space-y-4 md:space-y-6 lg:max-w-2xl lg:mx-auto">
      <div>
        <h1 className="text-lg md:text-xl font-bold text-gray-800 dark:text-gray-100">
          {t("settings.title")}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base">
          {t("settings.subtitle")}
        </p>
      </div>

      {/* ── Account: Email ── */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-warning" />
            <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
              {t("settings.accountSection")}
            </span>
          </div>
        </div>
        <form onSubmit={handleEmailSubmit} className="p-5 space-y-3">
          <Input
            type="email"
            label={t("auth.email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("auth.emailPlaceholder")}
            required
          />

          {emailMessage && (
            <div
              className={cn(
                "text-sm p-3 rounded-2xl flex items-center gap-2",
                emailMessage.type === "success"
                  ? "text-[#2E7D32] bg-[#E8F5E9] dark:bg-[#2E7D32]/15"
                  : "text-[#C62828] bg-[#FFEBEE] dark:bg-[#C62828]/15",
              )}
            >
              {emailMessage.type === "success" && <Check className="w-4 h-4 flex-shrink-0" />}
              {emailMessage.text}
            </div>
          )}

          <Button type="submit" isLoading={isLoading} disabled={email.trim() === user?.email}>
            {t("settings.changeEmail")}
          </Button>
        </form>
      </div>

      {/* ── Password ── */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-warning" />
            <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
              {t("settings.passwordSection")}
            </span>
          </div>
        </div>
        <form onSubmit={handlePasswordSubmit} className="p-5 space-y-3">
          <Input
            type="password"
            label={t("settings.currentPassword")}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
          />
          <Input
            type="password"
            label={t("settings.newPassword")}
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder={t("auth.minPassword")}
            required
          />
          <Input
            type="password"
            label={t("settings.confirmNewPassword")}
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            required
          />

          {passwordMessage && (
            <div
              className={cn(
                "text-sm p-3 rounded-2xl flex items-center gap-2",
                passwordMessage.type === "success"
                  ? "text-[#2E7D32] bg-[#E8F5E9] dark:bg-[#2E7D32]/15"
                  : "text-[#C62828] bg-[#FFEBEE] dark:bg-[#C62828]/15",
              )}
            >
              {passwordMessage.type === "success" && <Check className="w-4 h-4 flex-shrink-0" />}
              {passwordMessage.text}
            </div>
          )}

          <Button type="submit" isLoading={isLoading}>
            {t("settings.changePasswordButton")}
          </Button>
        </form>
      </div>

      {/* ── Language ── */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-warning" />
            <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
              {t("settings.languageSection")}
            </span>
          </div>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-2">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              onClick={() => setLanguage(lang.code as Language)}
              className={cn(
                "flex items-center gap-1.5 justify-center px-3 py-2 text-xs rounded-xl border-2 font-medium transition-all sm:gap-2 sm:px-4 sm:py-3 sm:text-sm sm:rounded-2xl",
                language === lang.code
                  ? "border-warning bg-warning/10 text-warning"
                  : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-warning/50",
              )}
            >
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Appearance ── */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            {theme === "dark" ? (
              <Moon className="w-4 h-4 text-warning" />
            ) : (
              <Sun className="w-4 h-4 text-warning" />
            )}
            <span className="font-semibold text-gray-800 dark:text-gray-100 text-sm">
              {t("settings.themeSection")}
            </span>
          </div>
        </div>
        <div className="p-5 grid grid-cols-2 gap-2">
          <button
            onClick={() => setTheme("light")}
            className={cn(
              "flex items-center gap-2 justify-center px-4 py-3 rounded-2xl border-2 text-sm font-medium transition-all",
              theme === "light"
                ? "border-warning bg-warning/10 text-warning"
                : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-warning/50",
            )}
          >
            <Sun className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {t("settings.themeLight")}
          </button>
          <button
            onClick={() => setTheme("dark")}
            className={cn(
              "flex items-center gap-2 justify-center px-4 py-3 rounded-2xl border-2 text-sm font-medium transition-all",
              theme === "dark"
                ? "border-warning bg-warning/10 text-warning"
                : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-warning/50",
            )}
          >
            <Moon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            {t("settings.themeDark")}
          </button>
        </div>
      </div>
    </div>
  );
};
