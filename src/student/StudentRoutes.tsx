// src/student/StudentRoutes.tsx
import { lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/components/Layout/Layout";
import { sharedPanelRoutes } from "@/pages/sharedRoutes";
import { studentNavigation } from "./navigation";

// Each page is its own chunk, so a student never downloads teacher code.
const DashboardPage = lazy(() => import("./pages/DashboardPage").then((m) => ({ default: m.DashboardPage })));
const GroupsPage = lazy(() => import("./pages/GroupsPage").then((m) => ({ default: m.GroupsPage })));
const GroupDetailPage = lazy(() => import("./pages/GroupDetailPage").then((m) => ({ default: m.GroupDetailPage })));
const LessonDetailPage = lazy(() => import("./pages/LessonDetailPage").then((m) => ({ default: m.LessonDetailPage })));
const AttendancePage = lazy(() => import("./pages/AttendancePage").then((m) => ({ default: m.AttendancePage })));
const CoinsPage = lazy(() => import("./pages/CoinsPage").then((m) => ({ default: m.CoinsPage })));
const ShopPage = lazy(() => import("./pages/ShopPage").then((m) => ({ default: m.ShopPage })));
const PaymentsPage = lazy(() => import("./pages/PaymentsPage").then((m) => ({ default: m.PaymentsPage })));
const WishlistPage = lazy(() => import("./pages/WishlistPage").then((m) => ({ default: m.WishlistPage })));

export const StudentRoutes = () => (
  <Routes>
    <Route element={<Layout navigation={studentNavigation} />}>
      <Route index element={<DashboardPage />} />
      <Route path="groups" element={<GroupsPage />} />
      <Route path="groups/:id" element={<GroupDetailPage />} />
      <Route path="lessons/:id" element={<LessonDetailPage />} />
      <Route path="attendance" element={<AttendancePage />} />
      <Route path="coins" element={<CoinsPage />} />
      <Route path="shop" element={<ShopPage />} />
      <Route path="payments" element={<PaymentsPage />} />
      <Route path="wishlist" element={<WishlistPage />} />
      {sharedPanelRoutes}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  </Routes>
);
