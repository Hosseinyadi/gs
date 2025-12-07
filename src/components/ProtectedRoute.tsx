import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

const ProtectedRoute = ({ children, requireAdmin = false }: ProtectedRouteProps) => {
  const { isLoading, isAuthenticated, isAdmin } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <div className="p-8 text-center">در حال بررسی دسترسی...</div>;
  }

  // If admin route is required
  if (requireAdmin) {
    if (!isAdmin) {
      return <Navigate to="/admin/login" state={{ from: location.pathname }} replace />;
    }
    return <>{children}</>;
  }

  // For regular user routes
  if (!isAuthenticated) {
    return <Navigate to="/auth" state={{ from: { pathname: location.pathname, search: location.search, state: location.state } }} replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;


