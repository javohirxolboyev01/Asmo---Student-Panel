// src/components/Layout/Layout.tsx
import { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { Header } from "./Header";
import { useAuthStore } from "@/stores/authStore";

export const Layout = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { user } = useAuthStore();

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header user={user} />

      <main className={`${isMobile ? "pb-20" : "pb-8"} pt-16`}>
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-4 md:py-6">
          <Outlet />
        </div>
      </main>

      {isMobile && <BottomNav />}
    </div>
  );
};
