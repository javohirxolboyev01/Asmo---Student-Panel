// src/student/pages/ProfilePage.tsx
// "Kosmik maktab" profile, 1:1 with the profile mock: hero card with the
// character avatar (opens the character editor), contacts and the menu.
// The teacher panel keeps src/pages/ProfilePage.tsx.
import "../theme/profile.css";
import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Link } from "react-router-dom";
import { Bell, CalendarDays, DoorOpen, Mail, Phone, Settings, ShoppingCart, UserRound } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { useTranslation } from "@/hooks/useTranslation";
import { useNotificationsQuery } from "@/hooks/queries/useNotifications";
import { ROUTES } from "@/constans/route";
import { SpaceAvatar } from "../components/SpaceAvatar";
import { EmptyState, Modal } from "../components/ui";

// The editor + item catalog only load when the student opens it.
const CharacterEditor = lazy(() =>
  import("../components/profile/CharacterEditor").then((m) => ({ default: m.CharacterEditor })),
);

const MENU = [
  { to: ROUTES.PROFILE_EDIT, icon: UserRound, bg: "#1a7cff", label: "profile.editInfo" },
  { to: ROUTES.SETTINGS, icon: Settings, bg: "#8a8a98", label: "profile.settings" },
  { to: "/attendance", icon: CalendarDays, bg: "#ff9a1f", label: "nav.attendance" },
  { to: "/shop", icon: ShoppingCart, bg: "#a74fe0", label: "nav.shop" },
  { to: ROUTES.NOTIFICATIONS, icon: Bell, bg: "#e8a01c", label: "notifications.title" },
] as const;

/** Lime toast sliding in from the top (mock's `toast()`). */
const useToast = () => {
  const [toast, setToast] = useState<{ text: string; show: boolean }>({ text: "", show: false });
  const timer = useRef<number>();
  useEffect(() => () => window.clearTimeout(timer.current), []);
  const show = (text: string) => {
    setToast({ text, show: true });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast((x) => ({ ...x, show: false })), 2000);
  };
  return [toast, show] as const;
};

export const ProfilePage = () => {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const { t } = useTranslation();
  const { data: notifications } = useNotificationsQuery();
  const unread = notifications?.filter((n) => !n.isRead).length ?? 0;

  const [editorOpen, setEditorOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const [toast, showToast] = useToast();

  if (!user) {
    return (
      <div className="sp-page">
        <EmptyState emoji="🛸" title={t("profile.notFound")} className="mt-6" />
      </div>
    );
  }

  const fullName = `${user.firstName} ${user.lastName}`.trim();
  const isTeacher = user.role === "teacher" || user.role === "admin";

  const contacts = [
    { icon: Phone, bg: "#25c26a", label: t("profile.phoneLabel"), value: user.phone },
    { icon: Mail, bg: "#0aa0ef", label: t("profile.emailLabel"), value: user.email },
  ];

  return (
    <div className="sp-page sp-pf">
      <div className="sp-pf-card sp-pf-hero">
        <button type="button" className="sp-pf-big" onClick={() => setEditorOpen(true)} aria-label={t("space.ce.edit")}>
          <span className="sp-pf-circ">
            <SpaceAvatar avatar={user.avatar} name={fullName} />
          </span>
          <span className="sp-pf-pen" aria-hidden="true">
            ✏️
          </span>
        </button>
        <div className="sp-pf-who">
          <h1>{fullName}</h1>
          <p>{isTeacher ? t("profile.teacher") : t("profile.student")}</p>
        </div>
      </div>

      <div className="sp-pf-card">
        {contacts.map((c) => (
          <div key={c.label} className="sp-pf-row">
            <span className="sp-pf-ic" style={{ background: c.bg }} aria-hidden="true">
              <c.icon />
            </span>
            <div className="sp-pf-txt">
              <small>{c.label}</small>
              {c.value ? <strong>{c.value}</strong> : <strong className="sp-pf-empty">{t("space.profile.notSet")}</strong>}
            </div>
          </div>
        ))}
      </div>

      <div className="sp-pf-card">
        {MENU.map((m) => (
          <Link key={m.to} to={m.to} className="sp-pf-row sp-pf-link">
            <span className="sp-pf-ic" style={{ background: m.bg }} aria-hidden="true">
              <m.icon />
            </span>
            <strong>{t(m.label)}</strong>
            {m.to === ROUTES.NOTIFICATIONS && unread > 0 && (
              <span className="sp-badge sp-pink">{unread > 99 ? "99+" : unread}</span>
            )}
            <span className="sp-pf-chev" aria-hidden="true">
              ›
            </span>
          </Link>
        ))}
        <button type="button" className="sp-pf-row sp-pf-link sp-pf-out" onClick={() => setLogoutOpen(true)}>
          <span className="sp-pf-ic" style={{ background: "#f03b3b" }} aria-hidden="true">
            <DoorOpen />
          </span>
          <strong>{t("profile.logout")}</strong>
          <span className="sp-pf-chev" aria-hidden="true">
            ›
          </span>
        </button>
      </div>

      {editorOpen && (
        <Suspense fallback={null}>
          <CharacterEditor avatar={user.avatar} onClose={() => setEditorOpen(false)} onToast={showToast} />
        </Suspense>
      )}

      {/* Portalled: a transformed ancestor would break position: fixed. */}
      {createPortal(
        <div className={toast.show ? "sp-ce-toast show" : "sp-ce-toast"} role="status" aria-live="polite">
          {toast.text}
        </div>,
        document.querySelector(".sp") ?? document.body,
      )}

      <Modal open={logoutOpen} onClose={() => setLogoutOpen(false)} labelledBy="sp-logout-title">
        <div className="text-5xl" aria-hidden="true">
          🚪
        </div>
        <h2 id="sp-logout-title">{t("space.profile.logoutTitle")}</h2>
        <p>{t("space.profile.logoutText")}</p>
        <div className="sp-profile-actions">
          <button type="button" className="sp-cta sp-ghost" onClick={() => setLogoutOpen(false)}>
            {t("common.cancel")}
          </button>
          <button
            type="button"
            className="sp-cta sp-danger"
            onClick={() => {
              setLogoutOpen(false);
              logout();
            }}
          >
            {t("profile.logout")}
          </button>
        </div>
      </Modal>
    </div>
  );
};
