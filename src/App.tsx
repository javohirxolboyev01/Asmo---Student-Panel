// src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Layout } from "./components/Layout/Layout";
import { DashboardPage } from "./pages/DashboardPage";
import { GroupsPage } from "./pages/GroupsPage";
import { GroupDetailPage } from "./pages/GroupDetailPage";
import { LessonDetailPage } from "./pages/LessonDetailPage";
import { AttendancePage } from "./pages/AttendancePage";
import { CoinsPage } from "./pages/CoinsPage";
import { NotificationsPage } from "./pages/NotificationsPage";
import { ProfilePage } from "./pages/ProfilePage";
import { LoginPage } from "./pages/LoginPage";
import { ProtectedRoute } from "./components/common/ProtectedRoute";

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
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
