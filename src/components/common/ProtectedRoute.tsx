// src/components/Common/ProtectedRoute.tsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { useEffect, useState } from "react";
import { AppShellSkeleton } from "@/components/common/Skeleton";

// Bootstraps the session once (checkAuth) and gates the whole app on it.
// Use once, at the top of the route tree.
export const ProtectedRoute = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isLoading = useAuthStore((state) => state.isLoading);
  const checkAuth = useAuthStore((state) => state.checkAuth);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      await checkAuth();
      setIsChecking(false);
    };
    initAuth();
  }, [checkAuth]);

  if (isLoading || isChecking) {
    return <AppShellSkeleton />;
  }

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};
