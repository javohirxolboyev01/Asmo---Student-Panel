// src/teacher/pages/MorePage.tsx
// Mock `more` view ("Ko'proq"): profile hero (tap the avatar to change it)
// and the menu of every page that has no tab of its own on phones.
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart3,
  Bell,
  ChevronRight,
  CreditCard,
  GraduationCap,
  ListChecks,
  LogOut,
  Pencil,
  Settings,
  ShoppingBag,
  User,
  type LucideIcon,
  MessageCircle,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useTranslation } from "@/hooks/useTranslation";
import { useConfirm } from "@/hooks/useConfirm";
import { useNotificationsQuery } from "@/hooks/queries/useNotifications";
import { useChatUnreadQuery } from "@/hooks/queries/useChat";
import { AvatarPickerModal } from "@/components/common/AvatarPickerModal";
import { ROUTES } from "@/constans/route";
import { toast, getErrorMessage } from "@/lib/toast";
import { Avatar, EmptyBox, PageHeader, Tag } from "../components/ui";

interface MenuItem {
  to: string;
  icon: LucideIcon;
  color: string;
  label: string;
  /** One plain line saying what the page is for. */
  hint?: string;
  badge?: number;
}

const MenuRow = ({ item }: { item: MenuItem }) => (
  <Link to={item.to} className="u-mn">
    <span className="u-mi" style={{ background: item.color, color: "#fff" }}>
      <item.icon className="u-i" strokeWidth={2} aria-hidden="true" />
    </span>
    <span className="g min-w-0">
      <span className="block truncate">{item.label}</span>
      {item.hint && <small className="u-sub block truncate text-[13px] font-semibold">{item.hint}</small>}
    </span>
    {!!item.badge && <Tag tone="er">{item.badge > 99 ? "99+" : item.badge}</Tag>}
    <ChevronRight className="u-i" strokeWidth={2} aria-hidden="true" />
  </Link>
);

export const MorePage = () => {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const isSaving = useAuthStore((s) => s.isLoading);
  const { data: notifications } = useNotificationsQuery();
  const { confirm, confirmModal } = useConfirm();
  const [pickerOpen, setPickerOpen] = useState(false);

  const unread = notifications?.filter((n) => !n.isRead).length ?? 0;
  const { data: chatUnread = 0 } = useChatUnreadQuery();
  const isTeacher = user?.role === "teacher" || user?.role === "admin";

  const handleLogout = async () => {
    const ok = await confirm(t("profile.logoutConfirm"), {
      title: t("profile.logoutConfirmTitle"),
      confirmLabel: t("profile.logout"),
    });
    if (ok) logout();
  };

  const handleAvatarSave = async (avatarPath: string) => {
    try {
      // Saved as a site-relative path ("/avatars/boy-01.svg") so it keeps
      // working when the app moves to another domain.
      await updateProfile({ avatar: avatarPath });
      toast.success(t("profile.avatarSaved"));
      setPickerOpen(false);
    } catch (err) {
      toast.error(getErrorMessage(err, t("common.error")));
    }
  };

  if (!user) return <EmptyBox icon={User} tone="mu" title={t("profile.notFound")} />;

  const fullName = `${user.firstName} ${user.lastName}`.trim();

  // Warm icon tiles (white glyph on them), grouped as "Boshqaruv" / "Hisob".
  const manage: MenuItem[] = [
    { to: "/chat", icon: MessageCircle, color: "#2e8f8a", label: t("us.chat.nav"), hint: t("us.chat.subtitle"), badge: chatUnread },
    { to: "/tests", icon: ListChecks, color: "#8a58a6", label: t("nav.tests"), hint: t("us.more.hint.tests") },
    { to: "/payments", icon: CreditCard, color: "#3f8a5c", label: t("nav.payments"), hint: t("us.more.hint.payments") },
    { to: "/attendance", icon: BarChart3, color: "#d0602f", label: t("nav.attendance"), hint: t("us.more.hint.attendance") },
    { to: "/shop", icon: ShoppingBag, color: "#2b8783", label: t("nav.shop"), hint: t("us.more.hint.shop") },
    ...(isTeacher
      ? [{ to: "/teachers", icon: GraduationCap, color: "#5a60b2", label: t("nav.teachers"), hint: t("us.more.hint.teachers") }]
      : []),
  ];
  const account: MenuItem[] = [
    { to: ROUTES.PROFILE_EDIT, icon: User, color: "#3f78b0", label: t("profile.editInfo"), hint: t("us.more.hint.profile") },
    { to: ROUTES.SETTINGS, icon: Settings, color: "#8a7d71", label: t("nav.settings"), hint: t("us.more.hint.settings") },
    { to: "/notifications", icon: Bell, color: "#c8463b", label: t("nav.notifications"), hint: t("us.more.hint.notifications"), badge: unread },
  ];

  return (
    <>
      <PageHeader title={t("nav.more")} subtitle={t("us.more.subtitle")} />
      <div className="u-two e">
        <div className="u-card u-me-card grid content-start justify-items-center gap-1.5 text-center" style={{ padding: "28px 20px" }}>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="relative rounded-full"
            aria-label={t("us.more.changeAvatar")}
            title={t("us.more.changeAvatar")}
          >
            <Avatar name={fullName} src={user.avatar} seed={user.id} size="xl" />
            <span
              className="absolute bottom-0 right-0 grid h-9 w-9 place-items-center rounded-full"
              style={{ background: "var(--prf)", color: "#fff", border: "3px solid var(--sf)" }}
              aria-hidden="true"
            >
              <Pencil className="u-i s" strokeWidth={2} />
            </span>
          </button>
          <h2 className="mt-2 max-w-full break-words text-[24px]">{fullName}</h2>
          <span className="u-tag pr">{isTeacher ? t("profile.teacher") : t("profile.student")}</span>
          {user.email && <p className="u-sub max-w-full break-all">{user.email}</p>}
          {user.phone && <p className="u-sub">{user.phone}</p>}
        </div>

        <div className="u-stack !gap-5">
          <section>
            <h2 className="u-day !mt-0">{t("us.more.manage")}</h2>
            <div className="u-card" style={{ padding: 8 }}>
              {manage.map((item) => (
                <MenuRow key={item.to} item={item} />
              ))}
            </div>
          </section>
          <section>
            <h2 className="u-day !mt-0">{t("us.more.account")}</h2>
            <div className="u-card" style={{ padding: 8 }}>
              {account.map((item) => (
                <MenuRow key={item.to} item={item} />
              ))}
              <button type="button" className="u-mn" style={{ color: "var(--er)" }} onClick={handleLogout}>
                <span className="u-mi" style={{ background: "var(--ert)", color: "var(--er)" }}>
                  <LogOut className="u-i" strokeWidth={2} aria-hidden="true" />
                </span>
                <span className="g">{t("profile.logout")}</span>
              </button>
            </div>
          </section>
        </div>
      </div>

      {confirmModal}
      <AvatarPickerModal
        isOpen={pickerOpen}
        currentAvatar={user.avatar}
        isSaving={isSaving}
        onClose={() => setPickerOpen(false)}
        onSave={handleAvatarSave}
      />
    </>
  );
};
