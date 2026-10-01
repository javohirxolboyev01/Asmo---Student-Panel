// src/student/StudentRoutes.tsx
import { useEffect } from "react";
import { lazyPage, preloadWhenIdle, runWhenIdle } from "@/lib/lazyPage";
import { queryClient } from "@/lib/queryClient";
import { groupsQueryOptions } from "@/hooks/queries/useGroups";
import { attendanceQueryOptions } from "@/hooks/queries/useAttendance";
import { coinsQueryOptions } from "@/hooks/queries/useCoins";
import { paymentsQueryOptions } from "@/hooks/queries/usePayments";
import { productsQueryOptions } from "@/hooks/queries/useProducts";
import { Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/components/Layout/Layout";
import { sharedPages, sharedPanelRoutes } from "@/pages/sharedRoutes";
import { studentNavigation } from "./navigation";

// Each page is its own chunk, so a student never downloads teacher code;
// once the panel is up, the rest are fetched in the background (preloadWhenIdle).
const pages = {
  DashboardPage: lazyPage(() => import("./pages/DashboardPage"), "DashboardPage"),
  GroupsPage: lazyPage(() => import("./pages/GroupsPage"), "GroupsPage"),
  GroupDetailPage: lazyPage(() => import("./pages/GroupDetailPage"), "GroupDetailPage"),
  LessonDetailPage: lazyPage(() => import("./pages/LessonDetailPage"), "LessonDetailPage"),
  AttendancePage: lazyPage(() => import("./pages/AttendancePage"), "AttendancePage"),
  CoinsPage: lazyPage(() => import("./pages/CoinsPage"), "CoinsPage"),
  ShopPage: lazyPage(() => import("./pages/ShopPage"), "ShopPage"),
  PaymentsPage: lazyPage(() => import("./pages/PaymentsPage"), "PaymentsPage"),
  WishlistPage: lazyPage(() => import("./pages/WishlistPage"), "WishlistPage"),
};

// Warms the cache behind the bottom-nav tabs so their first visit shows data
// instead of a skeleton; fresh entries are skipped (prefetchQuery honours staleTime).
const prefetchTabData = () => {
  void queryClient.prefetchQuery(groupsQueryOptions());
  void queryClient.prefetchQuery(attendanceQueryOptions());
  void queryClient.prefetchQuery(coinsQueryOptions());
  void queryClient.prefetchQuery(paymentsQueryOptions());
  void queryClient.prefetchQuery(productsQueryOptions());
};

export const StudentRoutes = () => {
  useEffect(() => {
    preloadWhenIdle([...Object.values(pages), ...Object.values(sharedPages)]);
    runWhenIdle(prefetchTabData);
  }, []);

  return (
    <Routes>
      <Route element={<Layout navigation={studentNavigation} />}>
        <Route index element={<pages.DashboardPage />} />
        <Route path="groups" element={<pages.GroupsPage />} />
        <Route path="groups/:id" element={<pages.GroupDetailPage />} />
        <Route path="lessons/:id" element={<pages.LessonDetailPage />} />
        <Route path="attendance" element={<pages.AttendancePage />} />
        <Route path="coins" element={<pages.CoinsPage />} />
        <Route path="shop" element={<pages.ShopPage />} />
        <Route path="payments" element={<pages.PaymentsPage />} />
        <Route path="wishlist" element={<pages.WishlistPage />} />
        {sharedPanelRoutes}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};
