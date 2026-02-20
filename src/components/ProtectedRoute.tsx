import { ReactNode } from "react";
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/types";

interface ProtectedRouteProps {
  allowedRoles: UserRole[];
  children?: ReactNode;
  requireSuperAdmin?: boolean;
}

export default function ProtectedRoute({ allowedRoles, children, requireSuperAdmin }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading, isSuperAdmin } = useAuth();

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/auth" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    // Redirect based on their actual role
    if (user.role === "admin") return <Navigate to="/admin" replace />;
    if (user.role === "user") return <Navigate to="/dashboard" replace />;
    return <Navigate to="/auth" replace />;
  }

  if (requireSuperAdmin && !isSuperAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return children ? <>{children}</> : <Outlet />;
}
