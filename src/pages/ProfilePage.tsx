// src/pages/ProfilePage.tsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { User, Phone, Settings, LogOut, ChevronRight, Pencil } from "lucide-react";
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

      {/* Profile Card */}
      <div className="card">
        <div className="p-5 md:p-6">
          <div className="flex flex-col items-center text-center">
            <button
              type="button"
              onClick={() => setIsAvatarPickerOpen(true)}
              className="relative w-24 h-24 rounded-full group focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2"
              aria-label={t("profile.chooseAvatar")}
            >
              <img
                src={getAvatarUrl(user.avatar, `${user.firstName} ${user.lastName}`)}
                alt={user.firstName}
                className="w-24 h-24 rounded-full border-4 border-primary-500/20"
              />
              <span className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-colors">
                <Pencil className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </span>
              <span className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-ink text-white flex items-center justify-center border-2 border-white dark:border-card-dark">
                <Pencil className="w-3.5 h-3.5" />
              </span>
            </button>
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100 mt-3">
              {user.firstName} {user.lastName}
            </h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm">
              {isTeacher ? t("profile.teacher") : t("profile.student")}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-3 text-sm text-gray-500 dark:text-gray-400">
              {user.phone && (
                <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-white/5 px-3 py-1.5 rounded-full">
                  <Phone className="w-4 h-4" />
                  <span>{user.phone}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="space-y-2">
        <button
          onClick={() => navigate(ROUTES.PROFILE_EDIT)}
          className="card w-full text-left hover:shadow-card-hover transition-shadow"
        >
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#E3F2FD] dark:bg-[#0D47A1]/20 rounded-xl flex items-center justify-center">
                <User className="w-5 h-5 text-[#0D47A1] dark:text-[#5C9CFF]" />
              </div>
              <div>
                <p className="font-medium text-gray-800 dark:text-gray-100">
                  {t("profile.editInfo")}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t("profile.editInfoDesc")}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </button>

        <button
          onClick={() => navigate(ROUTES.SETTINGS)}
          className="card w-full text-left hover:shadow-card-hover transition-shadow"
        >
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#F3E5F5] dark:bg-[#6A1B9A]/20 rounded-xl flex items-center justify-center">
                <Settings className="w-5 h-5 text-[#6A1B9A] dark:text-[#C87AE6]" />
              </div>
              <div>
                <p className="font-medium text-gray-800 dark:text-gray-100">{t("profile.settings")}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t("profile.settingsDesc")}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </div>
        </button>

        <button
          onClick={handleLogout}
          className="card w-full text-left hover:shadow-card-hover transition-shadow border-red-100 dark:border-red-900/40"
        >
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#FFEBEE] dark:bg-[#C62828]/20 rounded-xl flex items-center justify-center">
                <LogOut className="w-5 h-5 text-[#C62828]" />
              </div>
              <div>
                <p className="font-medium text-[#C62828]">{t("profile.logout")}</p>
                <p className="text-xs text-[#C62828]/70">{t("profile.logoutDesc")}</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
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
