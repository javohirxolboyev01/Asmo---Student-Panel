// src/pages/ProfilePage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { User, Phone, Mail, Settings, LogOut, ChevronRight, Pencil } from "lucide-react";
import { getAvatarUrl } from "@/lib/utils";
import { useTranslation } from "@/hooks/useTranslation";
import { useConfirm } from "@/hooks/useConfirm";
import { ROUTES } from "@/constans/route";
import { AvatarPickerModal } from "@/components/common/AvatarPickerModal";
import { toast, getErrorMessage } from "@/lib/toast";

export const ProfilePage = () => {
  const { user, logout, updateProfile, isLoading } = useAuthStore();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { confirm, confirmModal } = useConfirm();
  const [isAvatarPickerOpen, setIsAvatarPickerOpen] = useState(false);
  const isTeacher = user?.role === "teacher" || user?.role === "admin";

  const handleLogout = async () => {
    const confirmed = await confirm(t("profile.logoutConfirm"), {
      title: t("profile.logoutConfirmTitle"),
      confirmLabel: t("profile.logout"),
    });
    if (confirmed) logout();
  };

  const handleAvatarSave = async (dataUri: string) => {
    try {
      await updateProfile({ avatar: dataUri });
      toast.success(t("profile.avatarSaved"));
      setIsAvatarPickerOpen(false);
    } catch (err) {
      toast.error(getErrorMessage(err, t("common.error")));
    }
  };

  if (!user) {
    return (
      <div className="card p-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">{t("profile.notFound")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6 lg:max-w-2xl lg:mx-auto">
      <div>
        <h1 className="text-lg md:text-xl font-bold text-gray-800 dark:text-gray-100">
          {t("profile.title")}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base">
          {t("profile.subtitle")}
        </p>
      </div>

      {/* Profile header — avatar, name, role */}
      <div className="card">
        <div className="p-6 md:p-8 flex flex-col items-center text-center">
          <button
            type="button"
            onClick={() => setIsAvatarPickerOpen(true)}
            className="relative w-24 h-24 rounded-full group focus:outline-none focus-visible:ring-2 focus-visible:ring-warning focus-visible:ring-offset-2"
            aria-label={t("profile.chooseAvatar")}
          >
            <img
              src={getAvatarUrl(user.avatar, `${user.firstName} ${user.lastName}`)}
              alt={user.firstName}
              className="w-24 h-24 rounded-full border-4 border-warning/20"
            />
            <span className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-colors">
              <Pencil className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
            </span>
            <span className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-warning text-white flex items-center justify-center border-2 border-white dark:border-card-dark">
              <Pencil className="w-3.5 h-3.5" />
            </span>
          </button>
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mt-3">
            {user.firstName} {user.lastName}
          </h2>
          <p className="text-warning text-sm font-medium mt-0.5">
            {isTeacher ? t("profile.teacher") : t("profile.student")}
          </p>
        </div>
      </div>

      {/* Info — Telegram-style grouped rows: caption above, value below */}
      {(user.phone || user.email) && (
        <div className="card divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
          {user.phone && (
            <div className="p-4 flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-full bg-[#34C759] flex items-center justify-center flex-shrink-0">
                <Phone className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0 text-left">
                <p className="text-xs text-gray-500 dark:text-gray-400">{t("profile.phoneLabel")}</p>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{user.phone}</p>
              </div>
            </div>
          )}
          {user.email && (
            <div className="p-4 flex items-center gap-3.5">
              <div className="w-9 h-9 rounded-full bg-[#2196F3] flex items-center justify-center flex-shrink-0">
                <Mail className="w-4 h-4 text-white" />
              </div>
              <div className="min-w-0 text-left">
                <p className="text-xs text-gray-500 dark:text-gray-400">{t("profile.emailLabel")}</p>
                <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">{user.email}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions — one grouped list, Telegram/iOS Settings style */}
      <div className="card divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
        <button
          onClick={() => navigate(ROUTES.PROFILE_EDIT)}
          className="w-full text-left p-4 flex items-center justify-between gap-3 hover:bg-gray-50 dark:hover:bg-white/5 active:bg-gray-100 dark:active:bg-white/10 transition-colors"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#0A84FF] flex items-center justify-center flex-shrink-0">
              <User className="w-4 h-4 text-white" />
            </div>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
              {t("profile.editInfo")}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
        </button>

        <button
          onClick={() => navigate(ROUTES.SETTINGS)}
          className="w-full text-left p-4 flex items-center justify-between gap-3 hover:bg-gray-50 dark:hover:bg-white/5 active:bg-gray-100 dark:active:bg-white/10 transition-colors"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#8E8E93] flex items-center justify-center flex-shrink-0">
              <Settings className="w-4 h-4 text-white" />
            </div>
            <p className="text-sm font-medium text-gray-800 dark:text-gray-100 truncate">
              {t("profile.settings")}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
        </button>

        <button
          onClick={handleLogout}
          className="w-full text-left p-4 flex items-center justify-between gap-3 hover:bg-red-50 dark:hover:bg-red-500/10 active:bg-red-100 dark:active:bg-red-500/15 transition-colors"
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-[#FF3B30] flex items-center justify-center flex-shrink-0">
              <LogOut className="w-4 h-4 text-white" />
            </div>
            <p className="text-sm font-medium text-[#FF3B30]">{t("profile.logout")}</p>
          </div>
        </button>
      </div>
      {confirmModal}
      <AvatarPickerModal
        isOpen={isAvatarPickerOpen}
        currentAvatar={user.avatar}
        isSaving={isLoading}
        onClose={() => setIsAvatarPickerOpen(false)}
        onSave={handleAvatarSave}
      />
    </div>
  );
};
