// src/pages/EditProfilePage.tsx
import { useState } from "react";
import { User, Phone, Check, Pencil } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useTranslation } from "@/hooks/useTranslation";
import { cn, getAvatarUrl } from "@/lib/utils";
import { ROUTES } from "@/constans/route";
import { Button } from "@/components/ui";
import { toast, getErrorMessage } from "@/lib/toast";

// Telegram-style grouped list row: icon badge + label caption above a
// borderless inline input, sitting inside one shared `.card` with dividers.
const FieldRow = ({
  icon,
  iconBg,
  label,
  ...inputProps
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
} & React.InputHTMLAttributes<HTMLInputElement>) => (
  <div className="p-4 flex items-center gap-3.5">
    <div className={cn("w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0", iconBg)}>
      {icon}
    </div>
    <div className="min-w-0 flex-1 text-left">
      <label className="block text-xs text-gray-500 dark:text-gray-400">{label}</label>
      <input
        {...inputProps}
        className="w-full bg-transparent border-0 p-0 mt-0.5 text-sm font-medium text-gray-800 dark:text-gray-100 placeholder:text-gray-400 placeholder:font-normal outline-none focus:ring-0"
      />
    </div>
    <Pencil className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 flex-shrink-0" />
  </div>
);

export const EditProfilePage = () => {
  const user = useAuthStore((state) => state.user);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const isLoading = useAuthStore((state) => state.isLoading);
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

      {/* Avatar */}
      <div className="card">
        <div className="p-6 flex flex-col items-center text-center">
          <img
            src={getAvatarUrl(user.avatar, `${user.firstName} ${user.lastName}`)}
            alt={user.firstName}
            className="w-20 h-20 rounded-full border-4 border-warning/20"
          />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Fields — one grouped list, Telegram/iOS Settings style */}
        <div className="card divide-y divide-gray-100 dark:divide-gray-800 overflow-hidden">
          <FieldRow
            icon={<User className="w-4 h-4 text-white" />}
            iconBg="bg-[#0A84FF]"
            label={t("auth.firstName")}
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder={t("auth.firstNamePlaceholder")}
            required
          />
          <FieldRow
            icon={<User className="w-4 h-4 text-white" />}
            iconBg="bg-[#0A84FF]"
            label={t("auth.lastName")}
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder={t("auth.lastNamePlaceholder")}
            required
          />
          <FieldRow
            icon={<Phone className="w-4 h-4 text-white" />}
            iconBg="bg-[#34C759]"
            label={t("editProfile.phoneLabel")}
            type="tel"
            value={phone ?? ""}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t("editProfile.phonePlaceholder")}
          />
        </div>

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

        <div className="flex items-center gap-3">
          <Button type="submit" isLoading={isLoading} className="flex-1">
            {t("common.save")}
          </Button>
          <Button type="button" variant="outline" className="flex-1" onClick={() => navigate(ROUTES.PROFILE)}>
            {t("common.cancel")}
          </Button>
        </div>
      </form>
    </div>
  );
};
