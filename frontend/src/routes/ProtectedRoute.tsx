// src/routes/ProtectedRoute.tsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import type { Role } from "../types";

interface ProtectedRouteProps {
  allowedRoles: Role[];
  children: React.ReactNode;
}

// Wraps any page that requires login + a specific role. This is the
// frontend half of role-based access control — the real enforcement
// still happens on the backend per the API spec, but this prevents
// a logged-in Patient from ever landing on an Admin screen in the UI.
export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}
