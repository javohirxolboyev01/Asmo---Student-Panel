// src/teacher/TeacherRoutes.tsx
import { lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "@/components/Layout/Layout";
import { sharedPanelRoutes } from "@/pages/sharedRoutes";
import { teacherNavigation } from "./navigation";

// Each page is its own chunk, loaded only when the teacher opens it.
const DashboardPage = lazy(() => import("./pages/DashboardPage").then((m) => ({ default: m.DashboardPage })));
const GroupsPage = lazy(() => import("./pages/GroupsPage").then((m) => ({ default: m.GroupsPage })));
const GroupDetailPage = lazy(() => import("./pages/GroupDetailPage").then((m) => ({ default: m.GroupDetailPage })));
const LessonDetailPage = lazy(() => import("./pages/LessonDetailPage").then((m) => ({ default: m.LessonDetailPage })));
const AttendancePage = lazy(() => import("./pages/AttendancePage").then((m) => ({ default: m.AttendancePage })));
const CoinsPage = lazy(() => import("./pages/CoinsPage").then((m) => ({ default: m.CoinsPage })));
const ShopPage = lazy(() => import("./pages/ShopPage").then((m) => ({ default: m.ShopPage })));
const PaymentsPage = lazy(() => import("./pages/PaymentsPage").then((m) => ({ default: m.PaymentsPage })));
const StudentsPage = lazy(() => import("./pages/StudentsPage").then((m) => ({ default: m.StudentsPage })));
const StudentDetailPage = lazy(() => import("./pages/StudentDetailPage").then((m) => ({ default: m.StudentDetailPage })));
const TeachersPage = lazy(() => import("./pages/TeachersPage").then((m) => ({ default: m.TeachersPage })));
const GradingPage = lazy(() => import("./pages/GradingPage").then((m) => ({ default: m.GradingPage })));
const SubmissionGradePage = lazy(() => import("./pages/SubmissionGradePage").then((m) => ({ default: m.SubmissionGradePage })));

export const TeacherRoutes = () => (
  <Routes>
    <Route element={<Layout navigation={teacherNavigation} />}>
      <Route index element={<DashboardPage />} />
      <Route path="groups" element={<GroupsPage />} />
      <Route path="groups/:id" element={<GroupDetailPage />} />
      <Route path="lessons/:id" element={<LessonDetailPage />} />
      <Route path="attendance" element={<AttendancePage />} />
      <Route path="coins" element={<CoinsPage />} />
      <Route path="shop" element={<ShopPage />} />
      <Route path="payments" element={<PaymentsPage />} />
      <Route path="students" element={<StudentsPage />} />
      <Route path="students/:id" element={<StudentDetailPage />} />
      <Route path="teachers" element={<TeachersPage />} />
      <Route path="grading" element={<GradingPage />} />
      <Route path="submissions/:id" element={<SubmissionGradePage />} />
      {sharedPanelRoutes}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Route>
  </Routes>
);
