// src/App.tsx - Yangilangan route'lar
import { ShopPage } from "./pages/ShopPage";
import { CoinsPage } from "./pages/CoinsPage";
import { LoginPage } from "./pages/LoginPage";
import { GroupsPage } from "./pages/GroupsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { PaymentsPage } from "./pages/PaymentsPage";
import { Layout } from "./components/Layout/Layout";
import { DashboardPage } from "./pages/DashboardPage";
import { AttendancePage } from "./pages/AttendancePage";
import { GroupDetailPage } from "./pages/GroupDetailPage";
import { LessonDetailPage } from "./pages/LessonDetailPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { ProtectedRoute } from "./components/common/ProtectedRoute";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
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
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/payments" element={<PaymentsPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
