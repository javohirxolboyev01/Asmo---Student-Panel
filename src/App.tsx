// src/App.tsx - Yangilangan route'lar
import { lazy, Suspense } from "react";
import { Layout } from "./components/Layout/Layout";
import { ProtectedRoute, RoleRoute } from "./components/common/ProtectedRoute";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { LoadingSpinner } from "./components/common/LoadingSpinner";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Har bir sahifa alohida chunk sifatida yuklanadi — birinchi ochilishda faqat
// kerakli sahifa kodi tortiladi (masalan, student uchun teacher/grading sahifalari yuklanmaydi).
const LoginPage = lazy(() => import("./pages/LoginPage").then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import("./pages/RegisterPage").then((m) => ({ default: m.RegisterPage })));
const DashboardPage = lazy(() => import("./pages/DashboardPage").then((m) => ({ default: m.DashboardPage })));
const GroupsPage = lazy(() => import("./pages/GroupsPage").then((m) => ({ default: m.GroupsPage })));
const GroupDetailPage = lazy(() => import("./pages/GroupDetailPage").then((m) => ({ default: m.GroupDetailPage })));
const LessonDetailPage = lazy(() => import("./pages/LessonDetailPage").then((m) => ({ default: m.LessonDetailPage })));
const AttendancePage = lazy(() => import("./pages/AttendancePage").then((m) => ({ default: m.AttendancePage })));
const CoinsPage = lazy(() => import("./pages/CoinsPage").then((m) => ({ default: m.CoinsPage })));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage").then((m) => ({ default: m.NotificationsPage })));
const ProfilePage = lazy(() => import("./pages/ProfilePage").then((m) => ({ default: m.ProfilePage })));
const EditProfilePage = lazy(() => import("./pages/EditProfilePage").then((m) => ({ default: m.EditProfilePage })));
const SettingsPage = lazy(() => import("./pages/SettingsPage").then((m) => ({ default: m.SettingsPage })));
const ShopPage = lazy(() => import("./pages/ShopPage").then((m) => ({ default: m.ShopPage })));
const PaymentsPage = lazy(() => import("./pages/PaymentsPage").then((m) => ({ default: m.PaymentsPage })));
const WishlistPage = lazy(() => import("./pages/WishlistPage").then((m) => ({ default: m.WishlistPage })));
const StudentsPage = lazy(() => import("./pages/StudentsPage").then((m) => ({ default: m.StudentsPage })));
const StudentDetailPage = lazy(() => import("./pages/StudentDetailPage").then((m) => ({ default: m.StudentDetailPage })));
const TeachersPage = lazy(() => import("./pages/TeachersPage").then((m) => ({ default: m.TeachersPage })));
const GradingPage = lazy(() => import("./pages/GradingPage").then((m) => ({ default: m.GradingPage })));
const SubmissionGradePage = lazy(() => import("./pages/SubmissionGradePage").then((m) => ({ default: m.SubmissionGradePage })));

function App() {
  return (
    <ErrorBoundary>
      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="colored"
      />
      <BrowserRouter>
        <Suspense fallback={<LoadingSpinner size="lg" />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/groups" element={<GroupsPage />} />
                <Route path="/groups/:id" element={<GroupDetailPage />} />
                <Route path="/lessons/:id" element={<LessonDetailPage />} />
                <Route path="/attendance" element={<AttendancePage />} />
                <Route path="/coins" element={<CoinsPage />} />
                <Route path="/notifications" element={<NotificationsPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/profile/edit" element={<EditProfilePage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/shop" element={<ShopPage />} />
                <Route path="/payments" element={<PaymentsPage />} />

                <Route element={<RoleRoute roles={["student"]} />}>
                  <Route path="/wishlist" element={<WishlistPage />} />
                </Route>

                <Route element={<RoleRoute roles={["teacher", "admin"]} />}>
                  <Route path="/students" element={<StudentsPage />} />
                  <Route path="/students/:id" element={<StudentDetailPage />} />
                  <Route path="/teachers" element={<TeachersPage />} />
                  <Route path="/grading" element={<GradingPage />} />
                  <Route path="/submissions/:id" element={<SubmissionGradePage />} />
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
