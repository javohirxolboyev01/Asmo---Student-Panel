// src/App.tsx - Yangilangan route'lar
import { lazy, Suspense } from "react";
import { ProtectedRoute } from "./components/common/ProtectedRoute";
import { ErrorBoundary } from "./components/common/ErrorBoundary";
import { LoadingSpinner } from "./components/common/LoadingSpinner";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAuthStore } from "./stores/authStore";
import { StudentRoutes } from "./student/StudentRoutes";
import { TeacherRoutes } from "./teacher/TeacherRoutes";

const LoginPage = lazy(() => import("./pages/LoginPage").then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import("./pages/RegisterPage").then((m) => ({ default: m.RegisterPage })));

// Talaba va o'qituvchi panellari alohida: har biri o'z menyusi va sahifalariga
// ega, manzillar (URL) esa ikkalasida bir xil. Qaysi panel ochilishi rolga bog'liq.
const PanelRoutes = () => {
  const role = useAuthStore((state) => state.user?.role);
  const isTeacher = role === "teacher" || role === "admin";
  return isTeacher ? <TeacherRoutes /> : <StudentRoutes />;
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
