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

interface RoleRouteProps {
  roles: string[];
}

// Gates a nested subtree by role using the session ProtectedRoute already
// established — no checkAuth call of its own, so it can't race/loop with it.
export const RoleRoute = ({ roles }: RoleRouteProps) => {
  const user = useAuthStore((state) => state.user);

  if (!user || !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};
