// src/components/Common/ProtectedRoute.tsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useEffect, useState } from "react";

export const ProtectedRoute = () => {
  const { isAuthenticated, isLoading, checkAuth } = useAuthStore();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      await checkAuth();
      setIsChecking(false);
    };
    initAuth();
  }, [checkAuth]);

  if (isLoading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#2D6BFF] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};
