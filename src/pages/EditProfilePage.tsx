// src/pages/EditProfilePage.tsx
import { useState } from "react";
import { User, Phone, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useTranslation } from "@/hooks/useTranslation";
import { getAvatarUrl } from "@/lib/utils";
import { ROUTES } from "@/constans/route";
import { Button, Input } from "@/components/ui";
import { toast, getErrorMessage } from "@/lib/toast";

export const EditProfilePage = () => {
  const { user, updateProfile, isLoading } = useAuthStore();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!user) {
    return (
      <div className="card p-8 text-center">
        <p className="text-gray-500 dark:text-gray-400">{t("profile.notFound")}</p>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);
    try {
      await updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim() || null,
      });
      setSuccessMessage(t("editProfile.success"));
      toast.success(t("editProfile.success"));
    } catch (err) {
      const message = getErrorMessage(err, t("common.error"));
      setErrorMessage(message);
      toast.error(message);
    }
  };

  return (
    <div className="space-y-4 md:space-y-6 lg:max-w-2xl lg:mx-auto">

      <div>
        <h1 className="text-lg md:text-xl font-bold text-gray-800 dark:text-gray-100">
          {t("editProfile.title")}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm md:text-base">
          {t("editProfile.subtitle")}
        </p>
      </div>

      <div className="card">
        <div className="p-5 md:p-6">
          <div className="flex flex-col items-center text-center mb-6">
            <img
              src={getAvatarUrl(user.avatar, `${user.firstName} ${user.lastName}`)}
              alt={user.firstName}
              className="w-20 h-20 rounded-full border-4 border-primary-500/20"
            />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="text"
              label={t("auth.firstName")}
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              leftIcon={<User className="w-4 h-4" />}
              placeholder={t("auth.firstNamePlaceholder")}
              required
            />

            <Input
              type="text"
              label={t("auth.lastName")}
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              leftIcon={<User className="w-4 h-4" />}
              placeholder={t("auth.lastNamePlaceholder")}
              required
            />

            <Input
              type="tel"
              label={t("editProfile.phoneLabel")}
              value={phone ?? ""}
              onChange={(e) => setPhone(e.target.value)}
              leftIcon={<Phone className="w-4 h-4" />}
              placeholder={t("editProfile.phonePlaceholder")}
            />

            {successMessage && (
              <div className="text-sm text-[#2E7D32] bg-[#E8F5E9] dark:bg-[#2E7D32]/15 p-3 rounded-2xl flex items-center gap-2">
                <Check className="w-4 h-4 flex-shrink-0" />
                {successMessage}
              </div>
            )}

            {errorMessage && (
              <div className="text-sm text-[#C62828] bg-[#FFEBEE] dark:bg-[#C62828]/15 p-3 rounded-2xl">
                {errorMessage}
              </div>
            )}

            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" isLoading={isLoading} className="flex-1">
                {t("common.save")}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate(ROUTES.PROFILE)}>
                {t("common.cancel")}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
