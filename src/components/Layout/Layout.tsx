// src/components/Layout/Layout.tsx
import { Header } from "./Header";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { Outlet } from "react-router-dom";
import { Suspense, useState, useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import { SkeletonHeader, SkeletonCardGrid } from "@/components/common/Skeleton";
import { useTrackNavigationHistory } from "@/hooks/useNavigationHistory";
import type { PanelNavigation } from "./navigation";

// App shell shared by both panels; each panel passes its own menu.
export const Layout = ({ navigation }: { navigation: PanelNavigation }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const user = useAuthStore((state) => state.user);

  useTrackNavigationHistory();

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
        <Sidebar navigation={navigation} />

        {/* Main content */}
        <main
          className={`
            flex-1 min-w-0 transition-all duration-300
            ${isMobile ? "pb-24" : "pb-8 md:ml-[260px]"}
          `}
        >
          <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-4 md:py-6">
            <ErrorBoundary>
              {/* Page-shaped placeholder while a page's chunk loads (pages show the same skeleton next). */}
              <Suspense
                fallback={
                  <div className="space-y-4 md:space-y-6">
                    <SkeletonHeader />
                    <SkeletonCardGrid count={4} />
                  </div>
                }
              >
                <Outlet />
              </Suspense>
            </ErrorBoundary>
          </div>
        </main>
      </div>

      {/* BottomNav faqat mobilда */}
      {isMobile && <BottomNav items={navigation.bottom} more={navigation.more} />}
    </div>
  );
};
