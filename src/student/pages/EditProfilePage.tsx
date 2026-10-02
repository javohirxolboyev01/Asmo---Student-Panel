// src/student/pages/EditProfilePage.tsx
// "Kosmik maktab" edit profile (first / last name, phone) — same
// authStore.updateProfile call as src/pages/EditProfilePage.tsx.
import "../theme/profile.css";
import { useState, type FormEvent } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useTranslation } from "@/hooks/useTranslation";
import { useGoBack } from "@/hooks/useNavigationHistory";
import { ROUTES } from "@/constans/route";
import { getErrorMessage } from "@/lib/toast";
import { EmptyState, PageHeader, Spinner } from "../components/ui";

// Mirrors the backend's PATCH /profile schema.
const NAME_MIN = 2;
const NAME_MAX = 80;
const PHONE_MAX = 30;

export const EditProfilePage = () => {
  const user = useAuthStore((s) => s.user);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const { t } = useTranslation();

  const [firstName, setFirstName] = useState(user?.firstName ?? "");
  const [lastName, setLastName] = useState(user?.lastName ?? "");
  const [phone, setPhone] = useState(user?.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const back = { to: ROUTES.PROFILE, label: t("profile.title") };
  const goBack = useGoBack(ROUTES.PROFILE);

  if (!user) {
    return (
      <div className="sp-page">
        <PageHeader title={t("editProfile.title")} back={back} />
        <EmptyState emoji="🛸" title={t("profile.notFound")} />
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (saving) return;
    const first = firstName.trim();
    const last = lastName.trim();
    const tel = phone.trim();

    const nameOk = (v: string) => v.length >= NAME_MIN && v.length <= NAME_MAX;
    if (!nameOk(first) || !nameOk(last)) {
      setMessage({ ok: false, text: t("space.profile.namesInvalid") });
      return;
    }
    if (tel.length > PHONE_MAX) {
      setMessage({ ok: false, text: t("space.profile.phoneTooLong") });
      return;
    }

    setMessage(null);
    setSaving(true);
    try {
      await updateProfile({ firstName: first, lastName: last, phone: tel || null });
      setMessage({ ok: true, text: t("space.profile.saved") });
    } catch (err) {
      setMessage({ ok: false, text: getErrorMessage(err, t("common.error")) });
    } finally {
      setSaving(false);
    }
  };

  const edit = (setter: (v: string) => void) => (e: { target: { value: string } }) => {
    setter(e.target.value);
    if (message?.ok) setMessage(null);
  };

  return (
    <div className="sp-page">
      <PageHeader title={t("editProfile.title")} subtitle={t("space.profile.editSubtitle")} back={back} />

      <form className="sp-panel" onSubmit={handleSubmit} noValidate>
        <label className="sp-fl">
          {t("auth.firstName")}
          <input
            className="sp-in"
            value={firstName}
            onChange={edit(setFirstName)}
            placeholder={t("auth.firstNamePlaceholder")}
            autoComplete="given-name"
            maxLength={NAME_MAX}
            required
          />
        </label>
        <label className="sp-fl">
          {t("auth.lastName")}
          <input
            className="sp-in"
            value={lastName}
            onChange={edit(setLastName)}
            placeholder={t("auth.lastNamePlaceholder")}
            autoComplete="family-name"
            maxLength={NAME_MAX}
            required
          />
        </label>
        <label className="sp-fl">
          {t("editProfile.phoneLabel")}
          <input
            className="sp-in"
            type="tel"
            inputMode="tel"
            value={phone}
            onChange={edit(setPhone)}
            placeholder={t("editProfile.phonePlaceholder")}
            autoComplete="tel"
            maxLength={PHONE_MAX}
          />
        </label>

        <div className="sp-profile-actions">
          <button type="submit" className="sp-cta" disabled={saving}>
            {saving && <Spinner />}
            {t("common.save")}
          </button>
          <button type="button" className="sp-cta sp-ghost" onClick={goBack} disabled={saving}>
            {t("common.cancel")}
          </button>
        </div>
        <p className={message && !message.ok ? "sp-msg sp-err" : "sp-msg"} role={message ? "status" : undefined}>
          {message?.text}
        </p>
      </form>
    </div>
  );
};
