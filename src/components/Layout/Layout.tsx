// src/components/Layout/Layout.tsx
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { Outlet } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";

export const Layout = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Desktop'ga o'tganda sidebar overlay'ni yop
      if (!mobile) setSidebarOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />

      {/* Desktop: sidebar + content yan-yonma */}
      <div className="flex pt-16">
        {/* Sidebar — desktop'da har doim ko'rinadi, mobilда drawer */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main content */}
        <main
          className={`
            flex-1 min-w-0 transition-all duration-300
            ${isMobile ? "pb-24" : "pb-8 md:ml-[260px]"}
          `}
        >
          <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-4 md:py-6">
            <Outlet />
          </div>
        </main>
      </div>

      {/* BottomNav faqat mobilда */}
      {isMobile && <BottomNav />}
    </div>
  );
};
