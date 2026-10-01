// src/teacher/TeacherRoutes.tsx
import { useEffect } from "react";
import { lazyPage, preloadWhenIdle, runWhenIdle } from "@/lib/lazyPage";
import { queryClient } from "@/lib/queryClient";
import { groupsQueryOptions } from "@/hooks/queries/useGroups";
import { pendingSubmissionsQueryOptions } from "@/hooks/queries/useSubmissions";
import { studentsQueryOptions } from "@/hooks/queries/useStudents";
import { teacherCoinTransactionsQueryOptions } from "@/hooks/queries/useCoins";
import { paymentsQueryOptions } from "@/hooks/queries/usePayments";
import { Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/components/Layout/Layout";
import { sharedPages, sharedPanelRoutes } from "@/pages/sharedRoutes";
import { teacherNavigation } from "./navigation";

// Each page is its own chunk; once the panel is up, the rest are fetched in
// the background (preloadWhenIdle) so switching pages doesn't wait on code.
const pages = {
  DashboardPage: lazyPage(() => import("./pages/DashboardPage"), "DashboardPage"),
  GroupsPage: lazyPage(() => import("./pages/GroupsPage"), "GroupsPage"),
  GroupDetailPage: lazyPage(() => import("./pages/GroupDetailPage"), "GroupDetailPage"),
  LessonDetailPage: lazyPage(() => import("./pages/LessonDetailPage"), "LessonDetailPage"),
  AttendancePage: lazyPage(() => import("./pages/AttendancePage"), "AttendancePage"),
  CoinsPage: lazyPage(() => import("./pages/CoinsPage"), "CoinsPage"),
  ShopPage: lazyPage(() => import("./pages/ShopPage"), "ShopPage"),
  PaymentsPage: lazyPage(() => import("./pages/PaymentsPage"), "PaymentsPage"),
  StudentsPage: lazyPage(() => import("./pages/StudentsPage"), "StudentsPage"),
  StudentDetailPage: lazyPage(() => import("./pages/StudentDetailPage"), "StudentDetailPage"),
  TeachersPage: lazyPage(() => import("./pages/TeachersPage"), "TeachersPage"),
  GradingPage: lazyPage(() => import("./pages/GradingPage"), "GradingPage"),
  SubmissionGradePage: lazyPage(() => import("./pages/SubmissionGradePage"), "SubmissionGradePage"),
};

// Warms the cache behind the bottom-nav tabs so their first visit shows data
// instead of a skeleton; fresh entries are skipped (prefetchQuery honours staleTime).
const prefetchTabData = () => {
  void queryClient.prefetchQuery(groupsQueryOptions());
  void queryClient.prefetchQuery(pendingSubmissionsQueryOptions());
  void queryClient.prefetchQuery(studentsQueryOptions());
  void queryClient.prefetchQuery(teacherCoinTransactionsQueryOptions());
  void queryClient.prefetchQuery(paymentsQueryOptions());
};

export const TeacherRoutes = () => {
  useEffect(() => {
    preloadWhenIdle([...Object.values(pages), ...Object.values(sharedPages)]);
    runWhenIdle(prefetchTabData);
  }, []);

  return (
    <Routes>
      <Route element={<Layout navigation={teacherNavigation} />}>
        <Route index element={<pages.DashboardPage />} />
        <Route path="groups" element={<pages.GroupsPage />} />
        <Route path="groups/:id" element={<pages.GroupDetailPage />} />
        <Route path="lessons/:id" element={<pages.LessonDetailPage />} />
        <Route path="attendance" element={<pages.AttendancePage />} />
        <Route path="coins" element={<pages.CoinsPage />} />
        <Route path="shop" element={<pages.ShopPage />} />
        <Route path="payments" element={<pages.PaymentsPage />} />
        <Route path="students" element={<pages.StudentsPage />} />
        <Route path="students/:id" element={<pages.StudentDetailPage />} />
        <Route path="teachers" element={<pages.TeachersPage />} />
        <Route path="grading" element={<pages.GradingPage />} />
        <Route path="submissions/:id" element={<pages.SubmissionGradePage />} />
        {sharedPanelRoutes}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
};
