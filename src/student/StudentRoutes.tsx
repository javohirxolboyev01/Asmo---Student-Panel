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
import { StudentLayout } from "./layout/StudentLayout";

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
  QuizPage: lazyPage(() => import("./pages/QuizPage"), "QuizPage"),
  // Student-themed versions of the pages the teacher panel takes from src/pages.
  NotificationsPage: lazyPage(() => import("./pages/NotificationsPage"), "NotificationsPage"),
  ProfilePage: lazyPage(() => import("./pages/ProfilePage"), "ProfilePage"),
  EditProfilePage: lazyPage(() => import("./pages/EditProfilePage"), "EditProfilePage"),
  SettingsPage: lazyPage(() => import("./pages/SettingsPage"), "SettingsPage"),
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
    preloadWhenIdle(Object.values(pages));
    runWhenIdle(prefetchTabData);
  }, []);

  return (
    <Routes>
      <Route element={<StudentLayout />}>
        <Route index element={<pages.DashboardPage />} />
        <Route path="groups" element={<pages.GroupsPage />} />
        <Route path="groups/:id" element={<pages.GroupDetailPage />} />
        <Route path="lessons/:id" element={<pages.LessonDetailPage />} />
        <Route path="attendance" element={<pages.AttendancePage />} />
        <Route path="coins" element={<pages.CoinsPage />} />
        <Route path="shop" element={<pages.ShopPage />} />
        <Route path="payments" element={<pages.PaymentsPage />} />
        <Route path="wishlist" element={<pages.WishlistPage />} />
        <Route path="quiz/:id" element={<pages.QuizPage />} />
        <Route path="notifications" element={<pages.NotificationsPage />} />
        <Route path="profile" element={<pages.ProfilePage />} />
        <Route path="profile/edit" element={<pages.EditProfilePage />} />
        <Route path="settings" element={<pages.SettingsPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};
