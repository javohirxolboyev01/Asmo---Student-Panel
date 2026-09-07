// src/components/Layout/Layout.tsx
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useNotificationStore } from "@/stores/notificationStore";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { useTrackNavigationHistory } from "@/hooks/useNavigationHistory";

const NOTIFICATION_POLL_INTERVAL_MS = 30_000;

export const Layout = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const user = useAuthStore((state) => state.user);
  const fetchNotifications = useNotificationStore((state) => state.fetchNotifications);

  useTrackNavigationHistory();

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    const interval = setInterval(fetchNotifications, NOTIFICATION_POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [user, fetchNotifications]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-background dark:bg-background-dark">
      <Header user={user} />

      {/* Desktop: sidebar + content yan-yonma */}
      <div className="flex pt-16">
        {/* Sidebar — faqat desktop'da ko'rinadi */}
        <Sidebar />

        {/* Main content */}
        <main
          className={`
            flex-1 min-w-0 transition-all duration-300
            ${isMobile ? "pb-24" : "pb-8 md:ml-[260px]"}
          `}
        >
          <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-4 md:py-6">
            <ErrorBoundary>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
      </div>

      {/* BottomNav faqat mobilда */}
      {isMobile && <BottomNav />}
    </div>
  );
};
