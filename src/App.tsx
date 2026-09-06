// src/App.tsx - Yangilangan route'lar
import { ShopPage } from "./pages/ShopPage";
import { WishlistPage } from "./pages/WishlistPage";
import { CoinsPage } from "./pages/CoinsPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { GroupsPage } from "./pages/GroupsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { EditProfilePage } from "./pages/EditProfilePage";
import { SettingsPage } from "./pages/SettingsPage";
import { PaymentsPage } from "./pages/PaymentsPage";
import { Layout } from "./components/Layout/Layout";
import { DashboardPage } from "./pages/DashboardPage";
import { AttendancePage } from "./pages/AttendancePage";
import { GroupDetailPage } from "./pages/GroupDetailPage";
import { LessonDetailPage } from "./pages/LessonDetailPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { StudentsPage } from "./pages/StudentsPage";
import { StudentDetailPage } from "./pages/StudentDetailPage";
import { TeachersPage } from "./pages/TeachersPage";
import { GradingPage } from "./pages/GradingPage";
import { SubmissionGradePage } from "./pages/SubmissionGradePage";
import { ProtectedRoute, RoleRoute } from "./components/common/ProtectedRoute";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  return (
    <ErrorBoundary>
      <ToastContainer
        position="bottom-left"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        pauseOnHover
        theme="colored"
      />
      <BrowserRouter>
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
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
