// src/pages/EditProfilePage.tsx
// Mock `edit` view: one card form (name, surname, phone, photo) + Saqlash.
import { useState } from "react";
import { Check, Pencil, User } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useTranslation } from "@/hooks/useTranslation";
import { useGoBack } from "@/hooks/useNavigationHistory";
import { Button, Input } from "@/components/ui";
import { AvatarPickerModal } from "@/components/common/AvatarPickerModal";
import { toast, getErrorMessage } from "@/lib/toast";
import { Avatar, EmptyBox, PageHeader } from "@/teacher/components/ui";

export const EditProfilePage = () => {
  const user = useAuthStore((state) => state.user);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const isLoading = useAuthStore((state) => state.isLoading);
  const { t } = useTranslation();
  const goBack = useGoBack("/more");

  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!user) {
    return <EmptyBox icon={User} tone="mu" title={t("profile.notFound")} />;
  }

  const fullName = `${user.firstName} ${user.lastName}`.trim();

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

  const handleAvatarSave = async (avatarPath: string) => {
    try {
      // The backend accepts only http(s) or data:image URLs, so send the full URL.
      await updateProfile({ avatar: `${window.location.origin}${avatarPath}` });
      toast.success(t("profile.avatarSaved"));
      setPickerOpen(false);
    } catch (err) {
      toast.error(getErrorMessage(err, t("common.error")));
    }
  };

  return (
    <>
      <PageHeader title={t("editProfile.title")} subtitle={t("editProfile.subtitle")} back={{ to: "/more" }} />

      <form onSubmit={handleSubmit} className="u-card u-stack" style={{ maxWidth: 520 }}>
        {/* Photo */}
        <div className="flex items-center gap-3.5">
          <Avatar name={fullName} src={user.avatar} seed={user.id} size="xl" />
          <div className="min-w-0">
            <b className="block break-words">{fullName}</b>
            <button type="button" className="u-btn soft sm mt-2" onClick={() => setPickerOpen(true)}>
              <Pencil className="u-i s" strokeWidth={2} aria-hidden="true" />
              {t("us.more.changeAvatar")}
            </button>
          </div>
        </div>

        <Input
          type="text"
          label={t("auth.firstName")}
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          placeholder={t("auth.firstNamePlaceholder")}
          required
        />
        <Input
          type="text"
          label={t("auth.lastName")}
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          placeholder={t("auth.lastNamePlaceholder")}
          required
        />
        <Input
          type="tel"
          label={t("editProfile.phoneLabel")}
          value={phone ?? ""}
          onChange={(e) => setPhone(e.target.value)}
          placeholder={t("editProfile.phonePlaceholder")}
        />

        {successMessage && (
          <div className="flex items-center gap-2 rounded-2xl bg-u-okt px-4 py-3 text-sm font-bold text-u-ok">
            <Check className="u-i s" strokeWidth={2} aria-hidden="true" />
            {successMessage}
          </div>
        )}
        {errorMessage && (
          <div className="rounded-2xl bg-u-ert px-4 py-3 text-sm font-bold text-u-er">{errorMessage}</div>
        )}

        <button type="submit" className="u-btn block" disabled={isLoading}>
          {t("common.save")}
        </button>
        <Button type="button" variant="outline" fullWidth onClick={goBack}>
          {t("common.cancel")}
        </Button>
      </form>

      <AvatarPickerModal
        isOpen={pickerOpen}
        currentAvatar={user.avatar}
        isSaving={isLoading}
        onClose={() => setPickerOpen(false)}
        onSave={handleAvatarSave}
      />
    </>
  );
};
