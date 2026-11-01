import { Navigate, Outlet, useLocation } from "react-router-dom";
import { dashboardPath, useAuth } from "../context/AuthContext";
import type { Role } from "../lib/types";
import { PageLoader } from "./ui";

/** UX guard only — every API endpoint enforces authentication and roles on the server. */
export default function ProtectedRoute({ roles }: { roles?: Role[] }) {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to={`/login?next=${encodeURIComponent(location.pathname + location.search)}`} replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to={dashboardPath(user.role)} replace />;
  return <Outlet />;
}
