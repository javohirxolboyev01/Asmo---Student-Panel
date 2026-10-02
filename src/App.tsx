// src/App.tsx - Yangilangan route'lar
import { lazy, Suspense } from "react";
import { ProtectedRoute } from "./components/common/ProtectedRoute";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { LoadingSpinner } from "./components/common/LoadingSpinner";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuthStore } from "./stores/authStore";
import { lazyPage } from "./lib/lazyPage";
import { readCachedUser } from "./lib/sessionCache";

// Each panel is its own chunk, so a student never downloads the teacher shell
// and vice versa. The likely one starts loading right away (role from the
// cached session), in parallel with the auth check, instead of after it.
const StudentRoutes = lazyPage(() => import("./student/StudentRoutes"), "StudentRoutes");
const TeacherRoutes = lazyPage(() => import("./teacher/TeacherRoutes"), "TeacherRoutes");
const isTeacherRole = (role?: string) => role === "teacher" || role === "admin";
void (isTeacherRole(readCachedUser()?.role) ? TeacherRoutes : StudentRoutes).preload().catch(() => undefined);

const LoginPage = lazy(() => import("./pages/LoginPage").then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import("./pages/RegisterPage").then((m) => ({ default: m.RegisterPage })));

// Talaba va o'qituvchi panellari alohida: har biri o'z menyusi va sahifalariga
// ega, manzillar (URL) esa ikkalasida bir xil. Qaysi panel ochilishi rolga bog'liq.
const PanelRoutes = () => {
  const role = useAuthStore((state) => state.user?.role);
  return isTeacherRole(role) ? <TeacherRoutes /> : <StudentRoutes />;
};

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
              <Route path="/*" element={<PanelRoutes />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
