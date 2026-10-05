// src/teacher/pages/MorePage.tsx
// Mock `more` view ("Ko'proq"): profile hero (tap the avatar to change it)
// and the menu of every page that has no tab of its own on phones.
import { useState, type CSSProperties } from "react";
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
  Target,
  User,
  type LucideIcon,
} from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useTranslation } from "@/hooks/useTranslation";
import { useConfirm } from "@/hooks/useConfirm";
import { useNotificationsQuery } from "@/hooks/queries/useNotifications";
import { AvatarPickerModal } from "@/components/common/AvatarPickerModal";
import { ROUTES } from "@/constans/route";
import { toast, getErrorMessage } from "@/lib/toast";
import { Avatar, EmptyBox, PageHeader, Tag } from "../components/ui";

interface MenuItem {
  to: string;
  icon: LucideIcon;
  color: string;
  label: string;
  badge?: number;
}

const MenuRow = ({ item }: { item: MenuItem }) => (
  <Link to={item.to} className="u-mn">
    <span className="u-mi" style={{ background: `${item.color}1f`, color: item.color }}>
      <item.icon className="u-i" strokeWidth={2} aria-hidden="true" />
    </span>
    <span className="g truncate">{item.label}</span>
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
      // The backend accepts only http(s) or data:image URLs, so send the full URL.
      await updateProfile({ avatar: `${window.location.origin}${avatarPath}` });
      toast.success(t("profile.avatarSaved"));
      setPickerOpen(false);
    } catch (err) {
      toast.error(getErrorMessage(err, t("common.error")));
    }
  };

  if (!user) return <EmptyBox icon={User} tone="mu" title={t("profile.notFound")} />;

  const fullName = `${user.firstName} ${user.lastName}`.trim();

  const items: MenuItem[] = [
    { to: ROUTES.PROFILE_EDIT, icon: User, color: "#1a8cff", label: t("profile.editInfo") },
    { to: ROUTES.SETTINGS, icon: Settings, color: "#8e8e93", label: t("nav.settings") },
    { to: "/tests", icon: ListChecks, color: "#e8590c", label: t("nav.tests") },
    { to: "/missions", icon: Target, color: "#c2255c", label: t("nav.missions") },
    { to: "/payments", icon: CreditCard, color: "#0b8f6e", label: t("nav.payments") },
    { to: "/attendance", icon: BarChart3, color: "#17a37f", label: t("nav.attendance") },
    { to: "/shop", icon: ShoppingBag, color: "#8a63f5", label: t("nav.shop") },
    ...(isTeacher
      ? [{ to: "/teachers", icon: GraduationCap, color: "#34c759", label: t("nav.teachers") }]
      : []),
    { to: "/notifications", icon: Bell, color: "#ff9500", label: t("nav.notifications"), badge: unread },
  ];

  return (
    <>
      <PageHeader title={t("nav.more")} subtitle={t("us.more.subtitle")} />
      <div className="u-two e">
        <div
          className="u-ghero grid justify-items-center gap-1.5 text-center"
          style={{ "--g": "#5848e0", padding: "28px 20px" } as CSSProperties}
        >
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="relative rounded-full"
            aria-label={t("us.more.changeAvatar")}
            title={t("us.more.changeAvatar")}
          >
            <Avatar name={fullName} src={user.avatar} seed={user.id} size="xl" />
            <span
              className="absolute bottom-0 right-0 grid h-8 w-8 place-items-center rounded-full"
              style={{ background: "#fff", color: "#5848e0" }}
              aria-hidden="true"
            >
              <Pencil className="u-i s" strokeWidth={2} />
            </span>
          </button>
          <h1 className="max-w-full break-words">{fullName}</h1>
          <span className="u-chip">{isTeacher ? t("profile.teacher") : t("profile.student")}</span>
          {user.email && <p className="max-w-full break-all" style={{ opacity: 0.9 }}>{user.email}</p>}
          {user.phone && <p style={{ opacity: 0.9 }}>{user.phone}</p>}
        </div>

        <div className="u-card" style={{ padding: 8 }}>
          {items.map((item) => (
            <MenuRow key={item.to} item={item} />
          ))}
          <button type="button" className="u-mn" style={{ color: "var(--er)" }} onClick={handleLogout}>
            <span className="u-mi" style={{ background: "var(--ert)" }}>
              <LogOut className="u-i" strokeWidth={2} aria-hidden="true" />
            </span>
            <span className="g">{t("profile.logout")}</span>
          </button>
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
